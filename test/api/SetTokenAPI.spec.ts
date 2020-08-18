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

import { Address } from 'set-protocol-v2/utils/types';
import SetTokenAPI from '@src/api/SetTokenAPI';
import SetTokenWrapper from '@src/wrappers/set-protocol-v2/SetTokenWrapper';
import { expect } from '@test/utils/chai';

const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');

jest.mock('@src/wrappers/set-protocol-v2/SetTokenWrapper');

describe('SetTokenAPI', () => {
  let setAddress: Address;
  let moduleAddress: Address;
  let managerAddress: Address;
  let setTokenAPI: SetTokenAPI;
  let setTokenWrapper: SetTokenWrapper;

  beforeEach(async () => {
    [setAddress, moduleAddress, managerAddress] = await provider.listAccounts();

    setTokenAPI = new SetTokenAPI(provider);
    setTokenWrapper = (SetTokenWrapper as any).mock.instances[0];
  });

  afterEach(async () => {
    (SetTokenWrapper as any).mockClear();
  });

  describe('#getControllerAddressAsync', () => {
    it('should call the Set Token Wrapper with correct params', async () => {
      setTokenAPI.getControllerAddressAsync(setAddress);

      expect(setTokenWrapper.controller).to.have.beenCalledWith(setAddress);
    });

    it('should throw with invalid params', async () => {
      await expect(
        setTokenAPI.getControllerAddressAsync('InvalidAddress')
      ).to.be.rejectedWith('Validation error');
    });
  });

  describe('#getManagerAddressAsync', () => {
    it('should call the Set Token Wrapper with correct params', async () => {
      setTokenAPI.getManagerAddressAsync(setAddress);

      expect(setTokenWrapper.manager).to.have.beenCalledWith(setAddress);
    });

    it('should throw with invalid params', async () => {
      await expect(
        setTokenAPI.getManagerAddressAsync('InvalidAddress')
      ).to.be.rejectedWith('Validation error');
    });
  });

  describe('#getPositionsAsync', () => {
    it('should call the Set Token Wrapper with correct params', async () => {
      setTokenAPI.getPositionsAsync(setAddress);

      expect(setTokenWrapper.getPositions).to.have.beenCalledWith(setAddress, undefined);
    });

    it('should throw with invalid params', async () => {
      await expect(
        setTokenAPI.getPositionsAsync('InvalidAddress')
      ).to.be.rejectedWith('Validation error');
    });
  });

  describe('#getModulesAsync', () => {
    it('should call the Set Token Wrapper with correct params', async () => {
      setTokenAPI.getModulesAsync(setAddress);

      expect(setTokenWrapper.getModules).to.have.beenCalledWith(setAddress, undefined);
    });

    it('should throw with invalid params', async () => {
      await expect(
        setTokenAPI.getModulesAsync('InvalidAddress')
      ).to.be.rejectedWith('Validation error');
    });
  });

  describe('#getModuleStateAsync', () => {
    it('should call the Set Token Wrapper with correct params', async () => {
      setTokenAPI.getModuleStateAsync(setAddress, moduleAddress);

      expect(setTokenWrapper.moduleStates).to.have.beenCalledWith(
        setAddress,
        moduleAddress,
        undefined,
      );
    });

    it('should throw with invalid params', async () => {
      await expect(
        setTokenAPI.getModuleStateAsync('InvalidAddress', 'InvalidAddress')
      ).to.be.rejectedWith('Validation error');
    });
  });

  describe('#addModuleAsync', () => {
    it('should call the Set Token Wrapper with correct params', async () => {
      setTokenAPI.addModuleAsync(setAddress, moduleAddress);

      expect(setTokenWrapper.addModule).to.have.beenCalledWith(
        setAddress,
        moduleAddress,
        undefined,
        {}
      );
    });

    it('should throw with invalid params', async () => {
      await expect(
        setTokenAPI.addModuleAsync('InvalidAddress', 'InvalidAddress')
      ).to.be.rejectedWith('Validation error');
    });
  });

  describe('#setManagerAsync', () => {
    it('should call the Set Token Wrapper with correct params', async () => {
      setTokenAPI.setManagerAsync(setAddress, managerAddress);

      expect(setTokenWrapper.setManager).to.have.beenCalledWith(
        setAddress,
        managerAddress,
        undefined,
        {}
      );
    });

    it('should throw with invalid params', async () => {
      await expect(
        setTokenAPI.addModuleAsync('InvalidAddress', 'InvalidAddress')
      ).to.be.rejectedWith('Validation error');
    });
  });

  describe('#initializeModuleAsync', () => {
    it('should call the Set Token Wrapper with correct params', async () => {
      setTokenAPI.initializeModuleAsync(setAddress);

      expect(setTokenWrapper.initializeModule).to.have.beenCalledWith(setAddress, undefined, {});
    });

    it('should throw with invalid params', async () => {
      await expect(
        setTokenAPI.initializeModuleAsync('InvalidAddress')
      ).to.be.rejectedWith('Validation error');
    });
  });

  describe('#isModuleEnabledAsync', () => {
    it('should call the Set Token Wrapper with correct params', async () => {
      setTokenAPI.isModuleEnabledAsync(setAddress, moduleAddress);

      expect(setTokenWrapper.isModule).to.have.beenCalledWith(setAddress, moduleAddress, undefined);
    });

    it('should throw with invalid params', async () => {
      await expect(
        setTokenAPI.isModuleEnabledAsync('InvalidAddress', 'InvalidAddress')
      ).to.be.rejectedWith('Validation error');
    });
  });

  describe('#isModulePendingAsync', () => {
    it('should call the Set Token Wrapper with correct params', async () => {
      setTokenAPI.isModulePendingAsync(setAddress, moduleAddress);

      expect(setTokenWrapper.isPendingModule).to.have.beenCalledWith(setAddress, moduleAddress, undefined);
    });

    it('should throw with invalid params', async () => {
      await expect(
        setTokenAPI.isModulePendingAsync('InvalidAddress', 'InvalidAddress')
      ).to.be.rejectedWith('Validation error');
    });
  });
});