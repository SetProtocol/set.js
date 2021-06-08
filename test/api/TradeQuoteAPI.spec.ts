/*
  Copyright 2018 Set Labs Inc.

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

import axios from 'axios';
import { ethers } from 'ethers';
import { Address } from '@setprotocol/set-protocol-v2/utils/types';
import { CoinGeckoTokenMap, TradeQuote } from '@src/types';
import SetTokenAPI from '@src/api/SetTokenAPI';
import { TradeQuoteAPI, CoinGeckoDataService } from '@src/api/utils/tradeQuote';
import { tradeQuoteFixtures as fixture } from '../fixtures/tradeQuote';
import { expect } from '@test/utils/chai';

const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');

const DPI_ETH = '0x1494ca1f11d487c2bbe4543e90080aeba4ba3c2b';
const BUD_POLY = '0xd7dc13984d4fe87f389e50067fb3eedb3f704ea0';

jest.mock('@src/api/SetTokenAPI', () => {
  return function() {
    return {
      fetchSetDetailsAsync: jest.fn().mockImplementationOnce((setToken: Address) => {
        switch (setToken) {
          case DPI_ETH: return fixture.setDetailsResponseDPI;
          case BUD_POLY: return fixture.setDetailsResponseBUD;
        }
      }),
    };
  };
});

jest.mock('axios');

// @ts-ignore
axios.get.mockImplementation(val => {
  switch (val) {
    case fixture.zeroExRequestEth: return fixture.zeroExReponseEth;
    case fixture.zeroExRequestPoly: return fixture.zeroExReponsePoly;
    case fixture.ethGasStationRequest: return fixture.ethGasStationResponse;
    case fixture.maticGasStationRequest: return fixture.maticGasStationResponse;
    case fixture.coinGeckoTokenRequestEth: return fixture.coinGeckoTokenResponseEth;
    case fixture.coinGeckoTokenRequestPoly: return fixture.coinGeckoTokenResponsePoly;
    case fixture.coinGeckoPricesRequestEth: return fixture.coinGeckoPricesResponseEth;
    case fixture.coinGeckoPricesRequestPoly: return fixture.coinGeckoPricesResponsePoly;
    case fixture.maticMapperRequestPoly: return fixture.maticMapperResponsePoly;
    case fixture.quickswapRequestPoly: return fixture.quickswapResponsePoly;
  }
});

describe('TradeQuoteAPI', () => {
  let streamingFeeModuleAddress: Address;
  let protocolViewerAddress: Address;
  let setTokenCreatorAddress: Address;
  let setTokenAPI: SetTokenAPI;

  beforeEach(async () => {
    [
      streamingFeeModuleAddress,
      protocolViewerAddress,
      setTokenCreatorAddress,
    ] = await provider.listAccounts();

    setTokenAPI = new SetTokenAPI(
      provider,
      protocolViewerAddress,
      streamingFeeModuleAddress,
      setTokenCreatorAddress
    );
  });

  describe('mainnet', () => {
    let tradeQuote: TradeQuoteAPI;
    let coingecko: CoinGeckoDataService;
    let tokenMap: CoinGeckoTokenMap;

    beforeEach(async () => {
      coingecko = new CoinGeckoDataService(1);
      tokenMap = await coingecko.fetchTokenMap();
      tradeQuote = new TradeQuoteAPI(setTokenAPI, 'xyz');
    });

    describe('generate a quote', () => {
      let subjectFromToken: Address;
      let subjectToToken: Address;
      let subjectRawAmount: string;
      let subjectSetTokenAddress: Address;
      let subjectChainId: number;
      let subjectSlippagePercentage: number;
      let subjectTokenMap: CoinGeckoTokenMap;

      beforeEach(async () => {
        subjectFromToken = '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2'; // MKR
        subjectToToken = '0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e'; // YFI
        subjectSetTokenAddress = DPI_ETH; // DPI
        subjectRawAmount = '.5';
        subjectChainId = 1;
        subjectSlippagePercentage = 2,
        subjectTokenMap = tokenMap;
      });

      async function subject(): Promise<TradeQuote> {
        return await tradeQuote.generate({
          fromToken: subjectFromToken,
          toToken: subjectToToken,
          rawAmount: subjectRawAmount,
          fromAddress: subjectSetTokenAddress,
          chainId: subjectChainId,
          slippagePercentage: subjectSlippagePercentage,
          tokenMap: subjectTokenMap,
        });
      }

      it('should generate a trade quote correctly', async () => {
        const quote = await subject();
        expect(quote).to.be.deep.equal(fixture.setTradeQuoteEth);
      });
    });
  });

  describe('polygon', () => {
    let tradeQuote: TradeQuoteAPI;
    let coingecko: CoinGeckoDataService;
    let tokenMap: CoinGeckoTokenMap;

    beforeEach(async () => {
      coingecko = new CoinGeckoDataService(137);
      tokenMap = await coingecko.fetchTokenMap();
      tradeQuote = new TradeQuoteAPI(setTokenAPI, 'xyz');
    });

    describe('generate a quote', () => {
      let subjectFromToken: Address;
      let subjectToToken: Address;
      let subjectRawAmount: string;
      let subjectSetTokenAddress: Address;
      let subjectChainId: number;
      let subjectSlippagePercentage: number;
      let subjectTokenMap: CoinGeckoTokenMap;

      beforeEach(async () => {
        subjectFromToken = '0x2791bca1f2de4661ed88a30c99a7a9449aa84174'; // USDC
        subjectToToken = '0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6'; // WBTC
        subjectSetTokenAddress = BUD_POLY; // BUD
        subjectRawAmount = '1';
        subjectChainId = 137;
        subjectSlippagePercentage = 2,
        subjectTokenMap = tokenMap;
      });

      async function subject(): Promise<TradeQuote> {
        return await tradeQuote.generate({
          fromToken: subjectFromToken,
          toToken: subjectToToken,
          rawAmount: subjectRawAmount,
          fromAddress: subjectSetTokenAddress,
          chainId: subjectChainId,
          slippagePercentage: subjectSlippagePercentage,
          tokenMap: subjectTokenMap,
        });
      }

      it('should generate a trade quote correctly', async () => {
        const quote = await subject();
        expect(quote).to.be.deep.equal(fixture.setTradeQuotePoly);
      });
    });
  });
});
