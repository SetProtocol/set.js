import { ethers, ContractTransaction } from 'ethers';
import { BigNumber } from 'ethers/utils';

import { Account, Address, Wallet } from 'set-protocol-v2/utils/types';
import { ADDRESS_ZERO, ZERO } from 'set-protocol-v2/dist/utils/constants';
import { Blockchain, ether } from 'set-protocol-v2/dist/utils/common';
import DeployHelper from 'set-protocol-v2/dist/utils/deploys';
import { SystemFixture } from 'set-protocol-v2/dist/utils/fixtures';
import {
  BasicIssuanceModule,
  Controller,
  SetToken,
  StandardTokenMock,
} from 'set-protocol-v2/dist/utils/contracts';

import BasicIssuanceModuleWrapper from '@src/wrappers/set-protocol-v2/BasicIssuanceModuleWrapper';
import { expect } from '../../utils/chai';

const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');
const blockchain = new Blockchain(provider);


describe('BasicIssuanceModuleWrapper', () => {
  let owner: Address;
  let manager: Address;
  let functionCaller: Address;

  let basicIssuanceModule: BasicIssuanceModule;

  let deployer: DeployHelper;
  let setup: SystemFixture;

  let basicIssuanceModuleWrapper: BasicIssuanceModuleWrapper;

  beforeEach(async () => {
    [
      owner,
      manager,
      functionCaller,
    ] = await provider.listAccounts();

    deployer = new DeployHelper(provider.getSigner(owner));
    setup = new SystemFixture(provider, owner);
    await setup.initialize();

    basicIssuanceModule = await deployer.modules.deployBasicIssuanceModule(setup.controller.address);
    await setup.controller.addModule(basicIssuanceModule.address);

    basicIssuanceModuleWrapper = new BasicIssuanceModuleWrapper(provider, basicIssuanceModule.address);
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
    let subjectIssueTo: Address;
    let subjectCaller: Address;

    beforeEach(async () => {
      setToken = await setup.createSetToken(
        [setup.weth.address],
        [ether(1)],
        [basicIssuanceModule.address]
      );

      const preIssueHook = ADDRESS_ZERO;
      await basicIssuanceModule.initialize(setToken.address, preIssueHook);

      subjectSetTokenAddress = setToken.address;
      subjectIssuanceQuantity = ether(2);
      subjectIssueTo = functionCaller;
      subjectCaller = owner;
    });

    async function subject(): Promise<ContractTransaction> {
      return basicIssuanceModuleWrapper.issue(
        subjectSetTokenAddress,
        subjectIssuanceQuantity,
        subjectIssueTo,
        subjectCaller
      );
    }

    it('should issue the correct quantity of SetToken for the issue to address', async () => {
      const existingBalance = await setToken.balanceOf(functionCaller);
      expect(existingBalance.toString()).to.be.eq(ZERO.toString());

      await subject();

      const newBalance = await setToken.balanceOf(functionCaller);
      expect(newBalance.toString()).to.equal(subjectIssuanceQuantity.toString());
    });
  });

  describe('#redeem', () => {
    let setToken: SetToken;
    let issuanceQuantity: BigNumber;

    let subjectSetTokenAddress: Address;
    let subjectRedeemQuantity: BigNumber;
    let subjectCaller: Address;

    beforeEach(async () => {
      setToken = await setup.createSetToken(
        [setup.weth.address],
        [ether(1)],
        [basicIssuanceModule.address]
      );

      const preIssueHook = ADDRESS_ZERO;
      await basicIssuanceModule.initialize(setToken.address, preIssueHook);

      issuanceQuantity = ether(2);
      await basicIssuanceModule.issue(setToken.address, issuanceQuantity, functionCaller);

      subjectSetTokenAddress = setToken.address;
      subjectRedeemQuantity = ether(2);
      subjectCaller = functionCaller;
    });

    async function subject(): Promise<ContractTransaction> {
      return basicIssuanceModuleWrapper.redeem(
        subjectSetTokenAddress,
        subjectRedeemQuantity,
        subjectCaller
      );
    }

    it('should redeems the correct quantity of SetToken for the caller', async () => {
      const existingBalance = await setToken.balanceOf(subjectCaller);
      expect(existingBalance.toString()).to.be.eq(issuanceQuantity.toString());

      await subject();

      const newBalance = await setToken.balanceOf(subjectCaller);
      const expectedNewBalance = issuanceQuantity.sub(subjectRedeemQuantity).toString();
      expect(newBalance.toString()).to.equal(expectedNewBalance);
    });

    describe('when the redeem quantity is higher than the caller owns', () => {
      beforeEach(() => {
        subjectRedeemQuantity = ether(3);
      });

      it('should revert', async () => {
        try {
          await subject();
        } catch (err) {
          expect(err.responseText).to.include(
            'ERC20: burn amount exceeds balance'
          );
        }
      });
    });
  });
});
