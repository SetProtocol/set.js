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
import Assertions from '../../assertions';

import {
  CoinGeckoCoinPrices,
  CoinGeckoTokenData,
  CoinGeckoTokenMap,
  CoinPricesParams,
} from '../../types';

/**
 * These currency codes can be used for the vs_currencies parameter of the service's
 * fetchCoinPrices method
 *
 * @type {number}
 */
export const USD_CURRENCY_CODE = 'usd';
export const ETH_CURRENCY_CODE = 'eth';

/**
 * @title CoinGeckoDataService
 * @author Set Protocol
 *
 * A utility library for fetching token metadata and coin prices from Coingecko for Ethereum
 * and Polygon chains
 */
export class CoinGeckoDataService {
  chainId: number;
  private tokenList: CoinGeckoTokenData[] | undefined;
  private tokenMap: CoinGeckoTokenMap | undefined;
  private assert: Assertions;

  constructor(chainId: number) {
    this.assert = new Assertions();
    this.assert.common.isSupportedChainId(chainId);
    this.chainId = chainId;
  }

  /**
   * Gets address-to-price map of token prices for a set of token addresses and currencies
   *
   * @param  params             CoinPricesParams: token addresses and currency codes
   * @return                    CoinGeckoCoinPrices: Address to price map
   */
  async fetchCoinPrices(params: CoinPricesParams): Promise<CoinGeckoCoinPrices> {
    const platform = this.getPlatform();
    const endpoint = `https://api.coingecko.com/api/v3/simple/token_price/${platform}?`;
    const contractAddressParams = `contract_addresses=${params.contractAddresses.join(',')}`;
    const vsCurrenciesParams = `vs_currencies=${params.vsCurrencies.join(',')}`;
    const url = `${endpoint}${contractAddressParams}&${vsCurrenciesParams}`;

    let response;
    try {
      response = await axios.get(url);
    } catch (e) {
      // If coingecko fails, set prices to zero
      response = { data: {} };
      for (const address of params.contractAddresses) {
        response.data[address] = {};
        response.data[address][params.vsCurrencies[0]] = 0.00;
      }
    }
    return response.data;
  }

  /**
   * Gets a list of available tokens and their metadata for chain. If Ethereum, the list
   * is sourced from Uniswap. If Polygon the list is sourced from Sushiswap with image assets
   * derived from multiple sources including CoinGecko
   *
   * @return  CoinGeckoTokenData: array of token data
   */
  async fetchTokenList(): Promise<CoinGeckoTokenData[]> {
    if (this.tokenList !== undefined) return this.tokenList;

    const url = this.getCoingeckoUrl();
    this.tokenList = await this.fetchCoingeckoTokenList(url);
    this.tokenMap = this.convertTokenListToAddressMap(this.tokenList);

    return this.tokenList!;
  }

  /**
   * Gets a token list (see above) formatted as an address indexed map
   *
   * @return  CoinGeckoTokenMap: map of token addresses to token metadata
   */
  async fetchTokenMap(): Promise<CoinGeckoTokenMap> {
    if (this.tokenMap !== undefined) return this.tokenMap;

    this.tokenList = await this.fetchTokenList();
    this.tokenMap = this.convertTokenListToAddressMap(this.tokenList);

    return this.tokenMap;
  }

  public convertTokenListToAddressMap(list: CoinGeckoTokenData[] = []): CoinGeckoTokenMap {
    const tokenMap: CoinGeckoTokenMap = {};

    for (const entry of list) {
      tokenMap[entry.address] = Object.assign({}, entry);
    }

    return tokenMap;
  }

  private getPlatform(): string {
    switch (this.chainId) {
      case 1: return 'ethereum';
      case 10: return 'optimistic-ethereum';
      case 137: return 'polygon-pos';
      default: return '';
    }
  }

  private getCoingeckoUrl(): string {
    switch (this.chainId) {
      case 1: return 'https://tokens.coingecko.com/uniswap/all.json';
      case 10: return 'https://tokens.coingecko.com/optimistic-ethereum/all.json';
      case 137: return 'https://tokens.coingecko.com/polygon-pos/all.json';
    }
  }

  private async fetchCoingeckoTokenList(url: string): Promise<CoinGeckoTokenData[]> {
    const response = await axios.get(url);
    return response.data.tokens;
  }
}
