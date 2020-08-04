import { ethers } from 'ethers';
import { BigNumber } from 'ethers/utils';

import { Blockchain, ether } from 'set-protocol-v2/dist/utils/common';
import { Account, Address } from 'set-protocol-v2/dist/utils/types';
import { ADDRESS_ZERO, ZERO, ONE } from 'set-protocol-v2/dist/utils/constants';
import {
  Controller,
  SetTokenCreator,
  StandardTokenMock,
} from 'set-protocol-v2/dist/utils/contracts';
import DeployHelper from 'set-protocol-v2/dist/utils/deploys';
import { expect } from './utils/chai';

const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');
const blockchain = new Blockchain(provider);

describe('SetTokenCreatorWrapper', () => {
  let owner: Account;
  let manager: Account;
  let controllerAddress: Account;

  let deployer: DeployHelper;

  beforeEach(async () => {
    [owner, manager, controllerAddress] = await provider.listAccounts();

    deployer = new DeployHelper(provider.getSigner(owner));
  });

  beforeEach(async () => {
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

  // describe("when there is a SetTokenCreator", async () => {
  //   let controller: Controller;
  //   let setTokenCreator: SetTokenCreator;

  //   beforeEach(async () => {
  //     controller = await deployer.core.deployController(owner.address);
  //     setTokenCreator = await deployer.core.deploySetTokenCreator(
  //       controller.address
  //     );

  //     await controller.initialize([setTokenCreator.address], [], [], []);
  //   });

  //   describe("#create", async () => {
  //     let firstComponent: StandardTokenMock;
  //     let secondComponent: StandardTokenMock;
  //     let firstModule: Address;
  //     let secondModule: Address;

  //     let subjectComponents: Address[];
  //     let subjectUnits: BigNumber[];
  //     let subjectModules: Address[];
  //     let subjectManager: Address;
  //     let subjectName: string;
  //     let subjectSymbol: string;

  //     beforeEach(async () => {
  //       firstComponent = await deployer.mocks.deployTokenMock(manager.address);
  //       secondComponent = await deployer.mocks.deployTokenMock(manager.address);
  //       firstModule = await deployer.mocks.deployModuleBaseMock();
  //       secondModule = await deployer.mocks.deployModuleBaseMock();

  //       await controller.addModule(firstModule);
  //       await controller.addModule(secondModule);

  //       subjectComponents = [firstComponent.address, secondComponent.address];
  //       subjectUnits = [ether(1), ether(2)];
  //       subjectModules = [firstModule, secondModule];
  //       subjectManager = manager;
  //       subjectName = "TestSetTokenCreator";
  //       subjectSymbol = "SET";
  //     });

  //     async function subject(): Promise<any> {
  //       return setTokenCreator.create(
  //         subjectComponents,
  //         subjectUnits,
  //         subjectModules,
  //         subjectManager,
  //         subjectName,
  //         subjectSymbol
  //       );
  //     }

  //     it("should properly create the Set", async () => {
  //       const receipt = await subject();

  //       // const address = await protocolUtils.getCreatedSetTokenAddress(
  //       //   receipt.hash
  //       // );
  //       expect(receipt.hash).to.be.a("string");
  //     });

  //     it("should enable the Set on the controller", async () => {
  //       const receipt = await subject();

  //       // const retrievedSetAddress = await protocolUtils.getCreatedSetTokenAddress(
  //       //   receipt.hash
  //       // );
  //       const isSetEnabled = await controller.isSet(receipt.hash);
  //       expect(isSetEnabled).to.eq(true);
  //     });

  //     describe("when no components are passed in", async () => {
  //       beforeEach(async () => {
  //         subjectComponents = [];
  //       });

  //       it("should revert", async () => {
  //         try {
  //           await subject();
  //         } catch (err) {
  //           expect(err.responseText).to.include(
  //             "Must have at least 1 component"
  //           );
  //         }
  //       });
  //     });

  //     describe("when the component and units arrays are not the same length", async () => {
  //       beforeEach(async () => {
  //         subjectUnits = [ether(1)];
  //       });

  //       it("should revert", async () => {
  //         try {
  //           await subject();
  //         } catch (err) {
  //           expect(err.responseText).to.include(
  //             "Component and unit lengths must be the same"
  //           );
  //         }
  //       });
  //     });

  //     describe("when a module is not approved by the Controller", async () => {
  //       beforeEach(async () => {
  //         const invalidModuleAddress = await manager.address;

  //         subjectModules = [firstModule, invalidModuleAddress];
  //       });

  //       it("should revert", async () => {
  //         try {
  //           await subject();
  //         } catch (err) {
  //           expect(err.responseText).to.include("Must be enabled module");
  //         }
  //       });
  //     });

  //     describe("when no modules are passed in", async () => {
  //       beforeEach(async () => {
  //         subjectModules = [];
  //       });

  //       it("should revert", async () => {
  //         try {
  //           await subject();
  //         } catch (err) {
  //           expect(err.responseText).to.include("Must have at least 1 module");
  //         }
  //       });
  //     });

  //     describe("when the manager is a null address", async () => {
  //       beforeEach(async () => {
  //         subjectManager = ADDRESS_ZERO;
  //       });

  //       it("should revert", async () => {
  //         try {
  //           await subject();
  //         } catch (err) {
  //           expect(err.responseText).to.include("Manager must not be empty");
  //         }
  //       });
  //     });

  //     describe("when a component is a null address", async () => {
  //       beforeEach(async () => {
  //         subjectComponents = [firstComponent.address, ADDRESS_ZERO];
  //       });

  //       it("should revert", async () => {
  //         try {
  //           await subject();
  //         } catch (err) {
  //           expect(err.responseText).to.include(
  //             "Component must not be null address"
  //           );
  //         }
  //       });
  //     });

  //     describe("when a unit is 0", async () => {
  //       beforeEach(async () => {
  //         subjectUnits = [ONE, ZERO];
  //       });

  //       it("should revert", async () => {
  //         try {
  //           await subject();
  //         } catch (err) {
  //           expect(err.responseText).to.include("Units must be greater than 0");
  //         }
  //       });
  //     });
  //   });
  // });
});
