import { ethers } from 'ethers';
import { BigNumber } from 'ethers/utils';

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
    const streamingFeeStateTwo = {
      feeRecipient: managerTwo,
      maxStreamingFeePercentage: ether(.1),
      streamingFeePercentage: ether(.04),
      lastStreamingFeeTimestamp: ZERO,
    } as StreamingFeeState;
    await setup.streamingFeeModule.connect(provider.getSigner(managerOne)).initialize(
      setTokenOne.address, streamingFeeStateOne
    );
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

      const callTimestamp = new BigNumber((await provider.getBlock('latest')).timestamp);

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
});
