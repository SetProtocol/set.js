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
  SlippageIssuanceModule,
  DebtModuleMock,
  ModuleIssuanceHookMock,
  SetToken,
} from '@setprotocol/set-protocol-v2/dist/utils/contracts';

import SlippageIssuanceModuleWrapper from '@src/wrappers/set-protocol-v2/SlippageIssuanceModuleWrapper';
import { expect } from '../../utils/chai';

const provider = new ethers.providers.JsonRpcProvider();
const blockchain = new Blockchain(provider);

describe('SlippageIssuanceModuleWrapper', () => {
  let owner: Address;
  let manager: Address;
  let feeRecipient: Address;
  let randomAddress: Address;
  let recipient: Address;

  let slippageIssuanceModuleWrapper: SlippageIssuanceModuleWrapper;
  let slippageIssuanceModule: SlippageIssuanceModule;
  let debtModule: DebtModuleMock;
  let externalPositionModule: ModuleIssuanceHookMock;

  let maxFee: BigNumber;
  let issueFee: BigNumber;
  let redeemFee: BigNumber;

  let deployer: DeployHelper;
  let setup: SystemFixture;

  beforeAll(async() => {
    [
      owner,
      manager,
      feeRecipient,
      randomAddress,
      recipient,
    ] = await provider.listAccounts();

    deployer = new DeployHelper(provider.getSigner(owner));
    setup = new SystemFixture(provider, owner);

    maxFee = ether(0.02);
    issueFee = ether(0.005);
    redeemFee = ether(0.005);
  });

  beforeEach(async () => {
    await blockchain.saveSnapshotAsync();

    await setup.initialize();

    slippageIssuanceModule = await deployer.modules.deploySlippageIssuanceModule(setup.controller.address);
    debtModule = await deployer.mocks.deployDebtModuleMock(setup.controller.address, slippageIssuanceModule.address);
    externalPositionModule = await deployer.mocks.deployModuleIssuanceHookMock();

    await setup.controller.addModule(slippageIssuanceModule.address);
    await setup.controller.addModule(debtModule.address);
    await setup.controller.addModule(externalPositionModule.address);

    slippageIssuanceModuleWrapper = new SlippageIssuanceModuleWrapper(provider, slippageIssuanceModule.address);
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
        [slippageIssuanceModule.address]
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
      slippageIssuanceModule = slippageIssuanceModule.connect(provider.getSigner(subjectCaller));
      return slippageIssuanceModuleWrapper.initialize(
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
      const isModuleEnabled = await setToken.isInitializedModule(slippageIssuanceModule.address);
      expect(isModuleEnabled).to.eq(true);
    });

    it('should properly set the manager issuance hooks', async () => {
      await subject();
      const issuanceSettings = await slippageIssuanceModule.issuanceSettings(subjectSetTokenAddress);
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

        const slippageIssuanceModuleNotPendingSetToken = await setup.createSetToken(
          [setup.weth.address],
          [ether(1)],
          [newModule]
        );

        subjectSetTokenAddress = slippageIssuanceModuleNotPendingSetToken.address;
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
          [slippageIssuanceModule.address]
        );

        subjectSetTokenAddress = nonEnabledSetToken.address;
      });

      it('should revert', async () => {
        await expect(subject()).to.be.rejectedWith('Must be controller-enabled SetToken');
      });
    });
  });

  describe('#issueWithSlippage', () => {
    let setToken: SetToken;

    let subjectSetToken: Address;
    let subjectQuantity: BigNumber;
    let subjectCheckedComponents: Address[];
    let subjectMaxTokenAmountsIn: BigNumber[];
    let subjectManagerIssuanceHook: Address;
    let subjectTo: Address;
    let subjectCaller: Address;

    const debtUnits: BigNumber = ether(100);

    beforeEach(async () => {
      setToken = await setup.createSetToken(
        [setup.weth.address],
        [ether(1)],
        [setup.issuanceModule.address, slippageIssuanceModule.address, debtModule.address,
          externalPositionModule.address],
        manager,
        'DebtToken',
        'DBT'
      );

      await externalPositionModule.initialize(setToken.address);

      subjectManagerIssuanceHook = ADDRESS_ZERO;
      subjectSetToken = setToken.address;
      subjectQuantity = ether(1);
      subjectCheckedComponents = [];
      subjectMaxTokenAmountsIn = [];
      subjectTo = recipient;
      subjectCaller = owner;

      await slippageIssuanceModule.connect(provider.getSigner(manager)).initialize(
        subjectSetToken,
        maxFee,
        issueFee,
        redeemFee,
        feeRecipient,
        subjectManagerIssuanceHook,
      );

      await debtModule.connect(provider.getSigner(manager)).initialize(setToken.address);

      await debtModule.addDebt(setToken.address, setup.dai.address, debtUnits);
      await setup.dai.transfer(debtModule.address, ether(100.5));

      const [, equityFlows ] = await slippageIssuanceModule.getRequiredComponentIssuanceUnits(
        setToken.address, ether(1));
      await setup.weth.approve(slippageIssuanceModule.address, equityFlows[0].mul(ether(1.005)));
    });

    async function subject(): Promise<ContractTransaction> {
      return slippageIssuanceModuleWrapper.issueWithSlippage(
        subjectSetToken,
        subjectQuantity,
        subjectCheckedComponents,
        subjectMaxTokenAmountsIn,
        subjectTo,
        subjectCaller
      );
    }

    it('should mint SetTokens to the correct addresses', async () => {
      const existingBalance = await setToken.balanceOf(recipient);
      expect(existingBalance.toString()).to.be.eq(ZERO.toString());

      await subject();

      const feeQuantity = preciseMulCeil(subjectQuantity, issueFee);
      const managerBalance = await setToken.balanceOf(feeRecipient);
      const toBalance = await setToken.balanceOf(subjectTo);

      expect(toBalance.toString()).to.be.eq(subjectQuantity.toString());
      expect(managerBalance.toString()).to.be.eq(feeQuantity.toString());
    });
  });

  describe('#redeemWithSlippage', () => {
    let setToken: SetToken;

    let subjectSetToken: Address;
    let subjectQuantity: BigNumber;
    let subjectCheckedComponents: Address[];
    let subjectMinTokenAmountsOut: BigNumber[];
    let subjectManagerIssuanceHook: Address;
    let subjectTo: Address;
    let subjectCaller: Address;

    const debtUnits: BigNumber = ether(100);

    beforeEach(async () => {
      setToken = await setup.createSetToken(
        [setup.weth.address],
        [ether(1)],
        [setup.issuanceModule.address, slippageIssuanceModule.address, debtModule.address,
          externalPositionModule.address],
        manager,
        'DebtToken',
        'DBT'
      );

      await externalPositionModule.initialize(setToken.address);

      subjectManagerIssuanceHook = ADDRESS_ZERO;
      subjectSetToken = setToken.address;
      subjectQuantity = ether(1);
      subjectCheckedComponents = [];
      subjectMinTokenAmountsOut = [];
      subjectTo = recipient;
      subjectCaller = owner;

      await slippageIssuanceModule.connect(provider.getSigner(manager)).initialize(
        subjectSetToken,
        maxFee,
        issueFee,
        redeemFee,
        feeRecipient,
        subjectManagerIssuanceHook,
      );

      await debtModule.connect(provider.getSigner(manager)).initialize(setToken.address);

      await debtModule.addDebt(setToken.address, setup.dai.address, debtUnits);
      await setup.dai.transfer(debtModule.address, ether(100.5));

      const [, equityFlows ] = await slippageIssuanceModule.getRequiredComponentRedemptionUnits(
        setToken.address, ether(1));
      await setup.weth.approve(slippageIssuanceModule.address, equityFlows[0].mul(ether(1.005)));

      await slippageIssuanceModule.issue(setToken.address, ether(1), owner);

      await setup.dai.approve(slippageIssuanceModule.address, ether(100.5));
    });

    async function subject(): Promise<ContractTransaction> {
      return slippageIssuanceModuleWrapper.redeemWithSlippage(
        subjectSetToken,
        subjectQuantity,
        subjectCheckedComponents,
        subjectMinTokenAmountsOut,
        subjectTo,
        subjectCaller
      );
    }

    it('should redeem SetTokens to the correct addresses', async () => {
      const preManagerBalance = await setToken.balanceOf(feeRecipient);
      const preCallerBalance = await setToken.balanceOf(subjectCaller);

      await subject();

      const feeQuantity = preciseMulCeil(subjectQuantity, redeemFee);
      const postManagerBalance = await setToken.balanceOf(feeRecipient);
      const postCallerBalance = await setToken.balanceOf(subjectCaller);

      expect(postManagerBalance.toString()).to.be.eq(preManagerBalance.add(feeQuantity).toString());
      expect(postCallerBalance.toString()).to.eq(preCallerBalance.sub(subjectQuantity).toString());
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
        [slippageIssuanceModule.address]
      );

      subjectSetTokenAddress = setToken.address;
      subjectMaxManagerFee = ether(1);
      subjectManagerIssueFee = ether(0);
      subjectManagerRedeemFee = ether(0);
      subjectFeeRecipient = owner;
      subjectManagerIssuanceHook = ADDRESS_ZERO;
      subjectIssuanceQuantity = ether(2);
      subjectCaller = manager;
    });

    async function subject(): Promise<(Address|BigNumber)[][]> {
      await slippageIssuanceModule.initialize(
        subjectSetTokenAddress,
        subjectMaxManagerFee,
        subjectManagerIssueFee,
        subjectManagerRedeemFee,
        subjectFeeRecipient,
        subjectManagerIssuanceHook,
      );

      return slippageIssuanceModuleWrapper.getRequiredComponentIssuanceUnits(
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
        [slippageIssuanceModule.address]
      );

      subjectSetTokenAddress = setToken.address;
      subjectMaxManagerFee = ether(1);
      subjectManagerIssueFee = ether(0);
      subjectManagerRedeemFee = ether(0);
      subjectFeeRecipient = owner;
      subjectManagerIssuanceHook = ADDRESS_ZERO;
      subjectRedemptionQuantity = ether(2);
      subjectCaller = manager;
    });

    async function subject(): Promise<(Address|BigNumber)[][]> {
      await slippageIssuanceModule.initialize(
        subjectSetTokenAddress,
        subjectMaxManagerFee,
        subjectManagerIssueFee,
        subjectManagerRedeemFee,
        subjectFeeRecipient,
        subjectManagerIssuanceHook,
      );

      return slippageIssuanceModuleWrapper.getRequiredComponentRedemptionUnits(
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
        [slippageIssuanceModule.address]
      );

      subjectSetTokenAddress = setToken.address;
      subjectMaxManagerFee = ether(1);
      subjectManagerIssueFee = ether(0);
      subjectManagerRedeemFee = ether(0);
      subjectFeeRecipient = owner;
      subjectManagerIssuanceHook = ADDRESS_ZERO;
      subjectQuantity = ether(2);
      subjectCaller = manager;
    });

    async function subject(): Promise<
      [BigNumber, BigNumber, BigNumber] & {
        totalQuantity: BigNumber;
        managerFee: BigNumber;
        protocolFee: BigNumber;
      }
    > {
      await slippageIssuanceModule.initialize(
        subjectSetTokenAddress,
        subjectMaxManagerFee,
        subjectManagerIssueFee,
        subjectManagerRedeemFee,
        subjectFeeRecipient,
        subjectManagerIssuanceHook,
      );

      return slippageIssuanceModuleWrapper.calculateTotalFees(
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
