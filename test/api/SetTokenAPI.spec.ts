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
import { Address, ContractTransaction, Position } from 'set-protocol-v2/utils/types';

import SetTokenAPI from '@src/api/SetTokenAPI';
import SetTokenWrapper from '@src/wrappers/set-protocol-v2/SetTokenWrapper';
import ProtocolViewerWrapper from '@src/wrappers/set-protocol-v2/ProtocolViewerWrapper';
import { ModuleState } from '@src/types';
import { expect } from '@test/utils/chai';

const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');

jest.mock('@src/wrappers/set-protocol-v2/SetTokenWrapper');
jest.mock('@src/wrappers/set-protocol-v2/ProtocolViewerWrapper');

describe('SetTokenAPI', () => {
  let streamingFeeModuleAddress: Address;
  let protocolViewerAddress: Address;
  let setTokenAPI: SetTokenAPI;
  let setTokenWrapper: SetTokenWrapper;
  let protocolViewerWrapper: ProtocolViewerWrapper;

  beforeEach(async () => {
    [
      streamingFeeModuleAddress,
      protocolViewerAddress,
    ] = await provider.listAccounts();

    setTokenAPI = new SetTokenAPI(provider, protocolViewerAddress, streamingFeeModuleAddress);
    setTokenWrapper = (SetTokenWrapper as any).mock.instances[0];
    protocolViewerWrapper = (ProtocolViewerWrapper as any).mock.instances[0];
  });

  afterEach(async () => {
    (SetTokenWrapper as any).mockClear();
    (ProtocolViewerWrapper as any).mockClear();
  });

  describe('#batchFetchManagers', () => {
    let subjectSetTokenAddress1: Address;
    let subjectSetTokenAddress2: Address;
    let setTokenAddresses: Address[];

    beforeEach(async () => {
      subjectSetTokenAddress1 = '0xEC0815AA9B462ed4fC84B5dFc43Fd2a10a54B569';
      subjectSetTokenAddress2 = '0xEC0815AA9B462ed4fC84B5dFc43Fd2a10a54B570';
      setTokenAddresses = [subjectSetTokenAddress1, subjectSetTokenAddress2];
    });

    async function subject(): Promise<Address[]> {
      return await setTokenAPI.batchFetchManagers(setTokenAddresses);
    }

    it('should call the ProtocolViewerWrapper with correct params', async () => {
      await subject();

      expect(protocolViewerWrapper.batchFetchManagers).to.have.beenCalledWith(setTokenAddresses);
    });
  });

  describe('#getControllerAddressAsync', () => {
    let subjectSetTokenAddress: Address;

    beforeEach(async () => {
      subjectSetTokenAddress = '0xEC0815AA9B462ed4fC84B5dFc43Fd2a10a54B569';
    });

    async function subject(): Promise<Address> {
      return await setTokenAPI.getControllerAddressAsync(
        subjectSetTokenAddress
      );
    }

    it('should call the SetTokenWrapper with correct params', async () => {
      await subject();

      expect(setTokenWrapper.controller).to.have.beenCalledWith(subjectSetTokenAddress);
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

  describe('#getManagerAddressAsync', () => {
    let subjectSetTokenAddress: Address;

    beforeEach(async () => {
      subjectSetTokenAddress = '0xEC0815AA9B462ed4fC84B5dFc43Fd2a10a54B569';
    });

    async function subject(): Promise<Address> {
      return await setTokenAPI.getManagerAddressAsync(
        subjectSetTokenAddress
      );
    }

    it('should call the SetTokenWrapper with correct params', async () => {
      await subject();

      expect(setTokenWrapper.manager).to.have.beenCalledWith(subjectSetTokenAddress);
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

  describe('#getPositionsAsync', () => {
    let subjectSetTokenAddress: Address;

    beforeEach(async () => {
      subjectSetTokenAddress = '0xEC0815AA9B462ed4fC84B5dFc43Fd2a10a54B569';
    });

    async function subject(): Promise<Position[]> {
      return await setTokenAPI.getPositionsAsync(
        subjectSetTokenAddress
      );
    }

    it('should call the SetTokenWrapper with correct params', async () => {
      await subject();

      expect(setTokenWrapper.getPositions).to.have.beenCalledWith(subjectSetTokenAddress);
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

  describe('#getModulesAsync', () => {
    let subjectSetTokenAddress: Address;

    beforeEach(async () => {
      subjectSetTokenAddress = '0xEC0815AA9B462ed4fC84B5dFc43Fd2a10a54B569';
    });

    async function subject(): Promise<Address[]> {
      return await setTokenAPI.getModulesAsync(
        subjectSetTokenAddress
      );
    }

    it('should call the SetTokenWrapper with correct params', async () => {
      await subject();

      expect(setTokenWrapper.getModules).to.have.beenCalledWith(subjectSetTokenAddress);
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

  describe('#getModuleStateAsync', () => {
    let subjectSetTokenAddress: Address;
    let subjectModuleAddress: Address;

    beforeEach(async () => {
      subjectSetTokenAddress = '0xEC0815AA9B462ed4fC84B5dFc43Fd2a10a54B569';
      subjectModuleAddress = '0x0e2298E3B3390e3b945a5456fBf59eCc3f55DA16';
    });

    async function subject(): Promise<ModuleState> {
      return await setTokenAPI.getModuleStateAsync(
        subjectSetTokenAddress,
        subjectModuleAddress
      );
    }

    it('should call the SetTokenWrapper with correct params', async () => {
      await subject();

      expect(setTokenWrapper.moduleStates).to.have.beenCalledWith(
        subjectSetTokenAddress,
        subjectModuleAddress,
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

  describe('#addModuleAsync', () => {
    let subjectSetTokenAddress: Address;
    let subjectModuleAddress: Address;
    let subjectCallerAddress: Address;
    let subjectTransactionOptions = {};

    beforeEach(async () => {
      subjectSetTokenAddress = '0xEC0815AA9B462ed4fC84B5dFc43Fd2a10a54B569';
      subjectModuleAddress = '0x0e2298E3B3390e3b945a5456fBf59eCc3f55DA16';
      subjectCallerAddress = '0x0e2298E3B3390e3b945a5456fBf59eCc3f55DA16';
      subjectTransactionOptions = {};
    });

    async function subject(): Promise<ContractTransaction> {
      return await setTokenAPI.addModuleAsync(
        subjectSetTokenAddress,
        subjectModuleAddress,
        subjectCallerAddress,
        subjectTransactionOptions
      );
    }

    it('should call the SetTokenWrapper with correct params', async () => {
      await subject();

      expect(setTokenWrapper.addModule).to.have.beenCalledWith(
        subjectSetTokenAddress,
        subjectModuleAddress,
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
  });

  describe('#setManagerAsync', () => {
    let subjectSetTokenAddress: Address;
    let subjectManagerAddress: Address;
    let subjectCallerAddress: Address;
    let subjectTransactionOptions = {};

    beforeEach(async () => {
      subjectSetTokenAddress = '0xEC0815AA9B462ed4fC84B5dFc43Fd2a10a54B569';
      subjectManagerAddress = '0x0872262A92581EC09C2d522b48bCcd9E3C8ACf9C';
      subjectCallerAddress = '0x0e2298E3B3390e3b945a5456fBf59eCc3f55DA16';
      subjectTransactionOptions = {};
    });

    async function subject(): Promise<ContractTransaction> {
      return await setTokenAPI.setManagerAsync(
        subjectSetTokenAddress,
        subjectManagerAddress,
        subjectCallerAddress,
        subjectTransactionOptions
      );
    }

    it('should call the SetTokenWrapper with correct params', async () => {
      await subject();

      expect(setTokenWrapper.setManager).to.have.beenCalledWith(
        subjectSetTokenAddress,
        subjectManagerAddress,
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
  });

  describe('#initializeModuleAsync', () => {
    let subjectSetTokenAddress: Address;
    let subjectCallerAddress: Address;
    let subjectTransactionOptions = {};

    beforeEach(async () => {
      subjectSetTokenAddress = '0xEC0815AA9B462ed4fC84B5dFc43Fd2a10a54B569';
      subjectCallerAddress = '0x0e2298E3B3390e3b945a5456fBf59eCc3f55DA16';
      subjectTransactionOptions = {};
    });

    async function subject(): Promise<ContractTransaction> {
      return await setTokenAPI.initializeModuleAsync(
        subjectSetTokenAddress,
        subjectCallerAddress,
        subjectTransactionOptions
      );
    }

    it('should call the SetTokenWrapper with correct params', async () => {
      await subject();

      expect(setTokenWrapper.initializeModule).to.have.beenCalledWith(
        subjectSetTokenAddress,
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
  });

  describe('#isModuleEnabledAsync', () => {
    let subjectSetTokenAddress: Address;
    let subjectModuleAddress: Address;

    beforeEach(async () => {
      subjectSetTokenAddress = '0xEC0815AA9B462ed4fC84B5dFc43Fd2a10a54B569';
      subjectModuleAddress = '0x0872262A92581EC09C2d522b48bCcd9E3C8ACf9C';
    });

    async function subject(): Promise<boolean> {
      return await setTokenAPI.isModuleEnabledAsync(
        subjectSetTokenAddress,
        subjectModuleAddress
      );
    }

    it('should call the SetTokenWrapper with correct params', async () => {
      await subject();

      expect(setTokenWrapper.isModule).to.have.beenCalledWith(
        subjectSetTokenAddress,
        subjectModuleAddress,
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

    describe('when the module address is invalid', () => {
      beforeEach(async () => {
        subjectModuleAddress = '0xInvalidAddress';
      });

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('Validation error');
      });
    });
  });

  describe('#isModuleEnabledAsync', () => {
    let subjectSetTokenAddress: Address;
    let subjectModuleAddress: Address;

    beforeEach(async () => {
      subjectSetTokenAddress = '0xEC0815AA9B462ed4fC84B5dFc43Fd2a10a54B569';
      subjectModuleAddress = '0x0872262A92581EC09C2d522b48bCcd9E3C8ACf9C';
    });

    async function subject(): Promise<boolean> {
      return await setTokenAPI.isModuleEnabledAsync(
        subjectSetTokenAddress,
        subjectModuleAddress
      );
    }

    it('should call the SetTokenWrapper with correct params', async () => {
      await subject();

      expect(setTokenWrapper.isModule).to.have.beenCalledWith(
        subjectSetTokenAddress,
        subjectModuleAddress,
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

    describe('when the module address is invalid', () => {
      beforeEach(async () => {
        subjectModuleAddress = '0xInvalidAddress';
      });

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('Validation error');
      });
    });
  });

  describe('#isModulePendingAsync', () => {
    let subjectSetTokenAddress: Address;
    let subjectModuleAddress: Address;

    beforeEach(async () => {
      subjectSetTokenAddress = '0xEC0815AA9B462ed4fC84B5dFc43Fd2a10a54B569';
      subjectModuleAddress = '0x0872262A92581EC09C2d522b48bCcd9E3C8ACf9C';
    });

    async function subject(): Promise<boolean> {
      return await setTokenAPI.isModulePendingAsync(
        subjectSetTokenAddress,
        subjectModuleAddress
      );
    }

    it('should call the SetTokenWrapper with correct params', async () => {
      await subject();

      expect(setTokenWrapper.isPendingModule).to.have.beenCalledWith(
        subjectSetTokenAddress,
        subjectModuleAddress,
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

    describe('when the module address is invalid', () => {
      beforeEach(async () => {
        subjectModuleAddress = '0xInvalidAddress';
      });

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('Validation error');
      });
    });
  });
});
