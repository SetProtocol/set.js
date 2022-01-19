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

import { ethers } from 'ethers';
import { BigNumber, ContractTransaction } from 'ethers/lib/ethers';
import { Address } from '@setprotocol/set-protocol-v2/utils/types';
import { ether } from '@setprotocol/set-protocol-v2/dist/utils/common';
import { VAssetDisplayInfo } from '@src/types';

import PerpV2LeverageViewerAPI from '@src/api/PerpV2LeverageViewerAPI';
import PerpV2LeverageModuleViewerWrapper from '@src/wrappers/set-protocol-v2/PerpV2LeverageModuleViewerWrapper';
import { expect } from '../utils/chai';

const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');

jest.mock('@src/wrappers/set-protocol-v2/PerpV2LeverageModuleViewerWrapper');

describe('PerpV2LeverageViewerAPI', () => {
  let perpV2LeverageModuleViewerAddress: Address;
  let setTokenAddress: Address;
  let owner: Address;

  let perpV2LeverageViewerAPI: PerpV2LeverageViewerAPI;
  let perpV2LeverageModuleViewerWrapper: PerpV2LeverageModuleViewerWrapper;

  beforeEach(async () => {
    [
      owner,
      perpV2LeverageModuleViewerAddress,
      setTokenAddress,
    ] = await provider.listAccounts();

    perpV2LeverageViewerAPI = new PerpV2LeverageViewerAPI(provider, perpV2LeverageModuleViewerAddress);
    perpV2LeverageModuleViewerWrapper = (PerpV2LeverageModuleViewerWrapper as any).mock.instances[0];
  });

  afterEach(() => {
    (PerpV2LeverageModuleViewerWrapper as any).mockClear();
  });

  describe('#initializeAsync', () => {
    let subjectSetTokenAddress: Address;
    let subjectCallerAddress: Address;

    let subjectTransactionOptions: any;

    beforeEach(async () => {
      subjectSetTokenAddress = setTokenAddress;
      subjectCallerAddress = owner;
      subjectTransactionOptions = {};
    });

    async function subject(): Promise<ContractTransaction> {
      return perpV2LeverageViewerAPI.initializeAsync(
        subjectSetTokenAddress,
        subjectCallerAddress,
        subjectTransactionOptions,
      );
    }

    it('should call initialize on the PerpV2LeverageModuleViewerWrapper', async () => {
      await subject();

      expect(perpV2LeverageModuleViewerWrapper.initialize).to.have.beenCalledWith(
        subjectSetTokenAddress,
        subjectCallerAddress,
        subjectTransactionOptions,
      );
    });
  });

  describe('#getCollateralTokenAsync', () => {
    let nullCallerAddress: Address;

    beforeEach(async () => {
      nullCallerAddress = '0x0000000000000000000000000000000000000000';
    });

    async function subject(): Promise<string> {
      return await perpV2LeverageViewerAPI.getCollateralTokenAsync(
        nullCallerAddress,
      );
    }

    it('should call the PerpV2LeverageModuleViewerWrapper with correct params', async () => {
      await subject();

      expect(perpV2LeverageModuleViewerWrapper.collateralToken).to.have.beenCalledWith(nullCallerAddress);
    });
  });

  describe('#getMaximumSetTokenIssueAmountAsync', () => {
    let subjectTokenAddress: Address;
    let slippage: BigNumber;
    let nullCallerAddress: Address;

    beforeEach(async () => {
      subjectTokenAddress = '0xEC0815AA9B462ed4fC84B5dFc43Fd2a10a54B569';
      slippage = ether(2);
      nullCallerAddress = '0x0000000000000000000000000000000000000000';
    });

    async function subject(): Promise<BigNumber> {
      return await perpV2LeverageViewerAPI.getMaximumSetTokenIssueAmountAsync(
        subjectTokenAddress,
        slippage,
        nullCallerAddress,
      );
    }

    it('should call the PerpV2LeverageModuleViewerWrapper with correct params', async () => {
      await subject();

      expect(perpV2LeverageModuleViewerWrapper.getMaximumSetTokenIssueAmount).to.have.beenCalledWith(
        subjectTokenAddress,
        nullCallerAddress,
      );
    });

    describe('when the SetToken address is invalid', () => {
      beforeEach(async () => {
        subjectTokenAddress = '0xInvalidAddress';
      });

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('Validation error');
      });
    });
  });

  describe('#getTotalCollateralUnitAsync', () => {
    let subjectTokenAddress: Address;
    let nullCallerAddress: Address;

    beforeEach(async () => {
      subjectTokenAddress = '0xEC0815AA9B462ed4fC84B5dFc43Fd2a10a54B569';
      nullCallerAddress = '0x0000000000000000000000000000000000000000';
    });

    async function subject(): Promise<[Address, BigNumber]> {
      return await perpV2LeverageViewerAPI.getTotalCollateralUnitAsync(
        subjectTokenAddress,
        nullCallerAddress,
      );
    }

    it('should call the PerpV2LeverageModuleViewerWrapper with correct params', async () => {
      await subject();

      expect(perpV2LeverageModuleViewerWrapper.getTotalCollateralUnit).to.have.beenCalledWith(
        subjectTokenAddress,
        nullCallerAddress,
      );
    });

    describe('when the SetToken address is invalid', () => {
      beforeEach(async () => {
        subjectTokenAddress = '0xInvalidAddress';
      });

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('Validation error');
      });
    });
  });

  describe('#getVirtualAssetsDisplayInfoAsync', () => {
    let subjectTokenAddress: Address;
    let nullCallerAddress: Address;

    beforeEach(async () => {
      subjectTokenAddress = '0xEC0815AA9B462ed4fC84B5dFc43Fd2a10a54B569';
      nullCallerAddress = '0x0000000000000000000000000000000000000000';
    });

    async function subject(): Promise<VAssetDisplayInfo[]> {
      return await perpV2LeverageViewerAPI.getVirtualAssetsDisplayInfoAsync(
        subjectTokenAddress,
        nullCallerAddress,
      );
    }

    it('should call the PerpV2LeverageModuleViewerWrapper with correct params', async () => {
      await subject();

      expect(perpV2LeverageModuleViewerWrapper.getVirtualAssetsDisplayInfo).to.have.beenCalledWith(
        subjectTokenAddress,
        nullCallerAddress,
      );
    });

    describe('when the SetToken address is invalid', () => {
      beforeEach(async () => {
        subjectTokenAddress = '0xInvalidAddress';
      });

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('Validation error');
      });
    });
  });
});
