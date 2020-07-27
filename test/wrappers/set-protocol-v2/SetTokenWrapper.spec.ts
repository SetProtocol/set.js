import { ethers } from 'ethers';
import chai from 'chai';

import { Address } from 'set-protocol-v2/utils/types';
const { Blockchain } = require('set-protocol-v2/dist/utils/common');

import { SetTokenWrapper } from '../../../src/wrappers/set-protocol-v2/SetTokenWrapper';

const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');
const expect = chai.expect;

const blockchain = new Blockchain(provider);

describe('SetTokenWrapper', () => {
  let owner: string;
  let manager: string;
  let mockSetAddress: string;

  let setTokenWrapper: SetTokenWrapper;

  beforeEach(async () => {
    [
      owner,
      manager,
      mockSetAddress,
    ] = await provider.listAccounts();

    setTokenWrapper = new SetTokenWrapper(provider);
  });

  beforeEach(async () => {
    await blockchain.saveSnapshotAsync();
  });

  afterEach(async () => {
    await blockchain.revertAsync();
  });

  describe('#popPosition', () => {
    let subjectSetAddress: Address;

    beforeEach(async () => {
      subjectSetAddress = mockSetAddress;
    });

    async function subject(): Promise<any> {
      return await setTokenWrapper.popPosition(subjectSetAddress);
    }

    it('should should return the word hello', async () => {
      const response = await subject();

      expect(response).to.eq('hello');
    });
  });
});
