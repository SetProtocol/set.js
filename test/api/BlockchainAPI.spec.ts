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

'use strict';

jest.setTimeout(30000);

import * as _ from 'lodash';
import { ethers } from 'ethers';
import { BigNumber } from 'ethers/lib/ethers';
import { Blockchain } from '@setprotocol/set-protocol-v2/dist/utils/common';
import DeployHelper from '@setprotocol/set-protocol-v2/dist/utils/deploys';
import { TransactionReceipt } from 'ethereum-types';

import BlockchainAPI from '@src/api/BlockchainAPI';
import { expect } from '@test/utils/chai';
import ERC20Wrapper from '@src/wrappers/set-protocol-v2/ERC20Wrapper';
import { Address } from '@setprotocol/set-protocol-v2/utils/types';

const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');
const blockchain = new Blockchain(provider);

describe('BlockchainAPI', () => {
  let blockchainAPI: BlockchainAPI;
  let erc20Wrapper: ERC20Wrapper;
  let deployer: DeployHelper;

  let owner: Address;
  let manager: Address;

  beforeEach(async () => {
    [
      owner,
      manager,
    ] = await provider.listAccounts();

    blockchainAPI = new BlockchainAPI(provider);
    erc20Wrapper = new ERC20Wrapper(provider);

    deployer = new DeployHelper(provider.getSigner(owner));
  });

  describe('awaitTransactionMinedAsync', () => {
    let approveAllowance: BigNumber;
    let subjectOwnerAddress: Address;
    let subjectTokenAddress: Address;
    let subjectSpenderAddress: Address;
    let subjectTxHash: string;

    beforeEach(async () => {
      await blockchain.saveSnapshotAsync();

      approveAllowance = BigNumber.from(1000);
      const deployedToken = await deployer.mocks.deployTokenMock(owner);

      subjectOwnerAddress = owner;
      subjectTokenAddress = deployedToken.address;
      subjectSpenderAddress = manager;

      subjectTxHash = (await erc20Wrapper.approve(
        subjectTokenAddress,
        subjectSpenderAddress,
        approveAllowance,
        subjectOwnerAddress,
      )).hash;
    });

    afterEach(async () => {
      await blockchain.revertAsync();
    });

    async function subject(): Promise<TransactionReceipt> {
      return await blockchainAPI.awaitTransactionMinedAsync(
        subjectTxHash,
      );
    }

    it('returns transaction receipt with the correct logs', async () => {
      const receipt = await subject();

      expect(receipt.from).to.equal(subjectOwnerAddress);
    });
  });
});
