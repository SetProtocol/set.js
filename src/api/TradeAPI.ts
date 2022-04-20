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
  TradeQuoter
} from './utils';

import {
  TradeQuote,
  ZeroExApiUrls,
  TradeOrderPair
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

  public constructor(
    provider: Provider,
    tradeModuleAddress: Address,
    zeroExApiKey?: string,
    zeroExApiUrls?: ZeroExApiUrls
  ) {
    this.provider = provider;
    this.tradeModuleWrapper = new TradeModuleWrapper(provider, tradeModuleAddress);
    this.assert = new Assertions();
    this.tradeQuoter = new TradeQuoter(zeroExApiKey, zeroExApiUrls);
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
   * Batch multiple calls to 0x API to generate trade quotes for SetToken component pairs. By default, trade quotes
   * are fetched for 0x's public endpoints using their `https://api.0x.org`, `https://<network>/api.0x.org`
   * url scheme. In practice these open endpoints appear to be rate limited at ~3 req/sec
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
}
