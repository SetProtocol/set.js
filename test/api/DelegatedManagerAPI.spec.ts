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
import { ContractTransaction } from 'ethers';
import { Address } from '@setprotocol/set-protocol-v2/utils/types';

import DelegateManagerFactoryAPI from '@src/api/DelegatedManagerAPI';
import DelegatedManagerWrapper from '@src/wrappers/set-v2-strategies/DelegatedManagerWrapper';
import { expect } from '../utils/chai';

const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');

jest.mock('@src/wrappers/set-v2-strategies/DelegatedManagerWrapper');

describe('DelegatedManagerAPI', () => {
  let owner: Address;
  let delegatedManager: Address;
  let extensionA: Address;
  let extensionB: Address;

  let delegatedManagerAPI: DelegateManagerFactoryAPI;
  let delegatedManagerWrapper: DelegatedManagerWrapper;

  beforeEach(async () => {
    [
      owner,
      delegatedManager,
      extensionA,
      extensionB,
    ] = await provider.listAccounts();

    delegatedManagerAPI = new DelegateManagerFactoryAPI(provider, delegatedManager);
    delegatedManagerWrapper = (DelegatedManagerWrapper as any).mock.instances[0];
  });

  afterEach(() => {
    (DelegatedManagerWrapper as any).mockClear();
  });

  describe('#addExtension', () => {
    let subjectExtensions: Address[];
    let subjectCallerAddress: Address;
    let subjectTransactionOptions: any;

    beforeEach(async () => {
      subjectExtensions = [extensionA, extensionB];
      subjectCallerAddress = owner;
      subjectTransactionOptions = {};
    });

    async function subject(): Promise<ContractTransaction> {
      return delegatedManagerAPI.addExtensionsAsync(
        subjectExtensions,
        subjectCallerAddress,
        subjectTransactionOptions
      );
    }

    it('should call `addExtension` on the DelegatedManagerWrapper', async () => {
      await subject();

      expect(delegatedManagerWrapper.addExtensions).to.have.beenCalledWith(
        subjectExtensions,
        subjectCallerAddress,
        subjectTransactionOptions
      );
    });

    describe('when an extension is not a valid address', () => {
      beforeEach(() => subjectExtensions = ['0xinvalid', extensionB]);

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('Validation error');
      });
    });
  });
});
