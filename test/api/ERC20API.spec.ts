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
import { BigNumber } from 'ethers/utils';

import { Address } from 'set-protocol-v2/utils/types';

const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');
import { ERC20Wrapper } from '@src/wrappers/set-protocol-v2/ERC20Wrapper';

import { expect, sinon } from '../utils/chai';
import { ERC20API } from '@src/api/ERC20API';

describe('ERC20Wrapper', () => {
  let tokenAddress: Address;
  let userAddress: Address;
  let managerAddress: Address;
  let proxyAddress: Address;
  let erc20API: ERC20API;
  let erc20Wrapper: ERC20Wrapper;

  beforeEach(async () => {
    [
      tokenAddress,
      userAddress,
      managerAddress,
      proxyAddress,
    ] = await provider.listAccounts();

    erc20Wrapper = new ERC20Wrapper(provider);
    erc20API = new ERC20API(provider, { erc20Wrapper });
    sinon.stub(erc20Wrapper);
  });

  describe('#getBalanceAsync', () => {
    it('should call the ERC20Wrapper with correct params', async () => {
      erc20API.getBalanceAsync(tokenAddress, userAddress);

      expect(erc20Wrapper.balanceOf).to.have.been.calledWith(
        tokenAddress,
        userAddress
      );
    });
  });
});
