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

import { ethers } from 'ethers';
import { BigNumber } from 'ethers/utils';
import { Address } from '@setprotocol/set-protocol-v2/utils/types';

import PriceOracleAPI from '../../src/api/PriceOracleAPI';
import PriceOracleWrapper from '../../src/wrappers/set-protocol-v2/PriceOracleWrapper';
import { expect } from '@test/utils/chai';

const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');

jest.mock('../../src/wrappers/set-protocol-v2/PriceOracleWrapper');

describe('PriceOracleAPI', () => {
  let masterOracleAddress: Address;

  let priceOracleWrapper: PriceOracleWrapper;

  let priceOracleAPI: PriceOracleAPI;

  beforeEach(async () => {
    [
      masterOracleAddress,
    ] = await provider.listAccounts();

    priceOracleAPI = new PriceOracleAPI(provider, masterOracleAddress);
    priceOracleWrapper = (PriceOracleWrapper as any).mock.instances[0];
  });

  afterEach(async () => {
    (PriceOracleWrapper as any).mockClear();
  });

  describe('#getPriceAsync', () => {
    let subjectAssetOneAddress: Address;
    let subjectAssetTwoAddress: Address;
    let subjectCallerAddress: Address;

    beforeEach(async () => {
      subjectAssetOneAddress = '0xEC0815AA9B462ed4fC84B5dFc43Fd2a10a54B569';
      subjectAssetTwoAddress = '0x0872262A92581EC09C2d522b48bCcd9E3C8ACf9C';
      subjectCallerAddress = '0x0e2298E3B3390e3b945a5456fBf59eCc3f55DA16';
    });

    async function subject(): Promise<BigNumber> {
      return await priceOracleAPI.getPriceAsync(
        subjectAssetOneAddress,
        subjectAssetTwoAddress,
        subjectCallerAddress
      );
    }

    it('should call the TradeModuleWrapper with correct params', async () => {
      await subject();

      expect(priceOracleWrapper.getPrice).to.have.beenCalledWith(
        subjectAssetOneAddress,
        subjectAssetTwoAddress,
        subjectCallerAddress
      );
    });

    describe('when the assetOne address is invalid', () => {
      beforeEach(async () => {
        subjectAssetOneAddress = '0xInvalidAddress';
      });

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('Validation error');
      });
    });

    describe('when the assetTwo address is invalid', () => {
      beforeEach(async () => {
        subjectAssetTwoAddress = '0xInvalidAddress';
      });

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('Validation error');
      });
    });
  });
});
