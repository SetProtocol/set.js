import { ethers, ContractTransaction } from 'ethers';
import { BigNumber } from 'ethers/utils';

import { Address } from '@setprotocol/set-protocol-v2/dist/utils/types';
import { ADDRESS_ZERO, ZERO } from '@setprotocol/set-protocol-v2/dist/utils/constants';
import { Blockchain, ether, bitcoin } from '@setprotocol/set-protocol-v2/dist/utils/common';
import DeployHelper from '@setprotocol/set-protocol-v2/dist/utils/deploys';
import { SystemFixture } from '@setprotocol/set-protocol-v2/dist/utils/fixtures';
import {
  BasicIssuanceModule,
  SetToken,
} from '@setprotocol/set-protocol-v2/dist/utils/contracts';

import BasicIssuanceModuleWrapper from '@src/wrappers/set-protocol-v2/BasicIssuanceModuleWrapper';
import { expect } from '../../utils/chai';

const provider = new ethers.providers.JsonRpcProvider();
const blockchain = new Blockchain(provider);


describe('BasicIssuanceModuleWrapper', () => {
  let owner: Address;
  let recipient: Address;
  let functionCaller: Address;

  let basicIssuanceModule: BasicIssuanceModule;

  let deployer: DeployHelper;
  let setup: SystemFixture;

  let basicIssuanceModuleWrapper: BasicIssuanceModuleWrapper;

  beforeAll(async() => {
    [
      owner,
      recipient,
      functionCaller,
    ] = await provider.listAccounts();

    deployer = new DeployHelper(provider.getSigner(owner));
    setup = new SystemFixture(provider, owner);
  });

  beforeEach(async () => {
    await blockchain.saveSnapshotAsync();

    await setup.initialize();

    basicIssuanceModule = await deployer.modules.deployBasicIssuanceModule(setup.controller.address);
    await setup.controller.addModule(basicIssuanceModule.address);

    basicIssuanceModuleWrapper = new BasicIssuanceModuleWrapper(provider, basicIssuanceModule.address);
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

      // Approve tokens to the issuance module
      await setup.weth.approve(basicIssuanceModule.address, ether(5));
      await setup.wbtc.approve(basicIssuanceModule.address, bitcoin(10));

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
    let subjectTo: Address;

    beforeEach(async () => {
      setToken = await setup.createSetToken(
        [setup.weth.address, setup.wbtc.address],
        [ether(1), bitcoin(2)],
        [basicIssuanceModule.address]
      );

      const preIssueHook = ADDRESS_ZERO;
      await basicIssuanceModule.initialize(setToken.address, preIssueHook);

      // Approve tokens to the issuance module
      await setup.weth.approve(basicIssuanceModule.address, ether(5));
      await setup.wbtc.approve(basicIssuanceModule.address, bitcoin(10));

      issuanceQuantity = ether(2);
      await basicIssuanceModule.issue(setToken.address, issuanceQuantity, functionCaller);

      subjectSetTokenAddress = setToken.address;
      subjectRedeemQuantity = ether(2);
      subjectCaller = functionCaller;
      subjectTo = recipient;
    });

    async function subject(): Promise<ContractTransaction> {
      return basicIssuanceModuleWrapper.redeem(
        subjectSetTokenAddress,
        subjectRedeemQuantity,
        recipient,
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
