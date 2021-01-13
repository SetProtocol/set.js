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

import { ethers, ContractTransaction } from 'ethers';
import { BigNumber } from 'ethers/lib/ethers';
import { Address, StreamingFeeState } from '@setprotocol/set-protocol-v2/utils/types';

import FeeAPI from '@src/api/FeeAPI';
import StreamingFeeModuleWrapper from '@src/wrappers/set-protocol-v2/StreamingFeeModuleWrapper';
import { expect } from '@test/utils/chai';
import ProtocolViewerWrapper from '@src/wrappers/set-protocol-v2/ProtocolViewerWrapper';
import { StreamingFeeInfo } from '@src/types';
import {
  ether,
} from '@setprotocol/set-protocol-v2/dist/utils/common';

const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');

jest.mock('@src/wrappers/set-protocol-v2/StreamingFeeModuleWrapper');
jest.mock('@src/wrappers/set-protocol-v2/ProtocolViewerWrapper');

describe('FeeAPI', () => {
  let owner: Address;
  let streamingFeeModuleAddress: Address;
  let protocolViewerAddress: Address;
  let setTokenAddress: Address;
  let randomAddress: Address;

  let streamingFeeModuleWrapper: StreamingFeeModuleWrapper;
  let protocolViewerWrapper: ProtocolViewerWrapper;
  let feeAPI: FeeAPI;

  beforeEach(async () => {
    [
      owner,
      streamingFeeModuleAddress,
      protocolViewerAddress,
      setTokenAddress,
      randomAddress,
    ] = await provider.listAccounts();

    feeAPI = new FeeAPI(provider, protocolViewerAddress, streamingFeeModuleAddress);
    streamingFeeModuleWrapper = (StreamingFeeModuleWrapper as any).mock.instances[0];
    protocolViewerWrapper = (ProtocolViewerWrapper as any).mock.instances[0];
  });

  afterEach(async () => {
    (StreamingFeeModuleWrapper as any).mockClear();
    (ProtocolViewerWrapper as any).mockClear();
  });

  describe('#initializeAsync', () => {
    let feeRecipient: Address;
    let maxStreamingFeePercentage: BigNumber;
    let streamingFeePercentage: BigNumber;

    let subjectSetToken: Address;
    let subjectSettings: StreamingFeeState;
    let subjectCaller: Address;
    let subjectTransactionOptions: any;

    beforeEach(async () => {
      feeRecipient = randomAddress;
      maxStreamingFeePercentage = ether(.1);
      streamingFeePercentage = ether(.02);

      subjectSetToken = setTokenAddress;
      subjectSettings = {
        feeRecipient,
        maxStreamingFeePercentage,
        streamingFeePercentage,
        lastStreamingFeeTimestamp: BigNumber.from(0),
      } as StreamingFeeState;
      subjectCaller = owner;
      subjectTransactionOptions = {};
    });

    async function subject(): Promise<ContractTransaction> {
      return feeAPI.initializeAsync(subjectSetToken, subjectSettings, subjectCaller);
    }

    it('should call initialize on the StreamingFeeModuleWrapper', async () => {
      await subject();

      expect(streamingFeeModuleWrapper.initialize).to.have.beenCalledWith(
        subjectSetToken,
        subjectSettings,
        subjectCaller,
        subjectTransactionOptions
      );
    });
  });

  describe('#batchFetchStreamingFeeInfoAsync', () => {
    let subjectSetTokenAddress1: Address;
    let subjectSetTokenAddress2: Address;

    beforeEach(async () => {
      subjectSetTokenAddress1 = '0xEC0815AA9B462ed4fC84B5dFc43Fd2a10a54B569';
      subjectSetTokenAddress2 = '0xEC0815AA9B462ed4fC84B5dFc43Fd2a10a54B570';
    });

    async function subject(): Promise<StreamingFeeInfo[]> {
      return await feeAPI.batchFetchStreamingFeeInfoAsync(
        [subjectSetTokenAddress1, subjectSetTokenAddress2]
      );
    }

    it('should call the ProtocolViewerWrapper with correct params', async () => {
      await subject();

      expect(protocolViewerWrapper.batchFetchStreamingFeeInfo).to.have.beenCalledWith(
        [subjectSetTokenAddress1, subjectSetTokenAddress2]
      );
    });
  });

  describe('#accrueStreamingFeesAsync', () => {
    let subjectSetTokenAddress: Address;
    let subjectCallerAddress: Address;
    let subjectTransactionOptions: any;

    beforeEach(async () => {
      subjectSetTokenAddress = '0xEC0815AA9B462ed4fC84B5dFc43Fd2a10a54B569';
      subjectCallerAddress = '0x0e2298E3B3390e3b945a5456fBf59eCc3f55DA16';
      subjectTransactionOptions = {};
    });

    async function subject(): Promise<ContractTransaction> {
      return await feeAPI.accrueStreamingFeesAsync(
        subjectSetTokenAddress,
        subjectCallerAddress,
        subjectTransactionOptions
      );
    }

    it('should call the StreamingFeeModuleWrapper with correct params', async () => {
      await subject();

      expect(streamingFeeModuleWrapper.accrueFee).to.have.beenCalledWith(
        subjectSetTokenAddress,
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
  });

  describe('#updateStreamingFeeAsync', () => {
    let subjectSetTokenAddress: Address;
    let subjectNewFeePercentage: BigNumber;
    let subjectCallerAddress: Address;
    let subjectTransactionOptions: any;

    beforeEach(async () => {
      subjectSetTokenAddress = '0xEC0815AA9B462ed4fC84B5dFc43Fd2a10a54B569';
      subjectNewFeePercentage = BigNumber.from(2);
      subjectCallerAddress = '0x0e2298E3B3390e3b945a5456fBf59eCc3f55DA16';
      subjectTransactionOptions = {};
    });

    async function subject(): Promise<ContractTransaction> {
      return await feeAPI.updateStreamingFeeAsync(
        subjectSetTokenAddress,
        subjectNewFeePercentage,
        subjectCallerAddress,
        subjectTransactionOptions
      );
    }

    it('should call the StreamingFeeModuleWrapper with correct params', async () => {
      await subject();

      const streamingFeeScale = BigNumber.from(10).pow(16);
      const expectedNewFeeParameter = subjectNewFeePercentage.mul(streamingFeeScale);
      expect(streamingFeeModuleWrapper.updateStreamingFee).to.have.beenCalledWith(
        subjectSetTokenAddress,
        expectedNewFeeParameter,
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
  });

  describe('#updateStreamingFeeRecipient', () => {
    let subjectSetTokenAddress: Address;
    let subjectNewFeeRecipientAddress: Address;
    let subjectCallerAddress: Address;
    let subjectTransactionOptions: any;

    beforeEach(async () => {
      subjectSetTokenAddress = '0xEC0815AA9B462ed4fC84B5dFc43Fd2a10a54B569';
      subjectNewFeeRecipientAddress = '0x0872262A92581EC09C2d522b48bCcd9E3C8ACf9C';
      subjectCallerAddress = '0x0e2298E3B3390e3b945a5456fBf59eCc3f55DA16';
      subjectTransactionOptions = {};
    });

    async function subject(): Promise<ContractTransaction> {
      return await feeAPI.updateStreamingFeeRecipient(
        subjectSetTokenAddress,
        subjectNewFeeRecipientAddress,
        subjectCallerAddress,
        subjectTransactionOptions
      );
    }

    it('should call the StreamingFeeModuleWrapper with correct params', async () => {
      await subject();

      expect(streamingFeeModuleWrapper.updateFeeRecipient).to.have.beenCalledWith(
        subjectSetTokenAddress,
        subjectNewFeeRecipientAddress,
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

    describe('when the fee recipient address is invalid', () => {
      beforeEach(async () => {
        subjectNewFeeRecipientAddress = '0xInvalidAddress';
      });

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('Validation error');
      });
    });
  });

  describe('#getUnaccruedStreamingFeesAsync', () => {
    let subjectSetTokenAddress: Address;

    beforeEach(async () => {
      subjectSetTokenAddress = '0xEC0815AA9B462ed4fC84B5dFc43Fd2a10a54B569';
    });

    async function subject(): Promise<BigNumber> {
      return await feeAPI.getUnaccruedStreamingFeesAsync(
        subjectSetTokenAddress,
      );
    }

    it('should call the StreamingFeeModuleWrapper with correct params', async () => {
      await subject();

      expect(streamingFeeModuleWrapper.getFee).to.have.beenCalledWith(
        subjectSetTokenAddress
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
  });
});
