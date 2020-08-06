import { ethers } from 'ethers';

import { Address } from 'set-protocol-v2/utils/types';
import { SetTokenAPI } from '@src/api/SetTokenAPI';
import { Assertions } from '@src/assertions';
import { SetTokenWrapper } from '@src/wrappers';
import { expect, sinon } from '../utils/chai';

const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');


describe('SetTokenAPI', () => {
  let setAddress: Address;
  let assertions: Assertions;
  let setTokenAPI: SetTokenAPI;
  let setTokenWrapper: SetTokenWrapper;
  let stub: any;

  beforeEach(async () => {
    [
      setAddress,
    ] = await provider.listAccounts();

    assertions = new Assertions(provider);
    setTokenWrapper = new SetTokenWrapper(provider);
    setTokenAPI = new SetTokenAPI(provider, assertions, { setTokenWrapper });
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
  });
});
