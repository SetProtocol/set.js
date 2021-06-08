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
import Assertions from '../../../assertions';

import {
  ZeroExTradeQuoterOptions,
  ZeroExTradeQuote,
  ZeroExQueryParams
} from '../../../types/index';

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
  private feePercentage: number = 0;
  private feeRecipientAddress: Address = '0xD3D555Bb655AcBA9452bfC6D7cEa8cC7b3628C55';
  private affiliateAddress: Address = '0xD3D555Bb655AcBA9452bfC6D7cEa8cC7b3628C55';
  private excludedSources: string[] = ['Kyber', 'Eth2Dai', 'Uniswap', 'Mesh'];
  private skipValidation: boolean = true;
  private slippagePercentage: number = 0.02;

  constructor(options: ZeroExTradeQuoterOptions) {
    this.assert = new Assertions();
    this.assert.common.isSupportedChainId(options.chainId);
    this.host = this.getHostForChain(options.chainId) as string;
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
    sellAmount: BigNumber,
    takerAddress: Address,
    isFirm: boolean,
  ): Promise<ZeroExTradeQuote> {
    const url = `${this.host}${this.swapQuoteRoute}`;

    const params: ZeroExQueryParams = {
      sellToken: sellTokenAddress,
      buyToken: buyTokenAddress,
      slippagePercentage: this.slippagePercentage,
      sellAmount: sellAmount.toString(),
      takerAddress,
      excludedSources: this.excludedSources.join(','),
      skipValidation: this.skipValidation,
      feeRecipient: this.feeRecipientAddress,
      buyTokenPercentageFee: this.feePercentage,
      affiliateAddress: this.affiliateAddress,
      intentOnFilling: isFirm,
    };

    try {
      const response = await axios.get(url, {
        params: params,
        headers: {
          '0x-api-key': this.zeroExApiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      return {
        guaranteedPrice: parseFloat(response.data.guaranteedPrice),
        price: parseFloat(response.data.price),
        sellAmount: BigNumber.from(response.data.sellAmount),
        buyAmount: BigNumber.from(response.data.buyAmount),
        calldata: response.data.data,
        gas: parseInt(response.data.gas),
      };
    } catch (error) {
      throw new Error('ZeroEx quote request failed: ' + error);
    }
  }

  private getHostForChain(chainId: number) {
    switch (chainId) {
      case 1: return 'https://api.0x.org';
      case 137: return 'https://polygon.api.0x.org';
    }
  }
}
