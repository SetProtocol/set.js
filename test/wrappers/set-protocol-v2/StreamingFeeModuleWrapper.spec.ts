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
import { SystemFixture } from '@setprotocol/set-protocol-v2/dist/utils/fixtures/systemFixture';
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
  let randomAddress: Address;
  let deployer: DeployHelper;

  let setup: SystemFixture;
  let basicIssuanceModule: BasicIssuanceModule;
  let streamingFeeModule: StreamingFeeModule;

  let streamingFeeModuleWrapper: StreamingFeeModuleWrapper;

  beforeAll(async () => {
    [
      owner,
      feeRecipient,
      randomAddress,
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

  describe('#initialize', () => {
    let setToken: SetToken;
    let feeRecipient: Address;
    let maxStreamingFeePercentage: BigNumber;
    let streamingFeePercentage: BigNumber;

    let subjectSetToken: Address;
    let subjectSettings: StreamingFeeState;
    let subjectCaller: Address;

    beforeEach(async () => {
      setToken = await setup.createSetToken(
        [setup.weth.address],
        [ether(1)],
        [streamingFeeModule.address]
      );

      feeRecipient = randomAddress;
      maxStreamingFeePercentage = ether(.1);
      streamingFeePercentage = ether(.02);

      subjectSetToken = setToken.address;
      subjectSettings = {
        feeRecipient,
        maxStreamingFeePercentage,
        streamingFeePercentage,
        lastStreamingFeeTimestamp: ZERO,
      } as StreamingFeeState;
      subjectCaller = owner;
    });

    async function subject(): Promise<ContractTransaction> {
      streamingFeeModule = streamingFeeModule.connect(provider.getSigner(subjectCaller));
      return streamingFeeModuleWrapper.initialize(subjectSetToken, subjectSettings, subjectCaller);
    }

    it('should enable the Module on the SetToken', async () => {
      await subject();
      const isModuleEnabled = await setToken.isInitializedModule(streamingFeeModule.address);
      expect(isModuleEnabled).to.eq(true);
    });

    it('should set all the fields in FeeState correctly', async () => {
      const txTimestamp = BigNumber.from((await provider.getBlock((await subject()).blockHash)).timestamp);

      const feeState: StreamingFeeState = await streamingFeeModule.feeStates(setToken.address);

      expect(feeState.feeRecipient).to.eq(subjectSettings.feeRecipient);
      expect(feeState.maxStreamingFeePercentage.toString()).to.eq(subjectSettings.maxStreamingFeePercentage.toString());
      expect(feeState.streamingFeePercentage.toString()).to.eq(subjectSettings.streamingFeePercentage.toString());
      expect(feeState.lastStreamingFeeTimestamp.toString()).to.eq(txTimestamp.toString());
    });

    describe('when the caller is not the SetToken manager', () => {
      beforeEach(async () => {
        subjectCaller = randomAddress;
      });

      it('should revert', async () => {
        await expect(subject()).to.be.rejectedWith('Must be the SetToken manager');
      });
    });

    describe('when module is in NONE state', () => {
      beforeEach(async () => {
        await subject();
        await setToken.removeModule(streamingFeeModule.address);
      });

      it('should revert', async () => {
        await expect(subject()).to.be.rejectedWith('Must be pending initialization');
      });
    });

    describe('when module is in INITIALIZED state', () => {
      beforeEach(async () => {
        await subject();
      });

      it('should revert', async () => {
        await expect(subject()).to.be.rejectedWith('Must be pending initialization');
      });
    });

    describe('when the SetToken is not enabled on the controller', () => {
      beforeEach(async () => {
        const nonEnabledSetToken = await setup.createNonControllerEnabledSetToken(
          [setup.weth.address],
          [ether(1)],
          [streamingFeeModule.address]
        );

        subjectSetToken = nonEnabledSetToken.address;
      });

      it('should revert', async () => {
        await expect(subject()).to.be.rejectedWith('Must be controller-enabled SetToken');
      });
    });

    describe('when passed max fee is greater than 100%', () => {
      beforeEach(async () => {
        subjectSettings.maxStreamingFeePercentage = ether(1.1);
      });

      it('should revert', async () => {
        await expect(subject()).to.be.rejectedWith('Max fee must be < 100%.');
      });
    });

    describe('when passed fee is greater than max fee', () => {
      beforeEach(async () => {
        subjectSettings.streamingFeePercentage = ether(.11);
      });

      it('should revert', async () => {
        await expect(subject()).to.be.rejectedWith('Fee must be <= max.');
      });
    });

    describe('when feeRecipient is zero address', () => {
      beforeEach(async () => {
        subjectSettings.feeRecipient = ADDRESS_ZERO;
      });

      it('should revert', async () => {
        await expect(subject()).to.be.rejectedWith('Fee Recipient must be non-zero address.');
      });
    });
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