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
const pageResults = require('graph-results-pager');

import { ethers, ContractTransaction } from 'ethers';
import { BigNumber } from 'ethers/lib/ethers';
import { Network } from '@ethersproject/providers';
import { Address } from '@setprotocol/set-protocol-v2/utils/types';
import { EMPTY_BYTES } from '@setprotocol/set-protocol-v2/dist/utils/constants';
import { ether } from '@setprotocol/set-protocol-v2/dist/utils/common';

import TradeAPI from '@src/api/TradeAPI';
import TradeModuleWrapper from '@src/wrappers/set-protocol-v2/TradeModuleWrapper';
import type SetTokenAPI from '@src/api/SetTokenAPI';
import {
  TradeQuoter,
  CoinGeckoDataService,
} from '@src/api/utils';
import { expect } from '@test/utils/chai';
import {
  TradeQuote,
  CoinGeckoTokenData,
  CoinGeckoTokenMap,
  CoinGeckoCoinPrices
} from '@src/types';

import { tradeQuoteFixtures as fixture } from '../fixtures/tradeQuote';

const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');

jest.mock('@src/wrappers/set-protocol-v2/TradeModuleWrapper');
jest.mock('@src/api/utils/tradeQuoter');
jest.mock('axios');
jest.mock('graph-results-pager');

// @ts-ignore
axios.get.mockImplementation(val => {
  switch (val) {
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

pageResults.mockImplementation(() => fixture.sushiSubgraphResponsePoly);

describe('TradeAPI', () => {
  let tradeModuleAddress: Address;
  let setTokenAddress: Address;
  let owner: Address;

  let tradeModuleWrapper: TradeModuleWrapper;
  let tradeQuoter: TradeQuoter;
  let tradeAPI: TradeAPI;

  beforeEach(async () => {
    [
      owner,
      setTokenAddress,
      tradeModuleAddress,
    ] = await provider.listAccounts();

    tradeAPI = new TradeAPI(provider, tradeModuleAddress);
    tradeModuleWrapper = (TradeModuleWrapper as any).mock.instances[0];
    tradeQuoter = (TradeQuoter as any).mock.instances[0];
  });

  afterEach(async () => {
    (TradeModuleWrapper as any).mockClear();
    (TradeQuoter as any).mockClear();
    (axios as any).mockClear();
  });

  describe('#initializeAsync', () => {
    let subjectSetToken: Address;
    let subjectCaller: Address;
    let subjectTransactionOptions: any;

    beforeEach(async () => {
      subjectSetToken = setTokenAddress;
      subjectTransactionOptions = {};
      subjectCaller = owner;
    });

    async function subject(): Promise<any> {
      return tradeAPI.initializeAsync(
        subjectSetToken,
        subjectCaller,
        subjectTransactionOptions
      );
    }

    it('should call initialize on the TradeModuleWrapper', async () => {
      await subject();

      expect(tradeModuleWrapper.initialize).to.have.beenCalledWith(
        subjectSetToken,
        subjectCaller,
        subjectTransactionOptions
      );
    });
  });

  describe('#tradeAsync', () => {
    let subjectSetTokenAddress: Address;
    let subjectExchangeName: string;
    let subjectSendTokenAddress: Address;
    let subjectSendQuantity: BigNumber;
    let subjectReceiveTokenAddress: Address;
    let subjectMinReceivedQuantity: BigNumber;
    let subjectData: string;
    let subjectCallerAddress: Address;
    let subjectTransactionOptions: any;

    beforeEach(async () => {
      subjectSetTokenAddress = '0xEC0815AA9B462ed4fC84B5dFc43Fd2a10a54B569';
      subjectExchangeName = 'ONEINCH';
      subjectSendQuantity = ether(1);
      subjectSendTokenAddress = '0x0872262A92581EC09C2d522b48bCcd9E3C8ACf9C';
      subjectReceiveTokenAddress = '0x0872262A92581EC09C2d522b48bCcd9E3C8ACf9D';
      subjectMinReceivedQuantity = ether(0.01);
      subjectData = EMPTY_BYTES;
      subjectCallerAddress = '0x0e2298E3B3390e3b945a5456fBf59eCc3f55DA16';
      subjectTransactionOptions = {};
    });

    async function subject(): Promise<ContractTransaction> {
      return await tradeAPI.tradeAsync(
        subjectSetTokenAddress,
        subjectExchangeName,
        subjectSendTokenAddress,
        subjectSendQuantity,
        subjectReceiveTokenAddress,
        subjectMinReceivedQuantity,
        subjectData,
        subjectCallerAddress,
        subjectTransactionOptions
      );
    }

    it('should call the TradeModuleWrapper with correct params', async () => {
      await subject();

      expect(tradeModuleWrapper.trade).to.have.beenCalledWith(
        subjectSetTokenAddress,
        subjectExchangeName,
        subjectSendTokenAddress,
        subjectSendQuantity,
        subjectReceiveTokenAddress,
        subjectMinReceivedQuantity,
        subjectData,
        subjectCallerAddress,
        subjectTransactionOptions
      );
    });

    describe('when the SetToken address is invalid', () => {
      beforeEach(async () => {
        subjectSetTokenAddress = '0xInvalidAddress';
      });

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('Validation error');
      });
    });

    describe('when the send token address is invalid', () => {
      beforeEach(async () => {
        subjectSendTokenAddress = '0xInvalidAddress';
      });

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('Validation error');
      });
    });

    describe('when the receive token address is invalid', () => {
      beforeEach(async () => {
        subjectReceiveTokenAddress = '0xInvalidAddress';
      });

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('Validation error');
      });
    });

    describe('when the send quantity is invalid', () => {
      beforeEach(async () => {
        subjectSendQuantity = ether(0);
      });

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('sendQuantity needs to be greater than zero');
      });
    });
  });

  describe('#fetchTradeQuoteAsync', () => {
    let subjectFromToken: Address;
    let subjectToToken: Address;
    let subjectFromTokenDecimals: number;
    let subjectToTokenDecimals: number;
    let subjectRawAmount: string;
    let subjectFromAddress: Address;
    let subjectSetToken: SetTokenAPI;
    let subjectGasPrice: number;
    let subjectFeePercentage: number;

    beforeEach(async () => {
      subjectFromToken = '0xAAAA15AA9B462ed4fC84B5dFc43Fd2a10a54B569';
      subjectToToken = '0xBBBB262A92581EC09C2d522b48bCcd9E3C8ACf9C';
      subjectFromTokenDecimals = 8;
      subjectToTokenDecimals = 6;
      subjectRawAmount = '5';
      subjectFromAddress = '0xCCCC262A92581EC09C2d522b48bCcd9E3C8ACf9C';
      subjectSetToken = <unknown>{ val: 'settoken' } as SetTokenAPI;
      subjectGasPrice = 20;
      subjectFeePercentage = 1;
    });

    async function subject(): Promise<TradeQuote> {
      return await tradeAPI.fetchTradeQuoteAsync(
        subjectFromToken,
        subjectToToken,
        subjectFromTokenDecimals,
        subjectToTokenDecimals,
        subjectRawAmount,
        subjectFromAddress,
        subjectSetToken,
        subjectGasPrice,
        undefined,
        undefined,
        subjectFeePercentage
      );
    }

    it('should call the TradeQuoter with correct params', async () => {
      const expectedQuoteOptions = {
        fromToken: subjectFromToken,
        toToken: subjectToToken,
        fromTokenDecimals: subjectFromTokenDecimals,
        toTokenDecimals: subjectToTokenDecimals,
        rawAmount: subjectRawAmount,
        fromAddress: subjectFromAddress,
        chainId: (await provider.getNetwork()).chainId,
        tradeModule: tradeModuleWrapper,
        provider: provider,
        setToken: subjectSetToken,
        gasPrice: subjectGasPrice,
        slippagePercentage: undefined,
        isFirmQuote: undefined,
        feePercentage: subjectFeePercentage,
        feeRecipient: undefined,
        excludedSources: undefined,
      };
      await subject();

      expect(tradeQuoter.generate).to.have.beenCalledWith(expectedQuoteOptions);
    });

    describe('when the fromToken address is invalid', () => {
      beforeEach(async () => {
        subjectFromToken = '0xInvalidAddress';
      });

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('Validation error');
      });
    });

    describe('when the toToken address is invalid', () => {
      beforeEach(async () => {
        subjectToToken = '0xInvalidAddress';
      });

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('Validation error');
      });
    });

    describe('when the fromTokenDecimals is invalid', () => {
      beforeEach(async () => {
        subjectFromTokenDecimals = <unknown>'100' as number;
      });

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('Validation error');
      });
    });

    describe('when the toTokenDecimals is invalid', () => {
      beforeEach(async () => {
        subjectToTokenDecimals = <unknown>'100' as number;
      });

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('Validation error');
      });
    });

    describe('when the rawAmount quantity is invalid', () => {
      beforeEach(async () => {
        subjectRawAmount = <unknown>5 as string;
      });

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('Validation error');
      });
    });
  });

  describe('#fetchTokenListAsync', () => {
    let subjectChainId;

    async function subject(): Promise<CoinGeckoTokenData[]> {
      return await tradeAPI.fetchTokenListAsync();
    }

    describe('when the chain is ethereum (1)', () => {
      beforeEach(() => {
        subjectChainId = 1;
        provider.getNetwork = jest.fn(() => Promise.resolve(<unknown>{ chainId: subjectChainId } as Network ));
      });

      it('should fetch correct token data for network', async() => {
        const tokenData = await subject();
        await expect(tokenData).to.deep.equal(fixture.coinGeckoTokenResponseEth.data.tokens);
      });
    });

    describe('when the chain is polygon (137)', () => {
      beforeEach(() => {
        subjectChainId = 137;
        provider.getNetwork = jest.fn(() => Promise.resolve(<unknown>{ chainId: subjectChainId } as Network ));
      });

      it('should fetch correct token data for network', async() => {
        const tokenData = await subject();
        await expect(tokenData).to.deep.equal(fixture.fetchTokenListResponsePoly);
      });
    });

    describe('when chain is invalid', () => {
      beforeEach(() => {
        subjectChainId = 1337;
        provider.getNetwork = jest.fn(() => Promise.resolve(<unknown>{ chainId: subjectChainId } as Network ));
      });

      it('should error', async() => {
        await expect(subject()).to.be.rejectedWith(`Unsupported chainId: ${subjectChainId}`);
      });
    });
  });

  describe('#fetchTokenMapAsync', () => {
    let subjectChainId;
    let subjectTokenList;
    let subjectCoinGecko;

    async function subject(): Promise<CoinGeckoTokenMap> {
      return await tradeAPI.fetchTokenMapAsync();
    }

    describe('when the chain is ethereum (1)', () => {
      beforeEach(async () => {
        subjectChainId = 1;
        provider.getNetwork = jest.fn(() => Promise.resolve(<unknown>{ chainId: subjectChainId } as Network ));
        subjectCoinGecko = new CoinGeckoDataService(subjectChainId);
        subjectTokenList = await tradeAPI.fetchTokenListAsync();
      });

      it('should fetch correct token data for network', async() => {
        const expectedTokenMap = subjectCoinGecko.convertTokenListToAddressMap(subjectTokenList);
        const tokenData = await subject();
        await expect(tokenData).to.deep.equal(expectedTokenMap);
      });
    });

    describe('when the chain is polygon (137)', () => {
      beforeEach(async () => {
        subjectChainId = 1;
        provider.getNetwork = jest.fn(() => Promise.resolve(<unknown>{ chainId: subjectChainId } as Network ));
        subjectCoinGecko = new CoinGeckoDataService(subjectChainId);
        subjectTokenList = await tradeAPI.fetchTokenListAsync();
      });

      it('should fetch correct token data for network', async() => {
        const expectedTokenMap = subjectCoinGecko.convertTokenListToAddressMap(subjectTokenList);
        const tokenData = await subject();
        await expect(tokenData).to.deep.equal(expectedTokenMap);
      });
    });

    describe('when chain is invalid', () => {
      beforeEach(() => {
        subjectChainId = 1337;
        provider.getNetwork = jest.fn(() => Promise.resolve(<unknown>{ chainId: subjectChainId } as Network ));
      });

      it('should error', async() => {
        await expect(subject()).to.be.rejectedWith(`Unsupported chainId: ${subjectChainId}`);
      });
    });
  });

  describe('#fetchCoinPricesAsync', () => {
    let subjectChainId;
    let subjectContractAddresses;
    let subjectVsCurrencies;

    beforeEach(() => {
      subjectVsCurrencies = ['usd,usd,usd'];
    });

    async function subject(): Promise<CoinGeckoCoinPrices> {
      return await tradeAPI.fetchCoinPricesAsync(
        subjectContractAddresses,
        subjectVsCurrencies
      );
    }

    describe('when the chain is ethereum (1)', () => {
      beforeEach(() => {
        subjectChainId = 1;
        subjectContractAddresses = [
          '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
          '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2',
          '0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e',
        ];
        provider.getNetwork = jest.fn(() => Promise.resolve(<unknown>{ chainId: subjectChainId } as Network ));
      });

      it('should fetch correct coin prices for network', async() => {
        const coinPrices = await subject();
        await expect(coinPrices).to.deep.equal(fixture.coinGeckoPricesResponseEth.data);
      });
    });

    describe('when the chain is polygon (137)', () => {
      beforeEach(() => {
        subjectChainId = 137;
        subjectContractAddresses = [
          '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270',
          '0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
          '0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6',
        ];
        provider.getNetwork = jest.fn(() => Promise.resolve(<unknown>{ chainId: subjectChainId } as Network ));
      });

      it('should fetch correct coin prices for network', async() => {
        const coinPrices = await subject();
        await expect(coinPrices).to.deep.equal(fixture.coinGeckoPricesResponsePoly.data);
      });
    });

    describe('when chain is invalid', () => {
      beforeEach(() => {
        subjectChainId = 1337;
        provider.getNetwork = jest.fn(() => Promise.resolve(<unknown>{ chainId: subjectChainId } as Network ));
      });

      it('should error', async() => {
        await expect(subject()).to.be.rejectedWith(`Unsupported chainId: ${subjectChainId}`);
      });
    });
  });

  describe('#fetchGasPricesAsync', () => {
    let subjectChainId;

    async function subject(): Promise<number> {
      return await tradeAPI.fetchGasPriceAsync();
    }

    describe('when chain is Ethereum (1)', () => {
      beforeEach(() => {
        subjectChainId = 1;
        provider.getNetwork = jest.fn(() => Promise.resolve(<unknown>{ chainId: subjectChainId } as Network ));
      });

      it('should get gas price for the correct network', async() => {
        const expectedGasPrice = fixture.gasNowResponse.data.data.fast / 1e9;
        const gasPrice = await subject();
        expect(gasPrice).to.equal(expectedGasPrice);
      });
    });

    describe('when chain is Polygon (137)', () => {
      beforeEach(() => {
        subjectChainId = 137;
        provider.getNetwork = jest.fn(() => Promise.resolve(<unknown>{ chainId: subjectChainId } as Network ));
      });

      it('should get gas price for the correct network', async() => {
        const expectedGasPrice = fixture.maticGasStationResponse.data.fast;
        const gasPrice = await subject();
        expect(gasPrice).to.equal(expectedGasPrice);
      });
    });

    describe('when chain is invalid', () => {
      beforeEach(() => {
        subjectChainId = 1337;
        provider.getNetwork = jest.fn(() => Promise.resolve(<unknown>{ chainId: subjectChainId } as Network ));
      });

      it('should error', async() => {
        await expect(subject()).to.be.rejectedWith(`Unsupported chainId: ${subjectChainId}`);
      });
    });
  });
});
