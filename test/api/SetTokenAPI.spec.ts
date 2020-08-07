import { ethers } from 'ethers';

import { Address } from 'set-protocol-v2/utils/types';
import { SetTokenAPI } from '@src/api/SetTokenAPI';
import { SetTokenWrapper } from '@src/wrappers';
import { expect, sinon } from '../utils/chai';

const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');

describe('SetTokenAPI', () => {
  let setAddress: Address;
  let moduleAddress: Address;
  let setTokenAPI: SetTokenAPI;
  let setTokenWrapper: SetTokenWrapper;
  let stub: any;

  beforeEach(async () => {
    [setAddress, moduleAddress] = await provider.listAccounts();

    setTokenWrapper = new SetTokenWrapper(provider);
    setTokenAPI = new SetTokenAPI(provider, { setTokenWrapper });
    stub = sinon.stub(setTokenWrapper);
  });

  afterEach(async () => {
    sinon.restore();
  });

  describe('#getControllerAddressAsync', () => {
    it('should call the Set Token Wrapper with correct params', async () => {
      setTokenAPI.getControllerAddressAsync(setAddress);

      expect(setTokenWrapper.controller).to.have.been.calledWith(setAddress);
    });

    it('should throw with invalid params', async () => {
      expect(() =>
        setTokenAPI.getControllerAddressAsync('InvalidAddress')
      ).to.throw('Validation error');
    });
  });

  describe('#getManagerAddressAsync', () => {
    it('should call the Set Token Wrapper with correct params', async () => {
      setTokenAPI.getManagerAddressAsync(setAddress);

      expect(setTokenWrapper.manager).to.have.been.calledWith(setAddress);
    });

    it('should throw with invalid params', async () => {
      expect(() =>
        setTokenAPI.getManagerAddressAsync('InvalidAddress')
      ).to.throw('Validation error');
    });
  });

  describe('#getPositionsAsync', () => {
    it('should call the Set Token Wrapper with correct params', async () => {
      setTokenAPI.getPositionsAsync(setAddress);

      expect(setTokenWrapper.getPositions).to.have.been.calledWith(setAddress);
    });

    it('should throw with invalid params', async () => {
      expect(() => setTokenAPI.getPositionsAsync('InvalidAddress')).to.throw(
        'Validation error'
      );
    });
  });
});
