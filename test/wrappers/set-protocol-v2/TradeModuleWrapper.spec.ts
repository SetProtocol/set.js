import { ethers } from 'ethers';
import { BigNumber } from 'ethers/utils';
import Web3 from 'web3';

import { Address, Bytes } from '@setprotocol/set-protocol-v2/dist/utils/types';
import { ADDRESS_ZERO, ZERO, EMPTY_BYTES } from '@setprotocol/set-protocol-v2/dist/utils/constants';
import { Blockchain, ether } from '@setprotocol/set-protocol-v2/dist/utils/common';
import DeployHelper from '@setprotocol/set-protocol-v2/dist/utils/deploys';
import { SystemFixture } from '@setprotocol/set-protocol-v2/dist/utils/fixtures';
import {
  TradeModule,
  KyberNetworkProxyMock,
  KyberExchangeAdapter,
  OneInchExchangeMock,
  OneInchExchangeAdapter,
  ManagerIssuanceHookMock,
  SetToken,
  Weth9,
  StandardTokenMock,
} from '@setprotocol/set-protocol-v2/dist/utils/contracts';

import TradeModuleWrapper from '@src/wrappers/set-protocol-v2/TradeModuleWrapper';
import { expect } from '../../utils/chai';

const provider = new ethers.providers.JsonRpcProvider();
const blockchain = new Blockchain(provider);

describe('TradeModuleWrapper', () => {
  let owner: Address;
  let manager: Address;
  let mockModule: Address;
  let randomAccount: Address;
  let wbtcRate: BigNumber;
  let kyberAdapterName: string;
  let oneInchAdapterName: string;
  let kyberNetworkProxy: KyberNetworkProxyMock;
  let kyberExchangeAdapter: KyberExchangeAdapter;
  let oneInchExchangeMock: OneInchExchangeMock;
  let oneInchExchangeAdapter: OneInchExchangeAdapter;
  let tradeModule: TradeModule;

  let deployer: DeployHelper;
  let setup: SystemFixture;

  let tradeModuleWrapper: TradeModuleWrapper;

  const web3 = new Web3();

  beforeAll(async () => {
    [
      owner,
      manager,
      mockModule,
      randomAccount,
    ] = await provider.listAccounts();

    deployer = new DeployHelper(provider.getSigner(owner));
    setup = new SystemFixture(provider, owner);
  });

  beforeEach(async () => {
    await blockchain.saveSnapshotAsync();

    await setup.initialize();

    wbtcRate = ether(33); // 1 WBTC = 33 ETH

    // Mock Kyber reserve only allows trading from/to WETH
    kyberNetworkProxy = await deployer.mocks.deployKyberNetworkProxyMock(setup.weth.address);
    await kyberNetworkProxy.addToken(
      setup.wbtc.address,
      wbtcRate,
      8
    );
    kyberExchangeAdapter = await deployer.adapters.deployKyberExchangeAdapter(kyberNetworkProxy.address);

    // Mock OneInch exchange that allows for only fixed exchange amounts
    oneInchExchangeMock = await deployer.mocks.deployOneInchExchangeMock(
      setup.wbtc.address,
      setup.weth.address,
      new BigNumber(100000000), // 1 WBTC
      wbtcRate,                 // Trades for 33 WETH
    );

    // 1inch function signature
    const oneInchFunctionSignature = web3.eth.abi.encodeFunctionSignature(
      'swap(address,address,uint256,uint256,uint256,address,address[],bytes,uint256[],uint256[])'
    );
    oneInchExchangeAdapter = await deployer.adapters.deployOneInchExchangeAdapter(
      oneInchExchangeMock.address,
      oneInchExchangeMock.address,
      oneInchFunctionSignature
    );

    kyberAdapterName = 'KYBER';
    oneInchAdapterName = 'ONEINCH';

    tradeModule = await deployer.modules.deployTradeModule(setup.controller.address);
    await setup.controller.addModule(tradeModule.address);

    tradeModuleWrapper = new TradeModuleWrapper(provider, tradeModule.address);

    await setup.integrationRegistry.batchAddIntegration(
      [tradeModule.address, tradeModule.address],
      [kyberAdapterName, oneInchAdapterName],
      [kyberExchangeAdapter.address, oneInchExchangeAdapter.address]
    );
  });

  afterEach(async () => {
    await blockchain.revertAsync();
  });

  describe('when there is a deployed SetToken with enabled TradeModule', () => {
    let sourceToken: StandardTokenMock;
    let wbtcUnits: BigNumber;
    let destinationToken: Weth9;
    let setToken: SetToken;
    let issueQuantity: BigNumber;
    let mockPreIssuanceHook: ManagerIssuanceHookMock;

    beforeEach(async () => {
      // Selling WBTC
      sourceToken = setup.wbtc;
      destinationToken = setup.weth;
      wbtcUnits = new BigNumber(100000000); // 1 WBTC in base units 1 * 10 ** 8

      // Create Set token
      setToken = await setup.createSetToken(
        [sourceToken.address],
        [wbtcUnits],
        [setup.issuanceModule.address, tradeModule.address],
        manager
      );
    });

    describe('#trade', () => {
      let sourceTokenQuantity: BigNumber;
      let destinationTokenQuantity: BigNumber;
      let isInitialized: boolean;

      let subjectDestinationToken: Address;
      let subjectSourceToken: Address;
      let subjectSourceQuantity: BigNumber;
      let subjectAdapterName: string;
      let subjectSetToken: Address;
      let subjectMinDestinationQuantity: BigNumber;
      let subjectData: Bytes;
      let subjectCaller: Address;

      describe('when trading a Default component on Kyber', () => {
        beforeAll(async () => {
          isInitialized = true;
        });

        beforeEach(async () => {
          // Fund Kyber reserve with destinationToken WETH
          destinationToken = destinationToken.connect(provider.getSigner(owner));
          await destinationToken.transfer(kyberNetworkProxy.address, ether(1000));

          // Initialize module if set to true
          if (isInitialized) {
            tradeModule = tradeModule.connect(provider.getSigner(manager));
            await tradeModule.initialize(setToken.address);
          }

          sourceTokenQuantity = wbtcUnits.div(2); // Trade 0.5 WBTC
          const sourceTokenDecimals = await sourceToken.decimals();
          destinationTokenQuantity = wbtcRate.mul(sourceTokenQuantity).div(10 ** sourceTokenDecimals);

          // Transfer sourceToken from owner to manager for issuance
          sourceToken = sourceToken.connect(provider.getSigner(owner));
          await sourceToken.transfer(manager, wbtcUnits.mul(100));

          // Approve tokens to Controller and call issue
          sourceToken = sourceToken.connect(provider.getSigner(manager));
          await sourceToken.approve(setup.issuanceModule.address, ethers.constants.MaxUint256);
          // Deploy mock issuance hook and initialize issuance module
          setup.issuanceModule = setup.issuanceModule.connect(provider.getSigner(manager));
          mockPreIssuanceHook = await deployer.mocks.deployManagerIssuanceHookMock();
          await setup.issuanceModule.initialize(setToken.address, mockPreIssuanceHook.address);

          // Issue 10 SetTokens
          issueQuantity = ether(10);
          await setup.issuanceModule.issue(setToken.address, issueQuantity, owner);
          subjectSourceToken = sourceToken.address;
          subjectDestinationToken = destinationToken.address;
          subjectSourceQuantity = sourceTokenQuantity;
          subjectSetToken = setToken.address;
          subjectAdapterName = kyberAdapterName;
          subjectData = EMPTY_BYTES;
          subjectMinDestinationQuantity =
            destinationTokenQuantity.sub(ether(0.5)); // Receive a min of 16 WETH for 0.5 WBTC
          subjectCaller = manager;
        });

        async function subject(): Promise<any> {
          tradeModule = tradeModule.connect(provider.getSigner(subjectCaller));
          return tradeModuleWrapper.trade(
            subjectSetToken,
            subjectAdapterName,
            subjectSourceToken,
            subjectSourceQuantity,
            subjectDestinationToken,
            subjectMinDestinationQuantity,
            subjectData,
            subjectCaller
          );
        }

        it('should transfer the correct components to the SetToken', async () => {
          const oldDestinationTokenBalance = await destinationToken.balanceOf(setToken.address);

          await subject();

          const totalDestinationQuantity = issueQuantity.mul(destinationTokenQuantity).div(ether(1));
          const expectedDestinationTokenBalance = oldDestinationTokenBalance.add(totalDestinationQuantity);
          const newDestinationTokenBalance = await destinationToken.balanceOf(setToken.address);
          expect(newDestinationTokenBalance.toString()).to.eq(expectedDestinationTokenBalance.toString());
        });

        it('should transfer the correct components from the SetToken', async () => {
          const oldSourceTokenBalance = await sourceToken.balanceOf(setToken.address);

          await subject();

          const totalSourceQuantity = issueQuantity.mul(sourceTokenQuantity).div(ether(1));
          const expectedSourceTokenBalance = oldSourceTokenBalance.sub(totalSourceQuantity);
          const newSourceTokenBalance = await sourceToken.balanceOf(setToken.address);
          expect(newSourceTokenBalance.toString()).to.eq(expectedSourceTokenBalance.toString());
        });

        it('should transfer the correct components to the exchange', async () => {
          const oldSourceTokenBalance = await sourceToken.balanceOf(kyberNetworkProxy.address);

          await subject();

          const totalSourceQuantity = issueQuantity.mul(sourceTokenQuantity).div(ether(1));
          const expectedSourceTokenBalance = oldSourceTokenBalance.add(totalSourceQuantity);
          const newSourceTokenBalance = await sourceToken.balanceOf(kyberNetworkProxy.address);
          expect(newSourceTokenBalance.toString()).to.eq(expectedSourceTokenBalance.toString());
        });

        it('should transfer the correct components from the exchange', async () => {
          const oldDestinationTokenBalance = await destinationToken.balanceOf(kyberNetworkProxy.address);

          await subject();

          const totalDestinationQuantity = issueQuantity.mul(destinationTokenQuantity).div(ether(1));
          const expectedDestinationTokenBalance = oldDestinationTokenBalance.sub(totalDestinationQuantity);
          const newDestinationTokenBalance = await destinationToken.balanceOf(kyberNetworkProxy.address);
          expect(newDestinationTokenBalance.toString()).to.eq(expectedDestinationTokenBalance.toString());
        });

        it('should update the positions on the SetToken correctly', async () => {
          const initialPositions = await setToken.getPositions();
          const initialFirstPosition = (await setToken.getPositions())[0];

          await subject();

          const currentPositions = await setToken.getPositions();
          const newFirstPosition = (await setToken.getPositions())[0];
          const newSecondPosition = (await setToken.getPositions())[1];

          expect(initialPositions.length).to.eq(1);
          expect(currentPositions.length).to.eq(2);
          expect(newFirstPosition.component).to.eq(sourceToken.address);
          expect(newFirstPosition.unit.toString()).to.eq(initialFirstPosition.unit.sub(sourceTokenQuantity).toString());
          expect(newFirstPosition.module).to.eq(ADDRESS_ZERO);
          expect(newSecondPosition.component).to.eq(destinationToken.address);
          expect(newSecondPosition.unit.toString()).to.eq(destinationTokenQuantity.toString());
          expect(newSecondPosition.module).to.eq(ADDRESS_ZERO);
        });

        describe('when there is a protocol fee charged', () => {
          let feePercentage: BigNumber;

          beforeEach(async () => {
            feePercentage = ether(0.05);
            setup.controller = setup.controller.connect(provider.getSigner(owner));
            await setup.controller.addFee(
              tradeModule.address,
              ZERO, // Fee type on trade function denoted as 0
              feePercentage // Set fee to 5 bps
            );
          });

          it('should transfer the correct components minus fee to the SetToken', async () => {
            const oldDestinationTokenBalance = await destinationToken.balanceOf(setToken.address);

            await subject();

            const totalDestinationQuantity = issueQuantity.mul(destinationTokenQuantity).div(ether(1));
            const totalProtocolFee = feePercentage.mul(totalDestinationQuantity).div(ether(1));
            const expectedDestinationTokenBalance = oldDestinationTokenBalance
              .add(totalDestinationQuantity)
              .sub(totalProtocolFee);

            const newDestinationTokenBalance = await destinationToken.balanceOf(setToken.address);
            expect(newDestinationTokenBalance.toString()).to.eq(expectedDestinationTokenBalance.toString());
          });

          it('should transfer the correct components from the SetToken to the exchange', async () => {
            const oldSourceTokenBalance = await sourceToken.balanceOf(setToken.address);

            await subject();

            const totalSourceQuantity = issueQuantity.mul(sourceTokenQuantity).div(ether(1));
            const expectedSourceTokenBalance = oldSourceTokenBalance.sub(totalSourceQuantity);
            const newSourceTokenBalance = await sourceToken.balanceOf(setToken.address);
            expect(newSourceTokenBalance.toString()).to.eq(expectedSourceTokenBalance.toString());
          });

          it('should update the positions on the SetToken correctly', async () => {
            const initialPositions = await setToken.getPositions();
            const initialFirstPosition = (await setToken.getPositions())[0];

            await subject();

            const currentPositions = await setToken.getPositions();
            const newFirstPosition = (await setToken.getPositions())[0];
            const newSecondPosition = (await setToken.getPositions())[1];

            const unitProtocolFee = feePercentage.mul(destinationTokenQuantity).div(ether(1));
            expect(initialPositions.length).to.eq(1);
            expect(currentPositions.length).to.eq(2);
            expect(newFirstPosition.component).to.eq(sourceToken.address);
            expect(newFirstPosition.unit.toString()).to.eq(
              initialFirstPosition.unit.sub(sourceTokenQuantity).toString()
            );
            expect(newFirstPosition.module).to.eq(ADDRESS_ZERO);
            expect(newSecondPosition.component).to.eq(destinationToken.address);
            expect(newSecondPosition.unit.toString()).to.eq(
              destinationTokenQuantity.sub(unitProtocolFee).toString()
            );
            expect(newSecondPosition.module).to.eq(ADDRESS_ZERO);
          });

          describe('when receive token is more than total position units tracked on SetToken', () => {
            let extraTokenQuantity: BigNumber;

            beforeEach(async () => {
              extraTokenQuantity = ether(1);
              destinationToken = destinationToken.connect(provider.getSigner(owner));
              // Transfer destination token to SetToken
              await destinationToken.transfer(setToken.address, extraTokenQuantity);
            });

            it('should transfer the correct components minus fee to the SetToken', async () => {
              const oldDestinationTokenBalance = await destinationToken.balanceOf(setToken.address);

              await subject();

              const totalDestinationQuantity = issueQuantity.mul(destinationTokenQuantity).div(ether(1));
              const totalProtocolFee = feePercentage.mul(totalDestinationQuantity).div(ether(1));
              const expectedDestinationTokenBalance = oldDestinationTokenBalance
                .add(totalDestinationQuantity)
                .sub(totalProtocolFee);

              const newDestinationTokenBalance = await destinationToken.balanceOf(setToken.address);
              expect(newDestinationTokenBalance.toString()).to.eq(expectedDestinationTokenBalance.toString());
            });

            it('should update the positions on the SetToken correctly', async () => {
              const initialPositions = await setToken.getPositions();
              const initialFirstPosition = (await setToken.getPositions())[0];

              await subject();

              const currentPositions = await setToken.getPositions();
              const newFirstPosition = (await setToken.getPositions())[0];
              const newSecondPosition = (await setToken.getPositions())[1];

              const unitProtocolFee = feePercentage.mul(destinationTokenQuantity).div(ether(1));
              expect(initialPositions.length).to.eq(1);
              expect(currentPositions.length).to.eq(2);
              expect(newFirstPosition.component).to.eq(sourceToken.address);
              expect(newFirstPosition.unit.toString()).to.eq(
                initialFirstPosition.unit.sub(sourceTokenQuantity).toString()
              );
              expect(newFirstPosition.module).to.eq(ADDRESS_ZERO);
              expect(newSecondPosition.component).to.eq(destinationToken.address);
              expect(newSecondPosition.unit.toString()).to.eq(
                destinationTokenQuantity.sub(unitProtocolFee).toString()
              );
              expect(newSecondPosition.module).to.eq(ADDRESS_ZERO);
            });
          });

          describe('when send token is more than total position units tracked on SetToken', () => {
            let extraTokenQuantity: BigNumber;

            beforeEach(async () => {
              extraTokenQuantity = ether(1);
              sourceToken = sourceToken.connect(provider.getSigner(owner));
              // Transfer source token to SetToken
              await sourceToken.transfer(setToken.address, extraTokenQuantity);
            });

            it('should transfer the correct components from the SetToken', async () => {
              const oldSourceTokenBalance = await sourceToken.balanceOf(setToken.address);

              await subject();
              const totalSourceQuantity = issueQuantity.mul(sourceTokenQuantity).div(ether(1));
              const expectedSourceTokenBalance = oldSourceTokenBalance.sub(totalSourceQuantity);

              const newSourceTokenBalance = await sourceToken.balanceOf(setToken.address);
              expect(newSourceTokenBalance.toString()).to.eq(expectedSourceTokenBalance.toString());
            });

            it('should update the positions on the SetToken correctly', async () => {
              const initialPositions = await setToken.getPositions();
              const initialFirstPosition = (await setToken.getPositions())[0];
              await subject();

              const currentPositions = await setToken.getPositions();
              const newFirstPosition = (await setToken.getPositions())[0];
              const newSecondPosition = (await setToken.getPositions())[1];

              const unitProtocolFee = feePercentage.mul(destinationTokenQuantity).div(ether(1));
              expect(initialPositions.length).to.eq(1);
              expect(currentPositions.length).to.eq(2);
              expect(newFirstPosition.component).to.eq(sourceToken.address);
              expect(newFirstPosition.unit.toString()).to.eq(
                initialFirstPosition.unit.sub(sourceTokenQuantity).toString()
              );
              expect(newFirstPosition.module).to.eq(ADDRESS_ZERO);
              expect(newSecondPosition.component).to.eq(destinationToken.address);
              expect(newSecondPosition.unit.toString()).to.eq(
                destinationTokenQuantity.sub(unitProtocolFee).toString()
              );
              expect(newSecondPosition.module).to.eq(ADDRESS_ZERO);
            });
          });
        });

        describe('when SetToken is locked', () => {
          beforeEach(async () => {
            // Add mock module to controller
            setup.controller = setup.controller.connect(provider.getSigner(owner));
            await setup.controller.addModule(mockModule);

            // Add new mock module to SetToken
            setToken = setToken.connect(provider.getSigner(manager));
            await setToken.addModule(mockModule);

            // Lock SetToken
            setToken = setToken.connect(provider.getSigner(mockModule));
            await setToken.initializeModule();
            await setToken.lock();
          });

          it('should revert', async () => {
            await expect(subject()).to.be.rejectedWith('When locked, only the locker can call');
          });
        });

        describe('when the exchange is not valid', () => {
          beforeEach(async () => {
            subjectAdapterName = 'UNISWAP';
          });

          it('should revert', async () => {
            await expect(subject()).to.be.rejectedWith('Must be valid adapter');
          });
        });

        describe('when quantity of token to sell is 0', () => {
          beforeEach(async () => {
            subjectSourceQuantity = ZERO;
          });

          it('should revert', async () => {
            await expect(subject()).to.be.rejectedWith('Token to sell must be nonzero');
          });
        });

        describe('when quantity sold is more than total units available', () => {
          beforeEach(async () => {
            // Set to 1 base unit more WBTC
            subjectSourceQuantity = wbtcUnits.add(1);
          });

          it('should revert', async () => {
            await expect(subject()).to.be.rejectedWith('Unit cant be greater than existing');
          });
        });

        describe('when slippage is greater than allowed', () => {
          beforeEach(async () => {
            // Set to 1 base unit above the exchange rate
            subjectMinDestinationQuantity = wbtcRate.add(1);
          });

          it('should revert', async () => {
            await expect(subject()).to.be.rejectedWith('Slippage greater than allowed');
          });
        });

        describe('when the caller is not the SetToken manager', () => {
          beforeEach(async () => {
            subjectCaller = randomAccount;
          });

          it('should revert', async () => {
            await expect(subject()).to.be.rejectedWith('Must be the SetToken manager');
          });
        });

        describe('when module is not initialized', () => {
          beforeAll(async () => {
            isInitialized = false;
          });

          afterAll(async () => {
            isInitialized = true;
          });

          it('should revert', async () => {
            await expect(subject()).to.be.rejectedWith('Must be a valid and initialized SetToken');
          });
        });

        describe('when SetToken is not valid', () => {
          beforeEach(async () => {
            const nonEnabledSetToken = await setup.createNonControllerEnabledSetToken(
              [setup.weth.address],
              [ether(1)],
              [tradeModule.address],
              manager
            );

            subjectSetToken = nonEnabledSetToken.address;
          });

          it('should revert', async () => {
            await expect(subject()).to.be.rejectedWith('Must be a valid and initialized SetToken');
          });
        });
      });

      describe('when trading a Default component on One Inch', () => {
        beforeEach(async () => {
          // Add Set token as token sender / recipient
          oneInchExchangeMock = oneInchExchangeMock.connect(provider.getSigner(owner));
          await oneInchExchangeMock.addSetTokenAddress(setToken.address);

          // Fund One Inch exchange with destinationToken WETH
          await destinationToken.transfer(oneInchExchangeMock.address, ether(1000));

          tradeModule = tradeModule.connect(provider.getSigner(manager));
          await tradeModule.initialize(setToken.address);

          // Trade 1 WBTC. Note: 1inch mock is hardcoded to trade 1 WBTC unit regardless of Set supply
          sourceTokenQuantity = wbtcUnits;
          const sourceTokenDecimals = await sourceToken.decimals();
          destinationTokenQuantity = wbtcRate.mul(sourceTokenQuantity).div(10 ** sourceTokenDecimals);

          // Transfer sourceToken from owner to manager for issuance
          sourceToken = sourceToken.connect(provider.getSigner(owner));
          await sourceToken.transfer(manager, wbtcUnits.mul(100));

          // Approve tokens to Controller and call issue
          sourceToken = sourceToken.connect(provider.getSigner(manager));
          await sourceToken.approve(setup.issuanceModule.address, ethers.constants.MaxUint256);

          // Deploy mock issuance hook and initialize issuance module
          setup.issuanceModule = setup.issuanceModule.connect(provider.getSigner(manager));
          mockPreIssuanceHook = await deployer.mocks.deployManagerIssuanceHookMock();
          await setup.issuanceModule.initialize(setToken.address, mockPreIssuanceHook.address);

          // Issue 1 SetToken. Note: 1inch mock is hardcoded to trade 1 WBTC unit regardless of Set supply
          issueQuantity = ether(1);
          await setup.issuanceModule.issue(setToken.address, issueQuantity, owner);

          subjectSourceToken = sourceToken.address;
          subjectDestinationToken = destinationToken.address;
          subjectSourceQuantity = sourceTokenQuantity;
          subjectSetToken = setToken.address;
          subjectAdapterName = oneInchAdapterName;
          // Encode function data. Inputs are unused in the mock One Inch contract
          subjectData = oneInchExchangeMock.interface.functions.swap.encode([
            sourceToken.address, // Send token
            destinationToken.address, // Receive token
            sourceTokenQuantity, // Send quantity
            destinationTokenQuantity.sub(ether(1)), // Min receive quantity
            ZERO,
            ADDRESS_ZERO,
            [ADDRESS_ZERO],
            EMPTY_BYTES,
            [ZERO],
            [ZERO],
          ]);
          subjectMinDestinationQuantity = destinationTokenQuantity.sub(ether(1)); // Receive a min of 32 WETH for 1 WBTC
          subjectCaller = manager;
        });

        async function subject(): Promise<any> {
          return tradeModuleWrapper.trade(
            subjectSetToken,
            subjectAdapterName,
            subjectSourceToken,
            subjectSourceQuantity,
            subjectDestinationToken,
            subjectMinDestinationQuantity,
            subjectData,
            subjectCaller
          );
        }

        it('should transfer the correct components to the SetToken', async () => {
          const oldDestinationTokenBalance = await destinationToken.balanceOf(setToken.address);

          await subject();

          const totalDestinationQuantity = issueQuantity.mul(destinationTokenQuantity).div(ether(1));
          const expectedDestinationTokenBalance = oldDestinationTokenBalance.add(totalDestinationQuantity);
          const newDestinationTokenBalance = await destinationToken.balanceOf(setToken.address);
          expect(newDestinationTokenBalance.toString()).to.eq(expectedDestinationTokenBalance.toString());
        });

        it('should transfer the correct components from the SetToken', async () => {
          const oldSourceTokenBalance = await sourceToken.balanceOf(setToken.address);

          await subject();

          const totalSourceQuantity = issueQuantity.mul(sourceTokenQuantity).div(ether(1));
          const expectedSourceTokenBalance = oldSourceTokenBalance.sub(totalSourceQuantity);
          const newSourceTokenBalance = await sourceToken.balanceOf(setToken.address);
          expect(newSourceTokenBalance.toString()).to.eq(expectedSourceTokenBalance.toString());
        });

        it('should transfer the correct components to the exchange', async () => {
          const oldSourceTokenBalance = await sourceToken.balanceOf(oneInchExchangeMock.address);

          await subject();

          const totalSourceQuantity = issueQuantity.mul(sourceTokenQuantity).div(ether(1));
          const expectedSourceTokenBalance = oldSourceTokenBalance.add(totalSourceQuantity);
          const newSourceTokenBalance = await sourceToken.balanceOf(oneInchExchangeMock.address);
          expect(newSourceTokenBalance.toString()).to.eq(expectedSourceTokenBalance.toString());
        });

        it('should transfer the correct components from the exchange', async () => {
          const oldDestinationTokenBalance = await destinationToken.balanceOf(oneInchExchangeMock.address);

          await subject();

          const totalDestinationQuantity = issueQuantity.mul(destinationTokenQuantity).div(ether(1));
          const expectedDestinationTokenBalance = oldDestinationTokenBalance.sub(totalDestinationQuantity);
          const newDestinationTokenBalance = await destinationToken.balanceOf(oneInchExchangeMock.address);
          expect(newDestinationTokenBalance.toString()).to.eq(expectedDestinationTokenBalance.toString());
        });

        it('should update the positions on the SetToken correctly', async () => {
          const initialPositions = await setToken.getPositions();

          await subject();

          // All WBTC is sold for WETH
          const currentPositions = await setToken.getPositions();
          const newFirstPosition = (await setToken.getPositions())[0];

          expect(initialPositions.length).to.eq(1);
          expect(currentPositions.length).to.eq(1);
          expect(newFirstPosition.component).to.eq(destinationToken.address);
          expect(newFirstPosition.unit.toString()).to.eq(destinationTokenQuantity.toString());
          expect(newFirstPosition.module).to.eq(ADDRESS_ZERO);
        });

        describe('when function signature does not match 1inch', () => {
          beforeEach(async () => {
            // Encode random function
            subjectData = oneInchExchangeMock.interface.functions.addSetTokenAddress.encode([ADDRESS_ZERO]);
          });

          // it('should revert', async () => {
          //   await expect(subject()).to.be.rejectedWith('Not One Inch Swap Function');
          // });
        });

        describe('when send token does not match calldata', () => {
          beforeEach(async () => {
            // Get random source token
            const randomToken = randomAccount;
            subjectData = oneInchExchangeMock.interface.functions.swap.encode([
              randomToken, // Send token
              destinationToken.address, // Receive token
              sourceTokenQuantity, // Send quantity
              destinationTokenQuantity.sub(ether(1)), // Min receive quantity
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
            const randomToken = randomAccount;
            subjectData = oneInchExchangeMock.interface.functions.swap.encode([
              sourceToken.address, // Send token
              randomToken, // Receive token
              sourceTokenQuantity, // Send quantity
              destinationTokenQuantity.sub(ether(1)), // Min receive quantity
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
              sourceToken.address, // Send token
              destinationToken.address, // Receive token
              ZERO, // Send quantity
              destinationTokenQuantity.sub(ether(1)), // Min receive quantity
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
              sourceToken.address, // Send token
              destinationToken.address, // Receive token
              sourceTokenQuantity, // Send quantity
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
  });
});
