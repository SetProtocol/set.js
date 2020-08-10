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
import { Provider } from 'ethers/providers';
import { Address, Position } from 'set-protocol-v2/utils/types';
import { TransactionOverrides } from 'set-protocol-v2/dist/typechain';

import SetTokenWrapper from '../wrappers/set-protocol-v2/SetTokenWrapper';
import { Assertions } from '@src/assertions';
import { ModuleState } from '@src/types';

export type SetTokenAPIConfig = {
  setTokenWrapper?: SetTokenWrapper;
  assertions?: Assertions;
};

/**
 * @title  SetTokenWrapper
 * @author Set Protocol
 *
 * The Set Token wrapper handles all functions on the SetToken smart contract.
 *
 */
export class SetTokenAPI {
  private setTokenWrapper: SetTokenWrapper;
  private assert: Assertions;

  public constructor(provider: Provider, options?: SetTokenAPIConfig) {
    this.setTokenWrapper = (options?.setTokenWrapper) || new SetTokenWrapper(provider);
    this.assert = (options?.assertions) || new Assertions(provider);
  }

  /**
   * Gets the controller address of a target Set Token.
   *
   * @param  setAddress    Address of the Set.
   * @return               Address of the controller.
   */
  public async getControllerAddressAsync(setAddress: Address): Promise<string> {
    this.assert.schema.isValidAddress('setAddress', setAddress);

    return await this.setTokenWrapper.controller(setAddress);
  }

  /**
   * Gets the manager address of the target Set Token.
   *
   * @param  setAddress    Address of the Set.
   * @return               Address of the manager.
   */
  public async getManagerAddressAsync(setAddress: Address): Promise<Address> {
    this.assert.schema.isValidAddress('setAddress', setAddress);

    return this.setTokenWrapper.manager(setAddress);
  }

  /**
   * Gets all current positions on the target Set Token.
   *
   * @param  setAddress      Address of the Set.
   * @param  callerAddress   Address of the method caller.
   * @return                 Array of current Set Positions.
   */
  public async getPositionsAsync(
    setAddress: Address,
    callerAddress?: Address
  ): Promise<Position[]> {
    this.assert.schema.isValidAddress('setAddress', setAddress);

    return this.setTokenWrapper.getPositions(setAddress, callerAddress);
  }

  /**
   * Returns a list of modules for the target Set Token.
   *
   * @param  setAddress      Address of the Set.
   * @param  callerAddress   Address of caller (optional).
   * @return                 Array of module addresses.
   */
  public async getModulesAsync(
    setAddress: Address,
    callerAddress?: Address
  ): Promise<Address[]> {
    this.assert.schema.isValidAddress('setAddress', setAddress);

    return this.setTokenWrapper.getModules(setAddress, callerAddress);
  }

  /**
   * Get the target module initialization state for the target Set Token.
   *
   * @param  setAddress      Address of the Set.
   * @param  moduleAddress   Address of the module state to check.
   * @param  callerAddress   Address of caller (optional).
   * @return                 An integer representing module state.
   */
  public async getModuleStateAsync(
    setAddress: Address,
    moduleAddress: Address,
    callerAddress?: Address
  ): Promise<ModuleState> {
    this.assert.schema.isValidAddress('setAddress', setAddress);
    this.assert.schema.isValidAddress('moduleAddress', moduleAddress);

    return this.setTokenWrapper.moduleStates(setAddress, moduleAddress, callerAddress);
  }

  /**
   * Add a module via address to the target Set token.
   *
   * @param  setAddress      Address of the Set.
   * @param  moduleAddress   Address of the module to be added.
   * @param  callerAddress   Address of caller (optional).
   * @param  txOpts          Overrides for transaction (optional).
   * @return                 Transaction hash.
   */
  public async addModuleAsync(
    setAddress: Address,
    moduleAddress: Address,
    callerAddress: Address = undefined,
    txOpts: TransactionOverrides = {}
  ): Promise<ContractTransaction> {
    this.assert.schema.isValidAddress('setAddress', setAddress);
    this.assert.schema.isValidAddress('moduleAddress', moduleAddress);
    // TODO: assert module is an approved module on controller?

    return await this.setTokenWrapper.addModule(setAddress, moduleAddress, callerAddress, txOpts);
  }

  /**
   * Sets the manager of the target Set token.
   *
   * @param  setAddress      Address of the Set.
   * @param  callerAddress   Address of caller (optional).
   * @param  txOpts          Overrides for transaction (optional).
   * @return                 Transaction hash.
   */
  public async setManagerAsync(
    setAddress: Address,
    managerAddress: Address,
    callerAddress: Address = undefined,
    txOpts: TransactionOverrides = {}
  ): Promise<ContractTransaction> {
    this.assert.schema.isValidAddress('setAddress', setAddress);
    this.assert.schema.isValidAddress('managerAddress', managerAddress);

    return this.setTokenWrapper.setManager(setAddress, managerAddress, callerAddress, txOpts);
  }

  /**
   * Initialize a module on the target Set.
   *
   * @param  setAddress    Address Set to issue.
   * @param  callerAddress Address of caller (optional).
   * @param  txOpts     Overrides for transaction (optional).
   * @return               Contract transaction.
   */
  public async initializeModuleAsync(
    setAddress: Address,
    callerAddress: Address = undefined,
    txOpts: TransactionOverrides = {}
  ): Promise<ContractTransaction> {
    this.assert.schema.isValidAddress('setAddress', setAddress);

    return this.setTokenWrapper.initializeModule(setAddress, callerAddress, txOpts);
  }

  /**
   * Returns true if the given address is an enabled module on the target Set.
   *
   * @param  setAddress     Address of Set to check
   * @param  moduleAddress  Address of potential module
   * @param  callerAddress  Address of caller (optional)
   * @return                boolean
   */
  public async isModuleEnabledAsync(
    setAddress: Address,
    moduleAddress: Address,
    callerAddress?: Address
  ): Promise<boolean> {
    this.assert.schema.isValidAddress('setAddress', setAddress);
    this.assert.schema.isValidAddress('moduleAddress', moduleAddress);

    return this.setTokenWrapper.isModule(setAddress, moduleAddress, callerAddress);
  }

  /**
   * Returns true if the given module is in "pending" state for the target Set.
   *
   * @param  setAddress    Address of Set to check
   * @param  moduleAddress Address of module
   * @param  callerAddress Address of caller (optional)
   * @return               boolean
   */
  public async isModulePendingAsync(
    setAddress: Address,
    moduleAddress: Address,
    callerAddress?: Address
  ): Promise<boolean> {
    this.assert.schema.isValidAddress('setAddress', setAddress);
    this.assert.schema.isValidAddress('moduleAddress', moduleAddress);

    return this.setTokenWrapper.isPendingModule(setAddress, moduleAddress, callerAddress);
  }
}
