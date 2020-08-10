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

import { ethers } from 'ethers';
import { BigNumber } from 'ethers/utils';

import { Address } from 'set-protocol-v2/utils/types';

import ERC20API from '@src/api/ERC20API';
import ERC20Wrapper from '@src/wrappers/set-protocol-v2/ERC20Wrapper';
import { expect } from '../utils/chai';

const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');

jest.mock('@src/wrappers/set-protocol-v2/ERC20Wrapper');

describe('ERC20Wrapper', () => {
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
    it('should call the ERC20Wrapper with correct params', async () => {
      erc20API.getBalanceAsync(tokenAddress, userAddress);

      expect(erc20Wrapper.balanceOf).to.have.beenCalledWith(
        tokenAddress,
        userAddress
      );
    });

    it('should reject with invalid params', async () => {
      await expect(
        erc20API.getBalanceAsync('InvalidAddress', 'InvalidAddress')
      ).to.be.rejectedWith('Validation error');
    });
  });

  describe('#getTokenNameAsync', () => {
    it('should call the ERC20Wrapper with correct params', async () => {
      erc20API.getTokenNameAsync(tokenAddress);

      expect(erc20Wrapper.name).to.have.beenCalledWith(tokenAddress);
    });

    it('should reject with invalid params', async () => {
      await expect(
        erc20API.getTokenNameAsync('InvalidAddress')
      ).to.be.rejectedWith('Validation error');
    });
  });

  describe('#getTokenSymbolAsync', () => {
    it('should call the ERC20Wrapper with correct params', async () => {
      erc20API.getTokenSymbolAsync(tokenAddress);

      expect(erc20Wrapper.symbol).to.have.beenCalledWith(tokenAddress);
    });

    it('should reject with invalid params', async () => {
      await expect(
        erc20API.getTokenSymbolAsync('InvalidAddress')
      ).to.be.rejectedWith('Validation error');
    });
  });

  describe('#getTotalSupplyAsync', () => {
    it('should call the ERC20Wrapper with correct params', async () => {
      erc20API.getTotalSupplyAsync(tokenAddress);

      expect(erc20Wrapper.totalSupply).to.have.beenCalledWith(tokenAddress);
    });

    it('should reject with invalid params', async () => {
      await expect(
        erc20API.getTotalSupplyAsync('InvalidAddress')
      ).to.be.rejectedWith('Validation error');
    });
  });

  describe('#getDecimalsAsync', () => {
    it('should call the ERC20Wrapper with correct params', async () => {
      erc20API.getDecimalsAsync(tokenAddress);

      expect(erc20Wrapper.decimals).to.have.beenCalledWith(tokenAddress);
    });

    it('should reject with invalid params', async () => {
      await expect(
        erc20API.getDecimalsAsync('InvalidAddress')
      ).to.be.rejectedWith('Validation error');
    });
  });

  describe('#getAllowanceAsync', () => {
    it('should call the ERC20Wrapper with correct params', async () => {
      erc20API.getAllowanceAsync(tokenAddress, userAddress, proxyAddress);

      expect(erc20Wrapper.allowance).to.have.beenCalledWith(
        tokenAddress,
        userAddress,
        proxyAddress
      );
    });

    it('should reject with invalid params', async () => {
      await expect(
        erc20API.getAllowanceAsync(
          'InvalidAddress',
          'InvalidAddress',
          'InvalidAddress'
        )
      ).to.be.rejectedWith('Validation error');
    });
  });

  describe('#transferAsync', () => {
    it('should call the ERC20Wrapper with correct params', async () => {
      erc20API.transferAsync(tokenAddress, externalAddress, new BigNumber(1));

      expect(erc20Wrapper.transfer).to.have.beenCalledWith(
        tokenAddress,
        externalAddress,
        new BigNumber(1),
        undefined,
        {}
      );
    });

    it('should reject with invalid address params', async () => {
      await expect(
        erc20API.transferAsync(
          'InvalidAddress',
          'InvalidAddress',
          new BigNumber(1)
        )
      ).to.be.rejectedWith('Validation error');
    });

    it('should reject with invalid value param', async () => {
      await expect(
        erc20API.transferAsync(tokenAddress, externalAddress, 100 as any)
      ).to.be.rejectedWith('Validation error');
    });
  });

  describe('#approveProxyAsync', () => {
    it('should call the ERC20Wrapper with correct params', async () => {
      erc20API.approveProxyAsync(
        tokenAddress,
        externalAddress,
        new BigNumber(1)
      );

      expect(erc20Wrapper.approve).to.have.beenCalledWith(
        tokenAddress,
        externalAddress,
        new BigNumber(1),
        undefined,
        {},
      );
    });

    it('should reject with invalid address params', async () => {
      await expect(
        erc20API.approveProxyAsync(
          'InvalidAddress',
          'InvalidAddress',
          new BigNumber(1)
        )
      ).to.be.rejectedWith('Validation error');
    });

    it('should reject with invalid value param', async () => {
      await expect(
        erc20API.approveProxyAsync(tokenAddress, externalAddress, 100 as any)
      ).to.be.rejectedWith('Validation error');
    });
  });

  describe('#proxyTransferAsync', () => {
    it('should call the ERC20Wrapper with correct params', async () => {
      erc20API.proxyTransferAsync(
        tokenAddress,
        userAddress,
        externalAddress,
        new BigNumber(1)
      );

      expect(erc20Wrapper.transferFrom).to.have.beenCalledWith(
        tokenAddress,
        userAddress,
        externalAddress,
        new BigNumber(1),
        undefined,
        {},
      );
    });

    it('should reject with invalid address params', async () => {
      await expect(
        erc20API.proxyTransferAsync(
          'InvalidAddress',
          'InvalidAddress',
          'InvalidAddress',
          new BigNumber(1)
        )
      ).to.be.rejectedWith('Validation error');
    });

    it('should reject with invalid value param', async () => {
      await expect(
        erc20API.proxyTransferAsync(
          tokenAddress,
          userAddress,
          externalAddress,
          100 as any
        )
      ).to.be.rejectedWith('Validation error');
    });
  });
});
