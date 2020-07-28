import { ethers } from 'ethers';
import { BigNumber } from 'ethers/utils';
import chai from 'chai';

import { Address } from 'set-protocol-v2/utils/types';
import { Blockchain, ether } from 'set-protocol-v2/dist/utils/common';
import DeployHelper from 'set-protocol-v2/dist/utils/deploys';
import { SetTokenWrapper } from '../../../src/wrappers/set-protocol-v2/SetTokenWrapper';
import { SetToken } from 'set-protocol-v2/dist/typechain/SetToken';
import { Controller } from 'set-protocol-v2/dist/typechain/Controller';
import { StandardTokenMock } from 'set-protocol-v2/dist/typechain/StandardTokenMock';
import { ContractTransaction } from 'ethers';

const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');
const expect = chai.expect;

const blockchain = new Blockchain(provider);

describe('SetTokenWrapper', () => {
  let owner: Address;
  let manager: Address;
  let mockIssuanceModule: Address;
  let mockLockedModule: Address;
  let testAccount: Address;
  let setTokenWrapper: SetTokenWrapper;

  let deployer: DeployHelper;

  beforeEach(async () => {
    [
      owner,
      manager,
      mockIssuanceModule,
      testAccount,
    ] = await provider.listAccounts();

    setTokenWrapper = new SetTokenWrapper(provider);
    deployer = new DeployHelper(provider.getSigner(owner));
  });

  beforeEach(async () => {
    await blockchain.saveSnapshotAsync();
  });

  afterEach(async () => {
    await blockchain.revertAsync();
  });

  describe('when there is a deployed SetToken', () => {
    let setToken: SetToken;

    let controller: Controller;
    let firstComponent: StandardTokenMock;
    let firstComponentUnits: BigNumber;
    let secondComponent: StandardTokenMock;
    let secondComponentUnits: BigNumber;

    let components: Address[];
    let units: BigNumber[];
    let modules: Address[];
    let name: string;
    let symbol: string;

    beforeEach(async () => {
      [
        owner,
        manager,
        mockIssuanceModule,
        mockLockedModule,
        testAccount,
      ] = await provider.listAccounts();

      firstComponent = await deployer.mocks.deployTokenMock(manager);
      firstComponentUnits = ether(1);
      secondComponent = await deployer.mocks.deployTokenMock(manager);
      secondComponentUnits = ether(2);

      controller = await deployer.core.deployController(owner);
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

    describe('#popPosition', () => {
      let subjectCaller: Address;

      beforeEach(async () => {
        subjectCaller = mockIssuanceModule;
      });

      async function subject(): Promise<ContractTransaction> {
        return setTokenWrapper.popPosition(setToken.address, subjectCaller);
      }

      it('should remove the last position', async () => {
        const prevPositions = await setTokenWrapper.getPositions(setToken.address, subjectCaller);

        await subject();

        const positions = await setTokenWrapper.getPositions(setToken.address, subjectCaller);
        expect(positions.length).to.eq(prevPositions.length - 1);
      });
    });
  });
});
