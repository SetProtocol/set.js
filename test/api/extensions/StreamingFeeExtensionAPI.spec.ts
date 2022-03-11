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
import { Address, StreamingFeeState } from '@setprotocol/set-protocol-v2/utils/types';
import { ether } from '@setprotocol/set-protocol-v2/dist/utils/common';

import StreamingFeeExtensionAPI from '@src/api/extensions/StreamingFeeExtensionAPI';
import StreamingFeeExtensionWrapper from '@src/wrappers/set-v2-strategies/StreamingFeeExtensionWrapper';
import { expect } from '../../utils/chai';

const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');

jest.mock('@src/wrappers/set-v2-strategies/StreamingFeeExtensionWrapper');

describe('StreamingFeeExtensionAPI', () => {
  let owner: Address;
  let setToken: Address;
  let streamingFeeExtension: Address;
  let delegatedManager: Address;
  let feeRecipient: Address;

  let streamingFeeExtensionAPI: StreamingFeeExtensionAPI;
  let streamingFeeExtensionWrapper: StreamingFeeExtensionWrapper;

  beforeEach(async () => {
    [
      owner,
      setToken,
      delegatedManager,
      streamingFeeExtension,
      feeRecipient,
    ] = await provider.listAccounts();

    streamingFeeExtensionAPI = new StreamingFeeExtensionAPI(provider, streamingFeeExtension);
    streamingFeeExtensionWrapper = (StreamingFeeExtensionWrapper as any).mock.instances[0];
  });

  afterEach(() => {
    (StreamingFeeExtensionWrapper as any).mockClear();
  });

  describe('#accrueFeesAndDistribute(ISetToken _setToken)', () => {
    let subjectSetToken: Address;
    let subjectCallerAddress: Address;
    let subjectTransactionOptions: any;

    beforeEach(async () => {
      subjectSetToken = setToken;
      subjectCallerAddress = owner;
      subjectTransactionOptions = {};
    });

    async function subject(): Promise<ContractTransaction> {
      return streamingFeeExtensionAPI.accrueFeesAndDistribute(
        subjectSetToken,
        subjectCallerAddress,
        subjectTransactionOptions
      );
    }

    it('should call `distribute` on the StreamingFeeExtensionWrapper', async () => {
      await subject();

      expect(streamingFeeExtensionWrapper.accrueFeesAndDistribute).to.have.beenCalledWith(
        subjectSetToken,
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
  });

  describe('#getStreamingFeeExtensionInitializationBytecode', () => {
    let subjectDelegatedManager: Address;

    beforeEach(async () => {
      subjectDelegatedManager = delegatedManager;
    });

    async function subject(): Promise<BytesLike> {
      return streamingFeeExtensionAPI.getStreamingFeeExtensionInitializationBytecode(
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

  describe('#getStreamingFeeModuleInitializationBytecode', () => {
    let subjectSetToken: Address;
    let subjectFeeSettings: StreamingFeeState;

    beforeEach(async () => {
      subjectSetToken = setToken;
      subjectFeeSettings = {
        feeRecipient,
        maxStreamingFeePercentage: ether(.1),
        streamingFeePercentage: ether(.01),
        lastStreamingFeeTimestamp: ether(0),
      };
    });

    async function subject(): Promise<BytesLike> {
      return streamingFeeExtensionAPI.getStreamingFeeModuleInitializationBytecode(
        subjectSetToken,
        subjectFeeSettings
      );
    }

    it('should generate the expected bytecode', async () => {
      const expectedBytecode =
        '0xeb78e5ee0000000000000000000000006ecbe1db9ef729cbe972c83fb886247691fb6beb000000000000000' +
        '00000000078dc5d2d739606d31509c31d654056a45185ecb60000000000000000000000000000000000000000' +
        '00000000016345785d8a0000000000000000000000000000000000000000000000000000002386f26fc100000' +
        '000000000000000000000000000000000000000000000000000000000000000';

      expect(await subject()).eq(expectedBytecode);
    });

    describe('when setToken is not a valid address', () => {
      beforeEach(() => subjectSetToken = '0xinvalid');

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('Validation error');
      });
    });

    describe('when feeSettings.feeRecipient is not a valid address', () => {
      beforeEach(() => subjectFeeSettings.feeRecipient = '0xinvalid');

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('Validation error');
      });
    });

    describe('when feeSettings.maxStreamingFeePercentage is not a valid number', () => {
      beforeEach(() => subjectFeeSettings.maxStreamingFeePercentage = <unknown>NaN as BigNumber);

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('Validation error');
      });
    });

    describe('when feeSettings.streamingFeePercentage is not a valid number', () => {
      beforeEach(() => subjectFeeSettings.streamingFeePercentage = <unknown>NaN as BigNumber);

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('Validation error');
      });
    });

    describe('when feeSettings.lastStreamingFeeTimestamp is not a valid number', () => {
      beforeEach(() => subjectFeeSettings.lastStreamingFeeTimestamp = <unknown>NaN as BigNumber);

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('Validation error');
      });
    });
  });
});
