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
import { Blockchain, ether } from 'set-protocol-v2/dist/utils/common';
import DeployHelper from 'set-protocol-v2/dist/utils/deploys';

const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');
import { ERC20Wrapper } from '@src/wrappers/set-protocol-v2/ERC20Wrapper';

import { expect } from './utils/chai';

const blockchain = new Blockchain(provider);

describe('ERC20Wrapper', () => {
  let owner: Address;
  let manager: Address;
  let erc20Wrapper: ERC20Wrapper;

  let deployer: DeployHelper;

  beforeEach(async () => {
    [
      owner,
      manager,
    ] = await provider.listAccounts();

    erc20Wrapper = new ERC20Wrapper(provider);

    deployer = new DeployHelper(provider.getSigner(owner));
  });

  beforeEach(async () => {
    await blockchain.saveSnapshotAsync();
  });

  afterEach(async () => {
    await blockchain.revertAsync();
  });

  describe('name, symbol, totalSupply, decimals', () => {
    const tokenSupply: BigNumber = ether(1000000000);
    const tokenName: string = 'Token';
    const tokenSymbol: string = 'Symbol';
    const tokenDecimals: BigNumber = new BigNumber(18);

    let subjectTokenAddress: Address;

    beforeEach(async () => {
      const deployedToken = await deployer.mocks.deployTokenMock(owner);
      subjectTokenAddress = deployedToken.address;
    });

    async function subject(): Promise<{
      name: string,
      symbol: string,
      supply: BigNumber,
      decimals: BigNumber,
    }> {
      const name = await erc20Wrapper.name(subjectTokenAddress);
      const symbol = await erc20Wrapper.symbol(subjectTokenAddress);
      const supply = await erc20Wrapper.totalSupply(subjectTokenAddress);
      const decimals = await erc20Wrapper.decimals(subjectTokenAddress);

      return { name, symbol, supply, decimals };
    }

    it('fetches the erc20 token properties correctly', async () => {
      const { name, symbol, supply, decimals } = await subject();
      expect(name).to.eql(tokenName);
      expect(symbol).to.eql(tokenSymbol);
      expect(supply.toString()).to.eql(tokenSupply.toString());
      expect(decimals.toString()).to.eql(tokenDecimals.toString());
    });
  });

  describe('balanceOf', () => {
    let subjectTokenAddress: Address;
    let subjectOwnerAddress: Address;

    beforeEach(async () => {
      const deployedToken = await deployer.mocks.deployTokenMock(owner);
      subjectTokenAddress = deployedToken.address;

      subjectTokenAddress = deployedToken.address;
      subjectOwnerAddress = owner;
    });

    async function subject(): Promise<BigNumber> {
      return await erc20Wrapper.balanceOf(
        subjectTokenAddress,
        subjectOwnerAddress,
      );
    }

    it('fetches the balance correctly', async () => {
      const userTokenBalance = await subject();

      expect(userTokenBalance.toString()).to.eql('1000000000000000000000000000');
    });
  });

  describe('allowance', () => {
    let approveAllowance: BigNumber;

    let subjectOwnerAddress: Address;
    let subjectTokenAddress: Address;
    let subjectSpenderAddress: Address;

    beforeEach(async () => {
      approveAllowance = new BigNumber(1000);
      const deployedToken = await deployer.mocks.deployTokenMock(owner);
      subjectTokenAddress = deployedToken.address;

      subjectOwnerAddress = owner;
      subjectTokenAddress = deployedToken.address;
      subjectSpenderAddress = manager;

      await erc20Wrapper.approve(
        subjectTokenAddress,
        subjectSpenderAddress,
        approveAllowance
      );
    });

    async function subject(): Promise<BigNumber> {
      return await erc20Wrapper.allowance(
        subjectTokenAddress,
        subjectOwnerAddress,
        subjectSpenderAddress,
      );
    }

    it('fetches the spender balance correctly', async () => {
      const spenderAllowance = await subject();

      expect(spenderAllowance.toString()).to.eql(approveAllowance.toString());
    });
  });

  describe('approve', () => {
    let subjectTokenAddress: Address;
    let subjectSpenderAddress: Address;
    let subjectApproveAllowance: BigNumber;
    let subjectCaller: Address;

    beforeEach(async () => {
      const deployedToken = await deployer.mocks.deployTokenMock(owner);
      subjectTokenAddress = deployedToken.address;
      subjectSpenderAddress = manager;
      subjectApproveAllowance = new BigNumber(100);
      subjectCaller = owner;
    });

    async function subject(): Promise<string> {
      return await erc20Wrapper.approve(
        subjectTokenAddress,
        subjectSpenderAddress,
        subjectApproveAllowance,
      );
    }

    it('updates the allowance correctly for the spender', async () => {
      await subject();

      const newSpenderAllowance = await erc20Wrapper.allowance(
        subjectTokenAddress,
        subjectCaller,
        subjectSpenderAddress,
      );
      expect(newSpenderAllowance.toString()).to.eql(subjectApproveAllowance.toString());
    });
  });

  describe('transferFrom', () => {
    let approveAllowance: BigNumber;

    let subjectOwnerAddress: Address;
    let subjectTokenAddress: Address;
    let subjectSpenderAddress: Address;
    let subjectTransferAmount: BigNumber;

    beforeEach(async () => {
      approveAllowance = new BigNumber(1000);
      const deployedToken = await deployer.mocks.deployTokenMock(owner);

      subjectOwnerAddress = owner;
      subjectTokenAddress = deployedToken.address;
      subjectSpenderAddress = manager;
      subjectTransferAmount = approveAllowance;

      await erc20Wrapper.approve(
        subjectTokenAddress,
        subjectSpenderAddress,
        approveAllowance,
        subjectOwnerAddress,
      );
    });

    async function subject(): Promise<string> {
      return await erc20Wrapper.transferFrom(
        subjectTokenAddress,
        subjectOwnerAddress,
        subjectSpenderAddress,
        subjectTransferAmount,
        subjectSpenderAddress,
      );
    }

    it('transfers the token from the owner', async () => {
      const existingTokenBalance = await erc20Wrapper.balanceOf(subjectTokenAddress, subjectOwnerAddress);

      await subject();

      const expectedTokenBalance = existingTokenBalance.sub(subjectTransferAmount);
      const newTokenBalance = await erc20Wrapper.balanceOf(subjectTokenAddress, subjectOwnerAddress);
      expect(newTokenBalance.toString()).to.eql(expectedTokenBalance.toString());
    });
  });

  describe('transfer', () => {
    let subjectOwnerAddress: Address;
    let subjectTokenReceiver: Address;
    let subjectTokenAddress: Address;
    let subjectTransferAmount: BigNumber;

    beforeEach(async () => {
      const deployedToken = await deployer.mocks.deployTokenMock(owner);
      subjectTokenAddress = deployedToken.address;
      subjectOwnerAddress = owner;
      subjectTokenReceiver = manager;
      subjectTransferAmount = new BigNumber(1000);
    });

    async function subject(): Promise<string> {
      return await erc20Wrapper.transfer(
        subjectTokenAddress,
        subjectTokenReceiver,
        subjectTransferAmount,
        subjectOwnerAddress,
      );
    }

    it('transfers the token to the receiver', async () => {
      const existingTokenBalance = await erc20Wrapper.balanceOf(subjectTokenAddress, subjectTokenReceiver);

      await subject();

      const expectedTokenBalance = existingTokenBalance.add(subjectTransferAmount);
      const newTokenBalance = await erc20Wrapper.balanceOf(subjectTokenAddress, subjectTokenReceiver);
      expect(newTokenBalance.toString()).to.eql(expectedTokenBalance.toString());
    });
  });
});
