import { ethers, ContractTransaction } from 'ethers';
import { BigNumber } from 'ethers/utils';

import { Account, Address, Wallet, StreamingFeeState } from 'set-protocol-v2/utils/types';
import { ADDRESS_ZERO, ZERO, ONE_YEAR_IN_SECONDS } from 'set-protocol-v2/dist/utils/constants';
import {
  Blockchain,
  ether,
  getStreamingFee,
  getStreamingFeeInflationAmount
} from 'set-protocol-v2/dist/utils/common';
import DeployHelper from 'set-protocol-v2/dist/utils/deploys';
import { SystemFixture } from 'set-protocol-v2/dist/utils/fixtures';
import {
  BasicIssuanceModule,
  StreamingFeeModule,
  Controller,
  SetToken,
  StandardTokenMock
} from 'set-protocol-v2/dist/utils/contracts';

import BasicIssuanceModuleWrapper from '@src/wrappers/set-protocol-v2/BasicIssuanceModuleWrapper';
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

  describe.only('#accrueFee', () => {
    let setToken: SetToken;
    let settings: StreamingFeeState;

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
      await basicIssuanceModule.connect(provider.getSigner(owner)).issue(setToken.address, ether(1), owner);

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
      const transactionTimestamp = new BigNumber(block);
      const expectedFeeInflation = await getStreamingFee(
        streamingFeeModule,
        subjectSetToken,
        lastStreamingFeeTimestamp,
        transactionTimestamp
      );
      const feeInflation = getStreamingFeeInflationAmount(expectedFeeInflation, totalSupply);

      const feeAmountReceived = await setToken.balanceOf(feeRecipient);
      expect(feeAmountReceived.toString()).to.eq(feeInflation.toString());
    });
  });

  // describe('#updateStreamingFee', () => {
  //   let setToken: SetToken;
  //   let streamingFee: BigNumber;

  //   let subjectSetToken: Address;
  //   let subjectNewFee: BigNumber;

  //   beforeEach(async () => {
  //     setToken = await setup.createSetToken(
  //       [setup.weth.address],
  //       [ether(1)],
  //       [streamingFeeModule.address]
  //     );
  //     streamingFee = ether(0.1);

  //     const preIssueHook = ADDRESS_ZERO;
  //     await streamingFeeModule.initialize(setToken.address, preIssueHook);

  //     subjectSetToken = setToken.address;
  //     subjectNewFee = ether(0.2);
  //   });

  //   async function subject(): Promise<ContractTransaction> {
  //     return streamingFeeModule.updateStreamingFee(
  //       subjectSetToken,
  //       subjectNewFee
  //     );
  //   }

  //   it('should update the streaming fee', async () => {
  //   });

  //   describe('#updateFeeRecipient', () => {
  //     it('should update the fee recipient', async () => {
  //       try {
  //         await subject();
  //       } catch (err) {
  //       }
  //     });
  //   });
  // });
});