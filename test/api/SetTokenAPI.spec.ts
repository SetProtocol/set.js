import { ethers } from 'ethers';

import { Address } from 'set-protocol-v2/utils/types';
import { SetTokenAPI } from '@src/api/SetTokenAPI';
import { SetTokenWrapper } from '@src/wrappers';
import { expect, sinon } from '../utils/chai';

const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');

describe('SetTokenAPI', () => {
  let setAddress: Address;
  let moduleAddress: Address;
  let managerAddress: Address;
  let setTokenAPI: SetTokenAPI;
  let setTokenWrapper: SetTokenWrapper;

  beforeEach(async () => {
    [setAddress, moduleAddress, managerAddress] = await provider.listAccounts();

    setTokenWrapper = new SetTokenWrapper(provider);
    setTokenAPI = new SetTokenAPI(provider, { setTokenWrapper });
    sinon.stub(setTokenWrapper);
  });

  describe('#getControllerAddressAsync', () => {
    it('should call the Set Token Wrapper with correct params', async () => {
      setTokenAPI.getControllerAddressAsync(setAddress);

      expect(setTokenWrapper.controller).to.have.been.calledWith(setAddress);
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

      expect(setTokenWrapper.manager).to.have.been.calledWith(setAddress);
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

      expect(setTokenWrapper.getPositions).to.have.been.calledWith(setAddress);
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

      expect(setTokenWrapper.getModules).to.have.been.calledWith(setAddress);
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

      expect(setTokenWrapper.moduleStates).to.have.been.calledWith(
        setAddress,
        moduleAddress
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

      expect(setTokenWrapper.addModule).to.have.been.calledWith(
        setAddress,
        moduleAddress
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

      expect(setTokenWrapper.setManager).to.have.been.calledWith(
        setAddress,
        managerAddress
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

      expect(setTokenWrapper.initializeModule).to.have.been.calledWith(setAddress);
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

      expect(setTokenWrapper.isModule).to.have.been.calledWith(setAddress, moduleAddress);
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

      expect(setTokenWrapper.isPendingModule).to.have.been.calledWith(setAddress, moduleAddress);
    });

    it('should throw with invalid params', async () => {
      await expect(
        setTokenAPI.isModulePendingAsync('InvalidAddress', 'InvalidAddress')
      ).to.be.rejectedWith('Validation error');
    });
  });
});
