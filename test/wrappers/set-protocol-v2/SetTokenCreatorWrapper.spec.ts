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

import DeployHelper from 'set-protocol-v2/dist/utils/deploys';
import {
  Controller,
  SetTokenCreator,
  StandardTokenMock,
} from 'set-protocol-v2/dist/utils/contracts';
import { ProtocolUtils as CreateProtocolUtils } from 'set-protocol-v2/dist/utils/common/protocolUtils';
import { Blockchain, ether } from 'set-protocol-v2/dist/utils/common';
import { ADDRESS_ZERO, ZERO, ONE } from 'set-protocol-v2/dist/utils/constants';
import { Address } from 'set-protocol-v2/dist/utils/types';

import { expect } from '../../utils/chai';

const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');
const blockchain = new Blockchain(provider);
const protocolUtils = new CreateProtocolUtils(provider);

describe('SetTokenCreatorWrapper', () => {
  let owner: Address;
  let manager: Address;
  let controllerAddress: Address;
  let firstModuleAddress: Address;
  let secondModuleAddress: Address;
  let invalidModuleAddress: Address;

  let deployer: DeployHelper;

  beforeEach(async () => {
    [
      owner,
      manager,
      controllerAddress,
      firstModuleAddress,
      secondModuleAddress,
      invalidModuleAddress,
    ] = await provider.listAccounts();

    deployer = new DeployHelper(provider.getSigner(owner));

    await blockchain.saveSnapshotAsync();
  });

  afterEach(async () => {
    await blockchain.revertAsync();
  });

  describe('constructor', () => {
    let subjectControllerAddress: Address;

    beforeEach(() => {
      subjectControllerAddress = controllerAddress;
    });

    async function subject(): Promise<SetTokenCreator> {
      return await deployer.core.deploySetTokenCreator(
        subjectControllerAddress
      );
    }

    it('should have the correct controller', async () => {
      const newSetTokenCreator = await subject();

      const expectedController = await newSetTokenCreator.controller();
      expect(expectedController).to.eq(subjectControllerAddress);
    });
  });

  describe('when there is a SetTokenCreator', () => {
    let controller: Controller;
    let setTokenCreator: SetTokenCreator;

    beforeEach(async () => {
      controller = await deployer.core.deployController(owner);
      setTokenCreator = await deployer.core.deploySetTokenCreator(
        controller.address
      );

      await controller.initialize([setTokenCreator.address], [], [], []);
    });

    describe('#create', () => {
      let firstComponent: StandardTokenMock;
      let secondComponent: StandardTokenMock;
      let firstModule: Address;
      let secondModule: Address;

      let subjectComponents: Address[];
      let subjectUnits: BigNumber[];
      let subjectModules: Address[];
      let subjectManager: Address;
      let subjectName: string;
      let subjectSymbol: string;

      beforeEach(async () => {
        firstComponent = await deployer.mocks.deployTokenMock(manager);
        secondComponent = await deployer.mocks.deployTokenMock(manager);
        firstModule = firstModuleAddress;
        secondModule = secondModuleAddress;

        await controller.addModule(firstModule);
        await controller.addModule(secondModule);

        subjectComponents = [firstComponent.address, secondComponent.address];
        subjectUnits = [ether(1), ether(2)];
        subjectModules = [firstModule, secondModule];
        subjectManager = manager;
        subjectName = 'TestSetTokenCreator';
        subjectSymbol = 'SET';
      });

      async function subject(): Promise<any> {
        return setTokenCreator.create(
          subjectComponents,
          subjectUnits,
          subjectModules,
          subjectManager,
          subjectName,
          subjectSymbol
        );
      }

      it('should properly create the Set', async () => {
        const receipt = await subject();

        const address = await protocolUtils.getCreatedSetTokenAddress(
          receipt.hash
        );
        expect(address).to.be.a('string');
      });

      it('should enable the Set on the controller', async () => {
        const receipt = await subject();

        const retrievedSetAddress = await protocolUtils.getCreatedSetTokenAddress(
          receipt.hash
        );
        const isSetEnabled = await controller.isSet(retrievedSetAddress);
        expect(isSetEnabled).to.eq(true);
      });

      describe('when no components are passed in', () => {
        beforeEach(() => {
          subjectComponents = [];
        });

        it('should revert', async () => {
          try {
            await subject();
          } catch (err) {
            expect(err.responseText).to.include(
              'Must have at least 1 component'
            );
          }
        });
      });

      describe('when the component and units arrays are not the same length', () => {
        beforeEach(() => {
          subjectUnits = [ether(1)];
        });

        it('should revert', async () => {
          try {
            await subject();
          } catch (err) {
            expect(err.responseText).to.include(
              'Component and unit lengths must be the same'
            );
          }
        });
      });

      describe('when a module is not approved by the Controller', () => {
        beforeEach(() => {
          subjectModules = [firstModule, invalidModuleAddress];
        });

        it('should revert', async () => {
          try {
            await subject();
          } catch (err) {
            expect(err.responseText).to.include('Must be enabled module');
          }
        });
      });

      describe('when no modules are passed in', () => {
        beforeEach(() => {
          subjectModules = [];
        });

        it('should revert', async () => {
          try {
            await subject();
          } catch (err) {
            expect(err.responseText).to.include('Must have at least 1 module');
          }
        });
      });

      describe('when the manager is a null address', () => {
        beforeEach(() => {
          subjectManager = ADDRESS_ZERO;
        });

        it('should revert', async () => {
          try {
            await subject();
          } catch (err) {
            expect(err.responseText).to.include('Manager must not be empty');
          }
        });
      });

      describe('when a component is a null address', () => {
        beforeEach(() => {
          subjectComponents = [firstComponent.address, ADDRESS_ZERO];
        });

        it('should revert', async () => {
          try {
            await subject();
          } catch (err) {
            expect(err.responseText).to.include(
              'Component must not be null address'
            );
          }
        });
      });

      describe('when a unit is 0', () => {
        beforeEach(() => {
          subjectUnits = [ONE, ZERO];
        });

        it('should revert', async () => {
          try {
            await subject();
          } catch (err) {
            expect(err.responseText).to.include('Units must be greater than 0');
          }
        });
      });
    });
  });
});
