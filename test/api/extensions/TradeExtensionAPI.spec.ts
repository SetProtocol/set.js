/*
  Copyright 2022 Set Labs Inc.

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

import { ethers, BytesLike } from 'ethers';
import { BigNumber, ContractTransaction } from 'ethers';
import { Address } from '@setprotocol/set-protocol-v2/utils/types';
import { ether } from '@setprotocol/set-protocol-v2/dist/utils/common';

import TradeExtensionAPI from '@src/api/extensions/TradeExtensionAPI';
import TradeExtensionWrapper from '@src/wrappers/set-v2-strategies/TradeExtensionWrapper';
import { expect } from '../../utils/chai';

const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');

jest.mock('@src/wrappers/set-v2-strategies/TradeExtensionWrapper');

describe('TradeExtensionAPI', () => {
  let owner: Address;
  let setToken: Address;
  let tradeExtension: Address;
  let delegatedManager: Address;
  let sendToken: Address;
  let receiveToken: Address;

  let tradeExtensionAPI: TradeExtensionAPI;
  let tradeExtensionWrapper: TradeExtensionWrapper;

  beforeEach(async () => {
    [
      owner,
      setToken,
      delegatedManager,
      tradeExtension,
      sendToken,
      receiveToken,
    ] = await provider.listAccounts();

    tradeExtensionAPI = new TradeExtensionAPI(provider, tradeExtension);
    tradeExtensionWrapper = (TradeExtensionWrapper as any).mock.instances[0];
  });

  afterEach(() => {
    (TradeExtensionWrapper as any).mockClear();
  });

  describe('#tradeWithOperatorAsync', () => {
    let subjectSetToken: Address;
    let subjectExchangeName: string;
    let subjectSendToken: Address;
    let subjectSendQuantity: BigNumber;
    let subjectReceiveToken: Address;
    let subjectMinReceiveQuantity: BigNumber;
    let subjectData: string;
    let subjectCallerAddress: Address;
    let subjectTransactionOptions: any;

    beforeEach(async () => {
      subjectSetToken = setToken;
      subjectExchangeName = 'UniswapV3';
      subjectSendToken = sendToken;
      subjectSendQuantity = ether(1);
      subjectReceiveToken = receiveToken;
      subjectMinReceiveQuantity = ether(.5);
      subjectData = '0x123456789abcdedf';
      subjectCallerAddress = owner;
      subjectTransactionOptions = {};
    });

    async function subject(): Promise<ContractTransaction> {
      return tradeExtensionAPI.tradeWithOperatorAsync(
        subjectSetToken,
        subjectExchangeName,
        subjectSendToken,
        subjectSendQuantity,
        subjectReceiveToken,
        subjectMinReceiveQuantity,
        subjectData,
        subjectCallerAddress,
        subjectTransactionOptions
      );
    }

    it('should call `tradeWithOperator` on the TradeExtensionWrapper', async () => {
      await subject();

      expect(tradeExtensionWrapper.tradeWithOperator).to.have.beenCalledWith(
        subjectSetToken,
        subjectExchangeName,
        subjectSendToken,
        subjectSendQuantity,
        subjectReceiveToken,
        subjectMinReceiveQuantity,
        subjectData,
        subjectCallerAddress,
        subjectTransactionOptions
      );
    });

    describe('when a setToken is not a valid address', () => {
      beforeEach(() => subjectSetToken = '0xinvalid');

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('Validation error');
      });
    });

    describe('when a exchangeName is not a valid string', () => {
      beforeEach(() => subjectExchangeName = <unknown>5 as string);

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('Validation error');
      });
    });

    describe('when a sendToken is not a valid address', () => {
      beforeEach(() => subjectSendToken = '0xinvalid');

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('Validation error');
      });
    });

    describe('when sendQuantity is not a valid number', () => {
      beforeEach(() => subjectSendQuantity = <unknown>NaN as BigNumber);

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('Validation error');
      });
    });

    describe('when a receiveToken is not a valid address', () => {
      beforeEach(() => subjectReceiveToken = '0xinvalid');

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('Validation error');
      });
    });

    describe('when minReceiveQuantity is not a valid number', () => {
      beforeEach(() => subjectMinReceiveQuantity = <unknown>NaN as BigNumber);

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('Validation error');
      });
    });
  });

  describe('#getTradeExtensionInitializationBytecode', () => {
    let subjectDelegatedManager: Address;

    beforeEach(async () => {
      subjectDelegatedManager = delegatedManager;
    });

    async function subject(): Promise<BytesLike> {
      return tradeExtensionAPI.getTradeExtensionInitializationBytecode(
        subjectDelegatedManager
      );
    }

    it('should generate the expected bytecode', async () => {
      const expectedBytecode = '0xde2236bd000000000000000000000000e36ea790bc9d7ab70c55260c66d52b1eca985f84';
      expect(await subject()).eq(expectedBytecode);
    });

    describe('when delegatedManager is not a valid address', () => {
      beforeEach(() => subjectDelegatedManager = '0xinvalid');

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('Validation error');
      });
    });
  });

  describe('#getTradeModuleInitializationBytecode', () => {
    let subjectSetToken: Address;

    beforeEach(async () => {
      subjectSetToken = setToken;
    });

    async function subject(): Promise<BytesLike> {
      return tradeExtensionAPI.getTradeModuleInitializationBytecode(subjectSetToken);
    }

    it('should generate the expected bytecode', async () => {
      const expectedBytecode = '0xc4d66de80000000000000000000000006ecbe1db9ef729cbe972c83fb886247691fb6beb';

      expect(await subject()).eq(expectedBytecode);
    });

    describe('when setToken is not a valid address', () => {
      beforeEach(() => subjectSetToken = '0xinvalid');

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('Validation error');
      });
    });
  });
});
