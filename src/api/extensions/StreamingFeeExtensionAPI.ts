/*
  Copyright 2022 Set Labs Inc.

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

import { ContractTransaction, BytesLike, utils as EthersUtils } from 'ethers';
import { Provider } from '@ethersproject/providers';
import { TransactionOverrides } from '@setprotocol/set-protocol-v2/dist/typechain';
import { Address, StreamingFeeState } from '@setprotocol/set-protocol-v2/utils/types';
import { StreamingFeeModule__factory } from '@setprotocol/set-protocol-v2/dist/typechain/factories/StreamingFeeModule__factory';
import { StreamingFeeSplitExtension__factory } from '@setprotocol/set-v2-strategies/dist/typechain/factories/StreamingFeeSplitExtension__factory';

import StreamingFeeExtensionWrapper from '../../wrappers/set-v2-strategies/StreamingFeeExtensionWrapper';
import Assertions from '../../assertions';

/**
 * @title  StreamingFeeExtensionAPI
 * @author Set Protocol
 *
 * The StreamingFeeExtensionAPI exposes methods to set issuance and redemption fees for SetTokens using
 * the DelegatedManager system. The API also provides some helper methods to generate bytecode data packets
 * that encode module and extension initialization method calls.
 */
export default class StreamingFeeExtensionAPI {
  private streamingFeeExtensionWrapper: StreamingFeeExtensionWrapper;
  private assert: Assertions;

  public constructor(
    provider: Provider,
    streamingFeeExtensionAddress: Address,
    assertions?: Assertions) {
    this.streamingFeeExtensionWrapper = new StreamingFeeExtensionWrapper(provider, streamingFeeExtensionAddress);
    this.assert = assertions || new Assertions();
  }

  /**
   * Accrues fees from streaming fee module. Gets resulting balance after fee accrual, calculates fees for
   * owner and methodologist, and sends to owner fee recipient and methodologist respectively. (Anyone can call
   * this method.)
   *
   * @param setTokenAddress      Instance of deployed SetToken to accrue & distribute streaming fees for
   * @param callerAddress        Address of caller (optional)
   * @param txOpts               Overrides for transaction (optional)
   *
   * @return                     Initialization bytecode
   */
  public async accrueFeesAndDistributeAsync(
    setTokenAddress: Address,
    callerAddress: Address = undefined,
    txOpts: TransactionOverrides = {}
  ): Promise<ContractTransaction>  {
    this.assert.schema.isValidAddress('setTokenAddress', setTokenAddress);

    return await this.streamingFeeExtensionWrapper.accrueFeesAndDistribute(
      setTokenAddress,
      callerAddress,
      txOpts
    );
  }

  /**
   * Generates StreamingFeeExtension initialize call bytecode to be passed as an element in the `initializeBytecode`
   * array for the DelegatedManagerFactory's `initializeAsync` method.
   *
   * @param delegatedManagerAddress      Instance of DelegatedManager to initialize the StreamingFeeExtension for
   *
   * @return                             Initialization bytecode
   */
  public getStreamingFeeExtensionInitializationBytecode(
    delegatedManagerAddress: Address
  ): BytesLike {
    this.assert.schema.isValidAddress('delegatedManagerAddress', delegatedManagerAddress);

    const extensionInterface = new EthersUtils.Interface(StreamingFeeSplitExtension__factory.abi);
    return extensionInterface.encodeFunctionData('initializeExtension', [ delegatedManagerAddress ]);
  }

  /**
   * Generates StreamingFeeModule initialize call bytecode to be passed as an element in the  `initializeBytecode`
   * array for the `initializeAsync` method.
   *
   * FeeSettings is an object with the properties:
   * ```
   * {
   *   feeRecipient;                    Address to accrue fees to. (Should be the DelegatedManager contract)
   *   maxStreamingFeePercentage;       Max streaming fee manager commits to using (1% = 1e16, 100% = 1e18)
   *   streamingFeePercentage;          Percent of Set accruing to manager annually (1% = 1e16, 100% = 1e18)
   *   lastStreamingFeeTimestamp;       Timestamp last streaming fee was accrued (Should be 0 on init)
   * }
   * ```
   * @param setTokenAddress             Address of deployed SetToken to initialize the StreamingFeeModule for
   * @param feeSettings                 % of fees in precise units (10^16 = 1%) sent to owner, rest to methodologist
   *
   * @return                            Initialization bytecode
   */
  public getStreamingFeeModuleInitializationBytecode(
    setTokenAddress: Address,
    feeSettings: StreamingFeeState
  ): BytesLike {
    this.assert.schema.isValidAddress('setTokenAddress', setTokenAddress);
    this.assert.schema.isValidAddress('feeSettings.feeRecipient', feeSettings.feeRecipient);
    this.assert.schema.isValidNumber('feeSettings.maxStreamingFeePercentage', feeSettings.maxStreamingFeePercentage);
    this.assert.schema.isValidNumber('feeSettings.streamingFeePercentage', feeSettings.streamingFeePercentage);
    this.assert.schema.isValidNumber('feeSettings.lastStreamingFeeTimestamp', feeSettings.lastStreamingFeeTimestamp);

    const moduleInterface = new EthersUtils.Interface(StreamingFeeModule__factory.abi);
    return moduleInterface.encodeFunctionData('initialize', [ setTokenAddress, feeSettings ]);
  }
}
