import { ethers } from 'ethers';

import { Address } from 'set-protocol-v2/utils/types';
import { SetTokenAPI } from '@src/api/SetTokenAPI';
import SetTokenWrapper from '../../src/wrappers/set-protocol-v2/SetTokenWrapper';
import { expect } from '../utils/chai';

const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');

jest.mock('../../src/wrappers/set-protocol-v2/SetTokenWrapper');

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

    (SetTokenWrapper as any).mockClear();
  });

  describe('#getControllerAddressAsync', () => {
    it('should call the Set Token Wrapper with correct params', async () => {
      setTokenAPI.getControllerAddressAsync(setAddress);

      expect(setTokenWrapper.controller).to.have.beenCalledWith(setAddress);
    });

    xit('should throw with invalid params', async () => {
      await expect(
        setTokenAPI.getControllerAddressAsync('InvalidAddress')
      ).to.be.rejectedWith('Validation error');
    });
  });

  xdescribe('#getManagerAddressAsync', () => {
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

  xdescribe('#getPositionsAsync', () => {
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

  xdescribe('#getModulesAsync', () => {
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

  xdescribe('#getModuleStateAsync', () => {
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

  xdescribe('#addModuleAsync', () => {
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

  xdescribe('#setManagerAsync', () => {
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

  xdescribe('#initializeModuleAsync', () => {
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

  xdescribe('#isModuleEnabledAsync', () => {
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

  xdescribe('#isModulePendingAsync', () => {
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
