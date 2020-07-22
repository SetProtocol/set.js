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

import Web3 from 'web3';
import {
  BaseContract as CoreBaseContract,
  SetTokenContract,
} from 'set-protocol-v2';

/**
 * @title ContractWrapper
 * @author Set Protocol
 *
 * The Contracts API handles all functions that load contracts
 *
 */
export class ProtocolContractWrapper {
  private web3: Web3;
  private cache: { [contractName: string]: CoreBaseContract };

  public constructor(web3: Web3) {
    this.web3 = web3;
    this.cache = {};
  }

  /**
   * Load Set Token contract
   *
   * @param  setTokenAddress    Address of the Set Token contract
   * @param  transactionOptions Options sent into the contract deployed method
   * @return                    The Set Token Contract
   */
  public async loadSetTokenAsync(
    setTokenAddress: Address,
    transactionOptions: object = {},
  ): Promise<SetTokenContract> {
    const cacheKey = `SetToken_${setTokenAddress}`;

    if (cacheKey in this.cache) {
      return this.cache[cacheKey] as SetTokenContract;
    } else {
      const setTokenContract = await SetTokenContract.at(
        setTokenAddress,
        this.web3,
        transactionOptions,
      );
      this.cache[cacheKey] = setTokenContract;
      return setTokenContract;
    }
  }
}
