import { ethers, ContractTransaction } from 'ethers';
import { BigNumber } from 'ethers/lib/ethers';

import { Address } from '@setprotocol/set-protocol-v2/utils/types';
import { ADDRESS_ZERO, ZERO } from '@setprotocol/set-protocol-v2/dist/utils/constants';
import { Blockchain, ether, bitcoin } from '@setprotocol/set-protocol-v2/dist/utils/common';
import DeployHelper from '@setprotocol/set-protocol-v2/dist/utils/deploys';
import { SystemFixture } from '@setprotocol/set-protocol-v2/dist/utils/fixtures';
import {
  DebtIssuanceModule,
  SetToken,
} from '@setprotocol/set-protocol-v2/dist/utils/contracts';

import DebtIssuanceModuleWrapper from '@src/wrappers/set-protocol-v2/DebtIssuanceModuleWrapper';
import { expect } from '../../utils/chai';

const provider = new ethers.providers.JsonRpcProvider();
const blockchain = new Blockchain(provider);


describe('DebtIssuanceModuleWrapper', () => {
  let owner: Address;
  let recipient: Address;
  let functionCaller: Address;
  let randomAddress: Address;

  let debtIssuanceModule: DebtIssuanceModule;

  let deployer: DeployHelper;
  let setup: SystemFixture;

  let debtIssuanceModuleWrapper: DebtIssuanceModuleWrapper;

  beforeAll(async() => {
    [
      owner,
      recipient,
      functionCaller,
      randomAddress,
    ] = await provider.listAccounts();

    deployer = new DeployHelper(provider.getSigner(owner));
    setup = new SystemFixture(provider, owner);
  });

  beforeEach(async () => {
    await blockchain.saveSnapshotAsync();

    await setup.initialize();

    debtIssuanceModule = await deployer.modules.deployDebtIssuanceModule(setup.controller.address);
    await setup.controller.addModule(debtIssuanceModule.address);

    debtIssuanceModuleWrapper = new DebtIssuanceModuleWrapper(provider, debtIssuanceModule.address);
  });

  afterEach(async () => {
    await blockchain.revertAsync();
  });

  describe('#initialize', () => {
    let setToken: SetToken;

    let subjectSetTokenAddress: Address;
    let subjectMaxManagerFee: BigNumber;
    let subjectManagerIssueFee: BigNumber;
    let subjectManagerRedeemFee: BigNumber;
    let subjectFeeRecipient: Address;
    let subjectManagerIssuanceHook: Address;
    let subjectCaller: Address;
    let subjectTransactionOptions: any;

    beforeEach(async () => {
      setToken = await setup.createSetToken(
        [setup.weth.address],
        [ether(1)],
        [debtIssuanceModule.address]
      );
      subjectSetTokenAddress = setToken.address;
      subjectMaxManagerFee = ether(1);
      subjectManagerIssueFee = ether(0.1);
      subjectManagerRedeemFee = ether(0.2);
      subjectFeeRecipient = owner;
      subjectManagerIssuanceHook = randomAddress;
      subjectCaller = owner;
      subjectTransactionOptions = {};
    });

    async function subject(): Promise<any> {
      debtIssuanceModule = debtIssuanceModule.connect(provider.getSigner(subjectCaller));
      return debtIssuanceModuleWrapper.initialize(
        subjectSetTokenAddress,
        subjectMaxManagerFee,
        subjectManagerIssueFee,
        subjectManagerRedeemFee,
        subjectFeeRecipient,
        subjectManagerIssuanceHook,
        subjectCaller,
        subjectTransactionOptions,
      );
    }

    it('should enable the Module on the SetToken', async () => {
      await subject();
      const isModuleEnabled = await setToken.isInitializedModule(debtIssuanceModule.address);
      expect(isModuleEnabled).to.eq(true);
    });

    it('should properly set the manager issuance hooks', async () => {
      await subject();
      const issuanceSettings = await debtIssuanceModule.issuanceSettings(subjectSetTokenAddress);
      const managerIssuanceHook = issuanceSettings.managerIssuanceHook;
      expect(managerIssuanceHook).to.eq(subjectManagerIssuanceHook);
    });

    describe('when the caller is not the SetToken manager', () => {
      beforeEach(async () => {
        subjectCaller = randomAddress;
      });

      it('should revert', async () => {
        await expect(subject()).to.be.rejectedWith('Must be the SetToken manager');
      });
    });

    describe('when SetToken is not in pending state', () => {
      beforeEach(async () => {
        const newModule = randomAddress;
        await setup.controller.addModule(newModule);

        const debtIssuanceModuleNotPendingSetToken = await setup.createSetToken(
          [setup.weth.address],
          [ether(1)],
          [newModule]
        );

        subjectSetTokenAddress = debtIssuanceModuleNotPendingSetToken.address;
      });

      it('should revert', async () => {
        await expect(subject()).to.be.rejectedWith('Must be pending initialization');
      });
    });

    describe('when the SetToken is not enabled on the controller', () => {
      beforeEach(async () => {
        const nonEnabledSetToken = await setup.createNonControllerEnabledSetToken(
          [setup.weth.address],
          [ether(1)],
          [debtIssuanceModule.address]
        );

        subjectSetTokenAddress = nonEnabledSetToken.address;
      });

      it('should revert', async () => {
        await expect(subject()).to.be.rejectedWith('Must be controller-enabled SetToken');
      });
    });
  });

  describe('#issue', () => {
    let setToken: SetToken;

    let subjectSetTokenAddress: Address;
    let subjectMaxManagerFee: BigNumber;
    let subjectManagerIssueFee: BigNumber;
    let subjectManagerRedeemFee: BigNumber;
    let subjectFeeRecipient: Address;
    let subjectManagerIssuanceHook: Address;
    let subjectIssuanceQuantity: BigNumber;
    let subjectIssueTo: Address;
    let subjectCaller: Address;

    beforeEach(async () => {
      setToken = await setup.createSetToken(
        [setup.weth.address, setup.wbtc.address],
        [ether(1), bitcoin(2)],
        [debtIssuanceModule.address]
      );

      subjectSetTokenAddress = setToken.address;
      subjectMaxManagerFee = ether(1);
      subjectManagerIssueFee = ether(0.1);
      subjectManagerRedeemFee = ether(0.2);
      subjectFeeRecipient = owner;
      subjectManagerIssuanceHook = ADDRESS_ZERO;
      subjectIssuanceQuantity = ether(2);
      subjectIssueTo = functionCaller;
      subjectCaller = owner;

      await debtIssuanceModule.initialize(
        subjectSetTokenAddress,
        subjectMaxManagerFee,
        subjectManagerIssueFee,
        subjectManagerRedeemFee,
        subjectFeeRecipient,
        subjectManagerIssuanceHook,
      );

      // Approve tokens to the issuance module
      await setup.weth.approve(debtIssuanceModule.address, ether(5));
      await setup.wbtc.approve(debtIssuanceModule.address, bitcoin(10));
    });

    async function subject(): Promise<ContractTransaction> {
      return debtIssuanceModuleWrapper.issue(
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
    let subjectMaxManagerFee: BigNumber;
    let subjectManagerIssueFee: BigNumber;
    let subjectManagerRedeemFee: BigNumber;
    let subjectFeeRecipient: Address;
    let subjectManagerIssuanceHook: Address;
    let subjectRedeemQuantity: BigNumber;
    let subjectRedeemTo: Address;
    let subjectCaller: Address;

    beforeEach(async () => {
      setToken = await setup.createSetToken(
        [setup.weth.address, setup.wbtc.address],
        [ether(1), bitcoin(2)],
        [debtIssuanceModule.address]
      );

      subjectSetTokenAddress = setToken.address;
      subjectMaxManagerFee = ether(1);
      subjectManagerIssueFee = ether(0.1);
      subjectManagerRedeemFee = ether(0.2);
      subjectFeeRecipient = owner;
      subjectManagerIssuanceHook = ADDRESS_ZERO;
      subjectRedeemQuantity = ether(2);
      subjectRedeemTo = recipient;
      subjectCaller = functionCaller;

      await debtIssuanceModule.initialize(
        subjectSetTokenAddress,
        subjectMaxManagerFee,
        subjectManagerIssueFee,
        subjectManagerRedeemFee,
        subjectFeeRecipient,
        subjectManagerIssuanceHook,
      );

      // Approve tokens to the issuance module
      await setup.weth.approve(debtIssuanceModule.address, ether(5));
      await setup.wbtc.approve(debtIssuanceModule.address, bitcoin(10));

      issuanceQuantity = ether(2);
      await debtIssuanceModule.issue(setToken.address, issuanceQuantity, functionCaller);

      subjectSetTokenAddress = setToken.address;
      subjectRedeemQuantity = ether(2);
      subjectCaller = functionCaller;
      subjectRedeemTo = recipient;
    });

    async function subject(): Promise<ContractTransaction> {
      return debtIssuanceModuleWrapper.redeem(
        subjectSetTokenAddress,
        subjectRedeemQuantity,
        subjectRedeemTo,
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
          expect(err.body).to.include(
            'ERC20: burn amount exceeds balance'
          );
        }
      });
    });
  });
});
