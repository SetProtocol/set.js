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
import { Address } from '@setprotocol/set-protocol-v2/utils/types';

import SystemAPI from '@src/api/SystemAPI';
import ControllerWrapper from '@src/wrappers/set-protocol-v2/ControllerWrapper';
import { expect } from '@test/utils/chai';

const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');

jest.mock('@src/wrappers/set-protocol-v2/ControllerWrapper');


describe('SystemAPI', () => {
  let controllerAddress: Address;
  let systemAPI: SystemAPI;
  let controllerWrapper: ControllerWrapper;

  beforeEach(async () => {
    [
      controllerAddress,
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

  describe('#isSetAsync', () => {
    let subjectAddress: Address;
    let nullCallerAddress: Address;

    beforeEach(async () => {
      subjectAddress = '0xEC0815AA9B462ed4fC84B5dFc43Fd2a10a54B569';
      nullCallerAddress = '0x0000000000000000000000000000000000000000';
    });

    async function subject(): Promise<boolean> {
      return await systemAPI.isSetAsync(subjectAddress, nullCallerAddress);
    }

    it('should call the ControllerWrapper with correct params', async () => {
      await subject();

      expect(controllerWrapper.isSet).to.have.beenCalledWith(
        subjectAddress,
        nullCallerAddress,
      );
    });
  });
});
