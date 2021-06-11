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
import { ethers, BigNumber } from 'ethers';
import { Address } from '@setprotocol/set-protocol-v2/utils/types';
import { CoinGeckoTokenMap, TradeQuote } from '@src/types';
import SetTokenAPI from '@src/api/SetTokenAPI';
import TradeModuleWrapper from '@src/wrappers/set-protocol-v2/TradeModuleWrapper';
import { TradeQuoter, CoinGeckoDataService } from '@src/api/utils';
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
    case fixture.gasNowRequest: return fixture.gasNowResponse;
    case fixture.maticGasStationRequest: return fixture.maticGasStationResponse;
    case fixture.coinGeckoTokenRequestEth: return fixture.coinGeckoTokenResponseEth;
    case fixture.coinGeckoTokenRequestPoly: return fixture.coinGeckoTokenResponsePoly;
    case fixture.coinGeckoPricesRequestEth: return fixture.coinGeckoPricesResponseEth;
    case fixture.coinGeckoPricesRequestPoly: return fixture.coinGeckoPricesResponsePoly;
    case fixture.maticMapperRequestPoly: return fixture.maticMapperResponsePoly;
    case fixture.quickswapRequestPoly: return fixture.quickswapResponsePoly;
  }
});

// @ts-ignore
provider.estimateGas = jest.fn((arg: any) => Promise.resolve(BigNumber.from(300_000)));

describe('TradeQuoteAPI', () => {
  let streamingFeeModuleAddress: Address;
  let protocolViewerAddress: Address;
  let setTokenCreatorAddress: Address;
  let tradeModuleAddress: Address;
  let setTokenAPI: SetTokenAPI;
  let tradeModuleWrapper: TradeModuleWrapper;

  beforeEach(async () => {
    [
      streamingFeeModuleAddress,
      protocolViewerAddress,
      setTokenCreatorAddress,
      tradeModuleAddress,
    ] = await provider.listAccounts();

    setTokenAPI = new SetTokenAPI(
      provider,
      protocolViewerAddress,
      streamingFeeModuleAddress,
      setTokenCreatorAddress
    );

    tradeModuleWrapper = new TradeModuleWrapper(provider, tradeModuleAddress);
  });

  describe('mainnet', () => {
    let coingecko: CoinGeckoDataService;
    let tokenMap: CoinGeckoTokenMap;
    let tradeQuoter: TradeQuoter;

    beforeEach(async () => {
      coingecko = new CoinGeckoDataService(1);
      tokenMap = await coingecko.fetchTokenMap();
      tradeQuoter = new TradeQuoter('xyz');
    });

    describe('generate a quote', () => {
      let subjectFromToken: Address;
      let subjectToToken: Address;
      let subjectFromTokenDecimals: number;
      let subjectToTokenDecimals: number;
      let subjectRawAmount: string;
      let subjectSetTokenAddress: Address;
      let subjectChainId: number;
      let subjectSetToken: SetTokenAPI;

      beforeEach(async () => {
        subjectFromToken = '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2'; // MKR
        subjectToToken = '0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e'; // YFI
        subjectFromTokenDecimals = tokenMap[subjectFromToken].decimals;
        subjectToTokenDecimals = tokenMap[subjectToToken].decimals;
        subjectSetTokenAddress = DPI_ETH; // DPI
        subjectRawAmount = '.5';
        subjectChainId = 1;
        subjectSetToken = setTokenAPI;
      });

      async function subject(): Promise<TradeQuote> {
        return await tradeQuoter.generate({
          fromToken: subjectFromToken,
          toToken: subjectToToken,
          fromTokenDecimals: subjectFromTokenDecimals,
          toTokenDecimals: subjectToTokenDecimals,
          rawAmount: subjectRawAmount,
          fromAddress: subjectSetTokenAddress,
          chainId: subjectChainId,
          setToken: subjectSetToken,
          tradeModule: tradeModuleWrapper,
          provider: provider,
        });
      }

      it('should generate a trade quote correctly', async () => {
        const quote = await subject();
        expect(quote).to.be.deep.equal(fixture.setTradeQuoteEth);
      });
    });
  });

  describe('polygon', () => {
    let coingecko: CoinGeckoDataService;
    let tokenMap: CoinGeckoTokenMap;
    let tradeQuoter: TradeQuoter;

    beforeEach(async () => {
      coingecko = new CoinGeckoDataService(137);
      tokenMap = await coingecko.fetchTokenMap();
      tradeQuoter = new TradeQuoter('xyz');
    });

    describe('generate a quote', () => {
      let subjectFromToken: Address;
      let subjectToToken: Address;
      let subjectFromTokenDecimals: number;
      let subjectToTokenDecimals: number;
      let subjectRawAmount: string;
      let subjectSetTokenAddress: Address;
      let subjectChainId: number;
      let subjectSlippagePercentage: number;
      let subjectSetToken: SetTokenAPI;

      beforeEach(async () => {
        subjectFromToken = '0x2791bca1f2de4661ed88a30c99a7a9449aa84174'; // USDC
        subjectToToken = '0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6'; // WBTC
        subjectFromTokenDecimals = tokenMap[subjectFromToken].decimals;
        subjectToTokenDecimals = tokenMap[subjectToToken].decimals;
        subjectSetTokenAddress = BUD_POLY; // BUD
        subjectRawAmount = '1';
        subjectChainId = 137;
        subjectSlippagePercentage = 2,
        subjectSetToken = setTokenAPI;
      });

      async function subject(): Promise<TradeQuote> {
        return await tradeQuoter.generate({
          fromToken: subjectFromToken,
          toToken: subjectToToken,
          fromTokenDecimals: subjectFromTokenDecimals,
          toTokenDecimals: subjectToTokenDecimals,
          rawAmount: subjectRawAmount,
          fromAddress: subjectSetTokenAddress,
          chainId: subjectChainId,
          slippagePercentage: subjectSlippagePercentage,
          setToken: subjectSetToken,
          tradeModule: tradeModuleWrapper,
          provider: provider,
        });
      }

      it('should generate a trade quote correctly', async () => {
        const quote = await subject();
        expect(quote).to.be.deep.equal(fixture.setTradeQuotePoly);
      });
    });
  });
});
