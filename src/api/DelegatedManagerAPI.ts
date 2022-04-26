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

import { ContractTransaction } from 'ethers';
import { Provider } from '@ethersproject/providers';
import { Address } from '@setprotocol/set-protocol-v2/utils/types';
import { TransactionOverrides } from '@setprotocol/set-protocol-v2/dist/typechain';

import DelegatedManagerWrapper from '../wrappers/set-v2-strategies/DelegatedManagerWrapper';
import Assertions from '../assertions';

/**
 * @title  DelegatedManagerAPI
 * @author Set Protocol
 *
 * The DelegatedManagerAPI exposes methods to call functions only available directly on the
 * DelegatedManager contract. For the most part these are owner admin operations to reconfigure
 * permissions and add modules / extensions.
 *
 * (This API will be extended as required by set-ui (tokensets). For other use-cases interacting
 * with the contract via the Etherscan write API is the simplest option)
 */
export default class DelegatedManagerAPI {
  private DelegatedManagerWrapper: DelegatedManagerWrapper;
  private assert: Assertions;

  public constructor(
    provider: Provider,
    delegatedManagerAddress: Address,
    assertions?: Assertions) {
    this.DelegatedManagerWrapper = new DelegatedManagerWrapper(provider, delegatedManagerAddress);
    this.assert = assertions || new Assertions();
  }

  /**
   * ONLY OWNER: Add new extension(s) that the DelegatedManager can call. Puts extensions into PENDING
   * state, each must be initialized in order to be used.
   *
   * @param _extensions      New extension(s) to add
   * @param callerAddress    Address of caller (optional)
   * @param txOpts           Overrides for transaction (optional)
   */
  public async addExtensionsAsync(
    extensions: Address[],
    callerAddress: Address = undefined,
    txOpts: TransactionOverrides = {}
  ): Promise<ContractTransaction> {
    this.assert.schema.isValidAddressList('extensions', extensions);

    return await this.DelegatedManagerWrapper.addExtensions(
      extensions,
      callerAddress,
      txOpts
    );
  }
}
