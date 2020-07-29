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
import { Provider, JsonRpcProvider } from 'ethers/providers';
import { Address, Position } from 'set-protocol-v2/utils/types';

import { ContractWrapper } from './ContractWrapper';

/**
 * @title  SetTokenWrapper
 * @author Set Protocol
 *
 * The Set Token wrapper handles all functions on the SetToken smart contract.
 *
 */
export class SetTokenWrapper {
  private provider: Provider;
  private contracts: ContractWrapper;

  public constructor(provider: Provider) {
    this.provider = provider;
    this.contracts = new ContractWrapper(provider);
  }

  /**
   * Returns the list of positions on the SetToken
   *
   * @param setAddress  Address Set to get list of positions for
   * @return            Array of Positions
   */
  public async getPositions(setAddress: Address, callerAddress: Address): Promise<Position[]> {
    const setToken = await this.contracts.loadSetTokenAsync(
      setAddress,
      (this.provider as JsonRpcProvider).getSigner(callerAddress)
    );

    return setToken.getPositions();
  }

  /**
   * Returns the list of modules on the SetToken
   *
   * @param setAddress  Address Set to get list of modules for
   * @return            Array of module addresses
   */
  public async getModules(setAddress: Address, callerAddress: Address): Promise<Address[]> {
    const setToken = await this.contracts.loadSetTokenAsync(
      setAddress,
      (this.provider as JsonRpcProvider).getSigner(callerAddress)
    );

    return setToken.getModules();
  }

  /**
   * Removes the last element to the Positions array. Decreases length of position array by 1.
   *
   * @param  setAddress Address Set to get last position for
   * @return            ContractTransaction
   */
  public async popPosition(setAddress: Address, callerAddress: Address): Promise<ContractTransaction> {
    const setToken = await this.contracts.loadSetTokenAsync(
      setAddress,
      (this.provider as JsonRpcProvider).getSigner(callerAddress)
    );

    return setToken.popPosition();
  }
}
