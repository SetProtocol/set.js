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

const pageResults = require('graph-results-pager');

import axios from 'axios';
import Assertions from '../../assertions';

import {
  CoinGeckoCoinPrices,
  CoinGeckoTokenData,
  SushiswapTokenData,
  CoinGeckoTokenMap,
  CoinPricesParams,
  PolygonMappedTokenData
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

    switch (this.chainId) {
      case 1:
        this.tokenList = await this.fetchEthereumTokenList();
        break;
      case 137:
        this.tokenList = await this.fetchPolygonTokenList();
        break;
    }
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

  private async fetchEthereumTokenList(): Promise<CoinGeckoTokenData[]> {
    const url = 'https://tokens.coingecko.com/uniswap/all.json';
    const response = await axios.get(url);
    return response.data.tokens;
  }

  private async fetchPolygonTokenList(): Promise<CoinGeckoTokenData[]> {
    const coingeckoEthereumTokens = await this.fetchEthereumTokenList();
    const polygonMappedTokens = await this.fetchPolygonMappedTokenList();
    const sushiPolygonTokenList = await this.fetchSushiPolygonTokenList();
    const quickswapPolygonTokenList = await this.fetchQuickswapPolygonTokenList();

    for (const token of sushiPolygonTokenList) {
      const quickswapToken = quickswapPolygonTokenList.find(t => t.address.toLowerCase() === token.address);

      if (quickswapToken) {
        token.logoURI = quickswapToken.logoURI;
        continue;
      }

      const ethereumAddress = polygonMappedTokens[token.address];

      if (ethereumAddress !== undefined) {
        const ethereumToken = coingeckoEthereumTokens.find(t => t.address.toLowerCase() === ethereumAddress);

        if (ethereumToken) {
          token.logoURI = ethereumToken.logoURI;
        }
      }
    }

    return sushiPolygonTokenList;
  }

  private async fetchSushiPolygonTokenList() {
    let tokens: SushiswapTokenData[] = [];
    const url = 'https://api.thegraph.com/subgraphs/name/sushiswap/matic-exchange';
    const properties = [
      'id',
      'symbol',
      'name',
      'decimals',
      'volumeUSD',
    ];

    const response = await pageResults({
      api: url,
      query: {
        entity: 'tokens',
        properties: properties,
      },
    });

    for (const token of response) {
      tokens.push({
        chainId: 137,
        address: token.id,
        symbol: token.symbol,
        name: token.name,
        decimals: parseInt(token.decimals),
        volumeUSD: parseFloat(token.volumeUSD),
      });
    }

    // Sort by volume and filter out untraded tokens
    tokens.sort((a, b) => b.volumeUSD - a.volumeUSD);
    tokens = tokens.filter(t => t.volumeUSD > 0);

    return tokens;
  }

  private async fetchPolygonMappedTokenList(): Promise<PolygonMappedTokenData> {
    let offset = 0;
    const tokens: PolygonMappedTokenData = {};

    const url = 'https://tokenmapper.api.matic.today/api/v1/mapping?';
    const params = 'map_type=[%22POS%22]&chain_id=137&limit=200&offset=';

    while (true) {
      const response = await axios.get(`${url}${params}${offset}`);

      if (response.data.message === 'success') {
        for (const token of response.data.data.mapping) {
          tokens[token.child_token.toLowerCase()] = token.root_token.toLowerCase();
        }

        if (response.data.data.has_next_page === true) {
          offset += 200;
          continue;
        }
      }
      break;
    }

    return tokens;
  }

  private async fetchQuickswapPolygonTokenList(): Promise<CoinGeckoTokenData[]> {
    const url = 'https://raw.githubusercontent.com/sameepsi/' +
                'quickswap-default-token-list/master/src/tokens/mainnet.json';

    const data = (await axios.get(url)).data;
    return data;
  }

  private convertTokenListToAddressMap(list: CoinGeckoTokenData[] = []): CoinGeckoTokenMap {
    const tokenMap: CoinGeckoTokenMap = {};

    for (const entry of list) {
      tokenMap[entry.address] = Object.assign({}, entry);
    }

    return tokenMap;
  }

  private getPlatform(): string {
    switch (this.chainId) {
      case 1: return 'ethereum';
      case 137: return 'polygon-pos';
      default: return '';
    }
  }
}
