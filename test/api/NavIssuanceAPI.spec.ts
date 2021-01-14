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

import { ethers, ContractTransaction } from 'ethers';
import { BigNumber } from 'ethers/lib/ethers';
import { Address, NAVIssuanceSettings } from '@setprotocol/set-protocol-v2/utils/types';
import { ether } from '@setprotocol/set-protocol-v2/dist/utils/common';

import NavIssuanceAPI from '@src/api/NavIssuanceAPI';
import NavIssuanceModuleWrapper from '@src/wrappers/set-protocol-v2/NavIssuanceModuleWrapper';
import { expect } from '@test/utils/chai';

const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');

jest.mock('@src/wrappers/set-protocol-v2/NavIssuanceModuleWrapper');

describe('NavIssuanceAPI', () => {
  let navIssuanceModuleAddress: Address;
  let randomAddress: Address;
  let randomAddress2: Address;
  let owner: Address;
  let setTokenAddress: Address;
  let usdcAddress: Address;
  let wethAddress: Address;
  let feeRecipient: Address;

  let navIssuanceModuleWrapper: NavIssuanceModuleWrapper;
  let navIssuanceAPI: NavIssuanceAPI;

  beforeEach(async () => {
    [
      owner,
      setTokenAddress,
      randomAddress,
      randomAddress2,
      feeRecipient,
      navIssuanceModuleAddress,
      usdcAddress,
      wethAddress,
    ] = await provider.listAccounts();

    navIssuanceAPI = new NavIssuanceAPI(provider, navIssuanceModuleAddress);
    navIssuanceModuleWrapper = (NavIssuanceModuleWrapper as any).mock.instances[0];
  });

  afterEach(async () => {
    (NavIssuanceModuleWrapper as any).mockClear();
  });

  describe('#initializeAsync', () => {
    let managerIssuanceHook: Address;
    let managerRedemptionHook: Address;
    let reserveAssets: Address[];
    let managerFeeRecipient: Address;
    let managerFees: [BigNumber, BigNumber];
    let maxManagerFee: BigNumber;
    let premiumPercentage: BigNumber;
    let maxPremiumPercentage: BigNumber;
    let minSetTokenSupply: BigNumber;

    let subjectNAVIssuanceSettings: NAVIssuanceSettings;
    let subjectSetToken: Address;
    let subjectCaller: Address;
    let subjectTransactionOptions: any;

    beforeEach(async () => {
      managerIssuanceHook = randomAddress;
      managerRedemptionHook = randomAddress2;
      reserveAssets = [usdcAddress, wethAddress];
      managerFeeRecipient = feeRecipient;
      // Set manager issue fee to 0.1% and redeem to 0.2%
      managerFees = [ether(0.001), ether(0.002)];
      // Set max managerFee to 2%
      maxManagerFee = ether(0.02);
      // Set premium to 1%
      premiumPercentage = ether(0.01);
      // Set max premium to 10%
      maxPremiumPercentage = ether(0.1);
      // Set min SetToken supply to 100 units
      minSetTokenSupply = ether(100);

      subjectSetToken = setTokenAddress;
      subjectNAVIssuanceSettings = {
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
      subjectTransactionOptions = {};
      subjectCaller = owner;
    });

    async function subject(): Promise<any> {
      return navIssuanceAPI.initializeAsync(
        subjectSetToken,
        subjectNAVIssuanceSettings,
        subjectCaller,
        subjectTransactionOptions
      );
    }

    it('should call initialize on the NavIssuanceModuleWrapper', async () => {
      await subject();

      expect(navIssuanceModuleWrapper.initialize).to.have.beenCalledWith(
        subjectSetToken,
        subjectNAVIssuanceSettings,
        subjectCaller,
        subjectTransactionOptions
      );
    });
  });

  describe('#issueAsync', () => {
    let subjectSetTokenAddress: Address;
    let subjectReserveAsset: Address;
    let subjectReserveAssetQuantity: BigNumber;
    let subjectMinSetTokenReceiveQuantity: BigNumber;
    let subjectTo: Address;
    let subjectCallerAddress: Address;
    let subjectTransactionOptions: any;

    beforeEach(async () => {
      subjectSetTokenAddress = '0xEC0815AA9B462ed4fC84B5dFc43Fd2a10a54B569';
      subjectReserveAsset = '0xEC0815AA9B462ed4fC84B5dFc43Fd2a10a54B579';
      subjectReserveAssetQuantity = ether(1);
      subjectMinSetTokenReceiveQuantity = ether(0.1);
      subjectTo = '0x0872262A92581EC09C2d522b48bCcd9E3C8ACf9C';
      subjectCallerAddress = '0x0e2298E3B3390e3b945a5456fBf59eCc3f55DA16';
      subjectTransactionOptions = {};
    });

    async function subject(): Promise<ContractTransaction> {
      return await navIssuanceAPI.issueAsync(
        subjectSetTokenAddress,
        subjectReserveAsset,
        subjectReserveAssetQuantity,
        subjectMinSetTokenReceiveQuantity,
        subjectTo,
        subjectCallerAddress,
        subjectTransactionOptions
      );
    }

    it('should call the NavIssuanceModuleWrapper with correct params', async () => {
      await subject();

      expect(navIssuanceModuleWrapper.issue).to.have.beenCalledWith(
        subjectSetTokenAddress,
        subjectReserveAsset,
        subjectReserveAssetQuantity,
        subjectMinSetTokenReceiveQuantity,
        subjectTo,
        subjectCallerAddress,
        subjectTransactionOptions
      );
    });

    describe('when the SetToken address is invalid', () => {
      beforeEach(async () => {
        subjectSetTokenAddress = '0xInvalidAddress';
      });

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('Validation error');
      });
    });

    describe('when the SetToken recipient address is invalid', () => {
      beforeEach(async () => {
        subjectReserveAsset = '0xInvalidAddress';
      });

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('Validation error');
      });
    });

    describe('when the SetToken recipient address is invalid', () => {
      beforeEach(async () => {
        subjectTo = '0xInvalidAddress';
      });

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('Validation error');
      });
    });

    describe('when the reserve asset quantity is invalid', () => {
      beforeEach(async () => {
        subjectReserveAssetQuantity = ether(0);
      });

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('reserveAssetQuantity needs to be greater than zero');
      });
    });
  });

  describe('#issueWithEtherAsync', () => {
    let subjectSetTokenAddress: Address;
    let subjectSetTokenRecipient: Address;
    let subjectQuantity: BigNumber;
    let subjectCallerAddress: Address;
    let subjectTransactionOptions: any;

    beforeEach(async () => {
      subjectSetTokenAddress = '0xEC0815AA9B462ed4fC84B5dFc43Fd2a10a54B569';
      subjectQuantity = ether(1);
      subjectSetTokenRecipient = '0x0872262A92581EC09C2d522b48bCcd9E3C8ACf9C';
      subjectCallerAddress = '0x0e2298E3B3390e3b945a5456fBf59eCc3f55DA16';
      subjectTransactionOptions = {};
    });

    async function subject(): Promise<ContractTransaction> {
      return await navIssuanceAPI.issueWithEtherAsync(
        subjectSetTokenAddress,
        subjectQuantity,
        subjectSetTokenRecipient,
        subjectCallerAddress,
        subjectTransactionOptions
      );
    }

    it('should call the NavIssuanceModuleWrapper with correct params', async () => {
      await subject();

      expect(navIssuanceModuleWrapper.issueWithEther).to.have.beenCalledWith(
        subjectSetTokenAddress,
        subjectQuantity,
        subjectSetTokenRecipient,
        subjectCallerAddress,
        subjectTransactionOptions
      );
    });

    describe('when the SetToken address is invalid', () => {
      beforeEach(async () => {
        subjectSetTokenAddress = '0xInvalidAddress';
      });

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('Validation error');
      });
    });

    describe('when the SetToken recipient address is invalid', () => {
      beforeEach(async () => {
        subjectSetTokenRecipient = '0xInvalidAddress';
      });

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('Validation error');
      });
    });

    describe('when the quantity is invalid', () => {
      beforeEach(async () => {
        subjectQuantity = ether(0);
      });

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('quantity needs to be greater than zero');
      });
    });
  });


  describe('#redeemAsync', () => {
    let subjectSetTokenAddress: Address;
    let subjectReserveAsset: Address;
    let subjectSetTokenQuantity: BigNumber;
    let subjectMinReserveReceiveQuantity: BigNumber;
    let subjectTo: Address;
    let subjectCallerAddress: Address;
    let subjectTransactionOptions: any;

    beforeEach(async () => {
      subjectSetTokenAddress = '0xEC0815AA9B462ed4fC84B5dFc43Fd2a10a54B569';
      subjectSetTokenQuantity = ether(1);
      subjectMinReserveReceiveQuantity = ether(0.01);
      subjectReserveAsset = '0x0872262A92581EC09C2d522b48bCcd9E3C8ACf9C';
      subjectTo = '0x0872262A92581EC09C2d522b48bCcd9E3C8ACf9D';
      subjectCallerAddress = '0x0e2298E3B3390e3b945a5456fBf59eCc3f55DA16';
      subjectTransactionOptions = {};
    });

    async function subject(): Promise<ContractTransaction> {
      return await navIssuanceAPI.redeemAsync(
        subjectSetTokenAddress,
        subjectReserveAsset,
        subjectSetTokenQuantity,
        subjectMinReserveReceiveQuantity,
        subjectTo,
        subjectCallerAddress,
        subjectTransactionOptions
      );
    }

    it('should call the NavIssuanceModuleWrapper with correct params', async () => {
      await subject();

      expect(navIssuanceModuleWrapper.redeem).to.have.beenCalledWith(
        subjectSetTokenAddress,
        subjectReserveAsset,
        subjectSetTokenQuantity,
        subjectMinReserveReceiveQuantity,
        subjectTo,
        subjectCallerAddress,
        subjectTransactionOptions
      );
    });

    describe('when the SetToken address is invalid', () => {
      beforeEach(async () => {
        subjectSetTokenAddress = '0xInvalidAddress';
      });

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('Validation error');
      });
    });

    describe('when the SetToken address is invalid', () => {
      beforeEach(async () => {
        subjectTo = '0xInvalidAddress';
      });

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('Validation error');
      });
    });

    describe('when the SetToken address is invalid', () => {
      beforeEach(async () => {
        subjectReserveAsset = '0xInvalidAddress';
      });

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('Validation error');
      });
    });

    describe('when the set token quantity is invalid', () => {
      beforeEach(async () => {
        subjectSetTokenQuantity = ether(0);
      });

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('setTokenQuantity needs to be greater than zero');
      });
    });
  });

  describe('#redeemIntoEtherAsync', () => {
    let subjectSetTokenAddress: Address;
    let subjectSetTokenQuantity: BigNumber;
    let subjectMinReserveReceiveQuantity: BigNumber;
    let subjectTo: Address;
    let subjectCallerAddress: Address;
    let subjectTransactionOptions: any;

    beforeEach(async () => {
      subjectSetTokenAddress = '0xEC0815AA9B462ed4fC84B5dFc43Fd2a10a54B569';
      subjectSetTokenQuantity = ether(1);
      subjectMinReserveReceiveQuantity = ether(0.01);
      subjectTo = '0x0872262A92581EC09C2d522b48bCcd9E3C8ACf9D';
      subjectCallerAddress = '0x0e2298E3B3390e3b945a5456fBf59eCc3f55DA16';
      subjectTransactionOptions = {};
    });

    async function subject(): Promise<ContractTransaction> {
      return await navIssuanceAPI.redeemIntoEtherAsync(
        subjectSetTokenAddress,
        subjectSetTokenQuantity,
        subjectMinReserveReceiveQuantity,
        subjectTo,
        subjectCallerAddress,
        subjectTransactionOptions
      );
    }

    it('should call the NavIssuanceModuleWrapper with correct params', async () => {
      await subject();

      expect(navIssuanceModuleWrapper.redeemIntoEther).to.have.beenCalledWith(
        subjectSetTokenAddress,
        subjectSetTokenQuantity,
        subjectMinReserveReceiveQuantity,
        subjectTo,
        subjectCallerAddress,
        subjectTransactionOptions
      );
    });

    describe('when the SetToken address is invalid', () => {
      beforeEach(async () => {
        subjectSetTokenAddress = '0xInvalidAddress';
      });

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('Validation error');
      });
    });

    describe('when the SetToken address is invalid', () => {
      beforeEach(async () => {
        subjectTo = '0xInvalidAddress';
      });

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('Validation error');
      });
    });

    describe('when the set token quantity is invalid', () => {
      beforeEach(async () => {
        subjectSetTokenQuantity = ether(0);
      });

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('setTokenQuantity needs to be greater than zero');
      });
    });
  });

  describe('#getReserveAssetsAsync', () => {
    let subjectSetTokenAddress: Address;

    beforeEach(async () => {
      subjectSetTokenAddress = '0xEC0815AA9B462ed4fC84B5dFc43Fd2a10a54B569';
    });

    async function subject(): Promise<Address[]> {
      return await navIssuanceAPI.getReserveAssetsAsync(
        subjectSetTokenAddress
      );
    }

    it('should call the NavIssuanceModuleWrapper with correct params', async () => {
      await subject();

      expect(navIssuanceModuleWrapper.getReserveAssets).to.have.beenCalledWith(
        subjectSetTokenAddress
      );
    });

    describe('when the SetToken address is invalid', () => {
      beforeEach(async () => {
        subjectSetTokenAddress = '0xInvalidAddress';
      });

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('Validation error');
      });
    });
  });

  describe('#getIssuePremiumAsync', () => {
    let subjectSetTokenAddress: Address;
    let subjectReserveAsset: Address;
    let subjectReserveAssetQuantity: BigNumber;

    beforeEach(async () => {
      subjectSetTokenAddress = '0xEC0815AA9B462ed4fC84B5dFc43Fd2a10a54B569';
      subjectReserveAsset = '0xEC0815AA9B462ed4fC84B5dFc43Fd2a10a54B579';
      subjectReserveAssetQuantity = ether(1);
    });

    async function subject(): Promise<BigNumber> {
      return await navIssuanceAPI.getIssuePremiumAsync(
        subjectSetTokenAddress,
        subjectReserveAsset,
        subjectReserveAssetQuantity
      );
    }

    it('should call the NavIssuanceModuleWrapper with correct params', async () => {
      await subject();

      expect(navIssuanceModuleWrapper.getIssuePremium).to.have.beenCalledWith(
        subjectSetTokenAddress,
        subjectReserveAsset,
        subjectReserveAssetQuantity
      );
    });

    describe('when the SetToken address is invalid', () => {
      beforeEach(async () => {
        subjectSetTokenAddress = '0xInvalidAddress';
      });

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('Validation error');
      });
    });

    describe('when the SetToken address is invalid', () => {
      beforeEach(async () => {
        subjectReserveAsset = '0xInvalidAddress';
      });

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('Validation error');
      });
    });

    describe('when the reserve asset quantity is invalid', () => {
      beforeEach(async () => {
        subjectReserveAssetQuantity = ether(0);
      });

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('reserveAssetQuantity needs to be greater than zero');
      });
    });
  });

  describe('#getRedeemPremiumAsync', () => {
    let subjectSetTokenAddress: Address;
    let subjectReserveAsset: Address;
    let subjectSetTokenQuantity: BigNumber;

    beforeEach(async () => {
      subjectSetTokenAddress = '0xEC0815AA9B462ed4fC84B5dFc43Fd2a10a54B569';
      subjectReserveAsset = '0xEC0815AA9B462ed4fC84B5dFc43Fd2a10a54B579';
      subjectSetTokenQuantity = ether(1);
    });

    async function subject(): Promise<BigNumber> {
      return await navIssuanceAPI.getRedeemPremiumAsync(
        subjectSetTokenAddress,
        subjectReserveAsset,
        subjectSetTokenQuantity
      );
    }

    it('should call the NavIssuanceModuleWrapper with correct params', async () => {
      await subject();

      expect(navIssuanceModuleWrapper.getRedeemPremium).to.have.beenCalledWith(
        subjectSetTokenAddress,
        subjectReserveAsset,
        subjectSetTokenQuantity
      );
    });

    describe('when the SetToken address is invalid', () => {
      beforeEach(async () => {
        subjectSetTokenAddress = '0xInvalidAddress';
      });

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('Validation error');
      });
    });

    describe('when the SetToken address is invalid', () => {
      beforeEach(async () => {
        subjectReserveAsset = '0xInvalidAddress';
      });

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('Validation error');
      });
    });

    describe('when the set token quantity is invalid', () => {
      beforeEach(async () => {
        subjectSetTokenQuantity = ether(0);
      });

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('setTokenQuantity needs to be greater than zero');
      });
    });
  });

  describe('#getManagerFeeAsync', () => {
    let subjectSetTokenAddress: Address;
    let subjectManagerFeeIndex: BigNumber;

    beforeEach(async () => {
      subjectSetTokenAddress = '0xEC0815AA9B462ed4fC84B5dFc43Fd2a10a54B569';
      subjectManagerFeeIndex = BigNumber.from(0);
    });

    async function subject(): Promise<BigNumber> {
      return await navIssuanceAPI.getManagerFeeAsync(
        subjectSetTokenAddress,
        subjectManagerFeeIndex
      );
    }

    it('should call the NavIssuanceModuleWrapper with correct params', async () => {
      await subject();

      expect(navIssuanceModuleWrapper.getManagerFee).to.have.beenCalledWith(
        subjectSetTokenAddress,
        subjectManagerFeeIndex
      );
    });

    describe('when the SetToken address is invalid', () => {
      beforeEach(async () => {
        subjectSetTokenAddress = '0xInvalidAddress';
      });

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('Validation error');
      });
    });
  });

  describe('#getExpectedSetTokenIssueQuantityAsync', () => {
    let subjectSetTokenAddress: Address;
    let subjectReserveAsset: Address;
    let subjectReserveAssetQuantity: BigNumber;

    beforeEach(async () => {
      subjectSetTokenAddress = '0xEC0815AA9B462ed4fC84B5dFc43Fd2a10a54B569';
      subjectReserveAsset = '0xEC0815AA9B462ed4fC84B5dFc43Fd2a10a54B579';
      subjectReserveAssetQuantity = ether(1);
    });

    async function subject(): Promise<BigNumber> {
      return await navIssuanceAPI.getExpectedSetTokenIssueQuantityAsync(
        subjectSetTokenAddress,
        subjectReserveAsset,
        subjectReserveAssetQuantity
      );
    }

    it('should call the NavIssuanceModuleWrapper with correct params', async () => {
      await subject();

      expect(navIssuanceModuleWrapper.getExpectedSetTokenIssueQuantity).to.have.beenCalledWith(
        subjectSetTokenAddress,
        subjectReserveAsset,
        subjectReserveAssetQuantity
      );
    });

    describe('when the SetToken address is invalid', () => {
      beforeEach(async () => {
        subjectSetTokenAddress = '0xInvalidAddress';
      });

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('Validation error');
      });
    });

    describe('when the SetToken address is invalid', () => {
      beforeEach(async () => {
        subjectReserveAsset = '0xInvalidAddress';
      });

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('Validation error');
      });
    });

    describe('when the reserve asset quantity is invalid', () => {
      beforeEach(async () => {
        subjectReserveAssetQuantity = ether(0);
      });

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('reserveAssetQuantity needs to be greater than zero');
      });
    });
  });

  describe('#getExpectedReserveRedeemQuantityAsync', () => {
    let subjectSetTokenAddress: Address;
    let subjectReserveAsset: Address;
    let subjectSetTokenQuantity: BigNumber;

    beforeEach(async () => {
      subjectSetTokenAddress = '0xEC0815AA9B462ed4fC84B5dFc43Fd2a10a54B569';
      subjectReserveAsset = '0xEC0815AA9B462ed4fC84B5dFc43Fd2a10a54B579';
      subjectSetTokenQuantity = ether(1);
    });

    async function subject(): Promise<BigNumber> {
      return await navIssuanceAPI.getExpectedReserveRedeemQuantityAsync(
        subjectSetTokenAddress,
        subjectReserveAsset,
        subjectSetTokenQuantity
      );
    }

    it('should call the NavIssuanceModuleWrapper with correct params', async () => {
      await subject();

      expect(navIssuanceModuleWrapper.getExpectedReserveRedeemQuantity).to.have.beenCalledWith(
        subjectSetTokenAddress,
        subjectReserveAsset,
        subjectSetTokenQuantity
      );
    });

    describe('when the SetToken address is invalid', () => {
      beforeEach(async () => {
        subjectSetTokenAddress = '0xInvalidAddress';
      });

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('Validation error');
      });
    });

    describe('when the SetToken address is invalid', () => {
      beforeEach(async () => {
        subjectReserveAsset = '0xInvalidAddress';
      });

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('Validation error');
      });
    });

    describe('when the set token quantity is invalid', () => {
      beforeEach(async () => {
        subjectSetTokenQuantity = ether(0);
      });

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('setTokenQuantity needs to be greater than zero');
      });
    });
  });

  describe('#isIssueValidAsync', () => {
    let subjectSetTokenAddress: Address;
    let subjectReserveAsset: Address;
    let subjectReserveAssetQuantity: BigNumber;

    beforeEach(async () => {
      subjectSetTokenAddress = '0xEC0815AA9B462ed4fC84B5dFc43Fd2a10a54B569';
      subjectReserveAsset = '0xEC0815AA9B462ed4fC84B5dFc43Fd2a10a54B579';
      subjectReserveAssetQuantity = ether(1);
    });

    async function subject(): Promise<boolean> {
      return await navIssuanceAPI.isIssueValidAsync(
        subjectSetTokenAddress,
        subjectReserveAsset,
        subjectReserveAssetQuantity
      );
    }

    it('should call the NavIssuanceModuleWrapper with correct params', async () => {
      await subject();

      expect(navIssuanceModuleWrapper.isIssueValid).to.have.beenCalledWith(
        subjectSetTokenAddress,
        subjectReserveAsset,
        subjectReserveAssetQuantity
      );
    });

    describe('when the SetToken address is invalid', () => {
      beforeEach(async () => {
        subjectSetTokenAddress = '0xInvalidAddress';
      });

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('Validation error');
      });
    });

    describe('when the SetToken address is invalid', () => {
      beforeEach(async () => {
        subjectReserveAsset = '0xInvalidAddress';
      });

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('Validation error');
      });
    });

    describe('when the reserve asset quantity is invalid', () => {
      beforeEach(async () => {
        subjectReserveAssetQuantity = ether(0);
      });

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('reserveAssetQuantity needs to be greater than zero');
      });
    });
  });

  describe('#isRedeemValidAsync', () => {
    let subjectSetTokenAddress: Address;
    let subjectReserveAsset: Address;
    let subjectSetTokenQuantity: BigNumber;

    beforeEach(async () => {
      subjectSetTokenAddress = '0xEC0815AA9B462ed4fC84B5dFc43Fd2a10a54B569';
      subjectReserveAsset = '0xEC0815AA9B462ed4fC84B5dFc43Fd2a10a54B579';
      subjectSetTokenQuantity = ether(1);
    });

    async function subject(): Promise<boolean> {
      return await navIssuanceAPI.isRedeemValidAsync(
        subjectSetTokenAddress,
        subjectReserveAsset,
        subjectSetTokenQuantity
      );
    }

    it('should call the NavIssuanceModuleWrapper with correct params', async () => {
      await subject();

      expect(navIssuanceModuleWrapper.isRedeemValid).to.have.beenCalledWith(
        subjectSetTokenAddress,
        subjectReserveAsset,
        subjectSetTokenQuantity
      );
    });

    describe('when the SetToken address is invalid', () => {
      beforeEach(async () => {
        subjectSetTokenAddress = '0xInvalidAddress';
      });

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('Validation error');
      });
    });

    describe('when the SetToken address is invalid', () => {
      beforeEach(async () => {
        subjectReserveAsset = '0xInvalidAddress';
      });

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('Validation error');
      });
    });

    describe('when the set token quantity is invalid', () => {
      beforeEach(async () => {
        subjectSetTokenQuantity = ether(0);
      });

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('setTokenQuantity needs to be greater than zero');
      });
    });
  });
});
