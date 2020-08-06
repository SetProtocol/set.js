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

import { SetTokenWrapper } from '../../wrappers/set-protocol-v2/SetTokenWrapper';
import { generateTxOpts } from '@src/utils/transactions';
import { assertGetController } from './assertions';

/**
 * @title  SetTokenWrapper
 * @author Set Protocol
 *
 * The Set Token wrapper handles all functions on the SetToken smart contract.
 *
 */
export class SetTokenAPI {
  private setTokenWrapper: SetTokenWrapper;

  public constructor(provider: Provider) {
    this.setTokenWrapper = new SetTokenWrapper(provider);
  }

  /**
   * Gets the controller address of a target Set Token.
   *
   * @param  setAddress    Address of the SetToken.
   * @return               Address of the controller.
   */
  public async getControllerAsync(setAddress: Address): Promise<string> {
    assertGetController(setAddress);

    return await this.setTokenWrapper.controller(setAddress);
  }

  /**
   * Gets all current positions on a target Set Token.
   *
   * @param  setAddress    Address of Set.
   * @param  callerAddress Address of the method caller.
   * @return               Controller address of the Set.
   */
  public async getPositionsAsync(
    setAddress: Address,
    callerAddress?: Address
  ): Promise<Position[]> {
    return await this.setTokenWrapper.getPositions(setAddress, callerAddress);
  }

  /**
   * manager
   *
   * @param  setAddress    Address of Set
   * @return               Manager of the Set
   */
  public async manager(setAddress: Address): Promise<string> {
    const setToken = await this.contracts.loadSetTokenAsync(setAddress);

    return await setToken.manager();
  }

  /**
   * addModule
   *
   * @param  setAddress    Address Set to issue
   * @param  moduleAddress Address of potential module
   * @param  callerAddress Address of caller (optional)
   * @return               Transaction hash
   */
  public async moduleStates(
    setAddress: Address,
    moduleAddress: Address,
    callerAddress?: Address
  ): Promise<number> {
    const setToken = await this.contracts.loadSetTokenAsync(
      setAddress,
      callerAddress
    );

    return await setToken.moduleStates(moduleAddress);
  }

  /**
   * addModule
   * Add a module via address to the Set token
   *
   * @param  setAddress    Address Set to issue
   * @param  moduleAddress Address of potential module
   * @param  callerAddress Address of caller (optional)
   * @param  txOpts        Overrides for transaction (optional)
   * @return               Transaction hash
   */
  public async addModule(
    setAddress: Address,
    moduleAddress: Address,
    callerAddress: Address = undefined,
    txOpts: TransactionOverrides = {}
  ): Promise<ContractTransaction> {
    const txOptions = await generateTxOpts(txOpts);
    const setToken = await this.contracts.loadSetTokenAsync(
      setAddress,
      callerAddress
    );

    return await setToken.addModule(moduleAddress, txOptions);
  }

  /**
   * setManager
   * Sets the manager of the current Set token
   *
   * @param  setAddress    Address Set to issue
   * @param  callerAddress Address of caller (optional)
   * @param  txOpts     Overrides for transaction (optional)
   * @return               Transaction hash
   */
  public async setManager(
    setAddress: Address,
    managerAddress: Address,
    callerAddress: Address = undefined,
    txOpts: TransactionOverrides = {}
  ): Promise<ContractTransaction> {
    const txOptions = await generateTxOpts(txOpts);
    const setToken = await this.contracts.loadSetTokenAsync(
      setAddress,
      callerAddress
    );

    return await setToken.setManager(managerAddress, txOptions);
  }

  /**
   * initializeModule
   * Initializes the module on the Set
   *
   * @param  setAddress    Address Set to issue
   * @param  callerAddress Address of caller (optional)
   * @param  txOpts     Overrides for transaction (optional)
   * @return               Contract transaction
   */
  public async initializeModule(
    setAddress: Address,
    callerAddress: Address = undefined,
    txOpts: TransactionOverrides = {}
  ): Promise<ContractTransaction> {
    const txOptions = await generateTxOpts(txOpts);
    const setToken = await this.contracts.loadSetTokenAsync(
      setAddress,
      callerAddress
    );

    return await setToken.initializeModule(txOptions);
  }

  /**
   * isModule
   * Determines if given address is a module
   *
   * @param  setAddress    Address of Set to check
   * @param  moduleAddress Address of potential module
   * @param  callerAddress Address of caller (optional)
   * @return               boolean
   */
  public async isModule(
    setAddress: Address,
    moduleAddress: Address,
    callerAddress?: Address
  ): Promise<boolean> {
    const setToken = await this.contracts.loadSetTokenAsync(
      setAddress,
      callerAddress
    );

    return await setToken.isModule(moduleAddress);
  }

  /**
   * isPendingModule
   * Determines if a given module address is pending on the Set
   *
   * @param  setAddress    Address of Set to check
   * @param  moduleAddress Address of module
   * @param  callerAddress Address of caller (optional)
   * @return               boolean
   */
  public async isPendingModule(
    setAddress: Address,
    moduleAddress: Address,
    callerAddress?: Address
  ): Promise<boolean> {
    const setToken = await this.contracts.loadSetTokenAsync(
      setAddress,
      callerAddress
    );

    return await setToken.isPendingModule(moduleAddress);
  }

  /**
   * getPositions
   * Returns the list of positions on the SetToken
   *
   * @param  setAddress    Address of Set to get list of positions for
   * @param  callerAddress Address of caller (optional)
   * @return               Array of Positions
   */
  public async getPositions(
    setAddress: Address,
    callerAddress?: Address
  ): Promise<Position[]> {
    const setToken = await this.contracts.loadSetTokenAsync(
      setAddress,
      callerAddress
    );

    return setToken.getPositions();
  }

  /**
   * getModules
   * Returns the list of modules on the SetToken
   *
   * @param  setAddress     Address of Set to get list of modules for
   * @param  callerAddress  Address of caller (optional)
   * @return                Array of module addresses
   */
  public async getModules(
    setAddress: Address,
    callerAddress?: Address
  ): Promise<Address[]> {
    const setToken = await this.contracts.loadSetTokenAsync(
      setAddress,
      callerAddress
    );

    return setToken.getModules();
  }
}
