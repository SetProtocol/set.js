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

import { Provider } from 'ethers/providers';
import { Contract } from 'ethers';
import { Address } from 'set-protocol-v2/utils/types';
import { SetToken } from 'set-protocol-v2/dist/types/typechain/SetToken';

import { SetTokenWrapper } from './SetTokenWrapper';
import * as setTokenABI from 'set-protocol-v2/artifacts/SetToken.json';

/**
 * @title ContractWrapper
 * @author Set Protocol
 *
 * The Contracts API handles all functions that load contracts
 *
 */
export class ContractWrapper {
  private provider: Provider;
  private cache: { [contractName: string]: Contract };

  public constructor(provider: Provider) {
    this.provider = provider;
    this.cache = {};
  }

  /**
   * Load Set Token contract
   *
   * @param  setTokenAddress    Address of the Set Token contract
   * @param  transactionOptions Options sent into the contract deployed method
   * @return                    The Set Token Contract
   */
  public loadSetToken(
    setTokenAddress: Address,
    transactionOptions: object = {},
  ): SetToken {
    const cacheKey = `SetToken_${setTokenAddress}`;

    if (cacheKey in this.cache) {
      return this.cache[cacheKey] as SetToken;
    } else {
      const setTokenContract = new SetToken(
        setTokenAddress,
        setTokenABI.abi,
        this.provider
      );

      this.cache[cacheKey] = setTokenContract;
      return setTokenContract;
    }
  }
}
