import Web3 from 'web3';

import { BigNumber } from 'ethers/utils';
import { Account, Address } from 'set-protocol-v2/utils/types';
import {
  addSnapshotBeforeRestoreAfterEach,
  getAccounts,
  getWaffleExpect
} from 'set-protocol-v2/utils/masterUtils';

import { SetTokenWrapper } from '../../../src/wrappers/set-protocol-v2/SetTokenWrapper';

const web3 = new Web3('http://localhost:8545');
const expect = getWaffleExpect();


describe('SetTokenWrapper', () => {
  let owner: Account;
  let manager: Account;
  let mockSetAddress: Account;

  let setTokenWrapper: SetTokenWrapper;

  beforeEach(async () => {
    [
      owner,
      manager,
      mockSetAddress,
    ] = await getAccounts();

    setTokenWrapper = new SetTokenWrapper(web3);
  });

  addSnapshotBeforeRestoreAfterEach();

  describe('#popPosition', async () => {
    let subjectSetAddress: Address;

    beforeEach(async () => {
      subjectSetAddress = mockSetAddress.address;
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
