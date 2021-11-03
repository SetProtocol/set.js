/*
  Copyright 2020 Set Labs Inc.

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

'use strict';

import { Provider, JsonRpcProvider } from '@ethersproject/providers';
import { Contract, Signer } from 'ethers';
import { Address } from '@setprotocol/set-protocol-v2/utils/types';

import {
  BasicIssuanceModule,
  DebtIssuanceModule,
  DebtIssuanceModuleV2,
  Controller,
  ProtocolViewer,
  SetToken,
  SetTokenCreator,
  StreamingFeeModule,
  TradeModule,
  NavIssuanceModule,
  PriceOracle,
} from '@setprotocol/set-protocol-v2/typechain';
import { BasicIssuanceModule__factory } from '@setprotocol/set-protocol-v2/dist/typechain/factories/BasicIssuanceModule__factory';
import { DebtIssuanceModule__factory } from '@setprotocol/set-protocol-v2/dist/typechain/factories/DebtIssuanceModule__factory';
import { DebtIssuanceModuleV2__factory } from '@setprotocol/set-protocol-v2/dist/typechain/factories/DebtIssuanceModuleV2__factory';
import { Controller__factory } from '@setprotocol/set-protocol-v2/dist/typechain/factories/Controller__factory';
import { ERC20__factory } from '@setprotocol/set-protocol-v2/dist/typechain/factories/ERC20__factory';
import { ProtocolViewer__factory } from '@setprotocol/set-protocol-v2/dist/typechain/factories/ProtocolViewer__factory';
import { SetToken__factory } from '@setprotocol/set-protocol-v2/dist/typechain/factories/SetToken__factory';
import { SetTokenCreator__factory } from '@setprotocol/set-protocol-v2/dist/typechain/factories/SetTokenCreator__factory';
import { StreamingFeeModule__factory } from '@setprotocol/set-protocol-v2/dist/typechain/factories/StreamingFeeModule__factory';
import { TradeModule__factory } from '@setprotocol/set-protocol-v2/dist/typechain/factories/TradeModule__factory';
import { NavIssuanceModule__factory } from '@setprotocol/set-protocol-v2/dist/typechain/factories/NavIssuanceModule__factory';
import { PriceOracle__factory } from '@setprotocol/set-protocol-v2/dist/typechain/factories/PriceOracle__factory';

/**
 * @title ContractWrapper
 * @author Set Protocol
 *
 * The Contracts API handles all functions that load contracts
 *
 */
export default class ContractWrapper {
  private provider: Provider;
  private cache: { [contractName: string]: Contract };

  public constructor(provider: Provider) {
    this.provider = provider;
    this.cache = {};
  }

  /**
   * Load Controller contract
   *
   * @param  controllerAddress  Address of the Controller contract
   * @param  signer             Caller of the methods
   * @return                    The Controller Contract
   */
  public async loadControllerContractAsync(
    controllerAddress: Address,
    signer: Signer,
  ): Promise<Controller> {
    const cacheKey = `Controller_${controllerAddress}_${await signer.getAddress()}`;

    if (cacheKey in this.cache) {
      return this.cache[cacheKey] as Controller;
    } else {
      const controllerContract = Controller__factory.connect(
        controllerAddress,
        signer
      );

      this.cache[cacheKey] = controllerContract;
      return controllerContract;
    }
  }

  /**
   * Load ERC20 token contract
   *
   * @param  tokenAddress       Address of the token contract
   * @param  callerAddress      Address of caller, uses first one on node if none provided.
   * @return                    The token contract
   */
  public async loadERC20Async(
    tokenAddress: Address,
    callerAddress?: Address,
  ): Promise<SetToken> {
    const signer = (this.provider as JsonRpcProvider).getSigner(callerAddress);
    const cacheKey = `ERC20_${tokenAddress}_${await signer.getAddress()}`;

    if (cacheKey in this.cache) {
      return this.cache[cacheKey] as SetToken;
    } else {
      const tokenContract = ERC20__factory.connect(
        tokenAddress,
        signer
      );

      this.cache[cacheKey] = tokenContract;
      return tokenContract;
    }
  }

  /**
   * Load BasicIssuanceModule contract
   *
   * @param  basicIssuanceModuleAddress   Address of the token contract
   * @param  callerAddress                Address of caller, uses first one on node if none provided.
   * @return                              BasicIssuanceModule contract instance
   */
  public async loadBasicIssuanceModuleAsync(
    basicIssuanceModuleAddress: Address,
    callerAddress?: Address,
  ): Promise<BasicIssuanceModule> {
    const signer = (this.provider as JsonRpcProvider).getSigner(callerAddress);
    const cacheKey = `BasicIssuance_${basicIssuanceModuleAddress}_${await signer.getAddress()}`;

    if (cacheKey in this.cache) {
      return this.cache[cacheKey] as BasicIssuanceModule;
    } else {
      const basicIssuanceModuleContract = BasicIssuanceModule__factory.connect(
        basicIssuanceModuleAddress,
        signer
      );

      this.cache[cacheKey] = basicIssuanceModuleContract;
      return basicIssuanceModuleContract;
    }
  }

  /**
   * Load TradeModule contract
   *
   * @param  tradeModuleAddress           Address of the trade module
   * @param  callerAddress                Address of caller, uses first one on node if none provided.
   * @return                              TradeModule contract instance
   */
  public async loadTradeModuleAsync(
    tradeModuleAddress: Address,
    callerAddress?: Address,
  ): Promise<TradeModule> {
    const signer = (this.provider as JsonRpcProvider).getSigner(callerAddress);
    const cacheKey = `TradeModule_${tradeModuleAddress}_${await signer.getAddress()}`;

    if (cacheKey in this.cache) {
      return this.cache[cacheKey] as TradeModule;
    } else {
      const tradeModuleContract = TradeModule__factory.connect(
        tradeModuleAddress,
        signer
      );

      this.cache[cacheKey] = tradeModuleContract;
      return tradeModuleContract;
    }
  }

  /**
   * Load TradeModule contract without signer (for running populateTransaction)
   *
   * @param  tradeModuleAddress           Address of the trade module
   * @return                              TradeModule contract instance
   */
  public loadTradeModuleWithoutSigner(tradeModuleAddress: Address): TradeModule {
      return TradeModule__factory.connect(tradeModuleAddress);
  }

  /**
   * Load NavIssuanceModule contract
   *
   * @param  navIssuanceModuleAddress     Address of the NAV issuance module
   * @param  callerAddress                Address of caller, uses first one on node if none provided.
   * @return                              NavIssuanceModule contract instance
   */
  public async loadNavIssuanceModuleAsync(
    navIssuanceModuleAddress: Address,
    callerAddress?: Address,
  ): Promise<NavIssuanceModule> {
    const signer = (this.provider as JsonRpcProvider).getSigner(callerAddress);
    const cacheKey = `NavIssuanceModule_${navIssuanceModuleAddress}_${await signer.getAddress()}`;

    if (cacheKey in this.cache) {
      return this.cache[cacheKey] as NavIssuanceModule;
    } else {
      const navIssuanceModuleContract = NavIssuanceModule__factory.connect(
        navIssuanceModuleAddress,
        signer
      );

      this.cache[cacheKey] = navIssuanceModuleContract;
      return navIssuanceModuleContract;
    }
  }

  /**
   * Load PriceOracle contract
   *
   * @param  masterOracleAddress          Address of the master price oracle
   * @param  callerAddress                Address of caller, uses first one on node if none provided.
   * @return                              PriceOracle contract instance
   */
  public async loadMasterPriceOracleAsync(
    masterOracleAddress: Address,
    callerAddress?: Address,
  ): Promise<PriceOracle> {
    const signer = (this.provider as JsonRpcProvider).getSigner(callerAddress);
    const cacheKey = `MasterPriceOracle_${masterOracleAddress}_${await signer.getAddress()}`;

    if (cacheKey in this.cache) {
      return this.cache[cacheKey] as PriceOracle;
    } else {
      const masterPriceOracleContract = PriceOracle__factory.connect(
        masterOracleAddress,
        signer
      );

      this.cache[cacheKey] = masterPriceOracleContract;
      return masterPriceOracleContract;
    }
  }

  /**
   * Load Set Token contract
   *
   * @param  setTokenAddress    Address of the Set Token contract
   * @param  callerAddress      Address of caller, uses first one on node if none provided.
   * @return                    The Set Token Contract
   */
  public async loadSetTokenAsync(
    setTokenAddress: Address,
    callerAddress?: Address,
  ): Promise<SetToken> {
    const signer = (this.provider as JsonRpcProvider).getSigner(callerAddress);
    const cacheKey = `SetToken_${setTokenAddress}_${await signer.getAddress()}`;

    if (cacheKey in this.cache) {
      return this.cache[cacheKey] as SetToken;
    } else {
      const setTokenContract = SetToken__factory.connect(
        setTokenAddress,
        signer
      );

      this.cache[cacheKey] = setTokenContract;
      return setTokenContract;
    }
  }

  /**
   * Load Set Token Creator contract
   *
   * @param  setTokenCreatorAddress  Address of the Set Token Creator contract
   * @param  signer                  Caller of the method
   * @return                         The Set Token Creator Contract
   */
  public async loadSetTokenCreatorAsync(
    setTokenCreatorAddress: Address,
    signer: Signer,
  ): Promise<SetTokenCreator> {
    const cacheKey = `SetTokenCreator_${setTokenCreatorAddress}_${await signer.getAddress()}`;

    if (cacheKey in this.cache) {
      return this.cache[cacheKey] as SetTokenCreator;
    } else {
      const setTokenCreator = SetTokenCreator__factory.connect(
        setTokenCreatorAddress,
        signer
      );

      this.cache[cacheKey] = setTokenCreator;
      return setTokenCreator;
    }
  }

  /**
   * Load StreamingFeeModule contract
   *
   * @param  streamingFeeModuleAddress  Address of the streaming fee module contract
   * @param  callerAddress              Address of caller, uses first one on node if none provided.
   * @return                            The Streaming Fee Module Contract
   */
  public async loadStreamingFeeModuleAsync(
    streamingFeeModuleAddress: Address,
    callerAddress?: Address,
  ): Promise<StreamingFeeModule> {
    const signer = (this.provider as JsonRpcProvider).getSigner(callerAddress);
    const cacheKey = `StreamingFeeModule_${streamingFeeModuleAddress}_${await signer.getAddress()}`;

    if (cacheKey in this.cache) {
      return this.cache[cacheKey] as StreamingFeeModule;
    } else {
      const streamingFeeModuleContract = StreamingFeeModule__factory.connect(
        streamingFeeModuleAddress,
        signer
      );

      this.cache[cacheKey] = streamingFeeModuleContract;
      return streamingFeeModuleContract;
    }
  }

  /**
   * Load ProtocolViewer contract
   *
   * @param  protocolViewerAddress  Address of the ProtocolViewer contract
   * @param  signer                 Caller of the methods
   * @return                        The ProtocolViewer Contract
   */
  public async loadProtocolViewerContractAsync(
    protocolViewerAddress: Address,
    signer: Signer,
  ): Promise<ProtocolViewer> {
    const cacheKey = `ProtocolViewer_${protocolViewerAddress}_${await signer.getAddress()}`;

    if (cacheKey in this.cache) {
      return this.cache[cacheKey] as ProtocolViewer;
    } else {
      const protocolViewerContract = ProtocolViewer__factory.connect(
        protocolViewerAddress,
        signer
      );

      this.cache[cacheKey] = protocolViewerContract;
      return protocolViewerContract;
    }
  }


  /**
   * Load DebtIssuanceModule contract
   *
   * @param  debtIssuanceModuleAddress    Address of the token contract
   * @param  callerAddress                Address of caller, uses first one on node if none provided.
   * @return                              DebtIssuanceModule contract instance
   */
  public async loadDebtIssuanceModuleAsync(
    debtIssuanceModuleAddress: Address,
    callerAddress?: Address,
  ): Promise<DebtIssuanceModule> {
    const signer = (this.provider as JsonRpcProvider).getSigner(callerAddress);
    const cacheKey = `DebtIssuanceModule_${debtIssuanceModuleAddress}_${await signer.getAddress()}`;

    if (cacheKey in this.cache) {
      return this.cache[cacheKey] as DebtIssuanceModule;
    } else {
      const debtIssuanceModuleContract = DebtIssuanceModule__factory.connect(
        debtIssuanceModuleAddress,
        signer
      );

      this.cache[cacheKey] = debtIssuanceModuleContract;
      return debtIssuanceModuleContract;
    }
  }

  /**
   * Load DebtIssuanceModuleV2 contract
   *
   * @param  debtIssuanceModuleV2Address    Address of the token contract
   * @param  callerAddress                Address of caller, uses first one on node if none provided.
   * @return                              DebtIssuanceModuleV2 contract instance
   */
   public async loadDebtIssuanceModuleV2Async(
    debtIssuanceModuleV2Address: Address,
    callerAddress?: Address,
  ): Promise<DebtIssuanceModuleV2> {
    const signer = (this.provider as JsonRpcProvider).getSigner(callerAddress);
    const cacheKey = `DebtIssuanceModuleV2_${debtIssuanceModuleV2Address}_${await signer.getAddress()}`;

    if (cacheKey in this.cache) {
      return this.cache[cacheKey] as DebtIssuanceModuleV2;
    } else {
      const debtIssuanceModuleV2Contract = DebtIssuanceModuleV2__factory.connect(
        debtIssuanceModuleV2Address,
        signer
      );

      this.cache[cacheKey] = debtIssuanceModuleV2Contract;
      return debtIssuanceModuleV2Contract;
    }
  }
}
