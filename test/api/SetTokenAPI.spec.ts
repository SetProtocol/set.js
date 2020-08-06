import { ethers } from 'ethers';

import { Address, Position } from 'set-protocol-v2/utils/types';
import DeployHelper from 'set-protocol-v2/dist/utils/deploys';
import { SetTokenAPI } from '@src/api/SetTokenAPI';

const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');
import { expect, sinon } from '../utils/chai';
import { Assertions } from '@src/assertions';
import { SetTokenWrapper } from '@src/wrappers';


describe('SetTokenAPI', () => {
  let owner: Address;
  let assertions: Assertions;
  let setTokenAPI: SetTokenAPI;
  let setTokenWrapper: SetTokenWrapper;
  let stub: any;

  beforeEach(async () => {
    [
      owner,
    ] = await provider.listAccounts();

    assertions = new Assertions(provider);
    setTokenWrapper = new SetTokenWrapper(provider);
    setTokenAPI = new SetTokenAPI(provider, assertions, { setTokenWrapper });

    deployer = new DeployHelper(provider.getSigner(owner));

    stub = sinon.stub(setTokenWrapper);
  });

  afterEach(async () => {
    sinon.restore();
  });

  describe('Checking basic functionality', () => {
    it('should have the correct name, symbol, controller, and manager', async () => {
      setTokenAPI.getControllerAddressAsync(owner);
      expect(setTokenWrapper.controller).to.have.been.called;
    });
  });
});
