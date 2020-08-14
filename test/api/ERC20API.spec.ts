/*
  Copyright 2020 Set Labs Inc.

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
import { BigNumber } from 'ethers/utils';
import { ether } from 'set-protocol-v2/dist/utils/common';
import { Address } from 'set-protocol-v2/utils/types';

import ERC20API from '@src/api/ERC20API';
import ERC20Wrapper from '@src/wrappers/set-protocol-v2/ERC20Wrapper';
import { expect } from '../utils/chai';

const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');

jest.mock('@src/wrappers/set-protocol-v2/ERC20Wrapper');


describe('ERC20API', () => {
  let tokenAddress: Address;
  let userAddress: Address;
  let externalAddress: Address;
  let proxyAddress: Address;
  let erc20API: ERC20API;
  let erc20Wrapper: ERC20Wrapper;

  beforeEach(async () => {
    [
      tokenAddress,
      userAddress,
      externalAddress,
      proxyAddress,
    ] = await provider.listAccounts();

    erc20API = new ERC20API(provider);
    erc20Wrapper = (ERC20Wrapper as any).mock.instances[0];
  });

  afterEach(() => {
    (ERC20Wrapper as any).mockClear();
  });

  describe('#getBalanceAsync', () => {
    let subjectTokenAddress: Address;
    let subjectHolderAddress: Address;

    beforeEach(async () => {
      subjectTokenAddress = '0xEC0815AA9B462ed4fC84B5dFc43Fd2a10a54B569';
      subjectHolderAddress = '0x0e2298E3B3390e3b945a5456fBf59eCc3f55DA16';
    });

    async function subject(): Promise<BigNumber> {
      return await erc20API.getBalanceAsync(
        subjectTokenAddress,
        subjectHolderAddress
      );
    }

    it('should call the ERC20Wrapper with correct params', async () => {
      await subject();

      expect(erc20Wrapper.balanceOf).to.have.beenCalledWith(
        subjectTokenAddress,
        subjectHolderAddress
      );
    });

    describe('when the SetToken address is invalid', () => {
      beforeEach(async () => {
        subjectTokenAddress = '0xInvalidAddress';
      });

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('Validation error');
      });
    });
  });

  describe('#getTokenNameAsync', () => {
    let subjectTokenAddress: Address;

    beforeEach(async () => {
      subjectTokenAddress = '0xEC0815AA9B462ed4fC84B5dFc43Fd2a10a54B569';
    });

    async function subject(): Promise<string> {
      return await erc20API.getTokenNameAsync(
        subjectTokenAddress,
      );
    }

    it('should call the ERC20Wrapper with correct params', async () => {
      await subject();

      expect(erc20Wrapper.name).to.have.beenCalledWith(subjectTokenAddress);
    });

    describe('when the SetToken address is invalid', () => {
      beforeEach(async () => {
        subjectTokenAddress = '0xInvalidAddress';
      });

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('Validation error');
      });
    });
  });

  describe('#getTokenSymbolAsync', () => {
    let subjectTokenAddress: Address;

    beforeEach(async () => {
      subjectTokenAddress = '0xEC0815AA9B462ed4fC84B5dFc43Fd2a10a54B569';
    });

    async function subject(): Promise<string> {
      return await erc20API.getTokenSymbolAsync(
        subjectTokenAddress,
      );
    }

    it('should call the ERC20Wrapper with correct params', async () => {
      await subject();

      expect(erc20Wrapper.symbol).to.have.beenCalledWith(subjectTokenAddress);
    });

    describe('when the SetToken address is invalid', () => {
      beforeEach(async () => {
        subjectTokenAddress = '0xInvalidAddress';
      });

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('Validation error');
      });
    });
  });

  describe('#getTotalSupplyAsync', () => {
    let subjectTokenAddress: Address;

    beforeEach(async () => {
      subjectTokenAddress = '0xEC0815AA9B462ed4fC84B5dFc43Fd2a10a54B569';
    });

    async function subject(): Promise<BigNumber> {
      return await erc20API.getTotalSupplyAsync(
        subjectTokenAddress,
      );
    }

    it('should call the ERC20Wrapper with correct params', async () => {
      await subject();

      expect(erc20Wrapper.totalSupply).to.have.beenCalledWith(subjectTokenAddress);
    });

    describe('when the SetToken address is invalid', () => {
      beforeEach(async () => {
        subjectTokenAddress = '0xInvalidAddress';
      });

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('Validation error');
      });
    });
  });

  describe('#getDecimalsAsync', () => {
    let subjectTokenAddress: Address;

    beforeEach(async () => {
      subjectTokenAddress = '0xEC0815AA9B462ed4fC84B5dFc43Fd2a10a54B569';
    });

    async function subject(): Promise<BigNumber> {
      return await erc20API.getDecimalsAsync(
        subjectTokenAddress,
      );
    }

    it('should call the ERC20Wrapper with correct params', async () => {
      await subject();

      expect(erc20Wrapper.decimals).to.have.beenCalledWith(subjectTokenAddress);
    });

    describe('when the SetToken address is invalid', () => {
      beforeEach(async () => {
        subjectTokenAddress = '0xInvalidAddress';
      });

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('Validation error');
      });
    });
  });

  describe('#getAllowanceAsync', () => {
    let subjectTokenAddress: Address;
    let subjectUserAddress: Address;
    let subjectSpenderAddress: Address;

    beforeEach(async () => {
      subjectTokenAddress = '0xEC0815AA9B462ed4fC84B5dFc43Fd2a10a54B569';
      subjectUserAddress = '0x0e2298E3B3390e3b945a5456fBf59eCc3f55DA16';
      subjectSpenderAddress = '0x0e2298E3B3390e3b945a5456fBf59eCc3f55DA16';
    });

    async function subject(): Promise<BigNumber> {
      return await erc20API.getAllowanceAsync(
        subjectTokenAddress,
        subjectUserAddress,
        subjectSpenderAddress
      );
    }

    it('should call the ERC20Wrapper with correct params', async () => {
      await subject();

      expect(erc20Wrapper.allowance).to.have.beenCalledWith(
        subjectTokenAddress,
        subjectUserAddress,
        subjectSpenderAddress
      );
    });

    describe('when the SetToken address is invalid', () => {
      beforeEach(async () => {
        subjectTokenAddress = '0xInvalidAddress';
      });

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('Validation error');
      });
    });

    describe('when the User address is invalid', () => {
      beforeEach(async () => {
        subjectUserAddress = '0xInvalidAddress';
      });

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('Validation error');
      });
    });

    describe('when the Spender address is invalid', () => {
      beforeEach(async () => {
        subjectSpenderAddress = '0xInvalidAddress';
      });

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('Validation error');
      });
    });
  });

  describe('#transferAsync', () => {
    let subjectTokenAddress: Address;
    let subjectReceiverAddress: Address;
    let subjectQuantity: BigNumber;
    let subjectCallerAddress: Address;
    let subjectTransactionOptions: any;

    beforeEach(async () => {
      subjectTokenAddress = '0xEC0815AA9B462ed4fC84B5dFc43Fd2a10a54B569';
      subjectReceiverAddress = '0x0e2298E3B3390e3b945a5456fBf59eCc3f55DA16';
      subjectQuantity = ether(1);
      subjectCallerAddress = '0x0e2298E3B3390e3b945a5456fBf59eCc3f55DA16';
      subjectTransactionOptions = {};
    });

    async function subject(): Promise<string> {
      return await erc20API.transferAsync(
        subjectTokenAddress,
        subjectReceiverAddress,
        subjectQuantity,
        subjectCallerAddress,
        subjectTransactionOptions
      );
    }

    it('should call the ERC20Wrapper with correct params', async () => {
      await subject();

      expect(erc20Wrapper.transfer).to.have.beenCalledWith(
        subjectTokenAddress,
        subjectReceiverAddress,
        subjectQuantity,
        subjectCallerAddress,
        subjectTransactionOptions
      );
    });

    describe('when the SetToken address is invalid', () => {
      beforeEach(async () => {
        subjectTokenAddress = '0xInvalidAddress';
      });

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('Validation error');
      });
    });

    describe('when the receiver address is invalid', () => {
      beforeEach(async () => {
        subjectReceiverAddress = '0xInvalidAddress';
      });

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('Validation error');
      });
    });
  });

  describe('#approveProxyAsync', () => {
    let subjectTokenAddress: Address;
    let subjectSpenderAddress: Address;
    let subjectQuantity: BigNumber;
    let subjectCallerAddress: Address;
    let subjectTransactionOptions: any;

    beforeEach(async () => {
      subjectTokenAddress = '0xEC0815AA9B462ed4fC84B5dFc43Fd2a10a54B569';
      subjectSpenderAddress = '0x0e2298E3B3390e3b945a5456fBf59eCc3f55DA16';
      subjectQuantity = ether(1);
      subjectCallerAddress = '0x0e2298E3B3390e3b945a5456fBf59eCc3f55DA16';
      subjectTransactionOptions = {};
    });

    async function subject(): Promise<string> {
      return await erc20API.approveProxyAsync(
        subjectTokenAddress,
        subjectSpenderAddress,
        subjectQuantity,
        subjectCallerAddress,
        subjectTransactionOptions
      );
    }

    it('should call the ERC20Wrapper with correct params', async () => {
      await subject();

      expect(erc20Wrapper.approve).to.have.beenCalledWith(
        subjectTokenAddress,
        subjectSpenderAddress,
        subjectQuantity,
        subjectCallerAddress,
        subjectTransactionOptions
      );
    });

    describe('when the SetToken address is invalid', () => {
      beforeEach(async () => {
        subjectTokenAddress = '0xInvalidAddress';
      });

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('Validation error');
      });
    });

    describe('when the spender address is invalid', () => {
      beforeEach(async () => {
        subjectSpenderAddress = '0xInvalidAddress';
      });

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('Validation error');
      });
    });
  });

  describe('#proxyTransferAsync', () => {
    let subjectTokenAddress: Address;
    let subjectFromAddress: Address;
    let subjectToAddress: Address;
    let subjectTransferQuantity: BigNumber;
    let subjectCallerAddress: Address;
    let subjectTransactionOptions: any;

    beforeEach(async () => {
      subjectTokenAddress = '0xEC0815AA9B462ed4fC84B5dFc43Fd2a10a54B569';
      subjectFromAddress = '0x0e2298E3B3390e3b945a5456fBf59eCc3f55DA16';
      subjectToAddress = '0x0e2298E3B3390e3b945a5456fBf59eCc3f55DA16';
      subjectTransferQuantity = ether(1);
      subjectCallerAddress = '0x0e2298E3B3390e3b945a5456fBf59eCc3f55DA16';
      subjectTransactionOptions = {};
    });

    async function subject(): Promise<string> {
      return await erc20API.proxyTransferAsync(
        subjectTokenAddress,
        subjectFromAddress,
        subjectToAddress,
        subjectTransferQuantity,
        subjectCallerAddress,
        subjectTransactionOptions
      );
    }

    it('should call the ERC20Wrapper with correct params', async () => {
      await subject();

      expect(erc20Wrapper.transferFrom).to.have.beenCalledWith(
        subjectTokenAddress,
        subjectFromAddress,
        subjectToAddress,
        subjectTransferQuantity,
        subjectCallerAddress,
        subjectTransactionOptions
      );
    });

    describe('when the SetToken address is invalid', () => {
      beforeEach(async () => {
        subjectTokenAddress = '0xInvalidAddress';
      });

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('Validation error');
      });
    });

    describe('when the from address is invalid', () => {
      beforeEach(async () => {
        subjectFromAddress = '0xInvalidAddress';
      });

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('Validation error');
      });
    });

    describe('when the to address is invalid', () => {
      beforeEach(async () => {
        subjectToAddress = '0xInvalidAddress';
      });

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('Validation error');
      });
    });
  });
});
