import { ethers, ContractTransaction } from 'ethers';
import { BigNumber } from 'ethers/utils';

import { Address, NAVIssuanceSettings } from '@setprotocol/set-protocol-v2/utils/types';
import { ONE, TWO, THREE, ZERO, ADDRESS_ZERO } from '@setprotocol/set-protocol-v2/dist/utils/constants';
import {
  Blockchain,
  ether,
  usdc,
  bitcoin,
  preciseMul,
  getExpectedIssuePositionMultiplier,
  getExpectedIssuePositionUnit,
  getExpectedPostFeeQuantity,
  getExpectedSetTokenIssueQuantity,
  getExpectedReserveRedeemQuantity,
  getExpectedRedeemPositionMultiplier,
  getExpectedRedeemPositionUnit
} from '@setprotocol/set-protocol-v2/dist/utils/common';
import DeployHelper from '@setprotocol/set-protocol-v2/dist/utils/deploys';
import { SystemFixture } from '@setprotocol/set-protocol-v2/dist/utils/fixtures';
import { Erc20Factory } from '@setprotocol/set-protocol-v2/dist/typechain/Erc20Factory';
import {
  NAVIssuanceModule,
  ManagerIssuanceHookMock,
  SetToken,
} from '@setprotocol/set-protocol-v2/dist/utils/contracts';

import NAVIssuanceModuleWrapper from '@src/wrappers/set-protocol-v2/NavIssuanceModuleWrapper';
import { expect } from '../../utils/chai';

const provider = new ethers.providers.JsonRpcProvider();
const blockchain = new Blockchain(provider);

async function reconcileBalances(setToken: SetToken, subject: any, signer: Address): Promise<void> {
  await subject();

  const currentSetTokenSupply = await setToken.totalSupply();
  const components = await setToken.getComponents();
  for (let i = 0; i < components.length; i++) {
    const component = Erc20Factory.connect(components[i], provider.getSigner(signer));
    const defaultPositionUnit = await setToken.getDefaultPositionRealUnit(component.address);

    const expectedBalance = preciseMul(defaultPositionUnit, currentSetTokenSupply);
    const actualBalance = await component.balanceOf(setToken.address);

    expect(actualBalance.gte(expectedBalance)).to.eq(true);
  }
}

describe('NAVIssuanceModuleWrapper', () => {
  let owner: Address;
  let feeRecipient: Address;
  let recipient: Address;
  let randomAddress: Address;
  let randomAddress2: Address;
  let randomAddress3: Address;
  let deployer: DeployHelper;

  let setup: SystemFixture;
  let navIssuanceModule: NAVIssuanceModule;

  let navIssuanceModuleWrapper: NAVIssuanceModuleWrapper;

  beforeAll(async () => {
    [
      owner,
      feeRecipient,
      recipient,
      randomAddress,
      randomAddress2,
      randomAddress3,
    ] = await provider.listAccounts();

    deployer = new DeployHelper(provider.getSigner(owner));
    setup = new SystemFixture(provider, owner);
  });

  beforeEach(async () => {
    await blockchain.saveSnapshotAsync();

    await setup.initialize();

    navIssuanceModule = await deployer.modules.deployNavIssuanceModule(setup.controller.address, setup.weth.address);
    await setup.controller.addModule(navIssuanceModule.address);
    navIssuanceModuleWrapper = new NAVIssuanceModuleWrapper(provider, navIssuanceModule.address);
  });

  afterEach(async () => {
    await blockchain.revertAsync();
  });

  describe('#getReserveAssets', () => {
    let reserveAssets: Address[];
    let subjectSetToken: Address;

    beforeEach(async () => {
      const setToken = await setup.createSetToken(
        [setup.weth.address],
        [ether(1)],
        [navIssuanceModule.address]
      );
      const managerIssuanceHook = randomAddress;
      const managerRedemptionHook = randomAddress2;
      reserveAssets = [setup.usdc.address, setup.weth.address];
      const managerFeeRecipient = feeRecipient;
      // Set manager issue fee to 0.1% and redeem to 0.2%
      const managerFees = [ether(0.001), ether(0.002)];
      // Set max managerFee to 2%
      const maxManagerFee = ether(0.02);
      // Set premium to 1%
      const premiumPercentage = ether(0.01);
      // Set max premium to 10%
      const maxPremiumPercentage = ether(0.1);
      // Set min SetToken supply to 100 units
      const minSetTokenSupply = ether(100);

      const navIssuanceSettings = {
        managerIssuanceHook,
        managerRedemptionHook,
        reserveAssets,
        feeRecipient: managerFeeRecipient,
        managerFees,
        maxManagerFee,
        premiumPercentage,
        maxPremiumPercentage,
        minSetTokenSupply,
      } as NAVIssuanceSettings;

      await navIssuanceModule.initialize(
        setToken.address,
        navIssuanceSettings
      );

      subjectSetToken = setToken.address;
    });

    async function subject(): Promise<Address[]> {
      return navIssuanceModuleWrapper.getReserveAssets(subjectSetToken);
    }

    it('should return the valid reserve assets', async () => {
      const returnedReserveAssets = await subject();

      expect(JSON.stringify(returnedReserveAssets)).to.eq(JSON.stringify(reserveAssets));
    });
  });

  describe('#isValidReserveAsset', () => {
    let reserveAssets: Address[];
    let subjectSetToken: Address;
    let subjectReserveAsset: Address;

    beforeEach(async () => {
      const setToken = await setup.createSetToken(
        [setup.weth.address],
        [ether(1)],
        [navIssuanceModule.address]
      );
      const managerIssuanceHook = randomAddress;
      const managerRedemptionHook = randomAddress2;
      reserveAssets = [setup.usdc.address, setup.weth.address];
      const managerFeeRecipient = feeRecipient;
      // Set manager issue fee to 0.1% and redeem to 0.2%
      const managerFees = [ether(0.001), ether(0.002)];
      // Set max managerFee to 2%
      const maxManagerFee = ether(0.02);
      // Set premium to 1%
      const premiumPercentage = ether(0.01);
      // Set max premium to 10%
      const maxPremiumPercentage = ether(0.1);
      // Set min SetToken supply to 100 units
      const minSetTokenSupply = ether(100);

      const navIssuanceSettings = {
        managerIssuanceHook,
        managerRedemptionHook,
        reserveAssets,
        feeRecipient: managerFeeRecipient,
        managerFees,
        maxManagerFee,
        premiumPercentage,
        maxPremiumPercentage,
        minSetTokenSupply,
      } as NAVIssuanceSettings;

      await navIssuanceModule.initialize(
        setToken.address,
        navIssuanceSettings
      );

      subjectSetToken = setToken.address;
      subjectReserveAsset = reserveAssets[0];
    });

    async function subject(): Promise<boolean> {
      return navIssuanceModuleWrapper.isValidReserveAsset(subjectSetToken, subjectReserveAsset);
    }

    it('should return if reserve asset is valid', async () => {
      const isValid = await subject();

      expect(isValid).to.eq(true);
    });
  });

  describe('#getIssuePremium', () => {
    let premiumPercentage: BigNumber;
    let subjectSetToken: Address;
    let subjectReserveAsset: Address;
    let subjectReserveQuantity: BigNumber;

    beforeEach(async () => {
      const setToken = await setup.createSetToken(
        [setup.weth.address],
        [ether(1)],
        [navIssuanceModule.address]
      );
      const managerIssuanceHook = randomAddress;
      const managerRedemptionHook = randomAddress2;
      const reserveAssets = [setup.usdc.address, setup.weth.address];
      const managerFeeRecipient = feeRecipient;
      // Set manager issue fee to 0.1% and redeem to 0.2%
      const managerFees = [ether(0.001), ether(0.002)];
      // Set max managerFee to 2%
      const maxManagerFee = ether(0.02);
      // Set premium to 1%
      premiumPercentage = ether(0.01);
      // Set max premium to 10%
      const maxPremiumPercentage = ether(0.1);
      // Set min SetToken supply to 100 units
      const minSetTokenSupply = ether(100);

      const navIssuanceSettings = {
        managerIssuanceHook,
        managerRedemptionHook,
        reserveAssets,
        feeRecipient: managerFeeRecipient,
        managerFees,
        maxManagerFee,
        premiumPercentage,
        maxPremiumPercentage,
        minSetTokenSupply,
      } as NAVIssuanceSettings;

      await navIssuanceModule.initialize(
        setToken.address,
        navIssuanceSettings
      );

      subjectSetToken = setToken.address;
      subjectReserveAsset = randomAddress3; // Unused in NavIssuanceModule V1
      subjectReserveQuantity = ether(1); // Unused in NAVIssuanceModule V1
    });

    async function subject(): Promise<BigNumber> {
      return navIssuanceModuleWrapper.getIssuePremium(subjectSetToken, subjectReserveAsset, subjectReserveQuantity);
    }

    it('should return the correct premium', async () => {
      const returnedPremiumPercentage = await subject();

      expect(returnedPremiumPercentage.toString()).to.eq(premiumPercentage.toString());
    });
  });

  describe('#getRedeemPremium', () => {
    let premiumPercentage: BigNumber;
    let subjectSetToken: Address;
    let subjectReserveAsset: Address;
    let subjectSetTokenQuantity: BigNumber;

    beforeEach(async () => {
      const setToken = await setup.createSetToken(
        [setup.weth.address],
        [ether(1)],
        [navIssuanceModule.address]
      );
      const managerIssuanceHook = randomAddress;
      const managerRedemptionHook = randomAddress2;
      const reserveAssets = [setup.usdc.address, setup.weth.address];
      const managerFeeRecipient = feeRecipient;
      // Set manager issue fee to 0.1% and redeem to 0.2%
      const managerFees = [ether(0.001), ether(0.002)];
      // Set max managerFee to 2%
      const maxManagerFee = ether(0.02);
      // Set premium to 1%
      premiumPercentage = ether(0.01);
      // Set max premium to 10%
      const maxPremiumPercentage = ether(0.1);
      // Set min SetToken supply to 100 units
      const minSetTokenSupply = ether(100);

      const navIssuanceSettings = {
        managerIssuanceHook,
        managerRedemptionHook,
        reserveAssets,
        feeRecipient: managerFeeRecipient,
        managerFees,
        maxManagerFee,
        premiumPercentage,
        maxPremiumPercentage,
        minSetTokenSupply,
      } as NAVIssuanceSettings;

      await navIssuanceModule.initialize(
        setToken.address,
        navIssuanceSettings
      );

      subjectSetToken = setToken.address;
      subjectReserveAsset = randomAddress3; // Unused in NavIssuanceModule V1
      subjectSetTokenQuantity = ether(1); // Unused in NAVIssuanceModule V1
    });

    async function subject(): Promise<BigNumber> {
      return navIssuanceModuleWrapper.getRedeemPremium(subjectSetToken, subjectReserveAsset, subjectSetTokenQuantity);
    }

    it('should return the correct premium', async () => {
      const returnedPremiumPercentage = await subject();

      expect(returnedPremiumPercentage.toString()).to.eq(premiumPercentage.toString());
    });
  });

  describe('#getManagerFee', () => {
    let managerFees: BigNumber[];
    let subjectSetToken: Address;
    let subjectFeeIndex: BigNumber;

    beforeEach(async () => {
      const setToken = await setup.createSetToken(
        [setup.weth.address],
        [ether(1)],
        [navIssuanceModule.address]
      );
      const managerIssuanceHook = randomAddress;
      const managerRedemptionHook = randomAddress2;
      const reserveAssets = [setup.usdc.address, setup.weth.address];
      const managerFeeRecipient = feeRecipient;
      // Set manager issue fee to 0.1% and redeem to 0.2%
      managerFees = [ether(0.001), ether(0.002)];
      // Set max managerFee to 2%
      const maxManagerFee = ether(0.02);
      // Set premium to 1%
      const premiumPercentage = ether(0.01);
      // Set max premium to 10%
      const maxPremiumPercentage = ether(0.1);
      // Set min SetToken supply to 100 units
      const minSetTokenSupply = ether(100);

      const navIssuanceSettings = {
        managerIssuanceHook,
        managerRedemptionHook,
        reserveAssets,
        feeRecipient: managerFeeRecipient,
        managerFees,
        maxManagerFee,
        premiumPercentage,
        maxPremiumPercentage,
        minSetTokenSupply,
      } as NAVIssuanceSettings;

      await navIssuanceModule.initialize(
        setToken.address,
        navIssuanceSettings
      );

      subjectSetToken = setToken.address;
      subjectFeeIndex = ZERO;
    });

    async function subject(): Promise<BigNumber> {
      return navIssuanceModuleWrapper.getManagerFee(subjectSetToken, subjectFeeIndex);
    }

    it('should return the manager fee', async () => {
      const returnedManagerFee = await subject();

      expect(returnedManagerFee.toString()).to.eq(managerFees[0].toString());
    });
  });

  describe('#getExpectedSetTokenIssueQuantity', () => {
    let subjectSetToken: Address;
    let subjectReserveAsset: Address;
    let subjectReserveQuantity: BigNumber;

    let setToken: SetToken;
    let managerFees: BigNumber[];
    let protocolDirectFee: BigNumber;
    let premiumPercentage: BigNumber;

    beforeEach(async () => {
      setToken = await setup.createSetToken(
        [setup.weth.address],
        [ether(1)],
        [navIssuanceModule.address]
      );
      const managerIssuanceHook = randomAddress;
      const managerRedemptionHook = randomAddress2;
      const reserveAssets = [setup.usdc.address, setup.weth.address];
      const managerFeeRecipient = feeRecipient;
      // Set manager issue fee to 0.1% and redeem to 0.2%
      managerFees = [ether(0.001), ether(0.002)];
      // Set max managerFee to 2%
      const maxManagerFee = ether(0.02);
      // Set premium to 1%
      premiumPercentage = ether(0.01);
      // Set max premium to 10%
      const maxPremiumPercentage = ether(0.1);
      // Set min SetToken supply to 100 units
      const minSetTokenSupply = ether(100);

      const navIssuanceSettings = {
        managerIssuanceHook,
        managerRedemptionHook,
        reserveAssets,
        feeRecipient: managerFeeRecipient,
        managerFees,
        maxManagerFee,
        premiumPercentage,
        maxPremiumPercentage,
        minSetTokenSupply,
      } as NAVIssuanceSettings;

      await navIssuanceModule.initialize(
        setToken.address,
        navIssuanceSettings
      );

      protocolDirectFee = ether(.02);
      await setup.controller.addFee(navIssuanceModule.address, TWO, protocolDirectFee);

      const protocolManagerFee = ether(.3);
      await setup.controller.addFee(navIssuanceModule.address, ZERO, protocolManagerFee);

      subjectSetToken = setToken.address;
      subjectReserveAsset = setup.usdc.address;
      subjectReserveQuantity = ether(1);
    });

    async function subject(): Promise<BigNumber> {
      return navIssuanceModuleWrapper.getExpectedSetTokenIssueQuantity(
        subjectSetToken,
        subjectReserveAsset,
        subjectReserveQuantity
      );
    }

    it('should return the correct expected Set issue quantity', async () => {
      const expectedSetTokenIssueQuantity = await getExpectedSetTokenIssueQuantity(
        setToken,
        setup.setValuer,
        subjectReserveAsset,
        usdc(1),
        subjectReserveQuantity,
        managerFees[0],
        protocolDirectFee,
        premiumPercentage
      );
      const returnedSetTokenIssueQuantity = await subject();
      expect(expectedSetTokenIssueQuantity.toString()).to.eq(returnedSetTokenIssueQuantity.toString());
    });
  });

  describe('#getExpectedReserveRedeemQuantity', () => {
    let subjectSetToken: Address;
    let subjectReserveAsset: Address;
    let subjectSetTokenQuantity: BigNumber;

    let setToken: SetToken;
    let managerFees: BigNumber[];
    let protocolDirectFee: BigNumber;
    let premiumPercentage: BigNumber;

    beforeEach(async () => {
      setToken = await setup.createSetToken(
        [setup.weth.address, setup.usdc.address, setup.wbtc.address, setup.dai.address],
        [ether(1), usdc(270), bitcoin(1).div(10), ether(600)],
        [setup.issuanceModule.address, navIssuanceModule.address]
      );
      const managerIssuanceHook = randomAddress;
      const managerRedemptionHook = randomAddress2;
      const reserveAssets = [setup.usdc.address, setup.weth.address];
      const managerFeeRecipient = feeRecipient;
      // Set manager issue fee to 0.1% and redeem to 0.2%
      managerFees = [ether(0.001), ether(0.002)];
      // Set max managerFee to 2%
      const maxManagerFee = ether(0.02);
      // Set premium to 1%
      premiumPercentage = ether(0.01);
      // Set max premium to 10%
      const maxPremiumPercentage = ether(0.1);
      // Set min SetToken supply to 1 unit
      const minSetTokenSupply = ether(1);

      const navIssuanceSettings = {
        managerIssuanceHook,
        managerRedemptionHook,
        reserveAssets,
        feeRecipient: managerFeeRecipient,
        managerFees,
        maxManagerFee,
        premiumPercentage,
        maxPremiumPercentage,
        minSetTokenSupply,
      } as NAVIssuanceSettings;

      await navIssuanceModule.initialize(setToken.address, navIssuanceSettings);
      // Approve tokens to the controller
      await setup.weth.approve(setup.controller.address, ether(100));
      await setup.usdc.approve(setup.controller.address, usdc(1000000));
      await setup.wbtc.approve(setup.controller.address, bitcoin(1000000));
      await setup.dai.approve(setup.controller.address, ether(1000000));

      // Seed with 10 supply
      await setup.issuanceModule.connect(provider.getSigner(owner)).initialize(setToken.address, ADDRESS_ZERO);
      await setup.issuanceModule.connect(provider.getSigner(owner)).issue(setToken.address, ether(10), owner);

      protocolDirectFee = ether(.02);
      await setup.controller.addFee(navIssuanceModule.address, THREE, protocolDirectFee);

      const protocolManagerFee = ether(.3);
      await setup.controller.addFee(navIssuanceModule.address, ONE, protocolManagerFee);

      subjectSetToken = setToken.address;
      subjectReserveAsset = setup.usdc.address;
      subjectSetTokenQuantity = ether(1);
    });

    async function subject(): Promise<BigNumber> {
      return navIssuanceModuleWrapper.getExpectedReserveRedeemQuantity(
        subjectSetToken,
        subjectReserveAsset,
        subjectSetTokenQuantity
      );
    }

    it('should return the correct expected reserve asset redeem quantity', async () => {
      const setTokenValuation = await setup.setValuer.calculateSetTokenValuation(
        subjectSetToken,
        subjectReserveAsset
      );
      const expectedRedeemQuantity = getExpectedReserveRedeemQuantity(
        subjectSetTokenQuantity,
        setTokenValuation,
        usdc(1), // USDC base units
        managerFees[1],
        protocolDirectFee, // Protocol fee percentage
        premiumPercentage
      );
      const returnedRedeemQuantity = await subject();
      expect(expectedRedeemQuantity.toString()).to.eq(returnedRedeemQuantity.toString());
    });
  });

  describe('#isIssueValid', () => {
    let subjectSetToken: Address;
    let subjectReserveAsset: Address;
    let subjectReserveQuantity: BigNumber;

    let setToken: SetToken;

    beforeEach(async () => {
      setToken = await setup.createSetToken(
        [setup.weth.address, setup.usdc.address, setup.wbtc.address, setup.dai.address],
        [ether(1), usdc(270), bitcoin(1).div(10), ether(600)],
        [setup.issuanceModule.address, navIssuanceModule.address]
      );
      const managerIssuanceHook = randomAddress;
      const managerRedemptionHook = randomAddress2;
      const reserveAssets = [setup.usdc.address, setup.weth.address];
      const managerFeeRecipient = feeRecipient;
      // Set manager issue fee to 0.1% and redeem to 0.2%
      const managerFees = [ether(0.001), ether(0.002)];
      // Set max managerFee to 2%
      const maxManagerFee = ether(0.02);
      // Set premium to 1%
      const premiumPercentage = ether(0.01);
      // Set max premium to 10%
      const maxPremiumPercentage = ether(0.1);
      // Set min SetToken supply to 100 units
      const minSetTokenSupply = ether(1);

      const navIssuanceSettings = {
        managerIssuanceHook,
        managerRedemptionHook,
        reserveAssets,
        feeRecipient: managerFeeRecipient,
        managerFees,
        maxManagerFee,
        premiumPercentage,
        maxPremiumPercentage,
        minSetTokenSupply,
      } as NAVIssuanceSettings;

      await navIssuanceModule.initialize(setToken.address, navIssuanceSettings);
      // Approve tokens to the controller
      await setup.weth.approve(setup.controller.address, ether(100));
      await setup.usdc.approve(setup.controller.address, usdc(1000000));
      await setup.wbtc.approve(setup.controller.address, bitcoin(1000000));
      await setup.dai.approve(setup.controller.address, ether(1000000));

      // Seed with 10 supply
      await setup.issuanceModule.connect(provider.getSigner(owner)).initialize(setToken.address, ADDRESS_ZERO);
      await setup.issuanceModule.connect(provider.getSigner(owner)).issue(setToken.address, ether(10), owner);

      const protocolDirectFee = ether(.02);
      await setup.controller.addFee(navIssuanceModule.address, TWO, protocolDirectFee);

      const protocolManagerFee = ether(.3);
      await setup.controller.addFee(navIssuanceModule.address, ZERO, protocolManagerFee);

      subjectSetToken = setToken.address;
      subjectReserveAsset = setup.usdc.address;
      subjectReserveQuantity = usdc(100);
    });

    async function subject(): Promise<boolean> {
      return navIssuanceModule.isIssueValid(subjectSetToken, subjectReserveAsset, subjectReserveQuantity);
    }

    it('should return true', async () => {
      const returnedValue = await subject();
      expect(returnedValue).to.eq(true);
    });

    describe('when total supply is less than min required for NAV issuance', () => {
      beforeEach(async () => {
        // Redeem below required
        await setup.issuanceModule.connect(provider.getSigner(owner)).redeem(
          setToken.address,
          ether(9.5),
          owner
        );
      });

      it('returns false', async () => {
        const returnedValue = await subject();
        expect(returnedValue).to.eq(false);
      });
    });

    describe('when the issue quantity is 0', () => {
      beforeEach(async () => {
        subjectReserveQuantity = ZERO;
      });

      it('returns false', async () => {
        const returnedValue = await subject();
        expect(returnedValue).to.eq(false);
      });
    });

    describe('when the reserve asset is not valid', () => {
      beforeEach(async () => {
        subjectReserveAsset = setup.wbtc.address;
      });

      it('returns false', async () => {
        const returnedValue = await subject();
        expect(returnedValue).to.eq(false);
      });
    });
  });

  describe('#isRedeemValid', () => {
    let subjectSetToken: Address;
    let subjectReserveAsset: Address;
    let subjectSetTokenQuantity: BigNumber;

    let setToken: SetToken;

    beforeEach(async () => {
      setToken = await setup.createSetToken(
        [setup.weth.address, setup.usdc.address, setup.wbtc.address, setup.dai.address],
        [ether(1), usdc(270), bitcoin(1).div(10), ether(600)],
        [setup.issuanceModule.address, navIssuanceModule.address]
      );
      const managerIssuanceHook = randomAddress;
      const managerRedemptionHook = randomAddress2;
      const reserveAssets = [setup.usdc.address, setup.weth.address];
      const managerFeeRecipient = feeRecipient;
      // Set manager issue fee to 0.1% and redeem to 0.2%
      const managerFees = [ether(0.001), ether(0.002)];
      // Set max managerFee to 2%
      const maxManagerFee = ether(0.02);
      // Set premium to 1%
      const premiumPercentage = ether(0.01);
      // Set max premium to 10%
      const maxPremiumPercentage = ether(0.1);
      // Set min SetToken supply to 1 unit
      const minSetTokenSupply = ether(1);

      const navIssuanceSettings = {
        managerIssuanceHook,
        managerRedemptionHook,
        reserveAssets,
        feeRecipient: managerFeeRecipient,
        managerFees,
        maxManagerFee,
        premiumPercentage,
        maxPremiumPercentage,
        minSetTokenSupply,
      } as NAVIssuanceSettings;

      await navIssuanceModule.initialize(setToken.address, navIssuanceSettings);
      // Approve tokens to the controller
      await setup.weth.approve(setup.controller.address, ether(100));
      await setup.usdc.approve(setup.controller.address, usdc(1000000));
      await setup.wbtc.approve(setup.controller.address, bitcoin(1000000));
      await setup.dai.approve(setup.controller.address, ether(1000000));

      // Seed with 10 supply
      await setup.issuanceModule.connect(provider.getSigner(owner)).initialize(setToken.address, ADDRESS_ZERO);
      await setup.issuanceModule.connect(provider.getSigner(owner)).issue(setToken.address, ether(10), owner);

      const protocolDirectFee = ether(.02);
      await setup.controller.addFee(navIssuanceModule.address, THREE, protocolDirectFee);

      const protocolManagerFee = ether(.3);
      await setup.controller.addFee(navIssuanceModule.address, ONE, protocolManagerFee);

      subjectSetToken = setToken.address;
      subjectReserveAsset = setup.usdc.address;
      subjectSetTokenQuantity = ether(1);
    });

    async function subject(): Promise<boolean> {
      return navIssuanceModule.isRedeemValid(subjectSetToken, subjectReserveAsset, subjectSetTokenQuantity);
    }

    it('should return true', async () => {
      const returnedValue = await subject();
      expect(returnedValue).to.eq(true);
    });

    describe('when total supply is less than min required for NAV issuance', () => {
      beforeEach(async () => {
        // Redeem below required
        await setup.issuanceModule.connect(provider.getSigner(owner)).redeem(setToken.address, ether(9), owner);
        subjectSetTokenQuantity = ether(0.01);
      });

      it('returns false', async () => {
        const returnedValue = await subject();
        expect(returnedValue).to.eq(false);
      });
    });

    describe('when there is not sufficient reserve asset for withdraw', () => {
      beforeEach(async () => {
        // Add self as module and update the position state
        await setup.controller.addModule(owner);
        setToken = setToken.connect(provider.getSigner(owner));
        await setToken.addModule(owner);
        await setToken.initializeModule();

        // Remove USDC position
        await setToken.editDefaultPositionUnit(setup.usdc.address, ZERO);

        subjectSetTokenQuantity = ether(1);
      });

      it('returns false', async () => {
        const returnedValue = await subject();
        expect(returnedValue).to.eq(false);
      });
    });

    describe('when the redeem quantity is 0', () => {
      beforeEach(async () => {
        subjectSetTokenQuantity = ZERO;
      });

      it('returns false', async () => {
        const returnedValue = await subject();
        expect(returnedValue).to.eq(false);
      });
    });

    describe('when the reserve asset is not valid', () => {
      beforeEach(async () => {
        await setup.wbtc.approve(setup.controller.address, bitcoin(1000000));
        subjectReserveAsset = setup.wbtc.address;
      });

      it('returns false', async () => {
        const returnedValue = await subject();
        expect(returnedValue).to.eq(false);
      });
    });
  });

  describe('#issue', () => {
    let setToken: SetToken;

    let subjectSetToken: Address;
    let subjectReserveAsset: Address;
    let subjectReserveQuantity: BigNumber;
    let subjectMinSetTokenReceived: BigNumber;
    let subjectTo: Address;
    let subjectCaller: Address;

    let navIssuanceSettings: NAVIssuanceSettings;
    let managerIssuanceHook: Address;
    let managerFees: BigNumber[];
    let premiumPercentage: BigNumber;
    let units: BigNumber[];
    let issueQuantity: BigNumber;

    describe('when there are 4 components and reserve asset is USDC', () => {
      beforeEach(async () => {
        // Valued at 2000 USDC
        units = [ether(1), usdc(270), bitcoin(1).div(10), ether(600)];
        setToken = await setup.createSetToken(
          [setup.weth.address, setup.usdc.address, setup.wbtc.address, setup.dai.address],
          units, // Set is valued at 2000 USDC
          [setup.issuanceModule.address, navIssuanceModule.address]
        );
        const managerRedemptionHook = randomAddress;
        const reserveAssets = [setup.usdc.address, setup.weth.address];
        const managerFeeRecipient = feeRecipient;
        // Set max managerFee to 20%
        const maxManagerFee = ether(0.2);
        // Set max premium to 10%
        const maxPremiumPercentage = ether(0.1);
        // Set min SetToken supply required
        const minSetTokenSupply = ether(1);

        navIssuanceSettings = {
          managerIssuanceHook,
          managerRedemptionHook,
          reserveAssets,
          feeRecipient: managerFeeRecipient,
          managerFees,
          maxManagerFee,
          premiumPercentage,
          maxPremiumPercentage,
          minSetTokenSupply,
        } as NAVIssuanceSettings;

        await navIssuanceModule.initialize(setToken.address, navIssuanceSettings);
        // Approve tokens to the controller
        await setup.weth.approve(setup.controller.address, ether(100));
        await setup.usdc.approve(setup.controller.address, usdc(1000000));
        await setup.wbtc.approve(setup.controller.address, bitcoin(1000000));
        await setup.dai.approve(setup.controller.address, ether(1000000));

        // Seed with 2 supply
        await setup.issuanceModule.connect(provider.getSigner(owner)).initialize(setToken.address, ADDRESS_ZERO);
        await setup.issuanceModule.connect(provider.getSigner(owner)).issue(setToken.address, ether(2), owner);

        // Issue with 1k USDC
        issueQuantity = usdc(1000);

        await setup.usdc.approve(navIssuanceModule.address, issueQuantity);

        subjectSetToken = setToken.address;
        subjectReserveAsset = setup.usdc.address;
        subjectReserveQuantity = issueQuantity;
        subjectMinSetTokenReceived = ether(0);
        subjectTo = recipient;
        subjectCaller = owner;
      });

      describe('when there are no fees and no issuance hooks', () => {
        beforeAll(async () => {
          managerIssuanceHook = ADDRESS_ZERO;
          // Set fees to 0
          managerFees = [ether(0), ether(0)];
          // Set premium percentage to 50 bps
          premiumPercentage = ether(0.005);
        });

        async function subject(): Promise<ContractTransaction> {
          return navIssuanceModuleWrapper.issue(
            subjectSetToken,
            subjectReserveAsset,
            subjectReserveQuantity,
            subjectMinSetTokenReceived,
            subjectTo,
            subjectCaller
          );
        }

        it('should issue the Set to the recipient', async () => {
          const expectedSetTokenIssueQuantity = await getExpectedSetTokenIssueQuantity(
            setToken,
            setup.setValuer,
            subjectReserveAsset,
            usdc(1), // USDC base units 10^6
            subjectReserveQuantity,
            managerFees[0],
            ZERO, // Protocol direct fee
            premiumPercentage
          );
          await subject();

          const issuedBalance = await setToken.balanceOf(recipient);
          expect(issuedBalance.toString()).to.eq(expectedSetTokenIssueQuantity.toString());
        });

        it('should have deposited the reserve asset into the SetToken', async () => {
          const preIssueUSDCBalance = await setup.usdc.balanceOf(setToken.address);
          await subject();
          const postIssueUSDCBalance = await setup.usdc.balanceOf(setToken.address);
          const expectedUSDCBalance = preIssueUSDCBalance.add(issueQuantity);
          expect(postIssueUSDCBalance.toString()).to.eq(expectedUSDCBalance.toString());
        });

        it('should have updated the reserve asset position correctly', async () => {
          const previousSetTokenSupply = await setToken.totalSupply();
          await subject();
          const currentSetTokenSupply = await setToken.totalSupply();
          const defaultPositionUnit = await setToken.getDefaultPositionRealUnit(subjectReserveAsset);

          // (Previous supply * previous units + current units) / current supply
          const newPositionMultiplier = await setToken.positionMultiplier();
          const expectedPositionUnit = getExpectedIssuePositionUnit(
            units[1],
            issueQuantity,
            previousSetTokenSupply,
            currentSetTokenSupply,
            newPositionMultiplier,
            managerFees[0],
            ZERO // Protocol fee percentage
          );

          expect(defaultPositionUnit.toString()).to.eq(expectedPositionUnit.toString());
        });

        it('should have updated the position multiplier correctly', async () => {
          const previousSetTokenSupply = await setToken.totalSupply();
          const preIssuePositionMultiplier = await setToken.positionMultiplier();
          await subject();
          const currentSetTokenSupply = await setToken.totalSupply();
          const postIssuePositionMultiplier = await setToken.positionMultiplier();

          const expectedPositionMultiplier = getExpectedIssuePositionMultiplier(
            preIssuePositionMultiplier,
            previousSetTokenSupply,
            currentSetTokenSupply
          );
          expect(postIssuePositionMultiplier.toString()).to.eq(expectedPositionMultiplier.toString());
        });

        it('should reconcile balances', async () => {
          await reconcileBalances(setToken, subject, owner);
        });

        describe('when the issue quantity is extremely small', () => {
          beforeEach(async () => {
            subjectReserveQuantity = ONE;
          });

          it('should issue the Set to the recipient', async () => {
            const expectedSetTokenIssueQuantity = await getExpectedSetTokenIssueQuantity(
              setToken,
              setup.setValuer,
              subjectReserveAsset,
              usdc(1), // USDC base units 10^6
              subjectReserveQuantity,
              managerFees[0],
              ZERO, // Protocol direct fee
              premiumPercentage
            );
            await subject();

            const issuedBalance = await setToken.balanceOf(recipient);

            expect(issuedBalance.toString()).to.eq(expectedSetTokenIssueQuantity.toString());
          });

          it('should have deposited the reserve asset into the SetToken', async () => {
            const preIssueUSDCBalance = await setup.usdc.balanceOf(setToken.address);
            await subject();
            const postIssueUSDCBalance = await setup.usdc.balanceOf(setToken.address);
            const expectedUSDCBalance = preIssueUSDCBalance.add(subjectReserveQuantity);

            expect(postIssueUSDCBalance.toString()).to.eq(expectedUSDCBalance.toString());
          });

          it('should have updated the reserve asset position correctly', async () => {
            const previousSetTokenSupply = await setToken.totalSupply();
            await subject();
            const currentSetTokenSupply = await setToken.totalSupply();
            const usdcPositionUnit = await setToken.getDefaultPositionRealUnit(subjectReserveAsset);

            // (Previous supply * previous units + current units) / current supply
            const newPositionMultiplier = await setToken.positionMultiplier();
            const expectedPositionUnit = getExpectedIssuePositionUnit(
              units[1],
              subjectReserveQuantity,
              previousSetTokenSupply,
              currentSetTokenSupply,
              newPositionMultiplier,
              managerFees[0],
              ZERO // Protocol fee percentage
            );

            expect(usdcPositionUnit.toString()).to.eq(expectedPositionUnit.toString());
          });

          it('should have updated the position multiplier correctly', async () => {
            const previousSetTokenSupply = await setToken.totalSupply();
            const preIssuePositionMultiplier = await setToken.positionMultiplier();
            await subject();
            const currentSetTokenSupply = await setToken.totalSupply();
            const postIssuePositionMultiplier = await setToken.positionMultiplier();

            const expectedPositionMultiplier = getExpectedIssuePositionMultiplier(
              preIssuePositionMultiplier,
              previousSetTokenSupply,
              currentSetTokenSupply
            );

            expect(postIssuePositionMultiplier.toString()).to.eq(expectedPositionMultiplier.toString());
          });

          it('should reconcile balances', async () => {
            await reconcileBalances(setToken, subject, owner);
          });
        });

        describe('when a SetToken position is not in default state', () => {
          beforeEach(async () => {
            // Add self as module and update the position state
            await setup.controller.addModule(owner);
            setToken = setToken.connect(provider.getSigner(owner));
            await setToken.addModule(owner);
            await setToken.initializeModule();

            await setToken.addExternalPositionModule(setup.usdc.address, ADDRESS_ZERO);

            // Move default USDC to external position
            await setToken.editDefaultPositionUnit(setup.usdc.address, ZERO);
            await setToken.editExternalPositionUnit(setup.usdc.address, ADDRESS_ZERO, units[1]);
          });

          it('should have updated the reserve asset position correctly', async () => {
            const previousSetTokenSupply = await setToken.totalSupply();
            await subject();
            const currentSetTokenSupply = await setToken.totalSupply();
            const defaultUnit = await setToken.getDefaultPositionRealUnit(subjectReserveAsset);

            // (Previous supply * previous units + current units) / current supply
            const newPositionMultiplier = await setToken.positionMultiplier();
            const expectedPositionUnit = getExpectedIssuePositionUnit(
              ZERO, // Previous units are 0
              subjectReserveQuantity,
              previousSetTokenSupply,
              currentSetTokenSupply,
              newPositionMultiplier,
              managerFees[0],
              ZERO // Protocol fee percentage
            );

            expect(defaultUnit.toString()).to.eq(expectedPositionUnit.toString());
          });

          it('should have updated the position multiplier correctly', async () => {
            const previousSetTokenSupply = await setToken.totalSupply();
            const preIssuePositionMultiplier = await setToken.positionMultiplier();
            await subject();
            const currentSetTokenSupply = await setToken.totalSupply();
            const postIssuePositionMultiplier = await setToken.positionMultiplier();

            const expectedPositionMultiplier = getExpectedIssuePositionMultiplier(
              preIssuePositionMultiplier,
              previousSetTokenSupply,
              currentSetTokenSupply
            );
            expect(postIssuePositionMultiplier.toString()).to.eq(expectedPositionMultiplier.toString());
          });

          it('should reconcile balances', async () => {
            await reconcileBalances(setToken, subject, owner);
          });
        });

        describe('when total supply is less than min required for NAV issuance', () => {
          beforeEach(async () => {
            // Redeem below required
            await setup.issuanceModule.connect(provider.getSigner(owner)).redeem(
              setToken.address,
              ether(1.5),
              owner
            );
          });

          it('should revert', async () => {
            await expect(subject()).to.be.rejectedWith('Supply must be greater than minimum to enable issuance');
          });
        });

        describe('when the issue quantity is 0', () => {
          beforeEach(async () => {
            subjectReserveQuantity = ZERO;
          });

          it('should revert', async () => {
            await expect(subject()).to.be.rejectedWith('Quantity must be > 0');
          });
        });

        describe('when the reserve asset is not valid', () => {
          beforeEach(async () => {
            await setup.wbtc.approve(setup.controller.address, bitcoin(1000000));
            subjectReserveAsset = setup.wbtc.address;
          });

          it('should revert', async () => {
            await expect(subject()).to.be.rejectedWith('Must be valid reserve asset');
          });
        });

        describe('when SetToken received is less than min required', () => {
          beforeEach(async () => {
            subjectMinSetTokenReceived = ether(100);
          });

          it('should revert', async () => {
            await expect(subject()).to.be.rejectedWith('Must be greater than min SetToken');
          });
        });

        describe('when the SetToken is not enabled on the controller', () => {
          beforeEach(async () => {
            const nonEnabledSetToken = await setup.createNonControllerEnabledSetToken(
              [setup.weth.address],
              [ether(1)],
              [navIssuanceModule.address]
            );

            subjectSetToken = nonEnabledSetToken.address;
          });

          it('should revert', async () => {
            await expect(subject()).to.be.rejectedWith('Must be a valid and initialized SetToken');
          });
        });
      });

      describe('when there are fees enabled and no issuance hooks', () => {
        let protocolDirectFee: BigNumber;
        let protocolManagerFee: BigNumber;

        beforeAll(async () => {
          managerIssuanceHook = ADDRESS_ZERO;
          managerFees = [ether(0.1), ether(0.1)];
          premiumPercentage = ether(0.005);
        });

        beforeEach(async () => {
          protocolDirectFee = ether(.02);
          await setup.controller.addFee(navIssuanceModule.address, TWO, protocolDirectFee);

          protocolManagerFee = ether(.3);
          await setup.controller.addFee(navIssuanceModule.address, ZERO, protocolManagerFee);
        });

        async function subject(): Promise<ContractTransaction> {
          return navIssuanceModule.connect(provider.getSigner(subjectCaller)).issue(
            subjectSetToken,
            subjectReserveAsset,
            subjectReserveQuantity,
            subjectMinSetTokenReceived,
            subjectTo
          );
        }

        it('should issue the Set to the recipient', async () => {
          const expectedSetTokenIssueQuantity = await getExpectedSetTokenIssueQuantity(
            setToken,
            setup.setValuer,
            subjectReserveAsset,
            usdc(1), // USDC base units 10^6
            subjectReserveQuantity,
            managerFees[0],
            protocolDirectFee, // Protocol direct fee
            premiumPercentage
          );
          await subject();

          const issuedBalance = await setToken.balanceOf(recipient);
          expect(issuedBalance.toString()).to.eq(expectedSetTokenIssueQuantity.toString());
        });

        it('should have deposited the reserve asset into the SetToken', async () => {
          const preIssueUSDCBalance = await setup.usdc.balanceOf(setToken.address);
          await subject();
          const postIssueUSDCBalance = await setup.usdc.balanceOf(setToken.address);

          const postFeeQuantity = getExpectedPostFeeQuantity(
            issueQuantity,
            managerFees[0],
            protocolDirectFee
          );
          const expectedUSDCBalance = preIssueUSDCBalance.add(postFeeQuantity);
          expect(postIssueUSDCBalance.toString()).to.eq(expectedUSDCBalance.toString());
        });

        it('should have updated the reserve asset position correctly', async () => {
          const previousSetTokenSupply = await setToken.totalSupply();
          await subject();
          const currentSetTokenSupply = await setToken.totalSupply();
          const usdcPositionUnit = await setToken.getDefaultPositionRealUnit(subjectReserveAsset);

          // (Previous supply * previous units + current units) / current supply
          const newPositionMultiplier = await setToken.positionMultiplier();
          const expectedPositionUnit = getExpectedIssuePositionUnit(
            units[1],
            issueQuantity,
            previousSetTokenSupply,
            currentSetTokenSupply,
            newPositionMultiplier,
            managerFees[0],
            protocolDirectFee
          );

          expect(usdcPositionUnit.toString()).to.eq(expectedPositionUnit.toString());
        });

        it('should have updated the position multiplier correctly', async () => {
          const previousSetTokenSupply = await setToken.totalSupply();
          const preIssuePositionMultiplier = await setToken.positionMultiplier();
          await subject();
          const currentSetTokenSupply = await setToken.totalSupply();
          const postIssuePositionMultiplier = await setToken.positionMultiplier();

          const expectedPositionMultiplier = getExpectedIssuePositionMultiplier(
            preIssuePositionMultiplier,
            previousSetTokenSupply,
            currentSetTokenSupply
          );
          expect(postIssuePositionMultiplier.toString()).to.eq(expectedPositionMultiplier.toString());
        });

        it('should reconcile balances', async () => {
          await reconcileBalances(setToken, subject, owner);
        });
      });

      describe('when there are fees, premiums and an issuance hooks', () => {
        let issuanceHookContract: ManagerIssuanceHookMock;

        beforeAll(async () => {
          issuanceHookContract = await deployer.mocks.deployManagerIssuanceHookMock();

          managerIssuanceHook = issuanceHookContract.address;
        });

        async function subject(): Promise<ContractTransaction> {
          return navIssuanceModule.issue(
            subjectSetToken,
            subjectReserveAsset,
            subjectReserveQuantity,
            subjectMinSetTokenReceived,
            subjectTo
          );
        }

        it('should properly call the pre-issue hooks', async () => {
          await subject();
          const retrievedSetToken = await issuanceHookContract.retrievedSetToken();
          const retrievedIssueQuantity = await issuanceHookContract.retrievedIssueQuantity();
          const retrievedSender = await issuanceHookContract.retrievedSender();
          const retrievedTo = await issuanceHookContract.retrievedTo();

          expect(retrievedSetToken).to.eq(subjectSetToken);
          expect(retrievedIssueQuantity.toString()).to.eq(subjectMinSetTokenReceived.toString());
          expect(retrievedSender).to.eq(owner);
          expect(retrievedTo).to.eq(subjectTo);
        });
      });
    });
  });

  describe('#issueWithEther', () => {
    let setToken: SetToken;

    let subjectSetToken: Address;
    let subjectMinSetTokenReceived: BigNumber;
    let subjectTo: Address;
    let subjectCaller: Address;
    let subjectValue: BigNumber;

    let navIssuanceSettings: NAVIssuanceSettings;
    let managerIssuanceHook: Address;
    let managerFees: BigNumber[];
    let premiumPercentage: BigNumber;
    let units: BigNumber[];
    let issueQuantity: BigNumber;

    describe('when there are 4 components and reserve asset is ETH', () => {
      beforeEach(async () => {
        // Valued at 2000 USDC
        units = [ether(1), usdc(270), bitcoin(1).div(10), ether(600)];
        setToken = await setup.createSetToken(
          [setup.weth.address, setup.usdc.address, setup.wbtc.address, setup.dai.address],
          units, // Set is valued at 2000 USDC
          [setup.issuanceModule.address, navIssuanceModule.address]
        );
        const managerRedemptionHook = randomAddress;
        const reserveAssets = [setup.usdc.address, setup.weth.address];
        const managerFeeRecipient = feeRecipient;
        // Set max managerFee to 20%
        const maxManagerFee = ether(0.2);
        // Set max premium to 10%
        const maxPremiumPercentage = ether(0.1);
        // Set min SetToken supply required
        const minSetTokenSupply = ether(1);

        navIssuanceSettings = {
          managerIssuanceHook,
          managerRedemptionHook,
          reserveAssets,
          feeRecipient: managerFeeRecipient,
          managerFees,
          maxManagerFee,
          premiumPercentage,
          maxPremiumPercentage,
          minSetTokenSupply,
        } as NAVIssuanceSettings;

        await navIssuanceModule.initialize(setToken.address, navIssuanceSettings);
        // Approve tokens to the controller
        await setup.weth.approve(setup.controller.address, ether(100));
        await setup.usdc.approve(setup.controller.address, usdc(1000000));
        await setup.wbtc.approve(setup.controller.address, bitcoin(1000000));
        await setup.dai.approve(setup.controller.address, ether(1000000));

        // Seed with 2 supply
        await setup.issuanceModule.connect(provider.getSigner(owner)).initialize(setToken.address, ADDRESS_ZERO);
        await setup.issuanceModule.connect(provider.getSigner(owner)).issue(setToken.address, ether(2), owner);

        // Issue with 1 ETH
        issueQuantity = ether(0.1);

        subjectSetToken = setToken.address;
        subjectMinSetTokenReceived = ether(0);
        subjectTo = recipient;
        subjectValue = issueQuantity;
        subjectCaller = owner;
      });

      describe('when there are no fees and no issuance hooks', () => {
        beforeAll(async () => {
          managerIssuanceHook = ADDRESS_ZERO;
          // Set fees to 0
          managerFees = [ether(0), ether(0)];
          premiumPercentage = ether(0.005);
        });

        async function subject(): Promise<ContractTransaction> {
          return navIssuanceModule.connect(provider.getSigner(subjectCaller)).issueWithEther(
            subjectSetToken,
            subjectMinSetTokenReceived,
            subjectTo,
            {
              value: subjectValue,
            }
          );
        }

        it('should issue the Set to the recipient', async () => {
          const expectedSetTokenIssueQuantity = await getExpectedSetTokenIssueQuantity(
            setToken,
            setup.setValuer,
            setup.weth.address,
            ether(1), // ETH base units 10^18
            subjectValue,
            managerFees[0],
            ZERO, // Protocol direct fee
            premiumPercentage
          );
          await subject();

          const issuedBalance = await setToken.balanceOf(recipient);
          expect(issuedBalance.toString()).to.eq(expectedSetTokenIssueQuantity.toString());
        });

        it('should have deposited WETH into the SetToken', async () => {
          const preIssueWETHBalance = await setup.weth.balanceOf(setToken.address);
          await subject();
          const postIssueWETHBalance = await setup.weth.balanceOf(setToken.address);
          const expectedWETHBalance = preIssueWETHBalance.add(issueQuantity);
          expect(postIssueWETHBalance.toString()).to.eq(expectedWETHBalance.toString());
        });

        it('should have updated the reserve asset position correctly', async () => {
          const previousSetTokenSupply = await setToken.totalSupply();
          await subject();
          const currentSetTokenSupply = await setToken.totalSupply();
          const defaultPositionUnit = await setToken.getDefaultPositionRealUnit(setup.weth.address);

          const newPositionMultiplier = await setToken.positionMultiplier();
          const expectedPositionUnit = getExpectedIssuePositionUnit(
            units[0],
            issueQuantity,
            previousSetTokenSupply,
            currentSetTokenSupply,
            newPositionMultiplier,
            managerFees[0],
            ZERO // Protocol fee percentage
          );

          expect(defaultPositionUnit.toString()).to.eq(expectedPositionUnit.toString());
        });

        it('should have updated the position multiplier correctly', async () => {
          const previousSetTokenSupply = await setToken.totalSupply();
          const preIssuePositionMultiplier = await setToken.positionMultiplier();
          await subject();
          const currentSetTokenSupply = await setToken.totalSupply();
          const postIssuePositionMultiplier = await setToken.positionMultiplier();

          const expectedPositionMultiplier = getExpectedIssuePositionMultiplier(
            preIssuePositionMultiplier,
            previousSetTokenSupply,
            currentSetTokenSupply
          );
          expect(postIssuePositionMultiplier.toString()).to.eq(expectedPositionMultiplier.toString());
        });

        it('should reconcile balances', async () => {
          await reconcileBalances(setToken, subject, owner);
        });

        describe('when a SetToken position is not in default state', () => {
          beforeEach(async () => {
            // Add self as module and update the position state
            await setup.controller.addModule(owner);
            setToken = setToken.connect(provider.getSigner(owner));
            await setToken.addModule(owner);
            await setToken.initializeModule();

            await setToken.addExternalPositionModule(setup.weth.address, ADDRESS_ZERO);

            // Move default WETH to external position
            await setToken.editDefaultPositionUnit(setup.weth.address, ZERO);
            await setToken.editExternalPositionUnit(setup.weth.address, ADDRESS_ZERO, units[0]);
          });

          it('should have updated the reserve asset position correctly', async () => {
            const previousSetTokenSupply = await setToken.totalSupply();
            await subject();
            const currentSetTokenSupply = await setToken.totalSupply();
            const defaultUnit = await setToken.getDefaultPositionRealUnit(setup.weth.address);

            // (Previous supply * previous units + current units) / current supply
            const newPositionMultiplier = await setToken.positionMultiplier();
            const expectedPositionUnit = getExpectedIssuePositionUnit(
              ZERO, // Previous units are 0
              subjectValue,
              previousSetTokenSupply,
              currentSetTokenSupply,
              newPositionMultiplier,
              managerFees[0],
              ZERO // Protocol fee percentage
            );

            expect(defaultUnit.toString()).to.eq(expectedPositionUnit.toString());
          });

          it('should have updated the position multiplier correctly', async () => {
            const previousSetTokenSupply = await setToken.totalSupply();
            const preIssuePositionMultiplier = await setToken.positionMultiplier();
            await subject();
            const currentSetTokenSupply = await setToken.totalSupply();
            const postIssuePositionMultiplier = await setToken.positionMultiplier();

            const expectedPositionMultiplier = getExpectedIssuePositionMultiplier(
              preIssuePositionMultiplier,
              previousSetTokenSupply,
              currentSetTokenSupply
            );
            expect(postIssuePositionMultiplier.toString()).to.eq(expectedPositionMultiplier.toString());
          });

          it('should reconcile balances', async () => {
            await reconcileBalances(setToken, subject, owner);
          });
        });

        describe('when total supply is less than min required for NAV issuance', () => {
          beforeEach(async () => {
            // Redeem below required
            await setup.issuanceModule.connect(provider.getSigner(owner)).redeem(
              setToken.address,
              ether(1.5),
              owner
            );
          });

          it('should revert', async () => {
            await expect(subject()).to.be.rejectedWith('Supply must be greater than minimum to enable issuance');
          });
        });

        describe('when the value is 0', () => {
          beforeEach(async () => {
            subjectValue = ZERO;
          });

          it('should revert', async () => {
            await expect(subject()).to.be.rejectedWith('Quantity must be > 0');
          });
        });

        describe('when SetToken received is less than minimum', () => {
          beforeEach(async () => {
            subjectMinSetTokenReceived = ether(100);
          });

          it('should revert', async () => {
            await expect(subject()).to.be.rejectedWith('Must be greater than min SetToken');
          });
        });

        describe('when the SetToken is not enabled on the controller', () => {
          beforeEach(async () => {
            const nonEnabledSetToken = await setup.createNonControllerEnabledSetToken(
              [setup.weth.address],
              [ether(1)],
              [navIssuanceModule.address]
            );

            subjectSetToken = nonEnabledSetToken.address;
          });

          it('should revert', async () => {
            await expect(subject()).to.be.rejectedWith('Must be a valid and initialized SetToken');
          });
        });
      });

      describe('when there are fees enabled and no issuance hooks', () => {
        let protocolDirectFee: BigNumber;
        let protocolManagerFee: BigNumber;

        beforeAll(async () => {
          managerIssuanceHook = ADDRESS_ZERO;
          managerFees = [ether(0.1), ether(0.1)];
          premiumPercentage = ether(0.1);
        });

        beforeEach(async () => {
          protocolDirectFee = ether(.02);
          await setup.controller.addFee(navIssuanceModule.address, TWO, protocolDirectFee);

          protocolManagerFee = ether(.3);
          await setup.controller.addFee(navIssuanceModule.address, ZERO, protocolManagerFee);
        });

        async function subject(): Promise<ContractTransaction> {
          return navIssuanceModule.connect(provider.getSigner(subjectCaller)).issueWithEther(
            subjectSetToken,
            subjectMinSetTokenReceived,
            subjectTo,
            {
              value: subjectValue,
            }
          );
        }

        it('should issue the Set to the recipient', async () => {
          const expectedSetTokenIssueQuantity = await getExpectedSetTokenIssueQuantity(
            setToken,
            setup.setValuer,
            setup.weth.address,
            ether(1), // ETH base units 10^18
            subjectValue,
            managerFees[0],
            protocolDirectFee, // Protocol direct fee
            premiumPercentage
          );
          await subject();

          const issuedBalance = await setToken.balanceOf(recipient);
          expect(issuedBalance.toString()).to.eq(expectedSetTokenIssueQuantity.toString());
        });

        it('should have deposited the reserve asset into the SetToken', async () => {
          const preIssueWETHBalance = await setup.weth.balanceOf(setToken.address);
          await subject();
          const postIssueWETHBalance = await setup.weth.balanceOf(setToken.address);

          const postFeeQuantity = getExpectedPostFeeQuantity(
            issueQuantity,
            managerFees[0],
            protocolDirectFee
          );
          const expectedWETHBalance = preIssueWETHBalance.add(postFeeQuantity);
          expect(postIssueWETHBalance.toString()).to.eq(expectedWETHBalance.toString());
        });

        it('should have updated the reserve asset position correctly', async () => {
          const previousSetTokenSupply = await setToken.totalSupply();
          await subject();
          const currentSetTokenSupply = await setToken.totalSupply();
          const wethPositionUnit = await setToken.getDefaultPositionRealUnit(setup.weth.address);

          // (Previous supply * previous units + current units) / current supply
          const newPositionMultiplier = await setToken.positionMultiplier();
          const expectedPositionUnit = getExpectedIssuePositionUnit(
            units[0],
            issueQuantity,
            previousSetTokenSupply,
            currentSetTokenSupply,
            newPositionMultiplier,
            managerFees[0],
            protocolDirectFee
          );

          expect(wethPositionUnit.toString()).to.eq(expectedPositionUnit.toString());
        });

        it('should have updated the position multiplier correctly', async () => {
          const previousSetTokenSupply = await setToken.totalSupply();
          const preIssuePositionMultiplier = await setToken.positionMultiplier();
          await subject();
          const currentSetTokenSupply = await setToken.totalSupply();
          const postIssuePositionMultiplier = await setToken.positionMultiplier();

          const expectedPositionMultiplier = getExpectedIssuePositionMultiplier(
            preIssuePositionMultiplier,
            previousSetTokenSupply,
            currentSetTokenSupply
          );
          expect(postIssuePositionMultiplier.toString()).to.eq(expectedPositionMultiplier.toString());
        });

        it('should reconcile balances', async () => {
          await reconcileBalances(setToken, subject, owner);
        });
      });
    });
  });

  describe('#redeem', () => {
    let setToken: SetToken;

    let subjectSetToken: Address;
    let subjectReserveAsset: Address;
    let subjectSetTokenQuantity: BigNumber;
    let subjectMinReserveQuantityReceived: BigNumber;
    let subjectTo: Address;
    let subjectCaller: Address;

    let navIssuanceSettings: NAVIssuanceSettings;
    let managerRedemptionHook: Address;
    let managerFees: BigNumber[];
    let premiumPercentage: BigNumber;
    let units: BigNumber[];
    let redeemQuantity: BigNumber;

    describe('when there are 4 components and reserve asset is USDC', () => {
      beforeEach(async () => {
        // Valued at 2000 USDC
        units = [ether(1), usdc(570), bitcoin(1).div(10), ether(300)];
        setToken = await setup.createSetToken(
          [setup.weth.address, setup.usdc.address, setup.wbtc.address, setup.dai.address],
          units, // Set is valued at 2000 USDC
          [setup.issuanceModule.address, navIssuanceModule.address]
        );
        const managerIssuanceHook = randomAddress;
        const reserveAssets = [setup.usdc.address, setup.weth.address];
        const managerFeeRecipient = feeRecipient;
        // Set max managerFee to 20%
        const maxManagerFee = ether(0.2);
        // Set max premium to 10%
        const maxPremiumPercentage = ether(0.1);
        // Set min SetToken supply required
        const minSetTokenSupply = ether(1);

        navIssuanceSettings = {
          managerIssuanceHook,
          managerRedemptionHook,
          reserveAssets,
          feeRecipient: managerFeeRecipient,
          managerFees,
          maxManagerFee,
          premiumPercentage,
          maxPremiumPercentage,
          minSetTokenSupply,
        } as NAVIssuanceSettings;

        await navIssuanceModule.initialize(setToken.address, navIssuanceSettings);
        // Approve tokens to the controller
        await setup.weth.approve(setup.controller.address, ether(100));
        await setup.usdc.approve(setup.controller.address, usdc(1000000));
        await setup.wbtc.approve(setup.controller.address, bitcoin(1000000));
        await setup.dai.approve(setup.controller.address, ether(1000000));

        // Seed with 10 supply
        await setup.issuanceModule.connect(provider.getSigner(owner)).initialize(setToken.address, ADDRESS_ZERO);
        await setup.issuanceModule.connect(provider.getSigner(owner)).issue(setToken.address, ether(10), owner);

        // Redeem 1 SetToken
        redeemQuantity = ether(2.8);

        subjectSetToken = setToken.address;
        subjectReserveAsset = setup.usdc.address;
        subjectSetTokenQuantity = redeemQuantity;
        subjectMinReserveQuantityReceived = ether(0);
        subjectTo = recipient;
        subjectCaller = owner;
      });

      describe('when there are no fees and no redemption hooks', () => {
        beforeAll(async () => {
          managerRedemptionHook = ADDRESS_ZERO;
          // Set fees to 0
          managerFees = [ether(0), ether(0)];
          // Set premium percentage to 50 bps
          premiumPercentage = ether(0.005);
        });

        async function subject(): Promise<ContractTransaction> {
          return navIssuanceModule.connect(provider.getSigner(subjectCaller)).redeem(
            subjectSetToken,
            subjectReserveAsset,
            subjectSetTokenQuantity,
            subjectMinReserveQuantityReceived,
            subjectTo
          );
        }

        it('should reduce the SetToken supply', async () => {
          const previousSupply = await setToken.totalSupply();
          const preRedeemBalance = await setToken.balanceOf(owner);
          await subject();
          const currentSupply = await setToken.totalSupply();
          const postRedeemBalance = await setToken.balanceOf(owner);

          expect(preRedeemBalance.sub(postRedeemBalance).toString()).to.eq(
            previousSupply.sub(currentSupply).toString()
          );
        });

        it('should have redeemed the reserve asset to the recipient', async () => {
          const setTokenValuation = await setup.setValuer.calculateSetTokenValuation(
            subjectSetToken,
            subjectReserveAsset
          );
          await subject();
          const postIssueUSDCBalance = await setup.usdc.balanceOf(recipient);
          const expectedUSDCBalance = getExpectedReserveRedeemQuantity(
            subjectSetTokenQuantity,
            setTokenValuation,
            usdc(1), // USDC base units
            managerFees[1],
            ZERO, // Protocol fee percentage
            premiumPercentage
          );
          expect(postIssueUSDCBalance.toString()).to.eq(expectedUSDCBalance.toString());
        });

        it('should have updated the reserve asset position correctly', async () => {
          const previousSetTokenSupply = await setToken.totalSupply();
          const setTokenValuation = await setup.setValuer.calculateSetTokenValuation(
            subjectSetToken,
            subjectReserveAsset
          );
          await subject();
          const currentSetTokenSupply = await setToken.totalSupply();
          const defaultPositionUnit = await setToken.getDefaultPositionRealUnit(subjectReserveAsset);

          // (Previous supply * previous units + current units) / current supply
          const newPositionMultiplier = await setToken.positionMultiplier();
          const expectedPositionUnit = getExpectedRedeemPositionUnit(
            units[1],
            redeemQuantity,
            setTokenValuation,
            usdc(1), // USDC base units
            previousSetTokenSupply,
            currentSetTokenSupply,
            newPositionMultiplier,
            managerFees[1],
            ZERO, // Protocol fee percentage
            premiumPercentage,
          );

          expect(defaultPositionUnit.toString()).to.eq(expectedPositionUnit.toString());
        });

        it('should have updated the position multiplier correctly', async () => {
          const previousSetTokenSupply = await setToken.totalSupply();
          const preIssuePositionMultiplier = await setToken.positionMultiplier();
          await subject();
          const currentSetTokenSupply = await setToken.totalSupply();
          const postIssuePositionMultiplier = await setToken.positionMultiplier();

          const expectedPositionMultiplier = getExpectedRedeemPositionMultiplier(
            preIssuePositionMultiplier,
            previousSetTokenSupply,
            currentSetTokenSupply
          );
          expect(postIssuePositionMultiplier.toString()).to.eq(expectedPositionMultiplier.toString());
        });

        it('should reconcile balances', async () => {
          await reconcileBalances(setToken, subject, owner);
        });

        describe('when the redeem quantity is extremely small', () => {
          beforeEach(async () => {
            subjectSetTokenQuantity = ONE;
          });

          it('should reduce the SetToken supply', async () => {
            const previousSupply = await setToken.totalSupply();
            const preRedeemBalance = await setToken.balanceOf(owner);
            await subject();
            const currentSupply = await setToken.totalSupply();
            const postRedeemBalance = await setToken.balanceOf(owner);

            expect(preRedeemBalance.sub(postRedeemBalance).toString()).to.eq(
              previousSupply.sub(currentSupply).toString()
            );
          });

          it('should have redeemed the reserve asset to the recipient', async () => {
            const setTokenValuation = await setup.setValuer.calculateSetTokenValuation(
              subjectSetToken,
              subjectReserveAsset
            );
            await subject();
            const postIssueUSDCBalance = await setup.usdc.balanceOf(recipient);
            const expectedUSDCBalance = getExpectedReserveRedeemQuantity(
              subjectSetTokenQuantity,
              setTokenValuation,
              usdc(1), // USDC base units
              managerFees[1],
              ZERO, // Protocol fee percentage
              premiumPercentage
            );
            expect(postIssueUSDCBalance.toString()).to.eq(expectedUSDCBalance.toString());
          });

          it('should have updated the reserve asset position correctly', async () => {
            const previousSetTokenSupply = await setToken.totalSupply();
            const setTokenValuation = await setup.setValuer.calculateSetTokenValuation(
              subjectSetToken,
              subjectReserveAsset
            );
            await subject();
            const currentSetTokenSupply = await setToken.totalSupply();
            const defaultPositionUnit = await setToken.getDefaultPositionRealUnit(subjectReserveAsset);

            // (Previous supply * previous units + current units) / current supply
            const newPositionMultiplier = await setToken.positionMultiplier();
            const expectedPositionUnit = getExpectedRedeemPositionUnit(
              units[1],
              subjectSetTokenQuantity,
              setTokenValuation,
              usdc(1), // USDC base units
              previousSetTokenSupply,
              currentSetTokenSupply,
              newPositionMultiplier,
              managerFees[1],
              ZERO, // Protocol fee percentage
              premiumPercentage,
            );
            expect(defaultPositionUnit.toString()).to.eq(expectedPositionUnit.toString());
          });

          it('should have updated the position multiplier correctly', async () => {
            const previousSetTokenSupply = await setToken.totalSupply();
            const preIssuePositionMultiplier = await setToken.positionMultiplier();
            await subject();
            const currentSetTokenSupply = await setToken.totalSupply();
            const postIssuePositionMultiplier = await setToken.positionMultiplier();

            const expectedPositionMultiplier = getExpectedRedeemPositionMultiplier(
              preIssuePositionMultiplier,
              previousSetTokenSupply,
              currentSetTokenSupply
            );
            expect(postIssuePositionMultiplier.toString()).to.eq(expectedPositionMultiplier.toString());
          });

          it('should reconcile balances', async () => {
            await reconcileBalances(setToken, subject, owner);
          });
        });

        describe('when a SetToken position is not in default state', () => {
          beforeEach(async () => {
            // Add self as module and update the position state
            await setup.controller.addModule(owner);
            setToken = setToken.connect(provider.getSigner(owner));
            await setToken.addModule(owner);
            await setToken.initializeModule();

            await setToken.addExternalPositionModule(setup.usdc.address, ADDRESS_ZERO);

            // Convert half of default position to external position
            await setToken.editDefaultPositionUnit(setup.usdc.address, units[1].div(2));
            await setToken.editExternalPositionUnit(setup.usdc.address, ADDRESS_ZERO, units[1].div(2));

            subjectSetTokenQuantity = ether(0.1);
          });

          it('should have updated the reserve asset position correctly', async () => {
            const previousSetTokenSupply = await setToken.totalSupply();
            const setTokenValuation = await setup.setValuer.calculateSetTokenValuation(
              subjectSetToken,
              subjectReserveAsset
            );
            await subject();
            const currentSetTokenSupply = await setToken.totalSupply();
            const defaultPositionUnit = await setToken.getDefaultPositionRealUnit(subjectReserveAsset);

            // (Previous supply * previous units + current units) / current supply
            const newPositionMultiplier = await setToken.positionMultiplier();
            const expectedPositionUnit = getExpectedRedeemPositionUnit(
              units[1].div(2),
              subjectSetTokenQuantity,
              setTokenValuation,
              usdc(1), // USDC base units
              previousSetTokenSupply,
              currentSetTokenSupply,
              newPositionMultiplier,
              managerFees[1],
              ZERO, // Protocol fee percentage
              premiumPercentage,
            );

            expect(defaultPositionUnit.toString()).to.eq(expectedPositionUnit.toString());
          });

          it('should have updated the position multiplier correctly', async () => {
            const previousSetTokenSupply = await setToken.totalSupply();
            const preIssuePositionMultiplier = await setToken.positionMultiplier();
            await subject();
            const currentSetTokenSupply = await setToken.totalSupply();
            const postIssuePositionMultiplier = await setToken.positionMultiplier();

            const expectedPositionMultiplier = getExpectedRedeemPositionMultiplier(
              preIssuePositionMultiplier,
              previousSetTokenSupply,
              currentSetTokenSupply
            );
            expect(postIssuePositionMultiplier.toString()).to.eq(expectedPositionMultiplier.toString());
          });

          it('should reconcile balances', async () => {
            await reconcileBalances(setToken, subject, owner);
          });
        });

        describe('when total supply is less than min required for NAV issuance', () => {
          beforeEach(async () => {
            // Redeem below required
            await setup.issuanceModule.connect(provider.getSigner(owner)).redeem(
              setToken.address,
              ether(9),
              owner
            );
            subjectSetTokenQuantity = ether(0.01);
          });

          it('should revert', async () => {
            await expect(subject()).to.be.rejectedWith('Supply must be greater than minimum to enable redemption');
          });
        });

        describe('when there is not sufficient reserve asset for withdraw', () => {
          beforeEach(async () => {
            // Add self as module and update the position state
            await setup.controller.addModule(owner);
            setToken = setToken.connect(provider.getSigner(owner));
            await setToken.addModule(owner);
            await setToken.initializeModule();

            // Remove USDC position
            await setToken.editDefaultPositionUnit(setup.usdc.address, ZERO);

            subjectSetTokenQuantity = ether(1);
          });

          it('should revert', async () => {
            await expect(subject()).to.be.rejectedWith('Must be greater than total available collateral');
          });
        });

        describe('when the redeem quantity is 0', () => {
          beforeEach(async () => {
            subjectSetTokenQuantity = ZERO;
          });

          it('should revert', async () => {
            await expect(subject()).to.be.rejectedWith('Quantity must be > 0');
          });
        });

        describe('when the reserve asset is not valid', () => {
          beforeEach(async () => {
            await setup.wbtc.approve(setup.controller.address, bitcoin(1000000));
            subjectReserveAsset = setup.wbtc.address;
          });

          it('should revert', async () => {
            await expect(subject()).to.be.rejectedWith('Must be valid reserve asset');
          });
        });

        describe('when reserve asset received is less than min required', () => {
          beforeEach(async () => {
            subjectMinReserveQuantityReceived = ether(100);
          });

          it('should revert', async () => {
            await expect(subject()).to.be.rejectedWith('Must be greater than min receive reserve quantity');
          });
        });

        describe('when the SetToken is not enabled on the controller', () => {
          beforeEach(async () => {
            const nonEnabledSetToken = await setup.createNonControllerEnabledSetToken(
              [setup.weth.address],
              [ether(1)],
              [navIssuanceModule.address]
            );

            subjectSetToken = nonEnabledSetToken.address;
          });

          it('should revert', async () => {
            await expect(subject()).to.be.rejectedWith('Must be a valid and initialized SetToken');
          });
        });
      });

      describe('when there are fees enabled and no redemption hooks', () => {
        let protocolDirectFee: BigNumber;
        let protocolManagerFee: BigNumber;

        beforeAll(async () => {
          managerRedemptionHook = ADDRESS_ZERO;
          managerFees = [ether(0.1), ether(0.1)];
          premiumPercentage = ether(0.005);
        });

        beforeEach(async () => {
          protocolDirectFee = ether(.02);
          await setup.controller.addFee(navIssuanceModule.address, THREE, protocolDirectFee);

          protocolManagerFee = ether(.3);
          await setup.controller.addFee(navIssuanceModule.address, ONE, protocolManagerFee);
        });

        async function subject(): Promise<ContractTransaction> {
          return navIssuanceModule.connect(provider.getSigner(subjectCaller)).redeem(
            subjectSetToken,
            subjectReserveAsset,
            subjectSetTokenQuantity,
            subjectMinReserveQuantityReceived,
            subjectTo
          );
        }

        it('should reduce the SetToken supply', async () => {
          const previousSupply = await setToken.totalSupply();
          const preRedeemBalance = await setToken.balanceOf(owner);
          await subject();
          const currentSupply = await setToken.totalSupply();
          const postRedeemBalance = await setToken.balanceOf(owner);

          expect(preRedeemBalance.sub(postRedeemBalance).toString()).to.eq(
            previousSupply.sub(currentSupply).toString()
          );
        });

        it('should have redeemed the reserve asset to the recipient', async () => {
          const setTokenValuation = await setup.setValuer.calculateSetTokenValuation(
            subjectSetToken,
            subjectReserveAsset
          );
          await subject();
          const postIssueUSDCBalance = await setup.usdc.balanceOf(recipient);
          const expectedUSDCBalance = getExpectedReserveRedeemQuantity(
            subjectSetTokenQuantity,
            setTokenValuation,
            usdc(1), // USDC base units
            managerFees[1],
            protocolDirectFee, // Protocol fee percentage
            premiumPercentage
          );
          expect(postIssueUSDCBalance.toString()).to.eq(expectedUSDCBalance.toString());
        });

        it('should have updated the reserve asset position correctly', async () => {
          const previousSetTokenSupply = await setToken.totalSupply();
          const setTokenValuation = await setup.setValuer.calculateSetTokenValuation(
            subjectSetToken,
            subjectReserveAsset
          );
          await subject();
          const currentSetTokenSupply = await setToken.totalSupply();
          const defaultPositionUnit = await setToken.getDefaultPositionRealUnit(subjectReserveAsset);

          // (Previous supply * previous units + current units) / current supply
          const newPositionMultiplier = await setToken.positionMultiplier();
          const expectedPositionUnit = getExpectedRedeemPositionUnit(
            units[1],
            redeemQuantity,
            setTokenValuation,
            usdc(1), // USDC base units
            previousSetTokenSupply,
            currentSetTokenSupply,
            newPositionMultiplier,
            managerFees[1],
            protocolDirectFee, // Protocol fee percentage
            premiumPercentage,
          );

          expect(defaultPositionUnit.toString()).to.eq(expectedPositionUnit.toString());
        });

        it('should have updated the position multiplier correctly', async () => {
          const previousSetTokenSupply = await setToken.totalSupply();
          const preIssuePositionMultiplier = await setToken.positionMultiplier();
          await subject();
          const currentSetTokenSupply = await setToken.totalSupply();
          const postIssuePositionMultiplier = await setToken.positionMultiplier();

          const expectedPositionMultiplier = getExpectedRedeemPositionMultiplier(
            preIssuePositionMultiplier,
            previousSetTokenSupply,
            currentSetTokenSupply
          );
          expect(postIssuePositionMultiplier.toString()).to.eq(expectedPositionMultiplier.toString());
        });

        it('should reconcile balances', async () => {
          await reconcileBalances(setToken, subject, owner);
        });
      });

      describe('when there are fees, premiums and an redemption hook', () => {
        let issuanceHookContract: ManagerIssuanceHookMock;

        beforeAll(async () => {
          issuanceHookContract = await deployer.mocks.deployManagerIssuanceHookMock();

          managerRedemptionHook = issuanceHookContract.address;
        });

        async function subject(): Promise<any> {
          return navIssuanceModule.connect(provider.getSigner(subjectCaller)).redeem(
            subjectSetToken,
            subjectReserveAsset,
            subjectSetTokenQuantity,
            subjectMinReserveQuantityReceived,
            subjectTo
          );
        }

        it('should properly call the pre-issue hooks', async () => {
          await subject();
          const retrievedSetToken = await issuanceHookContract.retrievedSetToken();
          const retrievedIssueQuantity = await issuanceHookContract.retrievedIssueQuantity();
          const retrievedSender = await issuanceHookContract.retrievedSender();
          const retrievedTo = await issuanceHookContract.retrievedTo();

          expect(retrievedSetToken).to.eq(subjectSetToken);
          expect(retrievedIssueQuantity.toString()).to.eq(subjectSetTokenQuantity.toString());
          expect(retrievedSender).to.eq(owner);
          expect(retrievedTo).to.eq(subjectTo);
        });
      });
    });
  });

  describe('#redeemIntoEther', () => {
    let setToken: SetToken;

    let subjectSetToken: Address;
    let subjectSetTokenQuantity: BigNumber;
    let subjectMinReserveQuantityReceived: BigNumber;
    let subjectTo: Address;
    let subjectCaller: Address;

    let navIssuanceSettings: NAVIssuanceSettings;
    let managerRedemptionHook: Address;
    let managerFees: BigNumber[];
    let premiumPercentage: BigNumber;
    let units: BigNumber[];
    let redeemQuantity: BigNumber;

    describe('when there are 4 components and reserve asset is USDC', () => {
      beforeEach(async () => {
        // Valued at 2000 USDC
        units = [ether(1), usdc(270), bitcoin(1).div(10), ether(600)];
        setToken = await setup.createSetToken(
          [setup.weth.address, setup.usdc.address, setup.wbtc.address, setup.dai.address],
          units, // Set is valued at 2000 USDC
          [setup.issuanceModule.address, navIssuanceModule.address]
        );
        const managerIssuanceHook = randomAddress;
        const reserveAssets = [setup.usdc.address, setup.weth.address];
        const managerFeeRecipient = feeRecipient;
        // Set max managerFee to 20%
        const maxManagerFee = ether(0.2);
        // Set max premium to 10%
        const maxPremiumPercentage = ether(0.1);
        // Set min SetToken supply required
        const minSetTokenSupply = ether(1);

        navIssuanceSettings = {
          managerIssuanceHook,
          managerRedemptionHook,
          reserveAssets,
          feeRecipient: managerFeeRecipient,
          managerFees,
          maxManagerFee,
          premiumPercentage,
          maxPremiumPercentage,
          minSetTokenSupply,
        } as NAVIssuanceSettings;

        await navIssuanceModule.initialize(setToken.address, navIssuanceSettings);
        // Approve tokens to the controller
        await setup.weth.approve(setup.controller.address, ether(100));
        await setup.usdc.approve(setup.controller.address, usdc(1000000));
        await setup.wbtc.approve(setup.controller.address, bitcoin(1000000));
        await setup.dai.approve(setup.controller.address, ether(1000000));

        // Seed with 10 supply
        await setup.issuanceModule.connect(provider.getSigner(owner)).initialize(setToken.address, ADDRESS_ZERO);
        await setup.issuanceModule.connect(provider.getSigner(owner)).issue(setToken.address, ether(10), owner);

        // Redeem 1 SetToken
        redeemQuantity = ether(1);

        subjectSetToken = setToken.address;
        subjectSetTokenQuantity = redeemQuantity;
        subjectMinReserveQuantityReceived = ether(0);
        subjectTo = recipient;
        subjectCaller = owner;
      });

      describe('when there are no fees and no redemption hooks', () => {
        beforeAll(async () => {
          managerRedemptionHook = ADDRESS_ZERO;
          // Set fees to 0
          managerFees = [ether(0), ether(0)];
          // Set premium percentage to 50 bps
          premiumPercentage = ether(0.005);
        });

        async function subject(): Promise<any> {
          return navIssuanceModule.connect(provider.getSigner(subjectCaller)).redeemIntoEther(
            subjectSetToken,
            subjectSetTokenQuantity,
            subjectMinReserveQuantityReceived,
            subjectTo,
          );
        }

        it('should reduce the SetToken supply', async () => {
          const previousSupply = await setToken.totalSupply();
          const preRedeemBalance = await setToken.balanceOf(owner);
          await subject();
          const currentSupply = await setToken.totalSupply();
          const postRedeemBalance = await setToken.balanceOf(owner);

          expect(preRedeemBalance.sub(postRedeemBalance).toString()).to.eq(
            previousSupply.sub(currentSupply).toString()
          );
        });

        it('should have redeemed the reserve asset to the recipient', async () => {
          const setTokenValuation = await setup.setValuer.calculateSetTokenValuation(
            subjectSetToken,
            setup.weth.address
          );
          const preIssueETHBalance = await provider.getBalance(recipient);
          await subject();
          const postIssueETHBalance = await provider.getBalance(recipient);
          const expectedETHBalance = getExpectedReserveRedeemQuantity(
            subjectSetTokenQuantity,
            setTokenValuation,
            ether(1), // ETH base units
            managerFees[1],
            ZERO, // Protocol fee percentage
            premiumPercentage
          );
          expect(postIssueETHBalance.sub(preIssueETHBalance).toString()).to.eq(
            expectedETHBalance.toString()
          );
        });

        it('should have updated the reserve asset position correctly', async () => {
          const previousSetTokenSupply = await setToken.totalSupply();
          const setTokenValuation = await setup.setValuer.calculateSetTokenValuation(
            subjectSetToken,
            setup.weth.address
          );
          await subject();
          const currentSetTokenSupply = await setToken.totalSupply();
          const defaultPositionUnit = await setToken.getDefaultPositionRealUnit(setup.weth.address);

          const newPositionMultiplier = await setToken.positionMultiplier();
          const expectedPositionUnit = getExpectedRedeemPositionUnit(
            units[0],
            redeemQuantity,
            setTokenValuation,
            ether(1), // ETH base units
            previousSetTokenSupply,
            currentSetTokenSupply,
            newPositionMultiplier,
            managerFees[1],
            ZERO, // Protocol fee percentage
            premiumPercentage,
          );

          expect(defaultPositionUnit.toString()).to.eq(expectedPositionUnit.toString());
        });

        it('should have updated the position multiplier correctly', async () => {
          const previousSetTokenSupply = await setToken.totalSupply();
          const preIssuePositionMultiplier = await setToken.positionMultiplier();
          await subject();
          const currentSetTokenSupply = await setToken.totalSupply();
          const postIssuePositionMultiplier = await setToken.positionMultiplier();

          const expectedPositionMultiplier = getExpectedRedeemPositionMultiplier(
            preIssuePositionMultiplier,
            previousSetTokenSupply,
            currentSetTokenSupply
          );
          expect(postIssuePositionMultiplier.toString()).to.eq(expectedPositionMultiplier.toString());
        });

        it('should reconcile balances', async () => {
          await reconcileBalances(setToken, subject, owner);
        });

        describe('when total supply is less than min required for NAV issuance', () => {
          beforeEach(async () => {
            // Redeem below required
            await setup.issuanceModule.connect(provider.getSigner(owner)).redeem(
              setToken.address,
              ether(9),
              owner
            );
            subjectSetTokenQuantity = ether(0.01);
          });

          it('should revert', async () => {
            await expect(subject()).to.be.rejectedWith('Supply must be greater than minimum to enable redemption');
          });
        });

        describe('when there is not sufficient reserve asset for withdraw', () => {
          beforeEach(async () => {
            // Add self as module and update the position state
            await setup.controller.addModule(owner);
            setToken = setToken.connect(provider.getSigner(owner));
            await setToken.addModule(owner);
            await setToken.initializeModule();

            // Remove WETH position
            await setToken.editDefaultPositionUnit(setup.weth.address, ZERO);

            subjectSetTokenQuantity = ether(1);
          });

          it('should revert', async () => {
            await expect(subject()).to.be.rejectedWith('Must be greater than total available collateral');
          });
        });

        describe('when the redeem quantity is 0', () => {
          beforeEach(async () => {
            subjectSetTokenQuantity = ZERO;
          });

          it('should revert', async () => {
            await expect(subject()).to.be.rejectedWith('Quantity must be > 0');
          });
        });

        describe('when reserve asset received is less than min required', () => {
          beforeEach(async () => {
            subjectMinReserveQuantityReceived = ether(100);
          });

          it('should revert', async () => {
            await expect(subject()).to.be.rejectedWith('Must be greater than min receive reserve quantity');
          });
        });

        describe('when the SetToken is not enabled on the controller', () => {
          beforeEach(async () => {
            const nonEnabledSetToken = await setup.createNonControllerEnabledSetToken(
              [setup.weth.address],
              [ether(1)],
              [navIssuanceModule.address]
            );

            subjectSetToken = nonEnabledSetToken.address;
          });

          it('should revert', async () => {
            await expect(subject()).to.be.rejectedWith('Must be a valid and initialized SetToken');
          });
        });
      });

      describe('when there are fees enabled and no redemption hooks', () => {
        let protocolDirectFee: BigNumber;
        let protocolManagerFee: BigNumber;

        beforeAll(async () => {
          managerRedemptionHook = ADDRESS_ZERO;
          managerFees = [ether(0.1), ether(0.1)];
          premiumPercentage = ether(0.005);
        });

        beforeEach(async () => {
          protocolDirectFee = ether(.02);
          await setup.controller.addFee(navIssuanceModule.address, THREE, protocolDirectFee);

          protocolManagerFee = ether(.3);
          await setup.controller.addFee(navIssuanceModule.address, ONE, protocolManagerFee);
        });

        async function subject(): Promise<any> {
          return navIssuanceModule.connect(provider.getSigner(subjectCaller)).redeemIntoEther(
            subjectSetToken,
            subjectSetTokenQuantity,
            subjectMinReserveQuantityReceived,
            subjectTo,
          );
        }

        it('should reduce the SetToken supply', async () => {
          const previousSupply = await setToken.totalSupply();
          const preRedeemBalance = await setToken.balanceOf(owner);
          await subject();
          const currentSupply = await setToken.totalSupply();
          const postRedeemBalance = await setToken.balanceOf(owner);

          expect(preRedeemBalance.sub(postRedeemBalance).toString()).to.eq(
            previousSupply.sub(currentSupply).toString()
          );
        });

        it('should have redeemed the reserve asset to the recipient', async () => {
          const setTokenValuation = await setup.setValuer.calculateSetTokenValuation(
            subjectSetToken,
            setup.weth.address
          );
          const preIssueETHBalance = await provider.getBalance(recipient);
          await subject();
          const postIssueETHBalance = await provider.getBalance(recipient);
          const expectedETHBalance = getExpectedReserveRedeemQuantity(
            subjectSetTokenQuantity,
            setTokenValuation,
            ether(1), // ETH base units
            managerFees[1],
            protocolDirectFee, // Protocol direct fee percentage
            premiumPercentage
          );
          expect(postIssueETHBalance.sub(preIssueETHBalance).toString()).to.eq(
            expectedETHBalance.toString()
          );
        });

        it('should have updated the reserve asset position correctly', async () => {
          const previousSetTokenSupply = await setToken.totalSupply();
          const setTokenValuation = await setup.setValuer.calculateSetTokenValuation(
            subjectSetToken,
            setup.weth.address
          );
          await subject();
          const currentSetTokenSupply = await setToken.totalSupply();
          const defaultPositionUnit = await setToken.getDefaultPositionRealUnit(setup.weth.address);

          const newPositionMultiplier = await setToken.positionMultiplier();
          const expectedPositionUnit = getExpectedRedeemPositionUnit(
            units[0],
            redeemQuantity,
            setTokenValuation,
            ether(1), // ETH base units
            previousSetTokenSupply,
            currentSetTokenSupply,
            newPositionMultiplier,
            managerFees[1],
            protocolDirectFee, // Protocol direct fee percentage
            premiumPercentage,
          );

          expect(defaultPositionUnit.toString()).to.eq(expectedPositionUnit.toString());
        });

        it('should have updated the position multiplier correctly', async () => {
          const previousSetTokenSupply = await setToken.totalSupply();
          const preIssuePositionMultiplier = await setToken.positionMultiplier();
          await subject();
          const currentSetTokenSupply = await setToken.totalSupply();
          const postIssuePositionMultiplier = await setToken.positionMultiplier();

          const expectedPositionMultiplier = getExpectedRedeemPositionMultiplier(
            preIssuePositionMultiplier,
            previousSetTokenSupply,
            currentSetTokenSupply
          );
          expect(postIssuePositionMultiplier.toString()).to.eq(expectedPositionMultiplier.toString());
        });

        it('should reconcile balances', async () => {
          await reconcileBalances(setToken, subject, owner);
        });
      });
    });
  });
});