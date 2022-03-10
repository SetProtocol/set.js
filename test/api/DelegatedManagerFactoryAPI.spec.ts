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

import DelegateManagerFactoryAPI from '@src/api/DelegateManagerFactoryAPI';
import PerpV2LeverageModuleWrapper from '@src/wrappers/set-protocol-v2/PerpV2LeverageModuleWrapper';
import { expect } from '../utils/chai';

const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');

jest.mock('@src/wrappers/set-protocol-v2/PerpV2LeverageModuleWrapper');

describe('DelegateManagerFactoryAPI', () => {
  let perpV2LeverageModuleAddress: Address;
  let setTokenAddress: Address;
  let owner: Address;

  let perpV2LeverageAPI: DelegateManagerFactoryAPI;
  let perpV2LeverageModuleWrapper: PerpV2LeverageModuleWrapper;

  beforeEach(async () => {
    [
      owner,
      perpV2LeverageModuleAddress,
      setTokenAddress,
    ] = await provider.listAccounts();

    perpV2LeverageAPI = new DelegateManagerFactoryAPI(provider, perpV2LeverageModuleAddress);
    perpV2LeverageModuleWrapper = (PerpV2LeverageModuleWrapper as any).mock.instances[0];
  });

  afterEach(() => {
    (PerpV2LeverageModuleWrapper as any).mockClear();
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
      return perpV2LeverageAPI.initializeAsync(
        subjectSetTokenAddress,
        subjectCallerAddress,
        subjectTransactionOptions,
      );
    }

    it('should call initialize on the PerpV2LeverageModuleWrapper', async () => {
      await subject();

      expect(perpV2LeverageModuleWrapper.initialize).to.have.beenCalledWith(
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
      return await perpV2LeverageAPI.getCollateralTokenAsync(
        nullCallerAddress,
      );
    }

    it('should call the PerpV2LeverageModuleWrapper with correct params', async () => {
      await subject();

      expect(perpV2LeverageModuleWrapper.collateralToken).to.have.beenCalledWith(nullCallerAddress);
    });
  });

  describe('#getPositionNotionalInfoAsync', () => {
    let subjectTokenAddress: Address;
    let nullCallerAddress: Address;

    beforeEach(async () => {
      subjectTokenAddress = '0xEC0815AA9B462ed4fC84B5dFc43Fd2a10a54B569';
      nullCallerAddress = '0x0000000000000000000000000000000000000000';
    });

    async function subject(): Promise<(Address|BigNumber)[][]> {
      return await perpV2LeverageAPI.getPositionNotionalInfoAsync(
        subjectTokenAddress,
        nullCallerAddress,
      );
    }

    it('should call the PerpV2LeverageModuleWrapper with correct params', async () => {
      await subject();

      expect(perpV2LeverageModuleWrapper.getPositionNotionalInfo).to.have.beenCalledWith(
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

  describe('#getPositionUnitInfoAsync', () => {
    let subjectTokenAddress: Address;
    let nullCallerAddress: Address;

    beforeEach(async () => {
      subjectTokenAddress = '0xEC0815AA9B462ed4fC84B5dFc43Fd2a10a54B569';
      nullCallerAddress = '0x0000000000000000000000000000000000000000';
    });

    async function subject(): Promise<(Address|BigNumber)[][]> {
      return await perpV2LeverageAPI.getPositionUnitInfoAsync(
        subjectTokenAddress,
        nullCallerAddress,
      );
    }

    it('should call the PerpV2LeverageModuleWrapper with correct params', async () => {
      await subject();

      expect(perpV2LeverageModuleWrapper.getPositionUnitInfo).to.have.beenCalledWith(
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

  describe('#getAccountInfoAsync', () => {
    let subjectTokenAddress: Address;
    let nullCallerAddress: Address;

    beforeEach(async () => {
      subjectTokenAddress = '0xEC0815AA9B462ed4fC84B5dFc43Fd2a10a54B569';
      nullCallerAddress = '0x0000000000000000000000000000000000000000';
    });

    async function subject(): Promise<BigNumber[]> {
      return await perpV2LeverageAPI.getAccountInfoAsync(
        subjectTokenAddress,
        nullCallerAddress,
      );
    }

    it('should call the PerpV2LeverageModuleWrapper with correct params', async () => {
      await subject();

      expect(perpV2LeverageModuleWrapper.getAccountInfo).to.have.beenCalledWith(subjectTokenAddress, nullCallerAddress);
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
