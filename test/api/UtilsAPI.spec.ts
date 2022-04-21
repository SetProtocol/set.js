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
import { Network } from '@ethersproject/providers';
import { Address } from '@setprotocol/set-protocol-v2/utils/types';

import UtilsAPI from '@src/api/UtilsAPI';
import type SetTokenAPI from '@src/api/SetTokenAPI';
import TradeModuleWrapper from '@src/wrappers/set-protocol-v2/TradeModuleWrapper';

import {
  TradeQuoter,
  CoinGeckoDataService,
} from '@src/api/utils';
import { expect } from '@test/utils/chai';
import {
  SwapQuote,
  TradeQuote,
  SwapOrderPairs,
  TradeOrderPair,
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
    case fixture.ethGasStationRequest: return fixture.ethGasStationResponse;
    case fixture.maticGasStationRequest: return fixture.maticGasStationResponse;
    case fixture.coinGeckoTokenRequestEth: return fixture.coinGeckoTokenResponseEth;
    case fixture.coinGeckoTokenRequestPoly: return fixture.coinGeckoTokenResponsePoly;
    case fixture.coinGeckoPricesRequestEth: return fixture.coinGeckoPricesResponseEth;
    case fixture.coinGeckoPricesRequestPoly: return fixture.coinGeckoPricesResponsePoly;
  }
});

describe('UtilsAPI', () => {
  let tradeModuleAddress: Address;
  let tradeModuleWrapper: TradeModuleWrapper;
  let tradeQuoter: TradeQuoter;
  let utilsAPI: UtilsAPI;

  beforeEach(async () => {
    [ tradeModuleAddress ] = await provider.listAccounts();

    utilsAPI = new UtilsAPI(provider, tradeModuleAddress);
    tradeQuoter = (TradeQuoter as any).mock.instances[0];
    tradeModuleWrapper = (TradeModuleWrapper as any).mock.instances[0];
  });

  afterEach(async () => {
    (TradeModuleWrapper as any).mockClear();
    (TradeQuoter as any).mockClear();
    (axios as any).mockClear();
  });

  describe('#fetchSwapQuoteAsync', () => {
    let subjectFromToken: Address;
    let subjectToToken: Address;
    let subjectRawAmount: string;
    let subjectUseBuyAmount: boolean;
    let subjectFromAddress: Address;
    let subjectSetToken: SetTokenAPI;
    let subjectGasPrice: number;
    let subjectFeePercentage: number;

    beforeEach(async () => {
      subjectFromToken = '0xAAAA15AA9B462ed4fC84B5dFc43Fd2a10a54B569';
      subjectToToken = '0xBBBB262A92581EC09C2d522b48bCcd9E3C8ACf9C';
      subjectRawAmount = '5';
      subjectUseBuyAmount = false;
      subjectFromAddress = '0xCCCC262A92581EC09C2d522b48bCcd9E3C8ACf9C';
      subjectSetToken = <unknown>{ val: 'settoken' } as SetTokenAPI;
      subjectGasPrice = 20;
      subjectFeePercentage = 1;
    });

    async function subject(): Promise<SwapQuote> {
      return await utilsAPI.fetchSwapQuoteAsync(
        subjectFromToken,
        subjectToToken,
        subjectRawAmount,
        subjectUseBuyAmount,
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
        rawAmount: subjectRawAmount,
        useBuyAmount: subjectUseBuyAmount,
        fromAddress: subjectFromAddress,
        chainId: (await provider.getNetwork()).chainId,
        setToken: subjectSetToken,
        gasPrice: subjectGasPrice,
        slippagePercentage: undefined,
        isFirmQuote: undefined,
        feePercentage: subjectFeePercentage,
        feeRecipient: undefined,
        excludedSources: undefined,
      };
      await subject();

      expect(tradeQuoter.generateQuoteForSwap).to.have.beenCalledWith(expectedQuoteOptions);
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

    describe('when the rawAmount quantity is invalid', () => {
      beforeEach(async () => {
        subjectRawAmount = <unknown>5 as string;
      });

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('Validation error');
      });
    });
  });

  describe('#batchFetchSwapQuoteAsync', () => {
    let fromToken: Address;
    let toToken: Address;
    let rawAmount: string;
    let ignoredRawAmount: string;
    let subjectOrderPairs: SwapOrderPairs[];
    let subjectUseBuyAmount: boolean;
    let subjectFromAddress: Address;
    let subjectSetToken: SetTokenAPI;
    let subjectGasPrice: number;
    let subjectFeePercentage: number;

    beforeEach(async () => {
      fromToken = '0xAAAA15AA9B462ed4fC84B5dFc43Fd2a10a54B569';
      toToken = '0xBBBB262A92581EC09C2d522b48bCcd9E3C8ACf9C';
      rawAmount = '5';
      ignoredRawAmount = '10';

      subjectOrderPairs = [
        {
          fromToken,
          toToken,
          rawAmount,
        },
        {
          fromToken: '0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
          toToken: '0xBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB',
          rawAmount: ignoredRawAmount,
          ignore: true,
        },
      ];
      subjectUseBuyAmount = false;
      subjectFromAddress = '0xCCCC262A92581EC09C2d522b48bCcd9E3C8ACf9C';
      subjectSetToken = <unknown>{ val: 'settoken' } as SetTokenAPI;
      subjectGasPrice = 20;
      subjectFeePercentage = 1;
    });

    async function subject(): Promise<SwapQuote[]> {
      return await utilsAPI.batchFetchSwapQuoteAsync(
        subjectOrderPairs,
        subjectUseBuyAmount,
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
        fromToken,
        toToken,
        rawAmount,
        useBuyAmount: subjectUseBuyAmount,
        fromAddress: subjectFromAddress,
        chainId: (await provider.getNetwork()).chainId,
        setToken: subjectSetToken,
        gasPrice: subjectGasPrice,
        slippagePercentage: undefined,
        isFirmQuote: undefined,
        feePercentage: subjectFeePercentage,
        feeRecipient: undefined,
        excludedSources: undefined,
      };
      await subject();

      expect(tradeQuoter.generateQuoteForSwap).to.have.beenCalledWith(expectedQuoteOptions);
    });

    it('should format ignored orders correctly', async () => {
      const expectedQuote = {
        calldata: '0x0000000000000000000000000000000000000000000000000000000000000000',
        fromTokenAmount: ignoredRawAmount,
        toTokenAmount: ignoredRawAmount,
      };
      const quotes = await subject();

      expect(quotes[1]).to.deep.equal(expectedQuote);
    });

    describe('when a fromToken address is invalid', () => {
      beforeEach(async () => {
        subjectOrderPairs = [
          {
            fromToken: '0xInvalidAddress',
            toToken: '0xBBBB262A92581EC09C2d522b48bCcd9E3C8ACf9C',
            rawAmount: '5',
          },
        ];
      });

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('Validation error');
      });
    });

    describe('when a toToken address is invalid', () => {
      beforeEach(async () => {
        subjectOrderPairs = [
          {
            fromToken: '0xBBBB262A92581EC09C2d522b48bCcd9E3C8ACf9C',
            toToken: '0xInvalidAddress',
            rawAmount: '5',
          },
        ];
      });

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('Validation error');
      });
    });

    describe('when a rawAmount quantity is invalid', () => {
      beforeEach(async () => {
        subjectOrderPairs = [
          {
            fromToken: '0xAAAA15AA9B462ed4fC84B5dFc43Fd2a10a54B569',
            toToken: '0xBBBB262A92581EC09C2d522b48bCcd9E3C8ACf9C',
            rawAmount: <unknown>5 as string,
          },
        ];
      });

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('Validation error');
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
      return await utilsAPI.fetchTradeQuoteAsync(
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

      expect(tradeQuoter.generateQuoteForTrade).to.have.beenCalledWith(expectedQuoteOptions);
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

  describe('#batchFetchTradeQuoteAsync', () => {
    let subjectTradeOrderPairs: TradeOrderPair[];
    let subjectFromAddress: Address;
    let subjectSetToken: SetTokenAPI;
    let subjectGasPrice: number;

    beforeEach(async () => {
      const fromToken = '0xAAAA15AA9B462ed4fC84B5dFc43Fd2a10a54B569';
      const toToken = '0xBBBB262A92581EC09C2d522b48bCcd9E3C8ACf9C';
      const fromTokenDecimals = 8;
      const toTokenDecimals = 6;
      const rawAmount = '.5';
      const slippagePercentage = 2;

      subjectTradeOrderPairs = [
        {
          fromToken,
          toToken,
          fromTokenDecimals,
          toTokenDecimals,
          rawAmount,
          slippagePercentage,
        },
        // No slippage
        {
          fromToken: '0xCCCC15AA9B462ed4fC84B5dFc43Fd2a10a54B569',
          toToken: '0xBBBB262A92581EC09C2d522b48bCcd9E3C8ACf9C',
          fromTokenDecimals,
          toTokenDecimals,
          rawAmount,
        },
      ];
      subjectFromAddress = '0xEEEE262A92581EC09C2d522b48bCcd9E3C8ACf9C';
      subjectSetToken = <unknown>{ val: 'settoken' } as SetTokenAPI;
      subjectGasPrice = 20;
    });

    async function subject(): Promise<TradeQuote[]> {
      return await utilsAPI.batchFetchTradeQuoteAsync(
        subjectTradeOrderPairs,
        subjectFromAddress,
        subjectSetToken,
        subjectGasPrice
      );
    }

    it('should call the TradeQuoter with correct params', async () => {
      const firstExpectedQuoteOptions = {
        fromToken: subjectTradeOrderPairs[0].fromToken,
        toToken: subjectTradeOrderPairs[0].toToken,
        fromTokenDecimals: subjectTradeOrderPairs[0].fromTokenDecimals,
        toTokenDecimals: subjectTradeOrderPairs[0].toTokenDecimals,
        rawAmount: subjectTradeOrderPairs[0].rawAmount,
        slippagePercentage: subjectTradeOrderPairs[0].slippagePercentage,
        fromAddress: subjectFromAddress,
        chainId: (await provider.getNetwork()).chainId,
        tradeModule: tradeModuleWrapper,
        provider: provider,
        setToken: subjectSetToken,
        gasPrice: subjectGasPrice,
        isFirmQuote: undefined,
        feePercentage: undefined,
        feeRecipient: undefined,
        excludedSources: undefined,
      };

      const secondExpectedQuoteOptions = {
        fromToken: subjectTradeOrderPairs[1].fromToken,
        toToken: subjectTradeOrderPairs[1].toToken,
        fromTokenDecimals: subjectTradeOrderPairs[1].fromTokenDecimals,
        toTokenDecimals: subjectTradeOrderPairs[1].toTokenDecimals,
        rawAmount: subjectTradeOrderPairs[1].rawAmount,
        slippagePercentage: undefined,
        fromAddress: subjectFromAddress,
        chainId: (await provider.getNetwork()).chainId,
        tradeModule: tradeModuleWrapper,
        provider: provider,
        setToken: subjectSetToken,
        gasPrice: subjectGasPrice,
        isFirmQuote: undefined,
        feePercentage: undefined,
        feeRecipient: undefined,
        excludedSources: undefined,
      };

      await subject();

      // https://stackoverflow.com/questions/40018216/how-to-check-multiple-arguments-on-multiple-calls-for-jest-spies
      expect((tradeQuoter.generateQuoteForTrade as any).mock.calls).to.deep.eq([
        [ firstExpectedQuoteOptions ],
        [ secondExpectedQuoteOptions ],
      ]);
    });

    describe('when the fromToken address is invalid', () => {
      beforeEach(async () => {
        subjectTradeOrderPairs[1].fromToken = '0xInvalidAddress';
      });

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('Validation error');
      });
    });

    describe('when the toToken address is invalid', () => {
      beforeEach(async () => {
        subjectTradeOrderPairs[1].toToken = '0xInvalidAddress';
      });

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('Validation error');
      });
    });

    describe('when the fromTokenDecimals is invalid', () => {
      beforeEach(async () => {
        subjectTradeOrderPairs[1].fromTokenDecimals = <unknown>'100' as number;
      });

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('Validation error');
      });
    });

    describe('when the toTokenDecimals is invalid', () => {
      beforeEach(async () => {
        subjectTradeOrderPairs[1].toTokenDecimals = <unknown>'100' as number;
      });

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('Validation error');
      });
    });

    describe('when the rawAmount quantity is invalid', () => {
      beforeEach(async () => {
        subjectTradeOrderPairs[1].rawAmount = <unknown>5 as string;
      });

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('Validation error');
      });
    });
  });

  describe('#fetchTokenListAsync', () => {
    let subjectChainId;

    async function subject(): Promise<CoinGeckoTokenData[]> {
      return await utilsAPI.fetchTokenListAsync();
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
        await expect(tokenData).to.deep.equal(fixture.coinGeckoTokenResponsePoly.data.tokens);
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
      return await utilsAPI.fetchTokenMapAsync();
    }

    describe('when the chain is ethereum (1)', () => {
      beforeEach(async () => {
        subjectChainId = 1;
        provider.getNetwork = jest.fn(() => Promise.resolve(<unknown>{ chainId: subjectChainId } as Network ));
        subjectCoinGecko = new CoinGeckoDataService(subjectChainId);
        subjectTokenList = await utilsAPI.fetchTokenListAsync();
      });

      it('should fetch correct token data for network', async() => {
        const expectedTokenMap = subjectCoinGecko.convertTokenListToAddressMap(subjectTokenList);
        const tokenData = await subject();
        await expect(tokenData).to.deep.equal(expectedTokenMap);
      });
    });

    describe('when the chain is polygon (137)', () => {
      beforeEach(async () => {
        subjectChainId = 137;
        provider.getNetwork = jest.fn(() => Promise.resolve(<unknown>{ chainId: subjectChainId } as Network ));
        subjectCoinGecko = new CoinGeckoDataService(subjectChainId);
        subjectTokenList = await utilsAPI.fetchTokenListAsync();
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
      return await utilsAPI.fetchCoinPricesAsync(
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
      return await utilsAPI.fetchGasPriceAsync();
    }

    describe('when chain is Ethereum (1)', () => {
      beforeEach(() => {
        subjectChainId = 1;
        provider.getNetwork = jest.fn(() => Promise.resolve(<unknown>{ chainId: subjectChainId } as Network ));
      });

      it('should get gas price for the correct network', async() => {
        const expectedGasPrice = fixture.ethGasStationResponse.data.fast / 10;
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
