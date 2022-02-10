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

import ControllerWrapper from '../wrappers/set-protocol-v2/ControllerWrapper';

/**
 * @title  SystemAPI
 * @author Set Protocol
 *
 * The SystemAPI exposes functions to read state from the Controller smart contract which
 * shows tracks SetToken, Factory, and Module contracts
 *
 */
export default class SystemAPI {
  private controllerWrapper: ControllerWrapper;

  public constructor(provider: Provider, controllerWrapperAddress: Address) {
    this.controllerWrapper = new ControllerWrapper(provider, controllerWrapperAddress);
  }

  /**
   * Returns the enabled Factory contracts on the Controller
   *
   * @return    Array of factory addresses
   */
  public async getFactoriesAsync(callerAddress?: Address): Promise<Address[]> {
    return await this.controllerWrapper.getFactories(callerAddress);
  }

  /**
   * Returns the enabled Module contracts on the Controller
   *
   * @return    Array of module addresses
   */
  public async getModulesAsync(callerAddress?: Address): Promise<Address[]> {
    return await this.controllerWrapper.getModules(callerAddress);
  }

  /**
   * Returns the enabled Resource contracts on the Controller
   *
   * @return    Array of resource addresses
   */
  public async getResourcesAsync(callerAddress?: Address): Promise<Address[]> {
    return await this.controllerWrapper.getResources(callerAddress);
  }

  /**
   * Returns the enabled SetToken contracts on the Controller
   *
   * @return    Array of SetToken addresses
   */
  public async getSetsAsync(callerAddress?: Address): Promise<Address[]> {
    return await this.controllerWrapper.getSets(callerAddress);
  }

  /**
   * Returns whether or not an address is a SetToken
   *
   * @param address            Address to check
   * @return                   boolean
   */
  public async isSetAsync(address, callerAddress?: Address): Promise<boolean> {
    return await this.controllerWrapper.isSet(address, callerAddress);
  }
}
