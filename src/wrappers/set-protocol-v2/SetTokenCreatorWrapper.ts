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
 * @title  SetTokenCreatorWrapper
 * @author Set Protocol
 *
 * The SetTokenCreatorWrapper handles instantiation and registering of new Set Tokens.
 *
 */
export class SetTokenCreatorWrapper {
  private provider: Provider;
  private contracts: ContractWrapper;

  private setTokenCreatorAddress: Address;

  public constructor(provider: Provider, setTokenCreatorAddress: Address) {
    this.provider = provider;
    this.contracts = new ContractWrapper(provider);
    this.setTokenCreatorAddress = setTokenCreatorAddress;
  }

  /**
   * Returns the array of Factory contracts
   *
   * @param components  List of component addresses that will comprise initial positions
   * @param units       List of units. Each unit is the # of components per 10^18 of a Set Token.
   * @param modules     List of modules to enable. All modules must be approved by the Controller.
   * @param manager     Address of the manager
   * @param name        The Set Token's name.
   * @param symbol      The Set Token's symbol identifier.
   * @return            Address of newly instantiated Set Token.
   */
  public async create(
    components: Address[],
    units: string[],
    modules: Address[],
    manager: Address,
    name: string,
    symbol: string,
    callerAddress?: Address,
  ): Promise<Address[]> {
    const controller = await this.contracts.loadSetTokenCreatorAsync(
      this.setTokenCreatorAddress,
      (this.provider as JsonRpcProvider).getSigner(callerAddress)
    );

    return controller.create(components, units, modules, manager, name, symbol);
  }
}
