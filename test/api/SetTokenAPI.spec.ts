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

import { BigNumber } from 'ethers/lib/ethers';
import { Address, ContractTransaction, Position } from '@setprotocol/set-protocol-v2/utils/types';
import { ether } from '@setprotocol/set-protocol-v2/dist/utils/common';

import SetTokenAPI from '@src/api/SetTokenAPI';
import SetTokenWrapper from '@src/wrappers/set-protocol-v2/SetTokenWrapper';
import SetTokenCreatorWrapper from '@src/wrappers/set-protocol-v2/SetTokenCreatorWrapper';
import { ModuleState, SetDetailsWithStreamingInfo } from '@src/types';
import { expect } from '@test/utils/chai';

const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');

jest.mock('@src/wrappers/set-protocol-v2/ProtocolViewerWrapper', () => {
  return function() {
    return {
      batchFetchStreamingFeeInfo: jest.fn().mockImplementationOnce(() => {
        return [{
          feeRecipient: '0x1FdA7900056C0e4ED989127ecc3fC50F1Bd7f3dd',
          streamingFeePercentage: '9500000000000000',
          unaccruedFees: '311173045478743',
        }];
      }),
      getSetDetails: jest.fn().mockImplementationOnce(() => {
        return {
          name: 'DeFi Pulse Index',
          symbol: 'DPI',
          manager: '0x52bc44d5378309ee2abf1539bf71de1b7d7be3b5',
        };
      }),
      batchFetchManagers: jest.fn().mockImplementationOnce(() => {
        return ['0x52bc44d5378309ee2abf1539bf71de1b7d7be3b5'];
      }),
    };
  };
});
jest.mock('@src/wrappers/set-protocol-v2/SetTokenCreatorWrapper');
jest.mock('@src/wrappers/set-protocol-v2/SetTokenWrapper');


describe('SetTokenAPI', () => {
  let streamingFeeModuleAddress: Address;
  let protocolViewerAddress: Address;
  let setTokenCreatorAddress: Address;
  let setTokenAPI: SetTokenAPI;
  let setTokenWrapper: SetTokenWrapper;
  let setTokenCreatorWrapper: SetTokenCreatorWrapper;

  beforeEach(async () => {
    [
      streamingFeeModuleAddress,
      protocolViewerAddress,
      setTokenCreatorAddress,
    ] = await provider.listAccounts();

    setTokenAPI = new SetTokenAPI(provider, protocolViewerAddress, streamingFeeModuleAddress, setTokenCreatorAddress);

    setTokenWrapper = (SetTokenWrapper as any).mock.instances[0];
    setTokenCreatorWrapper = (SetTokenCreatorWrapper as any).mock.instances[0];
  });

  afterEach(async () => {
    (SetTokenWrapper as any).mockClear();
    (SetTokenCreatorWrapper as any).mockClear();
  });

  describe('#createAsync', () => {
    let subjectComponentAddresses: Address[];
    let subjectUnits: BigNumber[];
    let subjectModuleAddress: Address[];
    let subjectManagerAddress: Address;
    let subjectName: string;
    let subjectSymbol: string;
    let subjectCallerAddress: Address;
    let subjectTransactionOptions: any;

    beforeEach(async () => {
      subjectComponentAddresses = ['0x5A0b54D5dc17e0AadC383d2db43B0a0D3E029c4c', '0x5A0b54D5dc17e0AadC383d2db43B0a0D3E029c4c'];
      subjectUnits = [ether(33), ether(5)];
      subjectModuleAddress = ['0x8fD00f170FDf3772C5ebdCD90bF257316c69BA45'];
      subjectManagerAddress = '0x8fD00f170FDf3772C5ebdCD90bF257316c69BA45';
      subjectName = 'DPI Set';
      subjectSymbol = 'DPI';
      subjectCallerAddress = '0x0e2298E3B3390e3b945a5456fBf59eCc3f55DA16';
      subjectTransactionOptions = {};
    });

    async function subject(): Promise<Address[]> {
      return await setTokenAPI.createAsync(
        subjectComponentAddresses,
        subjectUnits,
        subjectModuleAddress,
        subjectManagerAddress,
        subjectName,
        subjectSymbol,
        subjectCallerAddress,
        subjectTransactionOptions,
      );
    }

    it('should call the SetTokenCreatorWrapper with correct params', async () => {
      await subject();

      expect(setTokenCreatorWrapper.create).to.have.beenCalledWith(
        subjectComponentAddresses,
        subjectUnits,
        subjectModuleAddress,
        subjectManagerAddress,
        subjectName,
        subjectSymbol,
        subjectCallerAddress,
        subjectTransactionOptions
      );
    });

    describe('when the component addresses are empty', () => {
      beforeEach(async () => {
        subjectComponentAddresses = [];
      });

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('Component addresses must contain at least one component.');
      });
    });

    describe('when the component addresses and units are not the same length', () => {
      beforeEach(async () => {
        subjectComponentAddresses = ['0x5A0b54D5dc17e0AadC383d2db43B0a0D3E029c4c', '0x5A0b54D5dc17e0AadC383d2db43B0a0D3E029c4c'];
        subjectUnits = [ether(5)];
      });

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('Component addresses and units must be equal length.');
      });
    });

    describe('when the component addresses contains an invalid address', () => {
      beforeEach(async () => {
        subjectComponentAddresses = ['0x5A0b54D5dc17e0AadC383d2db43B0a0D3E029c4c', '0xInvalidAddress'];
      });

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('Validation error');
      });
    });

    describe('when the module addresses contains an invalid address', () => {
      beforeEach(async () => {
        subjectModuleAddress = ['0x5A0b54D5dc17e0AadC383d2db43B0a0D3E029c4c', '0xInvalidAddress'];
      });

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('Validation error');
      });
    });

    describe('when the manager address is invalid', () => {
      beforeEach(async () => {
        subjectManagerAddress = '0xInvalidAddress';
      });

      it('should throw with invalid params', async () => {
        await expect(subject()).to.be.rejectedWith('Validation error');
      });
    });
  });

  describe('#fetchSetDetailsAsync', () => {
    let subjectSetTokenAddress: Address;
    let subjectModuleAddresses: Address[];

    beforeEach(async () => {
      subjectSetTokenAddress = '0xEC0815AA9B462ed4fC84B5dFc43Fd2a10a54B569';
      subjectModuleAddresses = ['0xEC0815AA9B462ed4fC84B5dFc43Fd2a10a54B569', '0xEC0815AA9B462ed4fC84B5dFc43Fd2a10a54B569'];
    });

    async function subject(): Promise<SetDetailsWithStreamingInfo> {
      return await setTokenAPI.fetchSetDetailsAsync(
        subjectSetTokenAddress,
        subjectModuleAddresses
      );
    }

    it('should call the ProtocolViewerWrapper with correct params', async () => {
      await subject();
    });
  });

  describe('#batchFetchManagersAsync', () => {
    let setTokenAddresses: Address[];

    let subjectSetTokenAddress1: Address;
    let subjectSetTokenAddress2: Address;

    beforeEach(async () => {
      subjectSetTokenAddress1 = '0xEC0815AA9B462ed4fC84B5dFc43Fd2a10a54B569';
      subjectSetTokenAddress2 = '0xEC0815AA9B462ed4fC84B5dFc43Fd2a10a54B570';
      setTokenAddresses = [subjectSetTokenAddress1, subjectSetTokenAddress2];
    });

    async function subject(): Promise<Address[]> {
      return await setTokenAPI.batchFetchManagersAsync(setTokenAddresses);
    }

    it('should call the ProtocolViewerWrapper with correct params', async () => {
      await subject();
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
