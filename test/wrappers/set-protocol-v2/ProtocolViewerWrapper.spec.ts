import { ethers } from 'ethers';
import { BigNumber } from 'ethers/lib/ethers';

import { Address, StreamingFeeState } from '@setprotocol/set-protocol-v2/utils/types';
import { ADDRESS_ZERO, ZERO, ONE_YEAR_IN_SECONDS } from '@setprotocol/set-protocol-v2/dist/utils/constants';
import { Blockchain, ether, getStreamingFee } from '@setprotocol/set-protocol-v2/dist/utils/common';
import DeployHelper from '@setprotocol/set-protocol-v2/dist/utils/deploys';
import { SystemFixture } from '@setprotocol/set-protocol-v2/dist/utils/fixtures';
import {
  ProtocolViewer,
  SetToken,
} from '@setprotocol/set-protocol-v2/dist/utils/contracts';

import ProtocolViewerWrapper from '@src/wrappers/set-protocol-v2/ProtocolViewerWrapper';
import { expect } from '../../utils/chai';

const provider = new ethers.providers.JsonRpcProvider();
const blockchain = new Blockchain(provider);

describe('ProtocolViewerWrapper', () => {
  let owner: Address;
  let managerOne: Address;
  let managerTwo: Address;
  let dummyModule: Address;

  let protocolViewer: ProtocolViewer;

  let setTokenOne: SetToken;
  let setTokenTwo: SetToken;

  let deployer: DeployHelper;
  let setup: SystemFixture;

  let protocolViewerWrapper: ProtocolViewerWrapper;

  beforeAll(async() => {
    [
      owner,
      managerOne,
      managerTwo,
      dummyModule,
    ] = await provider.listAccounts();

    deployer = new DeployHelper(provider.getSigner(owner));
    setup = new SystemFixture(provider, owner);
  });

  beforeEach(async () => {
    await blockchain.saveSnapshotAsync();

    await setup.initialize();
    await setup.controller.addModule(dummyModule);

    protocolViewer = await deployer.viewers.deployProtocolViewer();
    protocolViewerWrapper = new ProtocolViewerWrapper(
      provider,
      protocolViewer.address,
      setup.streamingFeeModule.address
    );

    setTokenOne = await setup.createSetToken(
      [setup.weth.address],
      [ether(1)],
      [setup.issuanceModule.address, setup.streamingFeeModule.address, dummyModule],
      managerOne
    );

    setTokenTwo = await setup.createSetToken(
      [setup.wbtc.address],
      [ether(1)],
      [setup.issuanceModule.address, setup.streamingFeeModule.address],
      managerTwo
    );

    const streamingFeeStateOne = {
      feeRecipient: managerOne,
      maxStreamingFeePercentage: ether(.1),
      streamingFeePercentage: ether(.02),
      lastStreamingFeeTimestamp: ZERO,
    } as StreamingFeeState;
    await setup.streamingFeeModule.connect(provider.getSigner(managerOne)).initialize(
      setTokenOne.address, streamingFeeStateOne
    );

    const streamingFeeStateTwo = {
      feeRecipient: managerTwo,
      maxStreamingFeePercentage: ether(.1),
      streamingFeePercentage: ether(.04),
      lastStreamingFeeTimestamp: ZERO,
    } as StreamingFeeState;
    await setup.streamingFeeModule.connect(provider.getSigner(managerTwo)).initialize(
      setTokenTwo.address, streamingFeeStateTwo
    );

    await setup.issuanceModule.connect(provider.getSigner(managerOne)).initialize(
      setTokenOne.address, ADDRESS_ZERO
    );
  });

  afterEach(async () => {
    await blockchain.revertAsync();
  });

  describe('#batchFetchManagers', () => {
    let subjectSetTokens: Address[];
    let subjectCaller: Address;

    beforeEach(async () => {
      subjectSetTokens = [setTokenOne.address, setTokenTwo.address];
      subjectCaller = owner;
    });

    async function subject(): Promise<Address[]> {
      return protocolViewerWrapper.batchFetchManagers(subjectSetTokens, subjectCaller);
    }

    it('should return the correct managers', async () => {
      const managers = await subject();

      expect(managers[0]).to.eq(managerOne);
      expect(managers[1]).to.eq(managerTwo);
    });
  });

  describe('#batchFetchStreamingFeeInfo', () => {
    let subjectSetTokens: Address[];

    let subjectTimeFastForward: BigNumber;

    beforeEach(async () => {
      subjectSetTokens = [setTokenOne.address, setTokenTwo.address];
      subjectTimeFastForward = ONE_YEAR_IN_SECONDS;
    });

    async function subject(): Promise<any> {
      await blockchain.increaseTimeAsync(subjectTimeFastForward);
      return protocolViewerWrapper.batchFetchStreamingFeeInfo(subjectSetTokens);
    }

    it('should return the correct streaming fee info', async () => {
      const feeStateOne = await setup.streamingFeeModule.feeStates(subjectSetTokens[0]);
      const feeStateTwo = await setup.streamingFeeModule.feeStates(subjectSetTokens[1]);

      const [setOneFeeInfo, setTwoFeeInfo] = await subject();

      const callTimestamp = BigNumber.from((await provider.getBlock('latest')).timestamp);

      const expectedFeePercentOne = await getStreamingFee(
        setup.streamingFeeModule,
        subjectSetTokens[0],
        feeStateOne.lastStreamingFeeTimestamp,
        callTimestamp
      );
      const expectedFeePercentTwo = await getStreamingFee(
        setup.streamingFeeModule,
        subjectSetTokens[1],
        feeStateTwo.lastStreamingFeeTimestamp,
        callTimestamp
      );

      expect(setOneFeeInfo.feeRecipient).to.eq(managerOne);
      expect(setTwoFeeInfo.feeRecipient).to.eq(managerTwo);
      expect(setOneFeeInfo.streamingFeePercentage.toString()).to.eq(ether(.02).toString());
      expect(setTwoFeeInfo.streamingFeePercentage.toString()).to.eq(ether(.04).toString());
      expect(setOneFeeInfo.unaccruedFees.toString()).to.eq(expectedFeePercentOne.toString());
      expect(setTwoFeeInfo.unaccruedFees.toString()).to.eq(expectedFeePercentTwo.toString());
    });
  });

  describe('#getSetDetails', () => {
    let subjectSetTokenAddress: Address;
    let subjectModuleAddresses: Address[];

    beforeEach(async () => {
      subjectSetTokenAddress = setTokenOne.address;
      subjectModuleAddresses = [setup.streamingFeeModule.address, setup.issuanceModule.address];
    });

    async function subject(): Promise<any> {
      return protocolViewerWrapper.getSetDetails(
         subjectSetTokenAddress,
         subjectModuleAddresses
       );
    }

    it('should return the correct streaming fee info', async () => {
      const setDetails = await subject();

      const expectedSetName = await setTokenOne.name();
      expect(setDetails.name).to.eq(expectedSetName);

      const expectedSetSymbol = await setTokenOne.symbol();
      expect(setDetails.symbol).to.eq(expectedSetSymbol);

      const expectedSetManager = await setTokenOne.manager();
      expect(setDetails.manager).to.eq(expectedSetManager);

      const expectSetModules = await setTokenOne.getModules();
      expect(setDetails.modules.toString()).to.eq(expectSetModules.toString());

      const expectSetModuleStatuses = [2, 2];
      expect(setDetails.moduleStatuses.toString()).to.eq(expectSetModuleStatuses.toString());

      const expectSetPositions = await setTokenOne.getPositions();
      expect(setDetails.positions.toString()).to.eq(expectSetPositions.toString());

      const expectedSetSupply = await setTokenOne.totalSupply();
      expect(setDetails.totalSupply.toString()).to.eq(expectedSetSupply.toString());
    });
  });

  describe('#batchFetchDetails', () => {
    let subjectSetTokenAddresses: Address[];
    let subjectModuleAddresses: Address[];

    beforeEach(async () => {
      subjectSetTokenAddresses = [setTokenOne.address, setTokenTwo.address];
      subjectModuleAddresses = [setup.streamingFeeModule.address, setup.issuanceModule.address];
    });

    async function subject(): Promise<any> {
      return protocolViewerWrapper.batchFetchDetails(
         subjectSetTokenAddresses,
         subjectModuleAddresses
       );
    }

    it('should return the correct streaming fee info', async () => {
      const [setOneDetails, setTwoDetails] = await subject();

      const expectedSetOneName = await setTokenOne.name();
      const expectedSetTwoName = await setTokenOne.name();
      expect(setOneDetails.name).to.eq(expectedSetOneName);
      expect(setTwoDetails.name).to.eq(expectedSetTwoName);

      const expectedSetOneSymbol = await setTokenOne.symbol();
      const expectedSetTwoSymbol = await setTokenTwo.symbol();
      expect(setOneDetails.symbol).to.eq(expectedSetOneSymbol);
      expect(setTwoDetails.symbol).to.eq(expectedSetTwoSymbol);

      const expectedSetOneManager = await setTokenOne.manager();
      const expectedSetTwoManager = await setTokenTwo.manager();
      expect(setOneDetails.manager).to.eq(expectedSetOneManager);
      expect(setTwoDetails.manager).to.eq(expectedSetTwoManager);

      const expectedSetOneModules = await setTokenOne.getModules();
      const expectedSetTwoModules = await setTokenTwo.getModules();
      expect(setOneDetails.modules.toString()).to.eq(expectedSetOneModules.toString());
      expect(setTwoDetails.modules.toString()).to.eq(expectedSetTwoModules.toString());

      const expectedSetOneModuleStatuses = [2, 2];
      const expectedSetTwoModuleStatuses = [2, 1];
      expect(setOneDetails.moduleStatuses.toString()).to.eq(expectedSetOneModuleStatuses.toString());
      expect(setTwoDetails.moduleStatuses.toString()).to.eq(expectedSetTwoModuleStatuses.toString());

      const expectedSetOnePositions = await setTokenOne.getPositions();
      const expectedSetTwoPositions = await setTokenTwo.getPositions();
      expect(setOneDetails.positions.toString()).to.eq(expectedSetOnePositions.toString());
      expect(setTwoDetails.positions.toString()).to.eq(expectedSetTwoPositions.toString());

      const expectedSetOneSupply = await setTokenOne.totalSupply();
      const expectedSetTwoSupply = await setTokenTwo.totalSupply();
      expect(setOneDetails.totalSupply.toString()).to.eq(expectedSetOneSupply.toString());
      expect(setTwoDetails.totalSupply.toString()).to.eq(expectedSetTwoSupply.toString());
    });
  });
});
