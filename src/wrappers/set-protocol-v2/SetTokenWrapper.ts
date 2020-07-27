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

import { Contract } from 'ethers';
import { Provider } from 'ethers/providers';
import { Address } from 'set-protocol-v2/utils/types';
import * as setTokenABI from 'set-protocol-v2/artifacts/SetToken.json';

const SetToken = require('set-protocol-v2/dist/utils/contracts').SetToken;

/**
 * @title  SetTokenWrapper
 * @author Set Protocol
 *
 * The Set Token wrapper handles all functions on the SetToken smart contract.
 *
 */
export class SetTokenWrapper {
  private provider: Provider;

  public constructor(provider: Provider) {
    this.provider = provider;
  }

  /**
   * Issues a Set to the transaction signer. Must have component tokens in the correct quantites in either
   * the vault or in the signer's wallet. Component tokens must be approved to the Transfer
   * Proxy contract via setTransferProxyAllowanceAsync
   *
   * @param  setAddress    Address Set to issue
   * @param  quantity      Amount of Set to issue. Must be multiple of the natural unit of the Set
   * @param  txOpts        Transaction options object conforming to `Tx` with signer, gas, and gasPrice data
   * @return               Transaction hash
   */
  public async popPosition(setAddress: string): Promise<string> {
    const setToken = this.loadSetTokenAsync(setAddress);

    return await setToken.getPositions();
  }

  /**
   * Load Set Token contract
   *
   * @param  setTokenAddress    Address of the Set Token contract
   * @return                    The Set Token Contract
   */
  private loadSetTokenAsync(setTokenAddress: Address): Contract {
    return new Contract(
      setTokenAddress,
      setTokenABI,
      this.provider
    );
  }
}
