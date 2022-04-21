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
import { Contract } from 'ethers';
import { Address } from '@setprotocol/set-protocol-v2/utils/types';

import {
  DelegatedManagerFactory,
  StreamingFeeSplitExtension,
  TradeExtension,
  IssuanceExtension,
  BatchTradeExtension
} from '@setprotocol/set-v2-strategies/typechain';

import {
  DelegatedManagerFactory__factory
} from '@setprotocol/set-v2-strategies/dist/typechain/factories/DelegatedManagerFactory__factory';
import {
  StreamingFeeSplitExtension__factory
} from '@setprotocol/set-v2-strategies/dist/typechain/factories/StreamingFeeSplitExtension__factory';
import {
  TradeExtension__factory,
} from '@setprotocol/set-v2-strategies/dist/typechain/factories/TradeExtension__factory';
import {
  IssuanceExtension__factory
} from '@setprotocol/set-v2-strategies/dist/typechain/factories/IssuanceExtension__factory';
import {
  BatchTradeExtension__factory,
} from '@setprotocol/set-v2-strategies/dist/typechain/factories/TradeExtension__factory';


/**
 * @title ContractWrapper
 * @author Set Protocol
 *
 * The Contracts API handles all functions that load contracts for set-v2-strategies
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
   * Load DelegatedManagerFactory contract
   *
   * @param  DelegatedManagerFactoryAddress  Address of the DelegatedManagerFactory instance
   * @param  callerAddress                   Address of caller, uses first one on node if none provided.
   * @return                                 DelegatedManagerFactory contract instance
   */
   public async loadDelegatedManagerFactoryAsync(
    delegatedManagerFactoryAddress: Address,
    callerAddress?: Address,
  ): Promise<DelegatedManagerFactory> {
    const signer = (this.provider as JsonRpcProvider).getSigner(callerAddress);
    const cacheKey = `DelegatedManagerFactory_${delegatedManagerFactoryAddress}_${await signer.getAddress()}`;

    if (cacheKey in this.cache) {
      return this.cache[cacheKey] as DelegatedManagerFactory;
    } else {
      const delegatedManagerFactoryContract = DelegatedManagerFactory__factory.connect(
        delegatedManagerFactoryAddress,
        signer
      );

      this.cache[cacheKey] = delegatedManagerFactoryContract;
      return delegatedManagerFactoryContract;
    }
  }

  /**
   * Load StreamingFeeSplitExtension contract
   *
   * @param  streamingFeeSplitExtension          Address of the StreamingFeeSplitExtension instance
   * @param  callerAddress                       Address of caller, uses first one on node if none provided.
   * @return                                     StreamingFeeSplitExtension contract instance
   */
   public async loadStreamingFeeExtensionAsync(
    streamingFeeSplitExtensionAddress: Address,
    callerAddress?: Address,
  ): Promise<StreamingFeeSplitExtension> {
    const signer = (this.provider as JsonRpcProvider).getSigner(callerAddress);
    const cacheKey = `StreamingFeeSplitExtension_${streamingFeeSplitExtensionAddress}_${await signer.getAddress()}`;

    if (cacheKey in this.cache) {
      return this.cache[cacheKey] as StreamingFeeSplitExtension;
    } else {
      const streamingFeeSplitExtensionContract = StreamingFeeSplitExtension__factory.connect(
        streamingFeeSplitExtensionAddress,
        signer
      );

      this.cache[cacheKey] = streamingFeeSplitExtensionContract;
      return streamingFeeSplitExtensionContract;
    }
  }

  /**
   * Load TradeExtension contract
   *
   * @param  TradeExtension                      Address of the TradeExtension instance
   * @param  callerAddress                       Address of caller, uses first one on node if none provided.
   * @return                                     TradeExtension contract instance
   */
   public async loadTradeExtensionAsync(
    tradeExtensionAddress: Address,
    callerAddress?: Address,
  ): Promise<TradeExtension> {
    const signer = (this.provider as JsonRpcProvider).getSigner(callerAddress);
    const cacheKey = `tradeExtension_${tradeExtensionAddress}_${await signer.getAddress()}`;

    if (cacheKey in this.cache) {
      return this.cache[cacheKey] as TradeExtension;
    } else {
      const tradeExtensionContract = TradeExtension__factory.connect(
        tradeExtensionAddress,
        signer
      );

      this.cache[cacheKey] = tradeExtensionContract;
      return tradeExtensionContract;
    }
  }

  /**
   * Load IssuanceExtension contract
   *
   * @param  IssuanceExtension                   Address of the IssuanceExtension instance
   * @param  callerAddress                       Address of caller, uses first one on node if none provided.
   * @return                                     TradeExtension contract instance
   */
   public async loadIssuanceExtensionAsync(
    issuanceExtensionAddress: Address,
    callerAddress?: Address,
  ): Promise<IssuanceExtension> {
    const signer = (this.provider as JsonRpcProvider).getSigner(callerAddress);
    const cacheKey = `issuanceExtension_${issuanceExtensionAddress}_${await signer.getAddress()}`;

    if (cacheKey in this.cache) {
      return this.cache[cacheKey] as IssuanceExtension;
    } else {
      const issuanceExtensionContract = IssuanceExtension__factory.connect(
        issuanceExtensionAddress,
        signer
      );

      this.cache[cacheKey] = issuanceExtensionContract;
      return issuanceExtensionContract;
    }
  }

  /**
   * Load BatchTradeExtension contract
   *
   * @param  batchTradeExtensionAddress          Address of the TradeExtension instance
   * @param  callerAddress                       Address of caller, uses first one on node if none provided.
   * @return                                     BatchTradeExtension contract instance
   */
   public async loadBatchTradeExtensionAsync(
    batchTradeExtensionAddress: Address,
    callerAddress?: Address,
  ): Promise<BatchTradeExtension> {
    const signer = (this.provider as JsonRpcProvider).getSigner(callerAddress);
    const cacheKey = `batchTradeExtension_${batchTradeExtensionAddress}_${await signer.getAddress()}`;

    if (cacheKey in this.cache) {
      return this.cache[cacheKey] as BatchTradeExtension;
    } else {
      const batchTradeExtensionContract = BatchTradeExtension__factory.connect(
        batchTradeExtensionAddress,
        signer
      );

      this.cache[cacheKey] = batchTradeExtensionContract;
      return batchTradeExtensionContract;
    }
  }

  /**
   * Load BatchTradeExtension contract without signer (for running populateTransaction)
   *
   * @param  batchTradeExtensionAddress         Address of the BatchTradeExtension
   * @return                                    BatchTradeExtension contract instance
   */
  public loadBatchTradeExtensionWithoutSigner(batchTradeExtensionAddress: Address): BatchTradeExtension {
      return BatchTradeExtension__factory.connect(batchTradeExtensionAddress);
  }
}
