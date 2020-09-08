import { ethers } from 'ethers';
import { BigNumber, Arrayish } from 'ethers/utils';
import Web3 from 'web3';

import { Address, Bytes } from 'set-protocol-v2/utils/types';
import { ADDRESS_ZERO, ZERO, ONE, EMPTY_BYTES } from 'set-protocol-v2/dist/utils/constants';
import {
  Blockchain,
  ether,
} from 'set-protocol-v2/dist/utils/common';
import DeployHelper from 'set-protocol-v2/dist/utils/deploys';
import {
  OneInchExchangeAdapter,
  OneInchExchangeMock,
} from 'set-protocol-v2/dist/utils/contracts';

import OneInchExchangeAdapterWrapper from '@src/wrappers/set-protocol-v2/OneInchExchangeAdapterWrapper';
import { expect } from '../../utils/chai';

const provider = new ethers.providers.JsonRpcProvider();
const blockchain = new Blockchain(provider);

describe('OneInchExchangeAdapterWrapper', () => {
  let owner: Address;
  let mockSetToken: Address;
  let mockWbtc: Address;
  let mockWeth: Address;
  let mockOneInchSpender: Address;
  let randomToken: Address;
  let caller: Address;
  let deployer: DeployHelper;

  let oneInchExchangeMock: OneInchExchangeMock;
  let oneInchExchangeAdapter: OneInchExchangeAdapter;
  let oneInchFunctionSignature: Bytes;

  const web3 = new Web3();

  let oneInchExchangeAdapterWrapper: OneInchExchangeAdapterWrapper;

  beforeAll(async () => {
    [
      owner,
      caller,
      mockSetToken,
      mockWbtc,
      mockWeth,
      mockOneInchSpender,
      randomToken,
    ] = await provider.listAccounts();

    deployer = new DeployHelper(provider.getSigner(owner));
  });

  beforeEach(async () => {
    await blockchain.saveSnapshotAsync();

    // Mock OneInch exchange that allows for only fixed exchange amounts
    oneInchExchangeMock = await deployer.mocks.deployOneInchExchangeMock(
      mockWbtc,
      mockWeth,
      new BigNumber(100000000),
      ether(33)
    );
    oneInchFunctionSignature = web3.eth.abi.encodeFunctionSignature(
      'swap(address,address,uint256,uint256,uint256,address,address[],bytes,uint256[],uint256[])'
    );
    oneInchExchangeAdapter = await deployer.adapters.deployOneInchExchangeAdapter(
      mockOneInchSpender,
      oneInchExchangeMock.address,
      oneInchFunctionSignature
    );

    oneInchExchangeAdapterWrapper = new OneInchExchangeAdapterWrapper(provider, oneInchExchangeAdapter.address);
  });

  afterEach(async () => {
    await blockchain.revertAsync();
  });

  describe('getTradeCalldata', () => {
    let subjectSourceToken: Address;
    let subjectDestinationToken: Address;
    let subjectMockSetToken: Address;
    let subjectSourceQuantity: BigNumber;
    let subjectMinDestinationQuantity: BigNumber;
    let subjectData: Bytes;
    let subjectCaller: Address;

    beforeEach(async () => {
      // 1inch trades only need byte data as all method call data is generaged offchain
      subjectSourceToken = mockWbtc;
      subjectDestinationToken = mockWeth;
      subjectMockSetToken = mockSetToken;
      subjectSourceQuantity = ONE;
      subjectMinDestinationQuantity = ONE;
      subjectCaller = caller;
      // Get mock 1inch swap calldata
      subjectData = oneInchExchangeMock.interface.functions.swap.encode([
        mockWbtc, // Send token
        mockWeth, // Receive token
        ONE, // Send quantity
        ONE, // Min receive quantity
        ZERO,
        ADDRESS_ZERO,
        [ADDRESS_ZERO],
        EMPTY_BYTES,
        [ZERO],
        [ZERO],
      ]);
    });

    async function subject(): Promise<[Address, BigNumber, Arrayish]> {
      return await oneInchExchangeAdapterWrapper.getTradeCalldata(
        subjectSourceToken,
        subjectDestinationToken,
        subjectMockSetToken,
        subjectSourceQuantity,
        subjectMinDestinationQuantity,
        subjectData,
        subjectCaller,
      );
    }

    it('should return the correct trade calldata', async () => {
      const calldata = await subject();
      const expectedCallData = [oneInchExchangeMock.address, ZERO, subjectData];

      expect(JSON.stringify(calldata)).to.eq(JSON.stringify(expectedCallData));
    });

    describe('when function signature does not match', () => {
      beforeEach(async () => {
        subjectData = EMPTY_BYTES;
      });

      it('should revert', async () => {
        await expect(subject()).to.be.rejectedWith('Not One Inch Swap Function');
      });
    });

    describe('when send token does not match calldata', () => {
      beforeEach(async () => {
        // Get random source token
        subjectData = oneInchExchangeMock.interface.functions.swap.encode([
          randomToken, // Send token
          mockWeth, // Receive token
          ONE, // Send quantity
          ONE, // Min receive quantity
          ZERO,
          ADDRESS_ZERO,
          [ADDRESS_ZERO],
          EMPTY_BYTES,
          [ZERO],
          [ZERO],
        ]);
      });

      it('should revert', async () => {
        await expect(subject()).to.be.rejectedWith('Invalid send token');
      });
    });

    describe('when receive token does not match calldata', () => {
      beforeEach(async () => {
        // Get random source token
        subjectData = oneInchExchangeMock.interface.functions.swap.encode([
          mockWbtc, // Send token
          randomToken, // Receive token
          ONE, // Send quantity
          ONE, // Min receive quantity
          ZERO,
          ADDRESS_ZERO,
          [ADDRESS_ZERO],
          EMPTY_BYTES,
          [ZERO],
          [ZERO],
        ]);
      });

      it('should revert', async () => {
        await expect(subject()).to.be.rejectedWith('Invalid receive token');
      });
    });

    describe('when send token quantity does not match calldata', () => {
      beforeEach(async () => {
        subjectData = oneInchExchangeMock.interface.functions.swap.encode([
          mockWbtc, // Send token
          mockWeth, // Receive token
          ZERO, // Send quantity
          ONE, // Min receive quantity
          ZERO,
          ADDRESS_ZERO,
          [ADDRESS_ZERO],
          EMPTY_BYTES,
          [ZERO],
          [ZERO],
        ]);
      });

      it('should revert', async () => {
        await expect(subject()).to.be.rejectedWith('Source quantity mismatch');
      });
    });

    describe('when min receive token quantity does not match calldata', () => {
      beforeEach(async () => {
        subjectData = oneInchExchangeMock.interface.functions.swap.encode([
          mockWbtc, // Send token
          mockWeth, // Receive token
          ONE, // Send quantity
          ZERO, // Min receive quantity
          ZERO,
          ADDRESS_ZERO,
          [ADDRESS_ZERO],
          EMPTY_BYTES,
          [ZERO],
          [ZERO],
        ]);
      });

      it('should revert', async () => {
        await expect(subject()).to.be.rejectedWith('Min destination quantity mismatch');
      });
    });
  });
});