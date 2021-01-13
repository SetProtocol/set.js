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
import { BigNumber } from 'ethers/utils';
import { Address, Position } from 'set-protocol-v2/utils/types';
import { TransactionOverrides } from 'set-protocol-v2/dist/typechain';

import Assertions from '../assertions';
import { ModuleState } from '../types';
import ProtocolViewerWrapper from '../wrappers/set-protocol-v2/ProtocolViewerWrapper';
import SetTokenCreatorWrapper from '../wrappers/set-protocol-v2/SetTokenCreatorWrapper';
import SetTokenWrapper from '../wrappers/set-protocol-v2/SetTokenWrapper';

/**
 * @title  SetTokenWrapper
 * @author Set Protocol
 *
 * The Set Token wrapper handles all functions on the SetToken smart contract.
 *
 */
export default class SetTokenAPI {
  private setTokenWrapper: SetTokenWrapper;
  private setTokenCreatorWrapper: SetTokenCreatorWrapper;
  private protocolViewerWrapper: ProtocolViewerWrapper;
  private assert: Assertions;

  public constructor(
    provider: Provider,
    protocolViewerAddress: Address,
    streamingFeeModuleAddress: Address,
    setTokenCreatorAddress: Address,
    assertions?: Assertions
  ) {
    this.setTokenWrapper = new SetTokenWrapper(provider);
    this.setTokenCreatorWrapper = new SetTokenCreatorWrapper(provider, setTokenCreatorAddress);
    this.protocolViewerWrapper = new ProtocolViewerWrapper(
      provider,
      protocolViewerAddress,
      streamingFeeModuleAddress
    );
    this.assert = assertions || new Assertions();
  }

  /**
   * Instantiates and registers a new Set Token.
   *
   * @param componentAddresses    List of component addresses that will comprise a Set's initial positions.
   * @param units                 List of units. Each unit is the # of components per 10^18 of this Set Token.
   * @param moduleAddresses       List of modules to enable. All modules must be approved by the Controller.
   * @param managerAddress        Address of the manager.
   * @param name                  The Set Token's name.
   * @param symbol                The Set Token's symbol identifier.
   * @param callerAddress         Address of caller (optional)
   *
   * @return            Address of newly instantiated Set Token.
   */
  public async create(
    componentAddresses: Address[],
    units: BigNumber[],
    moduleAddresses: Address[],
    managerAddress: Address,
    name: string,
    symbol: string,
    callerAddress?: Address,
    txOpts: TransactionOverrides = {}
  ): Promise<Address[]> {
    this.assert.common.isNotEmptyArray(componentAddresses, 'Component addresses must contain at least one component.');
    this.assert.common.isEqualLength(componentAddresses, units, 'Component addresses and units must be equal length.');
    this.assert.schema.isValidAddressList('componentAddresses', componentAddresses);
    this.assert.schema.isValidAddressList('moduleAddresses', moduleAddresses);
    this.assert.schema.isValidAddress('managerAddress', managerAddress);

    return this.setTokenCreatorWrapper.create(
      componentAddresses,
      units,
      moduleAddresses,
      managerAddress,
      name,
      symbol,
      callerAddress,
      txOpts
    );
  }

  /**
   * Fetches the managers of set tokens
   *
   * @param  tokenAddresses Addresses of ERC20 contracts to check balance for
   * @returns               Addresses of managers of the set tokens
   */
  public async batchFetchManagersAsync(
    tokenAddresses: Address[],
  ): Promise<Address[]> {
    return await this.protocolViewerWrapper.batchFetchManagers(tokenAddresses);
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
   * @return                 Array of current Set Positions.
   */
  public async getPositionsAsync(
    setAddress: Address
  ): Promise<Position[]> {
    this.assert.schema.isValidAddress('setAddress', setAddress);

    return this.setTokenWrapper.getPositions(setAddress);
  }

  /**
   * Returns a list of modules for the target Set Token.
   *
   * @param  setAddress      Address of the Set.
   * @return                 Array of module addresses.
   */
  public async getModulesAsync(
    setAddress: Address
  ): Promise<Address[]> {
    this.assert.schema.isValidAddress('setAddress', setAddress);

    return this.setTokenWrapper.getModules(setAddress);
  }

  /**
   * Get the target module initialization state for the target Set Token.
   *
   * @param  setAddress      Address of the Set.
   * @param  moduleAddress   Address of the module state to check.
   * @return                 An integer representing module state.
   */
  public async getModuleStateAsync(
    setAddress: Address,
    moduleAddress: Address,
  ): Promise<ModuleState> {
    this.assert.schema.isValidAddress('setAddress', setAddress);
    this.assert.schema.isValidAddress('moduleAddress', moduleAddress);

    return this.setTokenWrapper.moduleStates(setAddress, moduleAddress);
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
   * @param  txOpts        Overrides for transaction (optional).
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
   * @return                boolean
   */
  public async isModuleEnabledAsync(
    setAddress: Address,
    moduleAddress: Address
  ): Promise<boolean> {
    this.assert.schema.isValidAddress('setAddress', setAddress);
    this.assert.schema.isValidAddress('moduleAddress', moduleAddress);

    return this.setTokenWrapper.isModule(setAddress, moduleAddress);
  }

  /**
   * Returns true if the given module is in "pending" state for the target Set.
   *
   * @param  setAddress    Address of Set to check
   * @param  moduleAddress Address of module
   * @return               boolean
   */
  public async isModulePendingAsync(
    setAddress: Address,
    moduleAddress: Address
  ): Promise<boolean> {
    this.assert.schema.isValidAddress('setAddress', setAddress);
    this.assert.schema.isValidAddress('moduleAddress', moduleAddress);

    return this.setTokenWrapper.isPendingModule(setAddress, moduleAddress);
  }
}
