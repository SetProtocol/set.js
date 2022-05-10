/*
  Copyright 2022 Set Labs Inc.

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

'use strict';

import { constants as EthersConstants } from 'ethers';
import { Provider } from '@ethersproject/providers';
import { Address } from '@setprotocol/set-protocol-v2/utils/types';

import SetTokenAPI from './SetTokenAPI';
import Assertions from '../assertions';
import TradeModuleWrapper from '../wrappers/set-protocol-v2/TradeModuleWrapper';

import {
  TradeQuoter,
  CoinGeckoDataService,
  GasOracleService
} from './utils';

import {
  SwapQuote,
  TradeQuote,
  SwapOrderPairs,
  TradeOrderPair,
  CoinGeckoTokenData,
  CoinGeckoTokenMap,
  GasOracleSpeed,
  CoinGeckoCoinPrices,
  ZeroExApiUrls,
} from '../types';

/**
 * @title  UtilsAPI
 * @author Set Protocol
 *
 * The UtilsAPI exposes methods to fetch swap quotes from 0x Exchange and get token prices and
 * token metadata from CoinGecko
 *
 */
export default class UtilsAPI {
  private assert: Assertions;
  private provider: Provider;
  private tradeQuoter: TradeQuoter;
  private tradeModuleWrapper: TradeModuleWrapper;
  private coinGecko: CoinGeckoDataService;
  private chainId: number;

  public constructor(
    provider: Provider,
    tradeModuleAddress: Address,
    zeroExApiKey?: string,
    zeroExApiUrls?: ZeroExApiUrls
  ) {
    this.provider = provider;
    this.assert = new Assertions();
    this.tradeModuleWrapper = new TradeModuleWrapper(provider, tradeModuleAddress);
    this.tradeQuoter = new TradeQuoter(zeroExApiKey, zeroExApiUrls);
  }

  /**
   * Call 0x API to generate a swap quote for two tokens. This method is intended to be used alongside
   * ExchangeIssuanceZeroEx contract which allows you to convert a liquid "payment" currency into the
   * components that will make up the issued SetToken, (or the reverse when redeeming).
   *
   * @param  fromToken            Address of token being sold
   * @param  toToken              Address of token being bought
   * @param  rawAmount            String quantity of token to sell in token decimals (ex: "5000000" = 5 USDC)
   * @param  useBuyAmount         When true, amount is `buyAmount` of `toToken`,
   *                              When false, amount is `sellAmount` of `fromToken`
   * @param  fromAddress          SetToken address which holds the buy / sell components
   * @param  setToken             SetTokenAPI instance
   * @param  gasPrice             gasPrice to calculate gas costs with
   * @param  slippagePercentage   (Optional) maximum slippage, determines min receive quantity. (Default: 2%)
   * @param  isFirmQuote          (Optional) Whether quote request is indicative or firm
   * @param  feePercentage        (Optional) Default: 0
   * @param  feeRecipient         (Optional) Default: 0xD3D555Bb655AcBA9452bfC6D7cEa8cC7b3628C55
   * @param  excludedSources      (Optional) Exchanges to exclude (Default: ['Kyber', 'Eth2Dai', 'Mesh'])
   * @param  simulatedChainId     (Optional) ChainId of target network (useful when using a forked development client)
   *
   * @return {Promise<SwapQuote>}
   */
  public async fetchSwapQuoteAsync(
    fromToken: Address,
    toToken: Address,
    rawAmount: string,
    useBuyAmount: boolean,
    fromAddress: Address,
    setToken: SetTokenAPI,
    gasPrice?: number,
    slippagePercentage?: number,
    isFirmQuote?: boolean,
    feePercentage?: number,
    feeRecipient?: Address,
    excludedSources?: string[],
    simulatedChainId?: number,
  ): Promise<SwapQuote> {
    this.assert.schema.isValidAddress('fromToken', fromToken);
    this.assert.schema.isValidAddress('toToken', toToken);
    this.assert.schema.isValidAddress('fromAddress', fromAddress);
    this.assert.schema.isValidString('rawAmount', rawAmount);

    // The forked Hardhat network has a chainId of 31337 so we can't rely on autofetching this value
    const chainId = (simulatedChainId !== undefined)
      ? simulatedChainId
      : (await this.provider.getNetwork()).chainId;

    return this.tradeQuoter.generateQuoteForSwap({
      fromToken,
      toToken,
      rawAmount,
      useBuyAmount,
      fromAddress,
      chainId,
      setToken,
      gasPrice,
      slippagePercentage,
      isFirmQuote,
      feePercentage,
      feeRecipient,
      excludedSources,
    });
  }

  /**
   * Batch multiple calls to 0x API to generate swap quotes for token pairs. This method is intended to be used
   * alongside the ExchangeIssuanceZeroEx contract which allows you to convert a liquid "payment" currency into the
   * components that will make up the issued SetToken, (or the reverse when redeeming). By default, swap quotes
   * are fetched for 0x's public endpoints using their `https://api.0x.org`, `https://<network>/api.0x.org`
   * url scheme. These open endpoints are rate limited at ~3 req/sec
   *
   * It's also possible to make calls from non-browser context with an API key using the `https://gated.api.0x.org`
   * url scheme.
   *
   * Officially 0x rate-limits calls *per API key* as follows (mileage may vary):
   *
   * > Ethereum: 10 requests per second/200 requests per minute.
   * > Other networks: 30 requests per second.
   *
   * The `delayStep` parameter option allows you to stagger parallelized requests to stay within rate limits
   * and is set to 25ms by default.
   *
   * @param  orderPairs           SwapOrderPairs array
   * @param  useBuyAmount         When true, amount is `buyAmount` of `toToken`,
   *                              When false, amount is `sellAmount` of `fromToken`
   * @param  fromAddress          SetToken address which holds the buy / sell components
   * @param  setToken             SetTokenAPI instance
   * @param  gasPrice             gasPrice to calculate gas costs with
   * @param  slippagePercentage   (Optional) maximum slippage, determines min receive quantity. (Default: 2%)
   * @param  isFirmQuote          (Optional) Whether quote request is indicative or firm
   * @param  feePercentage        (Optional) Default: 0
   * @param  feeRecipient         (Optional) Default: 0xD3D555Bb655AcBA9452bfC6D7cEa8cC7b3628C55
   * @param  excludedSources      (Optional) Exchanges to exclude (Default: ['Kyber', 'Eth2Dai', 'Mesh'])
   * @param  simulatedChainId     (Optional) ChainId of target network (useful when using a forked development client)
   * @param  delayStep            (Optional) Delay between firing each quote request (to manage rate-limiting)
   *
   * @return {Promise<TradeQuote>}
   */
  public async batchFetchSwapQuoteAsync(
    orderPairs: SwapOrderPairs[],
    useBuyAmount: boolean,
    fromAddress: Address,
    setToken: SetTokenAPI,
    gasPrice?: number,
    slippagePercentage?: number,
    isFirmQuote?: boolean,
    feePercentage?: number,
    feeRecipient?: Address,
    excludedSources?: string[],
    simulatedChainId?: number,
    delayStep?: number,
  ): Promise<SwapQuote[]> {
    const self = this;
    this.assert.schema.isValidAddress('fromAddress', fromAddress);

    for (const pair of orderPairs) {
      this.assert.schema.isValidAddress('fromToken', pair.fromToken);
      this.assert.schema.isValidAddress('toToken', pair.toToken);
      this.assert.schema.isValidString('rawAmount', pair.rawAmount);
    }

    // The forked Hardhat network has a chainId of 31337 so we can't rely on autofetching this value
    const chainId = (simulatedChainId !== undefined)
      ? simulatedChainId
      : (await this.provider.getNetwork()).chainId;

    // Default 25 ms delay
    const _delayStep = (delayStep !== undefined)
      ? delayStep
      : 25;

    const orders = [];
    let delay = 0;

    for (const pair of orderPairs) {
      let order;

      // We can't get a quote when `to` and `from` tokens are the same but it's helpful to be able
      // to stub in null order calldata for use-cases where contract methods expect components and data
      // array lengths to match. (This is a common SetProtocol design pattern). We populate
      // the from and to amounts to permit pre-trade accounting by the consumer of this method
      // for issuance and redemption, respectively.
      if (pair.ignore === true) {
        order = Promise.resolve({
          fromTokenAmount: pair.rawAmount,
          toTokenAmount: pair.rawAmount,
          calldata: EthersConstants.HashZero,
        });
      } else {
        order = new Promise(async function (resolve, reject) {
          await new Promise(r => setTimeout(() => r(true), delay));


          try {
            const response = await self.tradeQuoter.generateQuoteForSwap({
              fromToken: pair.fromToken,
              toToken: pair.toToken,
              rawAmount: pair.rawAmount,
              useBuyAmount,
              fromAddress,
              chainId,
              setToken,
              gasPrice,
              slippagePercentage,
              isFirmQuote,
              feePercentage,
              feeRecipient,
              excludedSources,
            });

            resolve(response);
          } catch (e) {
            reject(e);
          }
        });

        delay += _delayStep;
      }

      orders.push(order);
    }

    return Promise.all(orders);
  }

  /**
   * Call 0x API to generate a trade quote for two SetToken components. This method is intended to be used alongside
   * the DelegatedManager TradeExtension which allows you to rebalance holdings within the SetToken.
   *
   * @param  fromToken            Address of token being sold
   * @param  toToken              Address of token being bought
   * @param  fromTokenDecimals    Token decimals of token being sold (ex: 18)
   * @param  toTokenDecimals      Token decimals of token being bought (ex: 18)
   * @param  rawAmount            String quantity of token to sell (ex: "0.5")
   * @param  fromAddress          SetToken address which holds the buy / sell components
   * @param  setToken             SetTokenAPI instance
   * @param  gasPrice             (Optional) gasPrice to calculate gas costs with (Default: fetched from EthGasStation)
   * @param  slippagePercentage   (Optional) max slippage, determines min receive quantity (ex: 5 (=5%)) (Default: 2%)
   * @param  isFirmQuote          (Optional) Whether quote request is indicative or firm
   * @param  feePercentage        (Optional) Default: 0
   * @param  feeRecipient         (Optional) Default: 0xD3D555Bb655AcBA9452bfC6D7cEa8cC7b3628C55
   * @param  excludedSources      (Optional) Exchanges to exclude (Default: ['Kyber', 'Eth2Dai', 'Mesh'])
   * @param  simulatedChainId     (Optional) ChainId of target network (useful when using a forked development client)
   *
   * @return {Promise<TradeQuote>}
   */
  public async fetchTradeQuoteAsync(
    fromToken: Address,
    toToken: Address,
    fromTokenDecimals: number,
    toTokenDecimals: number,
    rawAmount: string,
    fromAddress: Address,
    setToken: SetTokenAPI,
    gasPrice?: number,
    slippagePercentage?: number,
    isFirmQuote?: boolean,
    feePercentage?: number,
    feeRecipient?: Address,
    excludedSources?: string[],
    simulatedChainId?: number,
  ): Promise<TradeQuote> {
    this.assert.schema.isValidAddress('fromToken', fromToken);
    this.assert.schema.isValidAddress('toToken', toToken);
    this.assert.schema.isValidAddress('fromAddress', fromAddress);
    this.assert.schema.isValidJsNumber('fromTokenDecimals', fromTokenDecimals);
    this.assert.schema.isValidJsNumber('toTokenDecimals', toTokenDecimals);
    this.assert.schema.isValidString('rawAmount', rawAmount);

    // The forked Hardhat network has a chainId of 31337 so we can't rely on autofetching this value
    const chainId = (simulatedChainId !== undefined)
      ? simulatedChainId
      : (await this.provider.getNetwork()).chainId;

    return this.tradeQuoter.generateQuoteForTrade({
      fromToken,
      toToken,
      fromTokenDecimals,
      toTokenDecimals,
      rawAmount,
      fromAddress,
      chainId,
      tradeModule: this.tradeModuleWrapper,
      provider: this.provider,
      setToken,
      gasPrice,
      slippagePercentage,
      isFirmQuote,
      feePercentage,
      feeRecipient,
      excludedSources,
    });
  }

  /**
   * Batch multiple calls to 0x API to generate trade quotes for SetToken component pairs. This method is intended
   * to be used alongside the DelegatedManager BatchTradeExtension which allows you to rebalance holdings within the
   * SetToken. By default, trade quotes are fetched for 0x's public endpoints using their `https://api.0x.org`,
   * `https://<network>/api.0x.org` url scheme. In practice these open endpoints appear to be rate limited at ~3 req/sec
   *
   * It's also possible to make calls from non-browser context with an API key using the `https://gated.api.0x.org`
   * url scheme.
   *
   * These gated endpoints rate-limit calls *per API key* as follows (mileage may vary):
   *
   * > Ethereum: up to 50 requests per second/200 requests per minute.
   * > Other networks: 30 requests per second.
   *
   * The `delayStep` parameter option allows you to stagger parallelized requests to stay within rate limits
   * and is set to 300ms by default.
   *
   * @param  orderPairs           TradeOrderPairs array (see `fetchTradeQuoteAsync` for property descriptions)
   * @param  fromAddress          SetToken address which holds the buy / sell components
   * @param  setToken             SetTokenAPI instance
   * @param  gasPrice             gasPrice to calculate gas costs with
   * @param  isFirmQuote          (Optional) Whether quote request is indicative or firm
   * @param  feePercentage        (Optional) Default: 0
   * @param  feeRecipient         (Optional) Default: 0xD3D555Bb655AcBA9452bfC6D7cEa8cC7b3628C55
   * @param  excludedSources      (Optional) Exchanges to exclude (Default: ['Kyber', 'Eth2Dai', 'Mesh'])
   * @param  simulatedChainId     (Optional) ChainId of target network (useful when using a forked development client)
   * @param  delayStep            (Optional) Delay between firing each quote request (to manage rate-limiting)
   *
   * @return {Promise<TradeQuote>}
   */
  public async batchFetchTradeQuoteAsync(
    orderPairs: TradeOrderPair[],
    fromAddress: Address,
    setToken: SetTokenAPI,
    gasPrice?: number,
    isFirmQuote?: boolean,
    feePercentage?: number,
    feeRecipient?: Address,
    excludedSources?: string[],
    simulatedChainId?: number,
    delayStep?: number,
  ): Promise<TradeQuote[]> {
    const self = this;
    this.assert.schema.isValidAddress('fromAddress', fromAddress);

    for (const pair of orderPairs) {
      this.assert.schema.isValidAddress('fromToken', pair.fromToken);
      this.assert.schema.isValidAddress('toToken', pair.toToken);
      this.assert.schema.isValidJsNumber('fromTokenDecimals', pair.fromTokenDecimals);
      this.assert.schema.isValidJsNumber('toTokenDecimals', pair.toTokenDecimals);
      this.assert.schema.isValidString('rawAmount', pair.rawAmount);
    }

    // The forked Hardhat network has a chainId of 31337 so we can't rely on autofetching this value
    const chainId = (simulatedChainId !== undefined)
      ? simulatedChainId
      : (await this.provider.getNetwork()).chainId;

    // Default 300ms delay (to keep under 200 reqs/min for public endpoints)
    const _delayStep = (delayStep !== undefined)
      ? delayStep
      : 300;

    const orders = [];
    let delay = 0;

    // Check that summation of order pairs do not result in dust position upon trade execution
    // If there's a single max trade, then disregard this check
    self.tradeQuoter.validateBatchTradeDoesNotProduceDustPosition(
      orderPairs,
      setToken,
      fromAddress
    );

    for (const pair of orderPairs) {
      const order = new Promise(async function (resolve, reject) {
        await new Promise(r => setTimeout(() => r(true), delay));

        try {
          const response = await self.tradeQuoter.generateQuoteForTrade({
            fromToken: pair.fromToken,
            toToken: pair.toToken,
            fromTokenDecimals: pair.fromTokenDecimals,
            toTokenDecimals: pair.toTokenDecimals,
            rawAmount: pair.rawAmount,
            slippagePercentage: pair.slippagePercentage,
            tradeModule: self.tradeModuleWrapper,
            provider: self.provider,
            fromAddress,
            chainId,
            setToken,
            gasPrice,
            isFirmQuote,
            feePercentage,
            feeRecipient,
            excludedSources,
          });

          resolve(response);
        } catch (e) {
          reject(e);
        }
      });

      delay += _delayStep;
      orders.push(order);
    }

    return Promise.all(orders);
  }

  /**
   * Fetches a list of tokens and their metadata from CoinGecko. Each entry includes
   * the token's address, proper name, decimals, exchange symbol and a logo URI if available.
   * For Ethereum, this is a list of tokens tradeable on Uniswap, for Polygon it's a list of
   * tokens tradeable on Sushiswap's Polygon exchange. Method is useful for acquiring token decimals
   * necessary to generate a trade quote and images for representing available tokens in a UI.
   *
   * @return List of tradeable tokens for chain platform
   */
  public async fetchTokenListAsync(): Promise<CoinGeckoTokenData[]> {
    await this.initializeForChain();
    return this.coinGecko.fetchTokenList();
  }

  /**
   * Fetches the same info as `fetchTokenList` in the form of a map indexed by address. Method is
   * useful if you're cacheing the token list and want quick lookups for a variety of trades.
   *
   * @return Map of token addresses to token metadata
   */
  public async fetchTokenMapAsync(): Promise<CoinGeckoTokenMap> {
    await this.initializeForChain();
    return this.coinGecko.fetchTokenMap();
  }

  /**
   * Fetches a list of prices vs currencies for the specified inputs from CoinGecko
   *
   * @param  contractAddresses         String array of contract addresses
   * @param  vsCurrencies              String array of currency codes (see CoinGecko api for a complete list)
   *
   * @return                           List of prices vs currencies
   */
  public async fetchCoinPricesAsync(
    contractAddresses: string[],
    vsCurrencies: string[]
  ): Promise<CoinGeckoCoinPrices> {
    await this.initializeForChain();
    return this.coinGecko.fetchCoinPrices({contractAddresses, vsCurrencies});
  }

  /**
   * Fetches the recommended gas price for a specified execution speed.
   *
   * @param  speed                   (Optional) string value: "average" | "fast" | "fastest" (Default: fast)
   *
   * @return                         Number: gas price
   */
  public async fetchGasPriceAsync(speed?: GasOracleSpeed): Promise<number> {
    await this.initializeForChain();
    const oracle = new GasOracleService(this.chainId);
    return oracle.fetchGasPrice(speed);
  }


  private async initializeForChain() {
    if (this.coinGecko === undefined) {
      const network = await this.provider.getNetwork();
      this.chainId = network.chainId;
      this.coinGecko = new CoinGeckoDataService(network.chainId);
    }
  }
}
