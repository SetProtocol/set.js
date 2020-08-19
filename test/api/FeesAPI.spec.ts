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
import { BigNumber } from 'ethers/utils';
import { Address } from 'set-protocol-v2/utils/types';
import { ether } from 'set-protocol-v2/dist/utils/common';

import FeeAPI from '@src/api/FeeAPI';
import StreamingFeeModuleWrapper from '@src/wrappers/set-protocol-v2/StreamingFeeModuleWrapper';
import { expect } from '@test/utils/chai';

const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');

jest.mock('@src/wrappers/set-protocol-v2/StreamingFeeModuleWrapper');


describe('FeeAPI', () => {
  let setAddress: Address;
  let streamingFeeModuleAddress: Address;
  let managerAddress: Address;

  let streamingFeeModuleWrapper: StreamingFeeModuleWrapper;
  let feeAPI: FeeAPI;

  beforeEach(async () => {
    [
      setAddress,
      streamingFeeModuleAddress,
      managerAddress,
    ] = await provider.listAccounts();

    feeAPI = new FeeAPI(provider, streamingFeeModuleAddress);
    streamingFeeModuleWrapper = (StreamingFeeModuleWrapper as any).mock.instances[0];
  });

  afterEach(async () => {
    (StreamingFeeModuleWrapper as any).mockClear();
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
      subjectNewFeePercentage = new BigNumber(2);
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

      const streamingFeeScale = new BigNumber(10).pow(16);
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
