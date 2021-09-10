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

import { Provider, JsonRpcProvider } from '@ethersproject/providers';
import { BigNumber } from 'ethers/lib/ethers';
import { ContractTransaction } from 'ethers';
import { Address } from '@setprotocol/set-protocol-v2/utils/types';
import { TransactionOverrides } from '@setprotocol/set-protocol-v2/dist/typechain';

import ContractWrapper from './ContractWrapper';

/**
 * @title  SetTokenCreatorWrapper
 * @author Set Protocol
 *
 * The SetTokenCreatorWrapper handles instantiation and registering of new Set Tokens.
 *
 */
export default class SetTokenCreatorWrapper {
  private provider: Provider;
  private contracts: ContractWrapper;

  private setTokenCreatorAddress: Address;

  public constructor(provider: Provider, setTokenCreatorAddress: Address) {
    this.provider = provider;
    this.contracts = new ContractWrapper(provider);
    this.setTokenCreatorAddress = setTokenCreatorAddress;
  }

  /**
   * Instantiates and registers a new Set Token.
   *
   * @param components     List of component addresses that will comprise a Set's initial positions.
   * @param units          List of units. Each unit is the # of components per 10^18 of this Set Token.
   * @param modules        List of modules to enable. All modules must be approved by the Controller.
   * @param manager        Address of the manager.
   * @param name           The Set Token's name.
   * @param symbol         The Set Token's symbol identifier.
   * @param callerAddress  Address of caller (optional)
   *
   * @return            Address of newly instantiated Set Token.
   */
  public async create(
    components: Address[],
    units: BigNumber[],
    modules: Address[],
    manager: Address,
    name: string,
    symbol: string,
    callerAddress?: Address,
    txOpts: TransactionOverrides = {}
  ): Promise<ContractTransaction> {
    const setTokenCreator = await this.contracts.loadSetTokenCreatorAsync(
      this.setTokenCreatorAddress,
      (this.provider as JsonRpcProvider).getSigner(callerAddress)
    );

    return setTokenCreator.create(
      components,
      units,
      modules,
      manager,
      name,
      symbol,
      txOpts);
  }
}
