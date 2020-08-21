import { ethers, ContractTransaction } from 'ethers';
import { BigNumber } from 'ethers/utils';

import { Address, Position } from '@setprotocol/set-protocol-v2/utils/types';
import { Blockchain, ether } from '@setprotocol/set-protocol-v2/dist/utils/common';
import DeployHelper from '@setprotocol/set-protocol-v2/dist/utils/deploys';
import {
  Controller,
  SetToken,
  StandardTokenMock,
} from '@setprotocol/set-protocol-v2/dist/utils/contracts';
import {
  ADDRESS_ZERO,
  EMPTY_BYTES,
  POSITION_STATE,
  MODULE_STATE,
} from '@setprotocol/set-protocol-v2/dist/utils/constants';

import SetTokenWrapper from '@src/wrappers/set-protocol-v2/SetTokenWrapper';
import ERC20Wrapper from '@src/wrappers/set-protocol-v2/ERC20Wrapper';
import { expect } from '@test/utils/chai';

const provider = new ethers.providers.JsonRpcProvider();
const blockchain = new Blockchain(provider);


describe('SetTokenWrapper', () => {
  let owner: Address;
  let manager: Address;
  let mockIssuanceModule: Address;
  let mockLockedModule: Address;
  let testAccount: Address;

  let controller: Controller;

  let deployer: DeployHelper;

  let setTokenWrapper: SetTokenWrapper;
  let erc20Wrapper: ERC20Wrapper;

  beforeAll(async () => {
    [
      owner,
      manager,
      mockIssuanceModule,
      mockLockedModule,
      testAccount,
    ] = await provider.listAccounts();

    deployer = new DeployHelper(provider.getSigner(owner));
  });

  beforeEach(async () => {
    await blockchain.saveSnapshotAsync();

    controller = await deployer.core.deployController(owner);
    const initialFactoryAddesses = [];
    const initialModuleAddresses = [];
    const initialResourceAddresses = [];
    const initialResourceIDs = [];
    await controller.initialize(
      initialFactoryAddesses,
      initialModuleAddresses,
      initialResourceAddresses,
      initialResourceIDs
    );

    setTokenWrapper = new SetTokenWrapper(provider);
    erc20Wrapper = new ERC20Wrapper(provider);
  });

  afterEach(async () => {
    await blockchain.revertAsync();
  });

  describe('Checking basic functionality', () => {
    let firstComponent: StandardTokenMock;
    let firstComponentUnits: BigNumber;
    let secondComponent: StandardTokenMock;
    let secondComponentUnits: BigNumber;

    let subjectComponentAddresses: Address[];
    let subjectUnits: BigNumber[];
    let subjectModuleAddresses: Address[];
    let subjectControllerAddress: Address;
    let subjectManagerAddress: Address;
    let subjectName: string;
    let subjectSymbol: string;

    beforeEach(async () => {
      firstComponent = await deployer.mocks.deployTokenMock(manager);
      firstComponentUnits = ether(1);
      secondComponent = await deployer.mocks.deployTokenMock(manager);
      secondComponentUnits = ether(2);

      subjectComponentAddresses = [firstComponent.address, secondComponent.address];
      subjectUnits = [firstComponentUnits, secondComponentUnits];
      subjectModuleAddresses = [mockIssuanceModule, mockLockedModule];
      subjectControllerAddress = controller.address;
      subjectManagerAddress = manager;
      subjectName = 'TestSetToken';
      subjectSymbol = 'SET';
    });

    async function subject(): Promise<SetToken> {
      return await deployer.core.deploySetToken(
        subjectComponentAddresses,
        subjectUnits,
        subjectModuleAddresses,
        subjectControllerAddress,
        subjectManagerAddress,
        subjectName,
        subjectSymbol
      );
    }

    it('should have the correct name, symbol, controller, and manager', async () => {
      const setToken = await subject();

      const name = await erc20Wrapper.name(setToken.address);
      expect(name).to.eq(subjectName);

      const symbol = await erc20Wrapper.symbol(setToken.address);
      expect(symbol).to.eq(subjectSymbol);

      const controllerAddress = await setTokenWrapper.controller(setToken.address);
      expect(controllerAddress).to.eq(subjectControllerAddress);

      const managerAddress = await setTokenWrapper.manager(setToken.address);
      expect(managerAddress).to.eq(subjectManagerAddress);
    });

    it('should have the correct positions', async () => {
      const setToken = await subject();

      const positions = await setTokenWrapper.getPositions(setToken.address, testAccount);

      const firstComponentPosition = positions[0];
      expect(firstComponentPosition.component).to.eq(firstComponent.address);
      expect(firstComponentPosition.unit.toString()).to.eq(firstComponentUnits.toString());
      expect(firstComponentPosition.module).to.eq(ADDRESS_ZERO);
      expect(firstComponentPosition.positionState).to.eq(POSITION_STATE['DEFAULT']);
      expect(firstComponentPosition.data).to.eq(EMPTY_BYTES);

      const secondComponentPosition = positions[1];
      expect(secondComponentPosition.component).to.eq(secondComponent.address);
      expect(secondComponentPosition.unit.toString()).to.eq(secondComponentUnits.toString());
      expect(secondComponentPosition.module).to.eq(ADDRESS_ZERO);
      expect(secondComponentPosition.positionState).to.eq(POSITION_STATE['DEFAULT']);
      expect(secondComponentPosition.data).to.eq(EMPTY_BYTES);
    });

    it('should have the 0 modules initialized', async () => {
      const setToken = await subject();

      const modules = await setTokenWrapper.getModules(setToken.address);
      expect(modules.length).to.eq(0);
    });

    it('should have the correct modules in pending state', async () => {
      const setToken = await subject();

      const mockIssuanceModuleState = await setTokenWrapper.moduleStates(setToken.address, mockIssuanceModule);
      expect(mockIssuanceModuleState).to.eq(MODULE_STATE['PENDING']);

      const mockLockedModuleState = await setTokenWrapper.moduleStates(setToken.address, mockLockedModule);
      expect(mockLockedModuleState).to.eq(MODULE_STATE['PENDING']);
    });
  });

  describe('when there is a deployed SetToken', () => {
    let setToken: SetToken;

    let firstComponent: StandardTokenMock;
    let firstComponentUnits: BigNumber;
    let secondComponent: StandardTokenMock;
    let secondComponentUnits: BigNumber;

    let components: Address[];
    let units: BigNumber[];
    let modules: Address[];
    let name: string;
    let symbol: string;

    let subjectCaller: Address;

    beforeEach(async () => {
      firstComponent = await deployer.mocks.deployTokenMock(manager);
      firstComponentUnits = ether(1);
      secondComponent = await deployer.mocks.deployTokenMock(manager);
      secondComponentUnits = ether(2);

      components = [firstComponent.address, secondComponent.address];
      units = [firstComponentUnits, secondComponentUnits];
      modules = [mockIssuanceModule, mockLockedModule];
      name = 'TestSetToken';
      symbol = 'SET';

      setToken = await deployer.core.deploySetToken(
        components,
        units,
        modules,
        controller.address,
        manager,
        name,
        symbol,
      );

      setToken = setToken.connect(provider.getSigner(mockIssuanceModule));
      await setToken.initializeModule();

      setToken = setToken.connect(provider.getSigner(mockLockedModule));
      await setToken.initializeModule();
    });

    describe('#addModule', () => {
      let subjectModule: Address;

      beforeEach(async () => {
        await controller.addModule(testAccount);

        subjectModule = testAccount;
        subjectCaller = manager;
      });

      async function subject(): Promise<ContractTransaction> {
        return setTokenWrapper.addModule(setToken.address, subjectModule, subjectCaller);
      }

      it('should change the state to pending', async () => {
        await subject();

        const moduleState = await setTokenWrapper.moduleStates(setToken.address, subjectModule);
        expect(moduleState).to.eq(MODULE_STATE['PENDING']);
      });

      describe('when the caller is not the manager', () => {
        beforeEach(async () => {
          subjectCaller = testAccount;
        });

        it('should revert', async () => {
          try {
            await subject();
          } catch (err) {
            expect(err.responseText).to.include('Only manager can call');
          }
        });
      });

      describe('when the module is already added', () => {
        beforeEach(async () => {
          const moduleState = await setTokenWrapper.moduleStates(setToken.address, mockIssuanceModule);

          subjectModule = mockIssuanceModule;
        });

        it('should revert', async () => {
          try {
            await subject();
          } catch (err) {
            expect(err.responseText).to.include('Module must not be added');
          }
        });
      });

      describe('when the module is not enabled', () => {
        beforeEach(async () => {
          await controller.removeModule(subjectModule);
        });

        it('should revert', async () => {
          try {
            await subject();
          } catch (err) {
            expect(err.responseText).to.include('Must be enabled on Controller');
          }
        });
      });
    });

    describe('#setManager', () => {
      let subjectManager: Address;

      beforeEach(async () => {
        subjectManager = testAccount;
        subjectCaller = manager;
      });

      async function subject(): Promise<ContractTransaction> {
        return setTokenWrapper.setManager(setToken.address, subjectManager, subjectCaller);
      }

      it('should change the manager', async () => {
        await subject();

        const managerAddress = await setToken.manager();
        expect(managerAddress).to.eq(subjectManager);
      });

      describe('when the caller is not the manager', () => {
        beforeEach(async () => {
          subjectCaller = testAccount;
        });

        it('should revert', async () => {
          try {
            await subject();
          } catch (err) {
            expect(err.responseText).to.include('Only manager can call');
          }
        });
      });
    });

    describe('#initializeModule', () => {
      let subjectModule: Address;

      beforeEach(async () => {
        setToken = setToken.connect(provider.getSigner(manager));
        await controller.addModule(testAccount);
        await setToken.addModule(testAccount);

        subjectModule = testAccount;
        subjectCaller = testAccount;
      });

      async function subject(): Promise<ContractTransaction> {
        return setTokenWrapper.initializeModule(setToken.address, subjectCaller);
      }

      it('should add the module to the modules list', async () => {
        await subject();

        const moduleList = await setToken.getModules();
        expect(moduleList).to.include(subjectModule);
      });

      it('should update the module state to initialized', async () => {
        await subject();

        const moduleState = await setTokenWrapper.moduleStates(setToken.address, subjectModule);
        expect(moduleState).to.eq(MODULE_STATE['INITIALIZED']);
      });

      describe('when the module is not added', () => {
        beforeEach(async () => {
          subjectCaller = owner;
        });

        it('should revert', async () => {
          try {
            await subject();
          } catch (err) {
            expect(err.responseText).to.include('Module must be pending');
          }
        });
      });

      describe('when the module already added', () => {
        beforeEach(async () => {
          subjectCaller = mockIssuanceModule;
        });

        it('should revert', async () => {
          try {
            await subject();
          } catch (err) {
            expect(err.responseText).to.include('Module must be pending');
          }
        });
      });

      describe('when the module is locked', () => {
        beforeEach(async () => {
          await controller.addModule(mockIssuanceModule);

          setToken = setToken.connect(provider.getSigner(mockIssuanceModule));
          await setToken.lock();
        });

        it('should revert', async () => {
          try {
            await subject();
          } catch (err) {
            expect(err.responseText).to.include('Only when unlocked');
          }
        });
      });
    });

    describe ('#getPositions', () => {
      beforeEach(async () => {
        subjectCaller = testAccount;
      });

      async function subject(): Promise<Position[]> {
        return await setTokenWrapper.getPositions(setToken.address, subjectCaller);
      }

      it('should return the correct Positions', async () => {
        const positions = await subject();

        const firstPosition = positions[0];
        expect(firstPosition.component).to.eq(firstComponent.address);
        expect(firstPosition.unit.toString()).to.eq(units[0].toString());
        expect(firstPosition.module).to.eq(ADDRESS_ZERO);
        expect(firstPosition.positionState).to.eq(POSITION_STATE['DEFAULT']);
        expect(firstPosition.data).to.eq(EMPTY_BYTES);

        const secondPosition = positions[1];
        expect(secondPosition.component).to.eq(secondComponent.address);
        expect(secondPosition.unit.toString()).to.eq(units[1].toString());
        expect(secondPosition.module).to.eq(ADDRESS_ZERO);
        expect(secondPosition.positionState).to.eq(POSITION_STATE['DEFAULT']);
        expect(secondPosition.data).to.eq(EMPTY_BYTES);
      });
    });

    describe('#getModules', () => {
      beforeEach(async () => {
        subjectCaller = testAccount;
      });

      async function subject(): Promise<Address[]> {
        return await setTokenWrapper.getModules(setToken.address, subjectCaller);
      }

      it('should return the correct modules', async () => {
        const moduleAddresses = await subject();

        expect(JSON.stringify(moduleAddresses)).to.eq(JSON.stringify(modules));
      });
    });
  });
});
