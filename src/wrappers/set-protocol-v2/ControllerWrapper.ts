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

import { Provider } from '@ethersproject/providers';
import { Address } from '@setprotocol/set-protocol-v2/utils/types';

import ContractWrapper from './ContractWrapper';

/**
 * @title  ControllerWrapper
 * @author Set Protocol
 *
 * The Controller wrapper handles all functions on the Controller smart contract.
 *
 */
export default class ControllerWrapper {
  private provider: Provider;
  private contracts: ContractWrapper;

  private controllerAddress: Address;

  public constructor(provider: Provider, controllerAddress: Address) {
    this.provider = provider;
    this.contracts = new ContractWrapper(this.provider);
    this.controllerAddress = controllerAddress;
  }

  /**
   * Returns the array of Factory contracts
   *
   * @param controllerAddress  Controller address to get list of Factories for
   * @return                   Array of Factory addresses
   */
  public async getFactories(
    callerAddress?: Address,
  ): Promise<Address[]> {
    const controller = await this.contracts.loadControllerContractAsync(
      this.controllerAddress,
      callerAddress,
    );

    return controller.getFactories();
  }

  /**
   * Returns the array of Module contracts
   *
   * @param controllerAddress  Controller address to get list of Modules for
   * @return                   Array of Module addresses
   */
  public async getModules(
    callerAddress?: Address,
  ): Promise<Address[]> {
    const controller = await this.contracts.loadControllerContractAsync(
      this.controllerAddress,
      callerAddress,
    );

    return controller.getModules();
  }

  /**
   * Returns the array of Resource contracts
   *
   * @param controllerAddress  Controller address to get list of Resources for
   * @return                   Array of Resouce addresses
   */
  public async getResources(
    callerAddress?: Address,
  ): Promise<Address[]> {
    const controller = await this.contracts.loadControllerContractAsync(
      this.controllerAddress,
      callerAddress,
    );

    return controller.getResources();
  }

  /**
   * Returns the array of SetToken contracts
   *
   * @param controllerAddress  Controller address to get list of Sets for
   * @return                   Array of SetToken addresses
   */
  public async getSets(
    callerAddress?: Address,
  ): Promise<Address[]> {
    const controller = await this.contracts.loadControllerContractAsync(
      this.controllerAddress,
      callerAddress,
    );

    return controller.getSets();
  }

  /**
   * Returns whether or not an address is a SetToken
   *
   * @param address            Address to check
   * @return                   boolean
   */
  public async isSet(
    address: Address,
    callerAddress?: Address,
  ): Promise<boolean> {
    const controller = await this.contracts.loadControllerContractAsync(
      this.controllerAddress,
      callerAddress,
    );

    return controller.isSet(address);
  }
}
