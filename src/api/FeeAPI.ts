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

import { ContractTransaction } from 'ethers';
import { Provider } from 'ethers/providers';
import { Address } from 'set-protocol-v2/utils/types';
import { TransactionOverrides } from 'set-protocol-v2/dist/typechain';
import { BigNumber } from 'ethers/utils';

import StreamingFeeModuleWrapper from '@src/wrappers/set-protocol-v2/StreamingFeeModuleWrapper';
import Assertions from '@src/assertions';
import ProtocolViewerWrapper from '@src/wrappers/set-protocol-v2/ProtocolViewerWrapper';
import { StreamingFeeInfo } from '../types';

/**
 * @title  FeeAPI
 * @author Set Protocol
 *
 * The FeeAPI exposes functions that allow the manager to update various fees associated
 * with Sets through the modules
 *
 */
export default class FeeAPI {
  private streamingFeeModuleWrapper: StreamingFeeModuleWrapper;
  private protocolViewerWrapper: ProtocolViewerWrapper;
  private assert: Assertions;

  public constructor(
    provider: Provider,
    protocolViewerAddress: Address,
    streamingFeeIssuanceModuleAddress: Address,
    assertions?: Assertions
  ) {
    this.protocolViewerWrapper = new ProtocolViewerWrapper(
      provider,
      protocolViewerAddress,
      streamingFeeIssuanceModuleAddress
    );
    this.streamingFeeModuleWrapper = new StreamingFeeModuleWrapper(provider, streamingFeeIssuanceModuleAddress);
    this.assert = assertions || new Assertions();
  }

  /**
   * Fetches the streaming fee info of set tokens
   *
   * @param  tokenAddresses    Addresses of ERC20 contracts to check balance for
   * @returns                  Array of streaming fee infos
   */
  public async batchFetchStreamingFeeInfo(
    tokenAddresses: Address[],
  ): Promise<StreamingFeeInfo[]> {
    return await this.protocolViewerWrapper.batchFetchStreamingFeeInfo(tokenAddresses);
  }

  /**
   * Accrue the streaming fees for a SetToken. StreamingFeeModule must have been initialized
   *
   * @param  setAddress      Address of the Set
   * @param  callerAddress   Address of caller (optional)
   * @param  txOpts          Overrides for transaction (optional)
   * @return                 Transaction hash
   */
  public async accrueStreamingFeesAsync(
    setTokenAddress: Address,
    callerAddress: Address = undefined,
    txOpts: TransactionOverrides = {}
  ): Promise<ContractTransaction> {
    this.assert.schema.isValidAddress('setTokenAddress', setTokenAddress);

    return await this.streamingFeeModuleWrapper.accrueFee(
      setTokenAddress,
      callerAddress,
      txOpts
    );
  }

  /**
   * Update the streaming fee percentage for a SetToken. StreamingFeeModule must have been initialized
   *
   * @param  setAddress       Address of the Set
   * @param  newFee           New streaming fee amount in percentage
   * @param  callerAddress    Address of caller (optional)
   * @param  txOpts           Overrides for transaction (optional)
   * @return                  Transaction hash
   */
  public async updateStreamingFeeAsync(
    setTokenAddress: Address,
    newFee: BigNumber,
    callerAddress: Address = undefined,
    txOpts: TransactionOverrides = {}
  ): Promise<ContractTransaction> {
    this.assert.schema.isValidAddress('setTokenAddress', setTokenAddress);

    const streamingFeeScale = new BigNumber(10).pow(16);
    const newStreamingFee = newFee.mul(streamingFeeScale);

    return await this.streamingFeeModuleWrapper.updateStreamingFee(
      setTokenAddress,
      newStreamingFee,
      callerAddress,
      txOpts
    );
  }

  /**
   * Update fee recipient for a SetToken. StreamingFeeModule must have been initialized
   *
   * @param  setAddress            Address of the Set
   * @param  newRecipientAddress   The address of the new fee recipient
   * @param  callerAddress         Address of caller (optional)
   * @param  txOpts                Overrides for transaction (optional)
   * @return                       Transaction hash
   */
  public async updateStreamingFeeRecipient(
    setTokenAddress: Address,
    newRecipientAddress: Address,
    callerAddress: Address = undefined,
    txOpts: TransactionOverrides = {}
  ): Promise<ContractTransaction> {
    this.assert.schema.isValidAddress('setTokenAddress', setTokenAddress);
    this.assert.schema.isValidAddress('newRecipientAddress', newRecipientAddress);

    return await this.streamingFeeModuleWrapper.updateFeeRecipient(
      setTokenAddress,
      newRecipientAddress,
      callerAddress,
      txOpts
    );
  }

  /**
   * Fetch unaccrued fees as percentage of the SetToken's current supply
   *
   * @param  setAddress    Address of the Set
   * @return               Transaction hash
   */
  public async getUnaccruedStreamingFeesAsync(
    setTokenAddress: Address
  ): Promise<BigNumber> {
    this.assert.schema.isValidAddress('setTokenAddress', setTokenAddress);

    return await this.streamingFeeModuleWrapper.getFee(setTokenAddress);
  }
}
