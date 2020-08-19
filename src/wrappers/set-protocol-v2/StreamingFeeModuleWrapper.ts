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

import { Address } from 'set-protocol-v2/utils/types';
import { ContractTransaction } from 'ethers';
import { TransactionOverrides } from 'set-protocol-v2/dist/typechain';
import { BigNumber } from 'ethers/utils';
import { Provider } from 'ethers/providers';
import { generateTxOpts } from '@src/utils/transactions';

import ContractWrapper from './ContractWrapper';

/**
 * @title  StreamingFeeModuleWrapper
 * @author Set Protocol
 *
 * The StreamingFeeModuleWrapper forwards functionality from the StreamingFeeModule contract.
 *
 */
export default class StreamingFeeModuleWrapper {
  private provider: Provider;
  private contracts: ContractWrapper;

  private streamingFeeModuleAddress: Address;

  public constructor(provider: Provider, streamingFeeModuleAddress: Address) {
    this.provider = provider;
    this.contracts = new ContractWrapper(this.provider);
    this.streamingFeeModuleAddress = streamingFeeModuleAddress;
  }

  /**
   * Calculates total inflation percentage then mints new Sets to the fee recipient.
   *
   * @param  setTokenAddress    Address of the SetToken contract to issue
   * @param  callerAddress      Address of caller (optional)
   * @return                    Transaction hash of the issuance transaction
   */
  public async accrueFee(
    setTokenAddress: Address,
    callerAddress: Address = undefined,
    txOpts: TransactionOverrides = {}
  ): Promise<ContractTransaction> {
    const txOptions = await generateTxOpts(txOpts);
    const streamingFeeModuleInstance = await this.contracts.loadStreamingFeeModuleAsync(
      this.streamingFeeModuleAddress,
      callerAddress
    );

    return await streamingFeeModuleInstance.accrueFee(
      setTokenAddress,
      txOptions
    );
  }

  /**
   * Updates the streaming fee to a new streaming fee amount.
   *
   * @param  setTokenAddress    Address of the SetToken contract to issue
   * @param  newFee             The new streaming fee amount 18 decimal precision
   * @param  callerAddress      Address of caller (optional)
   * @return                    Transaction hash of the issuance transaction
   */
  public async updateStreamingFee(
    setTokenAddress: Address,
    newFee: BigNumber,
    callerAddress: Address = undefined,
    txOpts: TransactionOverrides = {}
  ): Promise<ContractTransaction> {
    const txOptions = await generateTxOpts(txOpts);
    const streamingFeeModuleInstance = await this.contracts.loadStreamingFeeModuleAsync(
      this.streamingFeeModuleAddress,
      callerAddress
    );

    return await streamingFeeModuleInstance.updateStreamingFee(
      setTokenAddress,
      newFee,
      txOptions
    );
  }

  /**
   * Updates the recipient address of the SetToken's streaming fees
   *
   * @param  setTokenAddress        Address of the SetToken contract to issue
   * @param  newRecipientAddress    The address of the new fee recipient
   * @param  callerAddress          Address of caller (optional)
   * @return                        Transaction hash of the issuance transaction
   */
  public async updateFeeRecipient(
    setTokenAddress: Address,
    newRecipientAddress: Address,
    callerAddress: Address = undefined,
    txOpts: TransactionOverrides = {}
  ): Promise<ContractTransaction> {
    const txOptions = await generateTxOpts(txOpts);
    const streamingFeeModuleInstance = await this.contracts.loadStreamingFeeModuleAsync(
      this.streamingFeeModuleAddress,
      callerAddress
    );

    return await streamingFeeModuleInstance.updateFeeRecipient(
      setTokenAddress,
      newRecipientAddress,
      txOptions
    );
  }

  /**
   * Calculates total inflation percentage in order to accrue fees to manager
   *
   * @param  setTokenAddress    Address of the SetToken contract to issue
   * @return                    Current unaccumulate fee amount in percentage of supply
   */
  public async getFee(
    setTokenAddress: Address,
  ): Promise<BigNumber> {
    const streamingFeeModuleInstance = await this.contracts.loadStreamingFeeModuleAsync(
      this.streamingFeeModuleAddress
    );

    return await streamingFeeModuleInstance.getFee(setTokenAddress);
  }
}