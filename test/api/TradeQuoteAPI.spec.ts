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

jest.mock('@src/api/SetTokenAPI', () => {
  return function() {
    return {
      fetchSetDetailsAsync: jest.fn().mockImplementationOnce(() => {
        return fixture.setDetailsResponse;
      }),
    };
  };
});

jest.mock('axios');

// @ts-ignore
axios.get.mockImplementation(val => {
  switch (val) {
    case fixture.zeroExRequest: return fixture.zeroExReponse;
    case fixture.ethGasStationRequest: return fixture.ethGasStationResponse;
    case fixture.coinGeckoTokenRequest: return fixture.coinGeckoTokenResponse;
    case fixture.coinGeckoPricesRequest: return fixture.coinGeckoPricesResponse;
  }
});

describe('TradeQuoteAPI', () => {
  let streamingFeeModuleAddress: Address;
  let protocolViewerAddress: Address;
  let setTokenCreatorAddress: Address;
  let tradeQuote: TradeQuoteAPI;
  let coingecko: CoinGeckoDataService;
  let tokenMap: CoinGeckoTokenMap;
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
    coingecko = new CoinGeckoDataService(1);
    tokenMap = await coingecko.fetchTokenMap();
    tradeQuote = new TradeQuoteAPI(setTokenAPI, 'xyz');
  });

  describe('generate (quote)', () => {
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
      subjectSetTokenAddress = '0x1494ca1f11d487c2bbe4543e90080aeba4ba3c2b'; // DPI
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

    it('should generate a trade quote for mainnet correctly', async () => {
      const quote = await subject();
      expect(quote).to.be.deep.equal(fixture.setTradeQuote);
    });
  });
});
