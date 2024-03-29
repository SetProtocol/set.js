import { ethers, ContractTransaction } from 'ethers';
import { BigNumber } from 'ethers/lib/ethers';

import { Address } from '@setprotocol/set-protocol-v2/utils/types';
import { ADDRESS_ZERO, ZERO } from '@setprotocol/set-protocol-v2/dist/utils/constants';
import {
  Blockchain,
  ether,
  bitcoin,
  preciseMul,
  preciseMulCeil,
} from '@setprotocol/set-protocol-v2/dist/utils/common';
import DeployHelper from '@setprotocol/set-protocol-v2/dist/utils/deploys';
import { SystemFixture } from '@setprotocol/set-protocol-v2/dist/utils/fixtures/systemFixture';
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

  let debtIssuanceModuleWrapper: DebtIssuanceModuleWrapper;
  let debtIssuanceModule: DebtIssuanceModule;

  let deployer: DeployHelper;
  let setup: SystemFixture;

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
      subjectMaxManagerFee = ether(0.02);
      subjectManagerIssueFee = ether(0.005);
      subjectManagerRedeemFee = ether(0.004);
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

    it('should enable the module on the SetToken', async () => {
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

    describe('when the issue fee is greater than the maximum fee', () => {
      beforeEach(async () => {
        subjectManagerIssueFee = ether(0.03);
      });

      it('should revert', async () => {
        await expect(subject()).to.be.rejectedWith('Issue fee can\'t exceed maximum fee');
      });
    });

    describe('when the redeem fee is greater than the maximum fee', () => {
      beforeEach(async () => {
        subjectManagerRedeemFee = ether(0.03);
      });

      it('should revert', async () => {
        await expect(subject()).to.be.rejectedWith('Redeem fee can\'t exceed maximum fee');
      });
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
      subjectMaxManagerFee = ether(0.02);
      subjectManagerIssueFee = ether(0.005);
      subjectManagerRedeemFee = ether(0.004);
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
      issuanceQuantity = ether(2);

      subjectSetTokenAddress = setToken.address;
      subjectMaxManagerFee = ether(0.02);
      subjectManagerIssueFee = ether(0.005);
      subjectManagerRedeemFee = ether(0.004);
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

      await debtIssuanceModule.issue(setToken.address, issuanceQuantity, functionCaller);
    });

    async function subject(): Promise<ContractTransaction> {
      return debtIssuanceModuleWrapper.redeem(
        subjectSetTokenAddress,
        subjectRedeemQuantity,
        subjectRedeemTo,
        subjectCaller
      );
    }

    it('should redeem the correct quantity of SetTokens for the caller', async () => {
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

  describe('#getRequiredComponentIssuanceUnits', () => {
    let setToken: SetToken;

    let subjectSetTokenAddress: Address;
    let subjectMaxManagerFee: BigNumber;
    let subjectManagerIssueFee: BigNumber;
    let subjectManagerRedeemFee: BigNumber;
    let subjectFeeRecipient: Address;
    let subjectManagerIssuanceHook: Address;
    let subjectIssuanceQuantity: BigNumber;
    let subjectCaller: Address;

    beforeEach(async () => {
      setToken = await setup.createSetToken(
        [setup.weth.address, setup.wbtc.address],
        [ether(1), bitcoin(2)],
        [debtIssuanceModule.address]
      );

      subjectSetTokenAddress = setToken.address;
      subjectMaxManagerFee = ether(1);
      subjectManagerIssueFee = ether(0);
      subjectManagerRedeemFee = ether(0);
      subjectFeeRecipient = owner;
      subjectManagerIssuanceHook = ADDRESS_ZERO;
      subjectIssuanceQuantity = ether(2);
      subjectCaller = functionCaller;
    });

    async function subject(): Promise<(Address|BigNumber)[][]> {
      await debtIssuanceModule.initialize(
        subjectSetTokenAddress,
        subjectMaxManagerFee,
        subjectManagerIssueFee,
        subjectManagerRedeemFee,
        subjectFeeRecipient,
        subjectManagerIssuanceHook,
      );

      return debtIssuanceModuleWrapper.getRequiredComponentIssuanceUnits(
        subjectSetTokenAddress,
        subjectIssuanceQuantity,
        subjectCaller
      );
    }

    it('should return the correct required quantity of component tokens for issuing', async () => {
      const [components, equityFlows, debtFlows] = await subject();
      const wethFlows = preciseMul(subjectIssuanceQuantity, ether(1));
      const wbtcFlows = preciseMulCeil(subjectIssuanceQuantity, bitcoin(2));

      const expectedComponents = await setToken.getComponents();
      const expectedEquityFlows = [wethFlows, wbtcFlows];
      const expectedDebtFlows = [ZERO, ZERO];

      expect(JSON.stringify(expectedComponents)).to.eq(JSON.stringify(components));
      expect(JSON.stringify(expectedEquityFlows)).to.eq(JSON.stringify(equityFlows));
      expect(JSON.stringify(expectedDebtFlows)).to.eq(JSON.stringify(debtFlows));
    });

    describe('when there\'s an issuance fee', () => {
      beforeEach(() => {
        subjectManagerIssueFee = ether(0.01);
      });

      it('should return required amount with fee', async () => {
        const [components, equityFlows, debtFlows] = await subject();
        const mintQuantity = preciseMul(subjectIssuanceQuantity, ether(1).add(subjectManagerIssueFee));
        const wethFlows = preciseMul(mintQuantity, ether(1));
        const wbtcFlows = preciseMulCeil(mintQuantity, bitcoin(2));

        const expectedComponents = await setToken.getComponents();
        const expectedEquityFlows = [wethFlows, wbtcFlows];
        const expectedDebtFlows = [ZERO, ZERO];

        expect(JSON.stringify(expectedComponents)).to.eq(JSON.stringify(components));
        expect(JSON.stringify(expectedEquityFlows)).to.eq(JSON.stringify(equityFlows));
        expect(JSON.stringify(expectedDebtFlows)).to.eq(JSON.stringify(debtFlows));
      });
    });
  });

  describe('#getRequiredComponentRedemptionUnits', () => {
    let setToken: SetToken;

    let subjectSetTokenAddress: Address;
    let subjectMaxManagerFee: BigNumber;
    let subjectManagerIssueFee: BigNumber;
    let subjectManagerRedeemFee: BigNumber;
    let subjectFeeRecipient: Address;
    let subjectManagerIssuanceHook: Address;
    let subjectRedemptionQuantity: BigNumber;
    let subjectCaller: Address;

    beforeEach(async () => {
      setToken = await setup.createSetToken(
        [setup.weth.address, setup.wbtc.address],
        [ether(1), bitcoin(2)],
        [debtIssuanceModule.address]
      );

      subjectSetTokenAddress = setToken.address;
      subjectMaxManagerFee = ether(1);
      subjectManagerIssueFee = ether(0);
      subjectManagerRedeemFee = ether(0);
      subjectFeeRecipient = owner;
      subjectManagerIssuanceHook = ADDRESS_ZERO;
      subjectRedemptionQuantity = ether(2);
      subjectCaller = functionCaller;
    });

    async function subject(): Promise<(Address|BigNumber)[][]> {
      await debtIssuanceModule.initialize(
        subjectSetTokenAddress,
        subjectMaxManagerFee,
        subjectManagerIssueFee,
        subjectManagerRedeemFee,
        subjectFeeRecipient,
        subjectManagerIssuanceHook,
      );

      return debtIssuanceModuleWrapper.getRequiredComponentRedemptionUnits(
        subjectSetTokenAddress,
        subjectRedemptionQuantity,
        subjectCaller
      );
    }

    it('should return the correct required quantity of component tokens for redeeming', async () => {
      const [components, equityFlows, debtFlows] = await subject();
      const wethFlows = preciseMul(subjectRedemptionQuantity, ether(1));
      const wbtcFlows = preciseMulCeil(subjectRedemptionQuantity, bitcoin(2));

      const expectedComponents = await setToken.getComponents();
      const expectedEquityFlows = [wethFlows, wbtcFlows];
      const expectedDebtFlows = [ZERO, ZERO];

      expect(JSON.stringify(expectedComponents)).to.eq(JSON.stringify(components));
      expect(JSON.stringify(expectedEquityFlows)).to.eq(JSON.stringify(equityFlows));
      expect(JSON.stringify(expectedDebtFlows)).to.eq(JSON.stringify(debtFlows));
    });

    describe('when there\'s a redemption fee', () => {
      beforeEach(() => {
        subjectManagerRedeemFee = ether(0.01);
      });

      it('should return required amount with fee', async () => {
        const [components, equityFlows, debtFlows] = await subject();
        const mintQuantity = preciseMul(subjectRedemptionQuantity, ether(1).sub(subjectManagerRedeemFee));
        const wethFlows = preciseMul(mintQuantity, ether(1));
        const wbtcFlows = preciseMulCeil(mintQuantity, bitcoin(2));

        const expectedComponents = await setToken.getComponents();
        const expectedEquityFlows = [wethFlows, wbtcFlows];
        const expectedDebtFlows = [ZERO, ZERO];

        expect(JSON.stringify(expectedComponents)).to.eq(JSON.stringify(components));
        expect(JSON.stringify(expectedEquityFlows)).to.eq(JSON.stringify(equityFlows));
        expect(JSON.stringify(expectedDebtFlows)).to.eq(JSON.stringify(debtFlows));
      });
    });
  });

  describe('#calculateTotalFees', () => {
    let setToken: SetToken;

    let subjectSetTokenAddress: Address;
    let subjectMaxManagerFee: BigNumber;
    let subjectManagerIssueFee: BigNumber;
    let subjectManagerRedeemFee: BigNumber;
    let subjectFeeRecipient: Address;
    let subjectManagerIssuanceHook: Address;
    let subjectQuantity: BigNumber;
    let subjectIsIssue: boolean;
    let subjectCaller: Address;

    beforeEach(async () => {
      setToken = await setup.createSetToken(
        [setup.weth.address, setup.wbtc.address],
        [ether(1), bitcoin(2)],
        [debtIssuanceModule.address]
      );

      subjectSetTokenAddress = setToken.address;
      subjectMaxManagerFee = ether(1);
      subjectManagerIssueFee = ether(0);
      subjectManagerRedeemFee = ether(0);
      subjectFeeRecipient = owner;
      subjectManagerIssuanceHook = ADDRESS_ZERO;
      subjectQuantity = ether(2);
      subjectCaller = functionCaller;
    });

    async function subject(): Promise<
      [BigNumber, BigNumber, BigNumber] & {
        totalQuantity: BigNumber;
        managerFee: BigNumber;
        protocolFee: BigNumber;
      }
    > {
      await debtIssuanceModule.initialize(
        subjectSetTokenAddress,
        subjectMaxManagerFee,
        subjectManagerIssueFee,
        subjectManagerRedeemFee,
        subjectFeeRecipient,
        subjectManagerIssuanceHook,
      );

      return debtIssuanceModuleWrapper.calculateTotalFees(
        subjectSetTokenAddress,
        subjectQuantity,
        subjectIsIssue,
        subjectCaller
      );
    }
    describe('when calculateTotalFees is used for issuance with no issue fee', () => {
      beforeEach(() => {
        subjectIsIssue = true;
      });

      it('should return no issue fee value', async () => {
        const [issuedSetsAmount, managerFeeAmount, protocolFeeAmount] = await subject();
        const expectedIssuedSetsAmount = subjectQuantity;
        const expectedManagerFeeAmount = ether(0);
        const expectedProtocolFeeAmount = ether(0);

        expect(JSON.stringify(issuedSetsAmount)).to.eq(JSON.stringify(expectedIssuedSetsAmount));
        expect(JSON.stringify(managerFeeAmount)).to.eq(JSON.stringify(expectedManagerFeeAmount));
        expect(JSON.stringify(protocolFeeAmount)).to.eq(JSON.stringify(expectedProtocolFeeAmount));
      });
    });

    describe('when there\'s an issue fee', () => {
      beforeEach(() => {
        subjectIsIssue = true;
        subjectManagerIssueFee = ether(0.01);
      });

      it('should return required amount with issue fee', async () => {
        const [issuedSetsAmount, managerFeeAmount, protocolFeeAmount] = await subject();
        const expectedIssuedSetsAmount = preciseMul(subjectQuantity, ether(1).add(subjectManagerIssueFee));
        const expectedManagerFeeAmount = preciseMul(subjectQuantity, subjectManagerIssueFee);
        const expectedProtocolFeeAmount = ether(0);

        expect(JSON.stringify(issuedSetsAmount)).to.eq(JSON.stringify(expectedIssuedSetsAmount));
        expect(JSON.stringify(managerFeeAmount)).to.eq(JSON.stringify(expectedManagerFeeAmount));
        expect(JSON.stringify(protocolFeeAmount)).to.eq(JSON.stringify(expectedProtocolFeeAmount));
      });
    });

    describe('when calculateTotalFees is used for redemption with no redeem fee', () => {
      beforeEach(() => {
        subjectIsIssue = false;
      });

      it('should return no redeem fee value', async () => {
        const [issuedSetsAmount, managerFeeAmount, protocolFeeAmount] = await subject();
        const expectedIssuedSetsAmount = subjectQuantity;
        const expectedManagerFeeAmount = ether(0);
        const expectedProtocolFeeAmount = ether(0);

        expect(JSON.stringify(issuedSetsAmount)).to.eq(JSON.stringify(expectedIssuedSetsAmount));
        expect(JSON.stringify(managerFeeAmount)).to.eq(JSON.stringify(expectedManagerFeeAmount));
        expect(JSON.stringify(protocolFeeAmount)).to.eq(JSON.stringify(expectedProtocolFeeAmount));
      });
    });

    describe('when there\'s a redeem fee', () => {
      beforeEach(() => {
        subjectIsIssue = false;
        subjectManagerRedeemFee = ether(0.01);
      });

      it('should return required amount with redeem fee', async () => {
        const [issuedSetsAmount, managerFeeAmount, protocolFeeAmount] = await subject();
        const expectedIssuedSetsAmount = preciseMul(subjectQuantity, ether(1).sub(subjectManagerRedeemFee));
        const expectedManagerFeeAmount = preciseMul(subjectQuantity, subjectManagerRedeemFee);
        const expectedProtocolFeeAmount = ether(0);

        expect(JSON.stringify(issuedSetsAmount)).to.eq(JSON.stringify(expectedIssuedSetsAmount));
        expect(JSON.stringify(managerFeeAmount)).to.eq(JSON.stringify(expectedManagerFeeAmount));
        expect(JSON.stringify(protocolFeeAmount)).to.eq(JSON.stringify(expectedProtocolFeeAmount));
      });
    });
  });
});
