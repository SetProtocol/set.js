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
import { Address } from '@setprotocol/set-protocol-v2/utils/types';
import { EMPTY_BYTES } from '@setprotocol/set-protocol-v2/dist/utils/constants';
import { ether } from '@setprotocol/set-protocol-v2/dist/utils/common';

import TradeAPI from '@src/api/TradeAPI';
import TradeModuleWrapper from '@src/wrappers/set-protocol-v2/TradeModuleWrapper';
import { expect } from '@test/utils/chai';

const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');

jest.mock('@src/wrappers/set-protocol-v2/TradeModuleWrapper');

describe('TradeAPI', () => {
  let tradeModuleAddress: Address;

  let tradeModuleWrapper: TradeModuleWrapper;

  let tradeAPI: TradeAPI;

  beforeEach(async () => {
    [
      tradeModuleAddress,
    ] = await provider.listAccounts();

    tradeAPI = new TradeAPI(provider, tradeModuleAddress);
    tradeModuleWrapper = (TradeModuleWrapper as any).mock.instances[0];
  });

  afterEach(async () => {
    (TradeModuleWrapper as any).mockClear();
  });

  describe('#tradeAsync', () => {
    let subjectSetTokenAddress: Address;
    let subjectExchangeName: string;
    let subjectSendTokenAddress: Address;
    let subjectSendQuantity: BigNumber;
    let subjectReceiveTokenAddress: Address;
    let subjectMinReceivedQuantity: BigNumber;
    let subjectData: string;
    let subjectCallerAddress: Address;
    let subjectTransactionOptions: any;

    beforeEach(async () => {
      subjectSetTokenAddress = '0xEC0815AA9B462ed4fC84B5dFc43Fd2a10a54B569';
      subjectExchangeName = 'ONEINCH';
      subjectSendQuantity = ether(1);
      subjectSendTokenAddress = '0x0872262A92581EC09C2d522b48bCcd9E3C8ACf9C';
      subjectReceiveTokenAddress = '0x0872262A92581EC09C2d522b48bCcd9E3C8ACf9D';
      subjectMinReceivedQuantity = ether(0.01);
      subjectData = EMPTY_BYTES;
      subjectCallerAddress = '0x0e2298E3B3390e3b945a5456fBf59eCc3f55DA16';
      subjectTransactionOptions = {};
    });

    async function subject(): Promise<ContractTransaction> {
      return await tradeAPI.tradeAsync(
        subjectSetTokenAddress,
        subjectExchangeName,
        subjectSendTokenAddress,
        subjectSendQuantity,
        subjectReceiveTokenAddress,
        subjectMinReceivedQuantity,
        subjectData,
        subjectCallerAddress,
        subjectTransactionOptions
      );
    }

    it('should call the TradeModuleWrapper with correct params', async () => {
      await subject();

      expect(tradeModuleWrapper.trade).to.have.beenCalledWith(
        subjectSetTokenAddress,
        subjectExchangeName,
        subjectSendTokenAddress,
        subjectSendQuantity,
        subjectReceiveTokenAddress,
        subjectMinReceivedQuantity,
        subjectData,
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

    describe('when the send token address is invalid', () => {
      beforeEach(async () => {
        subjectSendTokenAddress = '0xInvalidAddress';
      });

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('Validation error');
      });
    });

    describe('when the receive token address is invalid', () => {
      beforeEach(async () => {
        subjectReceiveTokenAddress = '0xInvalidAddress';
      });

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('Validation error');
      });
    });

    describe('when the send quantity is invalid', () => {
      beforeEach(async () => {
        subjectSendQuantity = ether(0);
      });

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('sendQuantity needs to be greater than zero');
      });
    });
  });
});
