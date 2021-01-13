import { ethers, ContractTransaction } from 'ethers';
import { BigNumber } from 'ethers/lib/ethers';

import { Address, StreamingFeeState } from '@setprotocol/set-protocol-v2/utils/types';
import { ADDRESS_ZERO, ZERO, ONE_YEAR_IN_SECONDS } from '@setprotocol/set-protocol-v2/dist/utils/constants';
import {
  Blockchain,
  ether,
  getStreamingFee,
  getStreamingFeeInflationAmount,
  preciseMul,
} from '@setprotocol/set-protocol-v2/dist/utils/common';
import DeployHelper from '@setprotocol/set-protocol-v2/dist/utils/deploys';
import { SystemFixture } from '@setprotocol/set-protocol-v2/dist/utils/fixtures';
import {
  BasicIssuanceModule,
  StreamingFeeModule,
  SetToken,
} from '@setprotocol/set-protocol-v2/dist/utils/contracts';

import StreamingFeeModuleWrapper from '@src/wrappers/set-protocol-v2/StreamingFeeModuleWrapper';
import { expect } from '../../utils/chai';

const provider = new ethers.providers.JsonRpcProvider();
const blockchain = new Blockchain(provider);


describe('StreamingFeeModuleWrapper', () => {
  let owner: Address;
  let feeRecipient: Address;
  let deployer: DeployHelper;

  let setup: SystemFixture;
  let basicIssuanceModule: BasicIssuanceModule;
  let streamingFeeModule: StreamingFeeModule;

  let streamingFeeModuleWrapper: StreamingFeeModuleWrapper;

  beforeAll(async () => {
    [
      owner,
      feeRecipient,
    ] = await provider.listAccounts();

    deployer = new DeployHelper(provider.getSigner(owner));
    setup = new SystemFixture(provider, owner);
  });

  beforeEach(async () => {
    await blockchain.saveSnapshotAsync();

    await setup.initialize();

    basicIssuanceModule = await deployer.modules.deployBasicIssuanceModule(setup.controller.address);
    await setup.controller.addModule(basicIssuanceModule.address);

    streamingFeeModule = await deployer.modules.deployStreamingFeeModule(setup.controller.address);
    await setup.controller.addModule(streamingFeeModule.address);

    streamingFeeModuleWrapper = new StreamingFeeModuleWrapper(provider, streamingFeeModule.address);
  });

  afterEach(async () => {
    await blockchain.revertAsync();
  });

  describe('#accrueFee', () => {
    let setToken: SetToken;
    let settings: StreamingFeeState;
    let protocolFee: BigNumber;

    let subjectSetToken: Address;
    let subjectTimeFastForward: BigNumber;
    let subjectCaller: Address;

    beforeEach(async () => {
      // Create the settings to initialize the streaming fee module with
      settings = {
        feeRecipient: feeRecipient,
        maxStreamingFeePercentage: ether(.1),
        streamingFeePercentage: ether(.02),
        lastStreamingFeeTimestamp: ZERO,
      } as StreamingFeeState;

      // Create the SetToken with the Issuance and StreamingFee modules
      setToken = await setup.createSetToken(
        [setup.weth.address],
        [ether(.01)],
        [basicIssuanceModule.address, streamingFeeModule.address]
      );

      // Initialize the SetToken to the StreamingFee module
      await streamingFeeModule.initialize(setToken.address, settings);

      // Initialize the SetToken to the IssuanceModule and issue some so a streaming fee can be collected
      await basicIssuanceModule.initialize(setToken.address, ADDRESS_ZERO);
      await setup.weth.approve(basicIssuanceModule.address, ether(1));
      await basicIssuanceModule.connect(provider.getSigner(owner)).issue(setToken.address, ether(1), owner);

      protocolFee = ether(.15);
      await setup.controller.addFee(streamingFeeModule.address, ZERO, protocolFee);

      subjectTimeFastForward = ONE_YEAR_IN_SECONDS.toNumber();
      subjectSetToken = setToken.address;
      subjectCaller = owner;
    });

    async function subject(): Promise<ContractTransaction> {
      await blockchain.increaseTimeAsync(subjectTimeFastForward);
      return streamingFeeModuleWrapper.accrueFee(
        subjectSetToken,
        subjectCaller
      );
    }

    it('should accrue a fee to the fee recipient', async () => {
      const streamingFeeStateBeforeSubject = await streamingFeeModule.feeStates(subjectSetToken);
      const lastStreamingFeeTimestamp = streamingFeeStateBeforeSubject.lastStreamingFeeTimestamp;
      const totalSupply = await setToken.totalSupply();

      const transactionHash = await subject();

      const block = (await provider.getBlock(transactionHash.blockNumber)).timestamp;
      const transactionTimestamp = BigNumber.from(block);
      const expectedFeeInflation = await getStreamingFee(
        streamingFeeModule,
        subjectSetToken,
        lastStreamingFeeTimestamp,
        transactionTimestamp
      );
      const feeInflation = getStreamingFeeInflationAmount(expectedFeeInflation, totalSupply);
      const protocolFeeAmount = preciseMul(feeInflation, protocolFee);
      const feeAmountReceived = await setToken.balanceOf(feeRecipient);
      expect(feeAmountReceived.toString()).to.eq(feeInflation.sub(protocolFeeAmount).toString());
    });
  });

  describe('#updateStreamingFee', () => {
    let setToken: SetToken;
    let previousStreamingFee: BigNumber;

    let subjectSetToken: Address;
    let subjectNewFee: BigNumber;
    let subjectCaller: Address;

    beforeEach(async () => {
      // Create the settings to initialize the streaming fee module with
      previousStreamingFee = ether(.02);
      const settings = {
        feeRecipient: feeRecipient,
        maxStreamingFeePercentage: ether(.1),
        streamingFeePercentage: previousStreamingFee,
        lastStreamingFeeTimestamp: ZERO,
      } as StreamingFeeState;

      // Create the SetToken with the Issuance and StreamingFee modules
      setToken = await setup.createSetToken(
        [setup.weth.address],
        [ether(.01)],
        [streamingFeeModule.address]
      );

      // Initialize the SetToken to the StreamingFee module
      await streamingFeeModule.initialize(setToken.address, settings);

      subjectSetToken = setToken.address;
      subjectNewFee = ether(0.03);
      subjectCaller = owner;
    });

    async function subject(): Promise<ContractTransaction> {
      return streamingFeeModuleWrapper.updateStreamingFee(
        subjectSetToken,
        subjectNewFee,
        subjectCaller
      );
    }

    it('should update the streaming fee', async () => {
      const previousFeeState: any = await streamingFeeModule.feeStates(subjectSetToken);
      expect(previousFeeState.streamingFeePercentage.toString()).to.eq(previousStreamingFee.toString());

      await subject();

      const updatedFeeState: any = await streamingFeeModule.feeStates(subjectSetToken);
      expect(updatedFeeState.streamingFeePercentage.toString()).to.eq(subjectNewFee.toString());
    });
  });

  describe('#updateFeeRecipient', () => {
    let setToken: SetToken;

    let subjectSetToken: Address;
    let subjectNewFeeRecipientAddress: Address;
    let subjectCaller: Address;

    beforeEach(async () => {
      // Create the settings to initialize the streaming fee module with
      const settings = {
        feeRecipient: feeRecipient,
        maxStreamingFeePercentage: ether(.1),
        streamingFeePercentage: ether(.02),
        lastStreamingFeeTimestamp: ZERO,
      } as StreamingFeeState;

      // Create the SetToken with the Issuance and StreamingFee modules
      setToken = await setup.createSetToken(
        [setup.weth.address],
        [ether(.01)],
        [streamingFeeModule.address]
      );

      // Initialize the SetToken to the StreamingFee module
      await streamingFeeModule.initialize(setToken.address, settings);

      subjectSetToken = setToken.address;
      subjectNewFeeRecipientAddress = owner;
      subjectCaller = owner;
    });

    async function subject(): Promise<ContractTransaction> {
      return streamingFeeModuleWrapper.updateFeeRecipient(
        subjectSetToken,
        subjectNewFeeRecipientAddress,
        subjectCaller
      );
    }

    it('updates the fee recipient', async () => {
      const previousFeeState: any = await streamingFeeModule.feeStates(subjectSetToken);
      expect(previousFeeState.feeRecipient).to.eq(feeRecipient);

      await subject();

      const newFeeState: any = await streamingFeeModule.feeStates(subjectSetToken);
      expect(newFeeState.feeRecipient).to.eq(subjectNewFeeRecipientAddress);
    });
  });
});