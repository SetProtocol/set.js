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

import { Address } from '@setprotocol/set-protocol-v2/utils/types';
import { ContractTransaction } from 'ethers';
import { TransactionOverrides } from '@setprotocol/set-protocol-v2/dist/typechain';
import { Provider } from '@ethersproject/providers';
import { generateTxOpts } from '../../utils/transactions';

import ContractWrapper from './ContractWrapper';

/**
 * @title  DelegatedManagerWrapper
 * @author Set Protocol
 *
 * The DelegatedManagerWrapper forwards functionality from the DelegatedManager contract.
 *
 */
export default class DelegatedManagerWrapper {
  private provider: Provider;
  private contracts: ContractWrapper;

  public constructor(provider: Provider) {
    this.provider = provider;
    this.contracts = new ContractWrapper(this.provider);
  }

  /**
   * ONLY OWNER: Add new extension(s) that the DelegatedManager can call. Puts extensions into PENDING
   * state, each must be initialized in order to be used.
   *
   * @param delegatedManagerAddress     DelegatedManager to add extension for
   * @param extensions                  New extension(s) to add
   * @param callerAddress               Address of caller (optional)
   * @param txOpts                      Overrides for transaction (optional)
   */
  public async addExtensions(
    delegatedManagerAddress: Address,
    extensions: Address[],
    callerAddress: Address = undefined,
    txOpts: TransactionOverrides = {}
  ): Promise<ContractTransaction> {
    const txOptions = await generateTxOpts(txOpts);
    const delegatedManagerInstance = await this.contracts.loadDelegatedManagerAsync(
      delegatedManagerAddress,
      callerAddress
    );

    return await delegatedManagerInstance.addExtensions(extensions, txOptions);
  }
}