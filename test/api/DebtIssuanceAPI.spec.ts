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
import { Address } from '@setprotocol/set-protocol-v2/utils/types';
import { ether } from '@setprotocol/set-protocol-v2/dist/utils/common';

import DebtIssuanceAPI from '@src/api/DebtIssuanceAPI';
import DebtIssuanceModuleWrapper from '@src/wrappers/set-protocol-v2/DebtIssuanceModuleWrapper';
import { expect } from '@test/utils/chai';

const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');

jest.mock('@src/wrappers/set-protocol-v2/DebtIssuanceModuleWrapper');


describe('DebtIssuanceAPI', () => {
  let debtIssuanceModuleAddress: Address;
  let managerIssuanceHook: Address;
  let setTokenAddress: Address;
  let owner: Address;

  let debtIssuanceModuleWrapper: DebtIssuanceModuleWrapper;
  let debtIssuanceAPI: DebtIssuanceAPI;

  beforeEach(async () => {
    [
      owner,
      debtIssuanceModuleAddress,
      managerIssuanceHook,
      setTokenAddress,
    ] = await provider.listAccounts();

    debtIssuanceAPI = new DebtIssuanceAPI(provider, debtIssuanceModuleAddress);
    debtIssuanceModuleWrapper = (DebtIssuanceModuleWrapper as any).mock.instances[0];
  });

  afterEach(async () => {
    (DebtIssuanceModuleWrapper as any).mockClear();
  });

  describe('#initializeAsync', () => {
    let subjectSetTokenAddress: Address;
    let subjectMaxManagerFee: BigNumber;
    let subjectManagerIssueFee: BigNumber;
    let subjectManagerRedeemFee: BigNumber;
    let subjectFeeRecipientAddress: Address;
    let subjectManagerIssuanceHook: Address;
    let subjectCallerAddress: Address;

    let subjectTransactionOptions: any;

    beforeEach(async () => {
      subjectSetTokenAddress = setTokenAddress;
      subjectMaxManagerFee = ether(1);
      subjectManagerIssueFee = ether(0.1);
      subjectManagerRedeemFee = ether(0.2);
      subjectFeeRecipientAddress = owner;
      subjectManagerIssuanceHook = managerIssuanceHook;
      subjectCallerAddress = owner;
      subjectTransactionOptions = {};
    });

    async function subject(): Promise<any> {
      return debtIssuanceAPI.initializeAsync(
        subjectSetTokenAddress,
        subjectMaxManagerFee,
        subjectManagerIssueFee,
        subjectManagerRedeemFee,
        subjectFeeRecipientAddress,
        subjectManagerIssuanceHook,
        subjectCallerAddress,
        subjectTransactionOptions,
      );
    }

    it('should call initialize on the DebtIssuanceModuleWrapper', async () => {
      await subject();

      expect(debtIssuanceModuleWrapper.initialize).to.have.beenCalledWith(
        subjectSetTokenAddress,
        subjectMaxManagerFee,
        subjectManagerIssueFee,
        subjectManagerRedeemFee,
        subjectFeeRecipientAddress,
        subjectManagerIssuanceHook,
        subjectCallerAddress,
        subjectTransactionOptions,
      );
    });
  });

  describe('#issueAsync', () => {
    let subjectSetTokenAddress: Address;
    let subjectIssuanceQuantity: BigNumber;
    let subjectSetTokenRecipientAddress: Address;
    let subjectCallerAddress: Address;
    let subjectTransactionOptions: any;

    beforeEach(async () => {
      subjectSetTokenAddress = '0xEC0815AA9B462ed4fC84B5dFc43Fd2a10a54B569';
      subjectIssuanceQuantity = ether(1);
      subjectSetTokenRecipientAddress = '0x0872262A92581EC09C2d522b48bCcd9E3C8ACf9C';
      subjectCallerAddress = '0x0e2298E3B3390e3b945a5456fBf59eCc3f55DA16';
      subjectTransactionOptions = {};
    });

    async function subject(): Promise<ContractTransaction> {
      return await debtIssuanceAPI.issueAsync(
        subjectSetTokenAddress,
        subjectIssuanceQuantity,
        subjectSetTokenRecipientAddress,
        subjectCallerAddress,
        subjectTransactionOptions
      );
    }

    it('should call the DebtIssuanceModuleWrapper with correct params', async () => {
      await subject();

      expect(debtIssuanceModuleWrapper.issue).to.have.beenCalledWith(
        subjectSetTokenAddress,
        subjectIssuanceQuantity,
        subjectSetTokenRecipientAddress,
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

    describe('when the SetToken recipient address is invalid', () => {
      beforeEach(async () => {
        subjectSetTokenRecipientAddress = '0xInvalidAddress';
      });

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('Validation error');
      });
    });
  });

  describe('#redeemAsync', () => {
    let subjectSetTokenAddress: Address;
    let subjectRedemptionQuantity: BigNumber;
    let subjectSetTokenRecipientAddress: Address;
    let subjectCallerAddress: Address;
    let subjectTransactionOptions: any;

    beforeEach(async () => {
      subjectSetTokenAddress = '0xEC0815AA9B462ed4fC84B5dFc43Fd2a10a54B569';
      subjectRedemptionQuantity = ether(1);
      subjectSetTokenRecipientAddress = '0x0872262A92581EC09C2d522b48bCcd9E3C8ACf9C';
      subjectCallerAddress = '0x0e2298E3B3390e3b945a5456fBf59eCc3f55DA16';
      subjectTransactionOptions = {};
    });

    async function subject(): Promise<ContractTransaction> {
      return await debtIssuanceAPI.redeemAsync(
        subjectSetTokenAddress,
        subjectRedemptionQuantity,
        subjectSetTokenRecipientAddress,
        subjectCallerAddress,
        subjectTransactionOptions
      );
    }

    it('should call the DebtIssuanceModuleWrapper with correct params', async () => {
      await subject();

      expect(debtIssuanceModuleWrapper.redeem).to.have.beenCalledWith(
        subjectSetTokenAddress,
        subjectRedemptionQuantity,
        subjectSetTokenRecipientAddress,
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
});
