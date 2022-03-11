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
import { BigNumber, ContractTransaction } from 'ethers';
import { Address } from '@setprotocol/set-protocol-v2/utils/types';
import { ether } from '@setprotocol/set-protocol-v2/dist/utils/common';

import DelegateManagerFactoryAPI from '@src/api/DelegatedManagerFactoryAPI';
import DelegatedManagerFactoryWrapper from '@src/wrappers/set-v2-strategies/DelegatedManagerFactoryWrapper';
import { expect } from '../utils/chai';

const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');

jest.mock('@src/wrappers/set-v2-strategies/DelegatedManagerFactoryWrapper');

describe('DelegateManagerFactoryAPI', () => {
  let owner: Address;
  let methodologist: Address;
  let operator: Address;
  let componentOne: Address;
  let componentTwo: Address;
  let module: Address;
  let extension: Address;
  let delegatedManagerFactory: Address;
  let setToken: Address;
  let ownerFeeRecipient: Address;

  let delegatedManagerFactoryAPI: DelegateManagerFactoryAPI;
  let delegatedManagerFactoryWrapper: DelegatedManagerFactoryWrapper;

  beforeEach(async () => {
    [
      owner,
      methodologist,
      operator,
      componentOne,
      componentTwo,
      module,
      extension,
      delegatedManagerFactory,
      setToken,
      ownerFeeRecipient,
    ] = await provider.listAccounts();

    delegatedManagerFactoryAPI = new DelegateManagerFactoryAPI(provider, delegatedManagerFactory);
    delegatedManagerFactoryWrapper = (DelegatedManagerFactoryWrapper as any).mock.instances[0];
  });

  afterEach(() => {
    (DelegatedManagerFactoryWrapper as any).mockClear();
  });

  describe('#createSetAndManagerAsync', () => {
    let subjectComponents: Address[];
    let subjectUnits: BigNumber[];
    let subjectName: string;
    let subjectSymbol: string;
    let subjectOwner: Address;
    let subjectMethodologist: Address;
    let subjectModules: Address[];
    let subjectOperators: Address[];
    let subjectAssets: Address[];
    let subjectExtensions: Address[];
    let subjectCallerAddress: Address;
    let subjectTransactionOptions: any;

    beforeEach(async () => {
      subjectComponents = [componentOne, componentTwo];
      subjectUnits = [ether(1), ether(.5)];
      subjectName = 'Test';
      subjectSymbol = 'TEST';
      subjectOwner = owner;
      subjectMethodologist = methodologist;
      subjectModules = [module];
      subjectOperators = [operator];
      subjectAssets = [componentOne, componentTwo];
      subjectExtensions = [extension];
      subjectCallerAddress = owner;
      subjectTransactionOptions = {};
    });

    async function subject(): Promise<ContractTransaction> {
      return delegatedManagerFactoryAPI.createSetAndManagerAsync(
        subjectComponents,
        subjectUnits,
        subjectName,
        subjectSymbol,
        subjectOwner,
        subjectMethodologist,
        subjectModules,
        subjectOperators,
        subjectAssets,
        subjectExtensions,
        subjectCallerAddress,
        subjectTransactionOptions
      );
    }

    it('should call `createSetAndManagerAsync` on the DelegatedManagerFactoryWrapper', async () => {
      await subject();

      expect(delegatedManagerFactoryWrapper.createSetAndManager).to.have.beenCalledWith(
        subjectComponents,
        subjectUnits,
        subjectName,
        subjectSymbol,
        subjectOwner,
        subjectMethodologist,
        subjectModules,
        subjectOperators,
        subjectAssets,
        subjectExtensions,
        subjectCallerAddress,
        subjectTransactionOptions
      );
    });

    describe('when a component is not a valid address', () => {
      beforeEach(() => subjectComponents = ['0xinvalid', componentTwo]);

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('Validation error');
      });
    });

    describe('when a unit is not a valid number', () => {
      beforeEach(() => subjectUnits = [NaN, ether(.5)]);

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('Validation error');
      });
    });

    describe('when a name is not a valid string', () => {
      beforeEach(() => subjectName = <unknown>5 as string);

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('Validation error');
      });
    });

    describe('when a symbol is not a valid string', () => {
      beforeEach(() => subjectSymbol = <unknown>5 as string);

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('Validation error');
      });
    });

    describe('when a methodologist is not a valid address', () => {
      beforeEach(() => subjectMethodologist = '0xinvalid');

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('Validation error');
      });
    });

    describe('when a module is not a valid address', () => {
      beforeEach(() => subjectModules = ['0xinvalid']);

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('Validation error');
      });
    });

    describe('when an operator is not a valid address', () => {
      beforeEach(() => subjectOperators = ['0xinvalid']);

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('Validation error');
      });
    });

    describe('when an asset is not a valid address', () => {
      beforeEach(() => subjectAssets = ['0xinvalid']);

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('Validation error');
      });
    });

    describe('when an extension is not a valid address', () => {
      beforeEach(() => subjectExtensions = ['0xinvalid']);

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('Validation error');
      });
    });

    describe('when components is an empty array', () => {
      beforeEach(() => subjectComponents = []);

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('Component addresses must contain at least one component.');
      });
    });

    describe('when components and units have different array lengths', () => {
      beforeEach(() => subjectComponents = [componentOne] );

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('Component addresses and units must be equal length.');
      });
    });
  });

  describe('#initializeAsync', () => {
    let subjectSetToken: Address;
    let subjectOwnerFeeSplit: BigNumber;
    let subjectOwnerFeeRecipient: Address;
    let subjectInitializeTargets: Address[];
    let subjectInitializeBytecode: string[];
    let subjectCallerAddress: Address;
    let subjectTransactionOptions: any;

    beforeEach(async () => {
      subjectSetToken = setToken;
      subjectOwnerFeeSplit = ether(.5);
      subjectOwnerFeeRecipient = ownerFeeRecipient;
      subjectInitializeTargets = [module];
      subjectInitializeBytecode = ['0x0123456789ABCDEF'];
      subjectCallerAddress = owner;
      subjectTransactionOptions = {};
    });

    async function subject(): Promise<ContractTransaction> {
      return delegatedManagerFactoryAPI.initializeAsync(
        subjectSetToken,
        subjectOwnerFeeSplit,
        subjectOwnerFeeRecipient,
        subjectInitializeTargets,
        subjectInitializeBytecode,
        subjectCallerAddress,
        subjectTransactionOptions,
      );
    }

    it('should call initialize on the DelegatedManagerFactoryWrapper', async () => {
      await subject();

      expect(delegatedManagerFactoryWrapper.initialize).to.have.beenCalledWith(
        subjectSetToken,
        subjectOwnerFeeSplit,
        subjectOwnerFeeRecipient,
        subjectInitializeTargets,
        subjectInitializeBytecode,
        subjectCallerAddress,
        subjectTransactionOptions,
      );
    });

    describe('when setToken is not a valid address', () => {
      beforeEach(() => subjectSetToken = '0xinvalid');

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('Validation error');
      });
    });

    describe('when ownerFeeSplit is not a valid number', () => {
      beforeEach(() => subjectOwnerFeeSplit = <unknown>NaN as BigNumber);

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('Validation error');
      });
    });

    describe('when ownerFeeRecipient is not a valid address', () => {
      beforeEach(() => subjectOwnerFeeRecipient = '0xinvalid');

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('Validation error');
      });
    });

    describe('when an initializeTarget is not a valid address', () => {
      beforeEach(() => subjectInitializeTargets = ['0xinvalid']);

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('Validation error');
      });
    });

    describe('when an initializeBytecode is not a valid string', () => {
      beforeEach(() => subjectInitializeBytecode = [<unknown>5 as string]);

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('Validation error');
      });
    });

    describe('when initializeTargets array is empty', () => {
      beforeEach(() => subjectInitializeTargets = []);

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith(
          'initializationTargets array must contain at least one element'
        );
      });
    });

    describe('when initializeTargets and initializeBytecode are not equal length', () => {
      beforeEach(() => subjectInitializeBytecode = ['0x00', '0x00']);

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith(
          'initializeTargets and initializeBytecode arrays must be equal length'
        );
      });
    });
  });
});
