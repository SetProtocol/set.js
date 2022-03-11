/*
  Copyright 2021 Set Labs Inc.

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

import axios from 'axios';
import { BigNumber } from 'ethers';
import Assertions from '../../assertions';

import {
  ZeroExTradeQuoterOptions,
  ZeroExTradeQuote,
  ZeroExQueryParams,
  ZeroExApiUrls
} from '../../types/index';

import { Address } from '@setprotocol/set-protocol-v2/utils/types';

/**
 * @title ZeroExTradeQuoter
 * @author Set Protocol
 *
 * A utility library to call 0xAPI to get a swap quote for a token pair on Ethereum or Polygon
 */
export class ZeroExTradeQuoter {
  private host: string;
  private zeroExApiKey: string;
  private assert: Assertions;

  private swapQuoteRoute = '/swap/v1/quote';
  private affiliateAddress: Address = '0xD3D555Bb655AcBA9452bfC6D7cEa8cC7b3628C55';
  private skipValidation: boolean = true;

  constructor(options: ZeroExTradeQuoterOptions) {
    this.assert = new Assertions();
    this.assert.common.isSupportedChainId(options.chainId);
    this.host = this.getHostForChain(options.chainId, options.zeroExApiUrls) as string;
    this.zeroExApiKey = options.zeroExApiKey;
  }

  /**
   * Gets a trade quote for a token pair
   *
   * @param  sellTokenAddress   address of token to sell
   * @param  buyTokenAddress    address of token to buy
   * @param  sellAmount         BigNumber amount of token to sell
   * @param  takerAddress       SetToken manager address
   * @param  isFirm             Boolean notifying 0x whether or not the query is speculative or
   *                            precedes an firm intent to trade
   *
   * @return                    ZeroExTradeQuote: quote info
   */
  async fetchTradeQuote(
    sellTokenAddress: Address,
    buyTokenAddress: Address,
    amount: BigNumber,
    useBuyAmount: boolean,
    takerAddress: Address,
    isFirm: boolean,
    slippagePercentage: number,
    feeRecipient: Address,
    excludedSources: string[],
    feePercentage: number
  ): Promise<ZeroExTradeQuote> {
    const url = `${this.host}${this.swapQuoteRoute}`;

    const params: ZeroExQueryParams = {
      sellToken: sellTokenAddress,
      buyToken: buyTokenAddress,
      slippagePercentage: slippagePercentage,
      sellAmount: (useBuyAmount) ? undefined : amount.toString(),
      buyAmount: (useBuyAmount) ? amount.toString() : undefined,
      takerAddress,
      excludedSources: excludedSources.join(','),
      skipValidation: this.skipValidation,
      feeRecipient: feeRecipient,
      buyTokenPercentageFee: feePercentage,
      affiliateAddress: this.affiliateAddress,
      intentOnFilling: isFirm,
    };

    // Only set the zeroExApiKey if calling `gated.api.0x.org` endpoints from a backend
    // + `api.0x.org` is public - no api key is required
    // + `frontend-integrations.api.0x.org` relies on IP whitelisting from 0x
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (this.zeroExApiKey !== undefined) {
      headers['0x-api-key'] = this.zeroExApiKey;
    }

    try {
      const response = await axios.get(url, {
        params,
        headers,
      });

      return {
        guaranteedPrice: parseFloat(response.data.guaranteedPrice),
        price: parseFloat(response.data.price),
        sellAmount: BigNumber.from(response.data.sellAmount),
        buyAmount: BigNumber.from(response.data.buyAmount),
        calldata: response.data.data,
        gas: parseInt(response.data.gas),
        _quote: response.data,
      };
    } catch (error) {
      throw new Error('ZeroEx quote request failed: ' + error);
    }
  }

  private getHostForChain(chainId: number, zeroExAPIUrls?: ZeroExApiUrls ) {
    const ethereumUrl = zeroExAPIUrls?.ethereum ? zeroExAPIUrls.ethereum : 'https://api.0x.org';
    const optimismUrl = zeroExAPIUrls?.optimism ? zeroExAPIUrls.optimism : 'https://optimism.api.0x.org';
    const polygonUrl = zeroExAPIUrls?.polygon ? zeroExAPIUrls.polygon : 'https://polygon.api.0x.org';

    switch (chainId) {
      case 1: return ethereumUrl;
      case 10: return optimismUrl;
      case 137: return polygonUrl;
    }
  }
}
