/*
  Copyright 2022 Set Labs Inc.

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

import { ethers, BytesLike } from 'ethers';
import { BigNumber, ContractTransaction } from 'ethers';
import { Address } from '@setprotocol/set-protocol-v2/utils/types';
import { ether } from '@setprotocol/set-protocol-v2/dist/utils/common';

import BatchTradeExtensionAPI from '@src/api/extensions/BatchTradeExtensionAPI';
import BatchTradeExtensionWrapper from '@src/wrappers/set-v2-strategies/BatchTradeExtensionWrapper';
import { TradeInfo, BatchTradeResult } from '../../../src/types/common';

import { tradeQuoteFixtures as fixture } from '../../fixtures/tradeQuote';
import { expect } from '../../utils/chai';

const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');

jest.mock('@src/wrappers/set-v2-strategies/BatchTradeExtensionWrapper');

// @ts-ignore
provider.getTransactionReceipt = jest.fn((arg: any) => Promise.resolve(fixture.batchTradeReceipt));


describe('BatchTradeExtensionAPI', () => {
  let owner: Address;
  let setToken: Address;
  let batchTradeExtension: Address;
  let delegatedManager: Address;

  let batchTradeExtensionAPI: BatchTradeExtensionAPI;
  let batchTradeExtensionWrapper: BatchTradeExtensionWrapper;

  beforeEach(async () => {
    [
      owner,
      setToken,
      delegatedManager,
      batchTradeExtension,
    ] = await provider.listAccounts();

    batchTradeExtensionAPI = new BatchTradeExtensionAPI(provider, batchTradeExtension);
    batchTradeExtensionWrapper = (BatchTradeExtensionWrapper as any).mock.instances[0];
  });

  afterEach(() => {
    (BatchTradeExtensionWrapper as any).mockClear();
  });

  describe('#initializeExtension', () => {
    let subjectDelegatedManager: Address;
    let subjectCallerAddress: Address;
    let subjectTransactionOptions: any;

    beforeEach(async () => {
      subjectDelegatedManager = delegatedManager;
      subjectCallerAddress = owner;
      subjectTransactionOptions = {};
    });

    async function subject(): Promise<ContractTransaction> {
      return batchTradeExtensionAPI.initializeExtensionAsync(
        subjectDelegatedManager,
        subjectCallerAddress,
        subjectTransactionOptions
      );
    }

    it('should call `initializeExtension` on the BatchTradeExtensionWrapper', async () => {
      await subject();

      expect(batchTradeExtensionWrapper.initializeExtension).to.have.beenCalledWith(
        subjectDelegatedManager,
        subjectCallerAddress,
        subjectTransactionOptions
      );
    });

    describe('when an extension is not a valid address', () => {
      beforeEach(() => subjectDelegatedManager = '0xinvalid');

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('Validation error');
      });
    });
  });

  describe('#batchTradeWithOperatorAsync', () => {
    let subjectSetToken: Address;
    let subjectTrades: TradeInfo[];
    let subjectCallerAddress: Address;
    let subjectTransactionOptions: any;

    beforeEach(async () => {
      const exchangeName = 'ZeroExApiAdapterV5';
      const sendToken = '0xAAAA15AA9B462ed4fC84B5dFc43Fd2a10a54B569';
      const sendQuantity = ether(10);
      const receiveToken = '0xBBBB262A92581EC09C2d522b48bCcd9E3C8ACf9C';
      const minReceiveQuantity = ether(.9);
      const data = '0x123456789abcdedf';

      subjectTrades = [
        {
          exchangeName,
          sendToken,
          receiveToken,
          sendQuantity,
          minReceiveQuantity,
          data,
        },
        {
          exchangeName,
          sendToken: '0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
          receiveToken: '0xBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB',
          sendQuantity,
          minReceiveQuantity,
          data,
        },
      ];

      subjectSetToken = setToken;
      subjectCallerAddress = owner;
      subjectTransactionOptions = {};
    });

    async function subject(): Promise<ContractTransaction> {
      return batchTradeExtensionAPI.batchTradeWithOperatorAsync(
        subjectSetToken,
        subjectTrades,
        subjectCallerAddress,
        subjectTransactionOptions
      );
    }

    it('should call `tradeWithOperator` on the BatchTradeExtensionWrapper', async () => {
      await subject();

      expect(batchTradeExtensionWrapper.batchTradeWithOperator).to.have.beenCalledWith(
        subjectSetToken,
        subjectTrades,
        subjectCallerAddress,
        subjectTransactionOptions
      );
    });

    describe('when a setToken is not a valid address', () => {
      beforeEach(() => subjectSetToken = '0xinvalid');

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('Validation error');
      });
    });

    describe('when a exchangeName is not a valid string', () => {
      beforeEach(() => subjectTrades[0].exchangeName = <unknown>5 as string);

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('Validation error');
      });
    });

    describe('when a sendToken is not a valid address', () => {
      beforeEach(() => subjectTrades[0].sendToken = '0xinvalid');

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('Validation error');
      });
    });

    describe('when sendQuantity is not a valid number', () => {
      beforeEach(() => subjectTrades[0].sendQuantity = <unknown>NaN as BigNumber);

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('Validation error');
      });
    });

    describe('when a receiveToken is not a valid address', () => {
      beforeEach(() => subjectTrades[0].receiveToken = '0xinvalid');

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('Validation error');
      });
    });

    describe('when minReceiveQuantity is not a valid number', () => {
      beforeEach(() => subjectTrades[0].minReceiveQuantity = <unknown>NaN as BigNumber);

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('Validation error');
      });
    });
  });

  describe('getBatchTradeResultsAsync', () => {
    let subjectTransactionHash: string;
    let subjectTrades: TradeInfo[];

    beforeEach(() => {
      const exchangeName = 'ZeroExApiAdapterV5';
      const sendToken = '0xAAAA15AA9B462ed4fC84B5dFc43Fd2a10a54B569';
      const sendQuantity = ether(10);
      const receiveToken = '0xBBBB262A92581EC09C2d522b48bCcd9E3C8ACf9C';
      const minReceiveQuantity = ether(.9);
      const data = '0x123456789abcdedf';

      subjectTrades = [
        {
          exchangeName,
          sendToken,
          receiveToken,
          sendQuantity,
          minReceiveQuantity,
          data,
        },
      ];

      subjectTransactionHash = '0x676f0263b724d24158d4999167ab9195edebe814e2cc05d0fa38dbdcc16d6a73';
    });

    async function subject(): Promise<BatchTradeResult[]> {
      return batchTradeExtensionAPI.getBatchTradeResultsAsync(
        subjectTransactionHash,
        subjectTrades
      );
    }

    it('should return the expected transaction result', async () => {
      const results = await subject();

      expect(results[0].success).eq(false);
      expect(results[0].tradeInfo).deep.eq(subjectTrades[0]);
      expect(results[0].revertReason).eq(`NotImplementedError({ selector: '0x6af479b2' })`);
    });
  });

  describe('#getBatchTradeExtensionInitializationBytecode', () => {
    let subjectDelegatedManager: Address;

    beforeEach(async () => {
      subjectDelegatedManager = delegatedManager;
    });

    async function subject(): Promise<BytesLike> {
      return batchTradeExtensionAPI.getBatchTradeExtensionInitializationBytecode(
        subjectDelegatedManager
      );
    }

    it('should generate the expected bytecode', async () => {
      const expectedBytecode = '0xde2236bd000000000000000000000000e36ea790bc9d7ab70c55260c66d52b1eca985f84';
      expect(await subject()).eq(expectedBytecode);
    });

    describe('when delegatedManager is not a valid address', () => {
      beforeEach(() => subjectDelegatedManager = '0xinvalid');

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('Validation error');
      });
    });
  });

  describe('#getTradeModuleAndExtensionInitializationBytecode', () => {
    let subjectDelegatedManager: Address;

    beforeEach(async () => {
      subjectDelegatedManager = delegatedManager;
    });

    async function subject(): Promise<BytesLike> {
      return batchTradeExtensionAPI.getTradeModuleAndExtensionInitializationBytecode(subjectDelegatedManager);
    }

    it('should generate the expected bytecode', async () => {
      const expectedBytecode = '0x9b468312000000000000000000000000e36ea790bc9d7ab70c55260c66d52b1eca985f84';

      expect(await subject()).eq(expectedBytecode);
    });

    describe('when setToken is not a valid address', () => {
      beforeEach(() => subjectDelegatedManager = '0xinvalid');

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('Validation error');
      });
    });
  });
});
