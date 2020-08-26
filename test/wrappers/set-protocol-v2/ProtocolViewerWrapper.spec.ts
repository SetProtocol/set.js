import { ethers } from 'ethers';

import { Address, StreamingFeeState } from 'set-protocol-v2/utils/types';
import { ADDRESS_ZERO, ZERO } from 'set-protocol-v2/dist/utils/constants';
import { Blockchain, ether } from 'set-protocol-v2/dist/utils/common';
import DeployHelper from 'set-protocol-v2/dist/utils/deploys';
import { SystemFixture } from 'set-protocol-v2/dist/utils/fixtures';
import {
  ProtocolViewer,
  SetToken,
} from 'set-protocol-v2/dist/utils/contracts';

import ProtocolViewerWrapper from '@src/wrappers/set-protocol-v2/ProtocolViewerWrapper';
import { expect } from '../../utils/chai';

const provider = new ethers.providers.JsonRpcProvider();
const blockchain = new Blockchain(provider);


describe('ProtocolViewerWrapper', () => {
  let owner: Address;
  let managerOne: Address;
  let managerTwo: Address;
  let functionCaller: Address;
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
      functionCaller,
    ] = await provider.listAccounts();

    deployer = new DeployHelper(provider.getSigner(owner));
    setup = new SystemFixture(provider, owner);
  });

  beforeEach(async () => {
    await blockchain.saveSnapshotAsync();

    await setup.initialize();

    protocolViewer = await deployer.modules.deployProtocolViewer();
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
      setTokenOne, streamingFeeStateOne
    );
    await setup.streamingFeeModule.connect(provider.getSigner(managerTwo)).initialize(
      setTokenTwo, streamingFeeStateTwo
    );

    await setup.issuanceModule.connect(provider.getSigner(managerOne)).initialize(
      setTokenOne, ADDRESS_ZERO
    );
  });

  afterEach(async () => {
    await blockchain.revertAsync();
  });

  describe('#batchFetchManagers', () => {
    let subjectSetTokens: Address[];

    beforeEach(async () => {
      subjectSetTokens = [setTokenOne, setTokenTwo];
    });

    async function subject(): Promise<any> {
      return protocolViewerWrapper.batchFetchManagers(subjectSetTokens);
    }

    it('should return the correct managers', async () => {
      const managers = await subject();

      expect(managers[0]).to.eq(managerOne);
      expect(managers[1]).to.eq(managerTwo);
    });
  });
});
