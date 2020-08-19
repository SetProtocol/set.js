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

import { ethers } from 'ethers';
import { Address, ContractTransaction, Position } from 'set-protocol-v2/utils/types';

import SystemAPI from '@src/api/SystemAPI';
import ControllerWrapper from '@src/wrappers/set-protocol-v2/ControllerWrapper';
import { ModuleState } from '@src/types';
import { expect } from '@test/utils/chai';

const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');

jest.mock('@src/wrappers/set-protocol-v2/ControllerWrapper');


describe('SystemAPI', () => {
  let setAddress: Address;
  let controllerAddress: Address;
  let managerAddress: Address;
  let systemAPI: SystemAPI;
  let controllerWrapper: ControllerWrapper;

  beforeEach(async () => {
    [
      setAddress,
      controllerAddress,
      managerAddress,
    ] = await provider.listAccounts();

    systemAPI = new SystemAPI(provider, controllerAddress);
    controllerWrapper = (ControllerWrapper as any).mock.instances[0];
  });

  afterEach(async () => {
    (ControllerWrapper as any).mockClear();
  });

  describe('#getFactoriesAsync', () => {
    async function subject(): Promise<Address[]> {
      return await systemAPI.getFactoriesAsync();
    }

    it('should call the ControllerWrapper with correct params', async () => {
      await subject();

      expect(controllerWrapper.getFactories).to.have.beenCalled;
    });
  });

  describe('#getModulesAsync', () => {
    async function subject(): Promise<Address[]> {
      return await systemAPI.getModulesAsync();
    }

    it('should call the ControllerWrapper with correct params', async () => {
      await subject();

      expect(controllerWrapper.getModules).to.have.beenCalled;
    });
  });

  describe('#getResourcesAsync', () => {
    async function subject(): Promise<Address[]> {
      return await systemAPI.getResourcesAsync();
    }

    it('should call the ControllerWrapper with correct params', async () => {
      await subject();

      expect(controllerWrapper.getResources).to.have.beenCalled;
    });
  });

  describe('#getSetsAsync', () => {
    async function subject(): Promise<Address[]> {
      return await systemAPI.getSetsAsync();
    }

    it('should call the ControllerWrapper with correct params', async () => {
      await subject();

      expect(controllerWrapper.getSets).to.have.beenCalled;
    });
  });
});
