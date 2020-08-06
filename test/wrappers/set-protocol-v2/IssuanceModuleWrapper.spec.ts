import { ethers } from 'ethers';
import { BigNumber } from 'ethers/utils';

import { Account, Address, Wallet } from 'set-protocol-v2/utils/types';
import { Blockchain, ether } from 'set-protocol-v2/dist/utils/common';
import { ContractTransaction } from 'ethers';
import { JsonRpcProvider } from 'ethers/providers';
import DeployHelper from 'set-protocol-v2/dist/utils/deploys';
import { SystemFixture } from 'set-protocol-v2/dist/utils/fixtures';
import { StandardTokenMock } from 'set-protocol-v2/dist/typechain/StandardTokenMock';
import { SetToken } from 'set-protocol-v2/dist/typechain/SetToken';
import { Controller } from 'set-protocol-v2/dist/typechain/Controller';
import { IssuanceModule } from 'set-protocol-v2/dist/typechain/IssuanceModule';
import { IssuanceModuleWrapper } from '../../../src/wrappers/set-protocol-v2/IssuanceModuleWrapper';

const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');
import { expect } from './utils/chai';

const blockchain = new Blockchain(provider);


describe('IssuanceModuleWrapper', () => {
  let owner: Address;
  let manager: Address;
  let functionCaller: Address;

  let issuanceModule: IssuanceModule;

  let deployer: DeployHelper;
  let setup: SystemFixture;

  let issuanceModuleWrapper: IssuanceModuleWrapper;

  beforeEach(async () => {
    [
      owner,
      manager,
      functionCaller,
    ] = await provider.listAccounts();

    deployer = new DeployHelper(provider.getSigner(owner));
    setup = new SystemFixture(provider, owner);
    await setup.initialize();

    issuanceModule = await deployer.modules.deployIssuanceModule(owner);
    await setup.controller.addModule(issuanceModule.address);

    issuanceModuleWrapper = new IssuanceModuleWrapper(provider, issuanceModule.address);
  });

  beforeEach(async () => {
    await blockchain.saveSnapshotAsync();
  });

  afterEach(async () => {
    await blockchain.revertAsync();
  });

  describe('#issue', () => {
    let setToken: SetToken;

    let subjectSetTokenAddress: Address;
    let subjectIssuanceQuantity: BigNumber;
    let subjectCaller: Address;

    beforeEach(async () => {
      setToken = await setup.createSetToken(
        [setup.weth.address],
        [ether(1)],
        [issuanceModule.address]
      );

      subjectSetTokenAddress = setToken.address;
      subjectIssuanceQuantity = ether(2);
      subjectCaller = functionCaller;
    });

    async function subject(): Promise<ContractTransaction> {
      return issuanceModuleWrapper.issue(
        subjectSetTokenAddress,
        subjectIssuanceQuantity,
        subjectCaller
      );
    }

    it('should issue some SetToken for the caller', async () => {
      await subject();
    });
  });
});
