/*
  Copyright 2020 Set Labs Inc.

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

import { ContractTransaction } from 'ethers';
import { Provider } from '@ethersproject/providers';
import { Address } from '@setprotocol/set-protocol-v2/utils/types';
import { TransactionOverrides } from '@setprotocol/set-protocol-v2/dist/typechain';
import { BigNumber } from 'ethers/lib/ethers';

import TradeModuleWrapper from '../wrappers/set-protocol-v2/TradeModuleWrapper';
import SetTokenAPI from './SetTokenAPI';
import Assertions from '../assertions';

import {
  TradeQuoter,
  CoinGeckoDataService,
  GasOracleService
} from './utils';

import {
  TradeQuote,
  CoinGeckoTokenData,
  CoinGeckoTokenMap,
  GasOracleSpeed,
  CoinGeckoCoinPrices
} from '../types';

/**
 * @title  TradeAPI
 * @author Set Protocol
 *
 * The TradeAPI exposes methods to generate the calldata needed for 1inch exchange trades
 * and a simple trade interface for making the actual trades.
 *
 */
export default class TradeAPI {
  private tradeModuleWrapper: TradeModuleWrapper;
  private assert: Assertions;
  private provider: Provider;
  private tradeQuoter: TradeQuoter;
  private coinGecko: CoinGeckoDataService;
  private chainId: number;

  public constructor(
    provider: Provider,
    tradeModuleAddress: Address,
    zeroExApiKey?: string,
  ) {
    this.provider = provider;
    this.tradeModuleWrapper = new TradeModuleWrapper(provider, tradeModuleAddress);
    this.assert = new Assertions();
    this.tradeQuoter = new TradeQuoter(zeroExApiKey);
  }

  /**
   * Initializes this TradeModule to the SetToken. Only callable by the SetToken's manager.
   *
   * @param setTokenAddress             Address of the SetToken to initialize
   * @param callerAddress               Address of caller (optional)
   * @param txOpts                      Overrides for transaction (optional)
   *
   * @return                            Transaction hash of the initialize transaction
   */
  public async initializeAsync(
    setTokenAddress: Address,
    callerAddress: Address = undefined,
    txOpts: TransactionOverrides = {}
  ): Promise<ContractTransaction> {
    this.assert.schema.isValidAddress('setTokenAddress', setTokenAddress);

    return await this.tradeModuleWrapper.initialize(
      setTokenAddress,
      callerAddress,
      txOpts
    );
  }

  /**
   * Executes a trade on a supported DEX. Only callable by the SetToken's manager.
   *
   * @dev Although the SetToken units are passed in for the send and receive quantities, the total quantity
   * sent and received is the quantity of SetToken units multiplied by the SetToken totalSupply.
   *
   * @param setTokenAddress             Instance of the SetToken to trade
   * @param exchangeName                Human readable name of the exchange in the integrations registry
   * @param sendTokenAddress            Address of the token to be sent to the exchange
   * @param sendQuantity                Units of token in SetToken sent to the exchange
   * @param receiveTokenAddress         Address of the token that will be received from the exchange
   * @param minReceiveQuantity          Min units of token in SetToken to be received from the exchange
   * @param data                        Arbitrary bytes to be used to construct trade call data
   *
   * @return                            Transaction hash of the trade transaction
   */
  public async tradeAsync(
    setTokenAddress: Address,
    exchangeName: string,
    sendTokenAddress: Address,
    sendQuantity: BigNumber,
    receiveTokenAddress: Address,
    minReceivedQuantity: BigNumber,
    data: string,
    callerAddress: Address = undefined,
    txOpts: TransactionOverrides = {}
  ): Promise<ContractTransaction> {
    this.assert.schema.isValidAddress('sendTokenAddress', sendTokenAddress);
    this.assert.schema.isValidAddress('setTokenAddress', setTokenAddress);
    this.assert.schema.isValidAddress('receiveTokenAddress', receiveTokenAddress);
    this.assert.common.greaterThanZero(sendQuantity, 'sendQuantity needs to be greater than zero');

    return await this.tradeModuleWrapper.trade(
      setTokenAddress,
      exchangeName,
      sendTokenAddress,
      sendQuantity,
      receiveTokenAddress,
      minReceivedQuantity,
      data,
      callerAddress,
      txOpts
    );
  }

  /**
   * Call 0x API to generate a trade quote for two SetToken components.
   *
   * @param  fromToken            Address of token being sold
   * @param  toToken              Address of token being bought
   * @param  fromTokenDecimals    Token decimals of token being sold (ex: 18)
   * @param  toTokenDecimals      Token decimals of token being bought (ex: 18)
   * @param  rawAmount            String quantity of token to sell (ex: "0.5")
   * @param  fromAddress          SetToken address which holds the buy / sell components
   * @param  setToken             SetTokenAPI instance
   * @param  gasPrice             (Optional) gasPrice to calculate gas costs with (Default: fetched from EthGasStation)
   * @param  slippagePercentage   (Optional) maximum slippage, determines min receive quantity. (Default: 2%)
   * @param  isFirmQuote          (Optional) Whether quote request is indicative or firm
   * @param  feePercentage        (Optional) Default: 0
   * @param  feeRecipient         (Optional) Default: 0xD3D555Bb655AcBA9452bfC6D7cEa8cC7b3628C55
   * @param  excludedSources      (Optional) Exchanges to exclude (Default: ['Kyber', 'Eth2Dai', 'Uniswap', 'Mesh'])
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
    skipAmountVerification?: boolean,
  ): Promise<TradeQuote> {
    this.assert.schema.isValidAddress('fromToken', fromToken);
    this.assert.schema.isValidAddress('toToken', toToken);
    this.assert.schema.isValidAddress('fromAddress', fromAddress);
    this.assert.schema.isValidJsNumber('fromTokenDecimals', fromTokenDecimals);
    this.assert.schema.isValidJsNumber('toTokenDecimals', toTokenDecimals);
    this.assert.schema.isValidString('rawAmount', rawAmount);

    const chainId = (await this.provider.getNetwork()).chainId;

    return this.tradeQuoter.generate({
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
      skipAmountVerification,
    });
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
