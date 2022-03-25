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

import IssuanceExtensionAPI from '@src/api/extensions/IssuanceExtensionAPI';
import IssuanceExtensionWrapper from '@src/wrappers/set-v2-strategies/IssuanceExtensionWrapper';
import { expect } from '../../utils/chai';

const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');

jest.mock('@src/wrappers/set-v2-strategies/IssuanceExtensionWrapper');

describe('IssuanceExtensionAPI', () => {
  let owner: Address;
  let setToken: Address;
  let issuanceExtension: Address;
  let delegatedManager: Address;
  let feeRecipient: Address;
  let managerIssueHook: Address;

  let issuanceExtensionAPI: IssuanceExtensionAPI;
  let issuanceExtensionWrapper: IssuanceExtensionWrapper;

  beforeEach(async () => {
    [
      owner,
      setToken,
      issuanceExtension,
      delegatedManager,
      feeRecipient,
      managerIssueHook,
    ] = await provider.listAccounts();

    issuanceExtensionAPI = new IssuanceExtensionAPI(provider, issuanceExtension);
    issuanceExtensionWrapper = (IssuanceExtensionWrapper as any).mock.instances[0];
  });

  afterEach(() => {
    (IssuanceExtensionWrapper as any).mockClear();
  });

  describe('#distributeFeesAsync', () => {
    let subjectSetToken: Address;
    let subjectCallerAddress: Address;
    let subjectTransactionOptions: any;

    beforeEach(async () => {
      subjectSetToken = setToken;
      subjectCallerAddress = owner;
      subjectTransactionOptions = {};
    });

    async function subject(): Promise<ContractTransaction> {
      return issuanceExtensionAPI.distributeFeesAsync(
        subjectSetToken,
        subjectCallerAddress,
        subjectTransactionOptions
      );
    }

    it('should call `distribute` on the IssuanceExtensionWrapper', async () => {
      await subject();

      expect(issuanceExtensionWrapper.distributeFees).to.have.beenCalledWith(
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

  describe('#getIssuanceExtensionInitializationBytecode', () => {
    let subjectDelegatedManager: Address;

    beforeEach(async () => {
      subjectDelegatedManager = delegatedManager;
    });

    async function subject(): Promise<BytesLike> {
      return issuanceExtensionAPI.getIssuanceExtensionInitializationBytecode(
        subjectDelegatedManager
      );
    }

    it('should generate the expected bytecode', async () => {
      const expectedBytecode = '0xde2236bd000000000000000000000000e834ec434daba538cd1b9fe1582052b880bd7e63';
      expect(await subject()).eq(expectedBytecode);
    });

    describe('when delegatedManager is not a valid address', () => {
      beforeEach(() => subjectDelegatedManager = '0xinvalid');

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('Validation error');
      });
    });
  });

  describe('#getIssuanceModuleAndExtensionInitializationBytecode', () => {
    let subjectDelegatedManager: Address;
    let subjectMaxManagerFee: BigNumber;
    let subjectManagerIssueFee: BigNumber;
    let subjectManagerRedeemFee: BigNumber;
    let subjectFeeRecipient: Address;
    let subjectManagerIssuanceHook: Address;

    beforeEach(async () => {
      subjectDelegatedManager = delegatedManager;
      subjectMaxManagerFee = ether(.5);
      subjectManagerIssueFee = ether(.05);
      subjectManagerRedeemFee =  ether(.04);
      subjectFeeRecipient = feeRecipient;
      subjectManagerIssuanceHook = managerIssueHook;
    });

    async function subject(): Promise<BytesLike> {
      return issuanceExtensionAPI.getIssuanceModuleAndExtensionInitializationBytecode(
        subjectDelegatedManager,
        subjectMaxManagerFee,
        subjectManagerIssueFee,
        subjectManagerRedeemFee,
        subjectFeeRecipient,
        subjectManagerIssuanceHook
      );
    }

    it('should generate the expected bytecode', async () => {
      const expectedBytecode =
        '0xb738ad91000000000000000000000000e834ec434daba538cd1b9fe1582052b880bd7e63000000000000000' +
        '00000000000000000000000000000000006f05b59d3b200000000000000000000000000000000000000000000' +
        '0000000000b1a2bc2ec50000000000000000000000000000000000000000000000000000008e1bc9bf0400000' +
        '0000000000000000000000078dc5d2d739606d31509c31d654056a45185ecb6000000000000000000000000a8' +
        'dda8d7f5310e4a9e24f8eba77e091ac264f872';

      expect(await subject()).eq(expectedBytecode);
    });

    describe('when setToken is not a valid address', () => {
      beforeEach(() => subjectDelegatedManager = '0xinvalid');

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('Validation error');
      });
    });

    describe('when maxManagerFee is not a valid number', () => {
      beforeEach(() => subjectMaxManagerFee = <unknown>NaN as BigNumber);

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('Validation error');
      });
    });

    describe('when managerIssueFee is not a valid number', () => {
      beforeEach(() => subjectManagerIssueFee = <unknown>NaN as BigNumber);

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('Validation error');
      });
    });

    describe('when managerRedeemFee is not a valid number', () => {
      beforeEach(() => subjectManagerRedeemFee = <unknown>NaN as BigNumber);

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('Validation error');
      });
    });

    describe('when feeRecipient is not a valid address', () => {
      beforeEach(() => subjectFeeRecipient = '0xinvalid');

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('Validation error');
      });
    });

    describe('when managerIssuanceHook is not a valid address', () => {
      beforeEach(() => subjectManagerIssuanceHook = '0xinvalid');

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('Validation error');
      });
    });
  });
});
