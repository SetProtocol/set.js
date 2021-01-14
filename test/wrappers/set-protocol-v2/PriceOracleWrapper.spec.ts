import { ethers } from 'ethers';
import { BigNumber } from 'ethers/lib/ethers';

import { Address } from '@setprotocol/set-protocol-v2/utils/types';
import { Blockchain, ether } from '@setprotocol/set-protocol-v2/dist/utils/common';
import DeployHelper from '@setprotocol/set-protocol-v2/dist/utils/deploys';
import {
  PriceOracle,
  OracleMock,
  Controller,
  OracleAdapterMock,
} from '@setprotocol/set-protocol-v2/dist/utils/contracts';

import { expect } from '../../utils/chai';
import PriceOracleWrapper from '../../../src/wrappers/set-protocol-v2/PriceOracleWrapper';

const provider = new ethers.providers.JsonRpcProvider();
const blockchain = new Blockchain(provider);

const inverse = (number: BigNumber): BigNumber => {
  return ether(1).mul(ether(1)).div(number);
};

describe('PriceOracleWrapper', () => {
  let wallet: Address;

  let ethusdcOracle: OracleMock;
  let ethbtcOracle: OracleMock;

  let wrappedETH: Address;
  let wrappedBTC: Address;
  let usdc: Address;
  let adapterAsset: Address;
  let randomAsset: Address;
  let attacker: Address;
  let subjectCaller: Address;

  let initialETHValue: BigNumber;
  let initialETHBTCValue: BigNumber;
  let adapterDummyPrice: BigNumber;

  let controller: Controller;
  let oracleAdapter: OracleAdapterMock;
  let masterOracle: PriceOracle;
  let deployer: DeployHelper;

  let priceOracleWrapper: PriceOracleWrapper;

  beforeAll(async() => {
    [
      wallet,
      wrappedETH,
      wrappedBTC,
      usdc,
      adapterAsset,
      randomAsset,
      attacker,
    ] = await provider.listAccounts();

    deployer = new DeployHelper(provider.getSigner(wallet));
  });

  beforeEach(async () => {
    await blockchain.saveSnapshotAsync();

    initialETHValue = ether(235);
    initialETHBTCValue = ether(0.025);
    ethusdcOracle = await deployer.mocks.deployOracleMock(initialETHValue);
    ethbtcOracle = await deployer.mocks.deployOracleMock(initialETHBTCValue);

    adapterDummyPrice = ether(5);
    oracleAdapter = await deployer.mocks.deployOracleAdapterMock(adapterAsset, adapterDummyPrice);

    controller = await deployer.core.deployController(wallet);
    await controller.initialize([], [wallet], [], []);

    masterOracle = await deployer.core.deployPriceOracle(
      controller.address,
      wrappedETH,
      [oracleAdapter.address],
      [wrappedETH, wrappedETH],
      [usdc, wrappedBTC],
      [ethusdcOracle.address, ethbtcOracle.address],
    );

    priceOracleWrapper = new PriceOracleWrapper(
      provider,
      masterOracle.address
    );

    subjectCaller = wallet;
  });

  afterEach(async () => {
    await blockchain.revertAsync();
  });

  describe('getPrice', () => {
    let subjectAssetOne: Address;
    let subjectAssetTwo: Address;

    beforeEach(async () => {
      subjectAssetOne = wrappedETH;
      subjectAssetTwo = usdc;
    });

    async function subject(): Promise<BigNumber> {
      return priceOracleWrapper.getPrice(
        subjectAssetOne,
        subjectAssetTwo,
        subjectCaller
      );
    }

    it('should return the price', async () => {
      const actualPrice = await subject();

      const expectedPrice = await ethusdcOracle.read();
      expect(actualPrice.toString()).to.eq(expectedPrice.toString());
    });

    describe('when an inverse price is requested', () => {
      beforeEach(async () => {
        subjectAssetOne = usdc;
        subjectAssetTwo = wrappedETH;
      });

      it('should return inverse price', async () => {
        const actualPrice = await subject();

        const expectedPrice = inverse(initialETHValue);
        expect(actualPrice.toString()).to.eq(expectedPrice.toString());
      });
    });

    describe('when the master quote asset must be used', () => {
      beforeEach(async () => {
        subjectAssetOne = wrappedBTC;
        subjectAssetTwo = usdc;
      });

      it('should return price computed with two oracles', async () => {
        const actualPrice = await subject();

        const expectedPrice = inverse(initialETHBTCValue).mul(ether(1)).div(inverse(initialETHValue));
        expect(actualPrice.toString()).to.eq(expectedPrice.toString());
      });
    });

    describe('when the price is on an adapter', () => {
      beforeEach(async () => {
        subjectAssetOne = adapterAsset;
        subjectAssetTwo = usdc;
      });

      it('should return price computed by adapter', async () => {
        const actualPrice = await subject();

        expect(actualPrice.toString()).to.eq(adapterDummyPrice.toString());
      });
    });

    describe('when there is no price for the asset pair', () => {
      beforeEach(async () => {
        subjectAssetOne = randomAsset;
        subjectAssetTwo = usdc;
      });

      it('should revert', async () => {
        await expect(subject()).to.be.rejectedWith('PriceOracle.getPrice: Price not found.');
      });
    });

    describe('when the caller is not a system contract (i.e. external party seeking access to data)', () => {
      beforeEach(async () => {
        subjectCaller = attacker;
      });

      it('should revert', async () => {
        await expect(subject()).to.be.rejectedWith('PriceOracle.getPrice: Caller must be system contract.');
      });
    });
  });
});
