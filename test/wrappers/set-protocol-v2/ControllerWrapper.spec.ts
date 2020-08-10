import { ethers } from 'ethers';
import { BigNumber } from 'ethers/utils';

import { Address } from 'set-protocol-v2/utils/types';
import { Blockchain, ether } from 'set-protocol-v2/dist/utils/common';
import DeployHelper from 'set-protocol-v2/dist/utils/deploys';
import { Controller } from 'set-protocol-v2/dist/utils/contracts';

import { ControllerWrapper } from '../../../src/wrappers/set-protocol-v2/ControllerWrapper';

const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');
import { expect } from '../../utils/chai';

const blockchain = new Blockchain(provider);


describe('ControllerWrapper', () => {
  let owner: Address;
  let manager: Address;
  let mockSetTokenFactory: Address;
  let mockModule: Address;
  let mockSetTokenAddress: Address;
  let mockPriceOracleAddress: Address;
  let functionCaller: Address;

  let controller: Controller;
  let controllerWrapper: ControllerWrapper;

  let deployer: DeployHelper;

  beforeEach(async () => {
    [
      owner,
      manager,
      mockSetTokenFactory,
      mockModule,
      mockSetTokenAddress,
      mockPriceOracleAddress,
      functionCaller,
    ] = await provider.listAccounts();

    deployer = new DeployHelper(provider.getSigner(owner));
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

    controllerWrapper = new ControllerWrapper(provider, controller.address);
  });

  beforeEach(async () => {
    await blockchain.saveSnapshotAsync();
  });

  afterEach(async () => {
    await blockchain.revertAsync();
  });

  describe('#getFactories', () => {
    let subjectCaller: Address;

    beforeEach(async () => {
      subjectCaller = functionCaller;
    });

    async function subject(): Promise<Address[]> {
      return controllerWrapper.getFactories(subjectCaller);
    }

    it('should return empty array', async () => {
      const factoryAddresses = await subject();

      expect(factoryAddresses.length).to.eq(0);
    });

    describe('when there is a deployed SetToken', () => {
      beforeEach(async () => {
        await controller.addFactory(mockSetTokenFactory);
      });

      it('returns the Factory address as part of factories', async () => {
        const factoryAddresses = await subject();

        expect(factoryAddresses[0]).to.eq(mockSetTokenFactory);
      });
    });
  });

  describe('#getModules', () => {
    let subjectCaller: Address;

    beforeEach(async () => {
      subjectCaller = functionCaller;
    });

    async function subject(): Promise<Address[]> {
      return controllerWrapper.getModules(subjectCaller);
    }

    it('should return empty array', async () => {
      const moduleAddresses = await subject();

      expect(moduleAddresses.length).to.eq(0);
    });

    describe('when there is a deployed SetToken', () => {
      beforeEach(async () => {
        await controller.addModule(mockModule);
      });

      it('returns the Module address as part of modules', async () => {
        const modules = await subject();

        expect(modules[0]).to.eq(mockModule);
      });
    });
  });

  describe('#getResources', () => {
    let subjectCaller: Address;

    beforeEach(async () => {
      subjectCaller = functionCaller;
    });

    async function subject(): Promise<Address[]> {
      return controllerWrapper.getResources(subjectCaller);
    }

    it('should return empty array', async () => {
      const resources = await subject();

      expect(resources.length).to.eq(0);
    });

    describe('when there is a resource added', () => {
      beforeEach(async () => {
        const resourceId: BigNumber = new BigNumber(0);
        await controller.addResource(mockPriceOracleAddress, resourceId);
      });

      it('returns the resource as part of resources', async () => {
        const resources = await subject();

        expect(resources[0]).to.eq(mockPriceOracleAddress);
      });
    });
  });

  describe('#getSets', () => {
    let subjectCaller: Address;

    beforeEach(async () => {
      subjectCaller = functionCaller;
    });

    async function subject(): Promise<Address[]> {
      return controllerWrapper.getSets(subjectCaller);
    }

    it('should return empty array', async () => {
      const setAddresses = await subject();

      expect(setAddresses.length).to.eq(0);
    });

    describe('when there is a deployed SetToken', () => {
      beforeEach(async () => {
        await controller.addFactory(mockSetTokenFactory);

        controller = controller.connect(provider.getSigner(mockSetTokenFactory));
        await controller.addSet(mockSetTokenAddress);
      });

      it('returns the SetToken as part of sets', async () => {
        const setAddresses = await subject();

        expect(setAddresses[0]).to.eq(mockSetTokenAddress);
      });
    });
  });
});
