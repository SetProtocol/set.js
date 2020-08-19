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
import { Address, Position } from 'set-protocol-v2/utils/types';
import { TransactionOverrides } from 'set-protocol-v2/dist/typechain';
import { BigNumber } from 'ethers/utils';

import ControllerWrapper from '@src/wrappers/set-protocol-v2/ControllerWrapper';
import Assertions from '@src/assertions';

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
  private assert: Assertions;

  public constructor(provider: Provider, controllerWrapperAddress: Address, assertions?: Assertions) {
    this.controllerWrapper = new ControllerWrapper(provider, controllerWrapperAddress);
    this.assert = assertions || new Assertions(provider);
  }

  /**
   * Returns the enabled Factory contracts on the Controller
   *
   * @return    Array of factory addresses
   */
  public async getFactoriesAsync(): Promise<Address[]> {
    return await this.controllerWrapper.getFactories();
  }

  /**
   * Returns the enabled Module contracts on the Controller
   *
   * @return    Array of module addresses
   */
  public async getModulesAsync(): Promise<Address[]> {
    return await this.controllerWrapper.getModules();
  }

  /**
   * Returns the enabled Resource contracts on the Controller
   *
   * @return    Array of resource addresses
   */
  public async getResourcesAsync(): Promise<Address[]> {
    return await this.controllerWrapper.getResources();
  }

  /**
   * Returns the enabled SetToken contracts on the Controller
   *
   * @return    Array of SetToken addresses
   */
  public async getSetsAsync(): Promise<Address[]> {
    return await this.controllerWrapper.getSets();
  }
}
