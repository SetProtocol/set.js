/*
  Copyright 2022 Set Labs Inc.

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

import { ContractTransaction, BigNumberish, BytesLike } from 'ethers';
import { Provider } from '@ethersproject/providers';
import { Address } from '@setprotocol/set-protocol-v2/utils/types';
import { TransactionOverrides } from '@setprotocol/set-protocol-v2/dist/typechain';

import DelegatedManagerFactoryWrapper from '../wrappers/set-v2-strategies/DelegatedManagerFactoryWrapper';
import Assertions from '../assertions';

/**
 * @title  DelegatedManagerFactoryAPI
 * @author Set Protocol
 *
 * The DelegatedManagerFactoryAPI exposes methods to create and initialized new SetTokens bundled with
 * Manager contracts and extensions which encode fee management and rebalance trading logic. The API also
 * provides some helper methods to generate bytecode data packets that encode module and extension
 * initialization method calls.
 *
 */
export default class DelegatedManagerFactoryAPI {
  private DelegatedManagerFactoryWrapper: DelegatedManagerFactoryWrapper;
  private assert: Assertions;

  public constructor(
    provider: Provider,
    delegatedManagerFactoryAddress: Address,
    assertions?: Assertions) {
    this.DelegatedManagerFactoryWrapper = new DelegatedManagerFactoryWrapper(provider, delegatedManagerFactoryAddress);
    this.assert = assertions || new Assertions();
  }

  /**
   * Deploys a new SetToken and DelegatedManager. Sets some temporary metadata about the deployment
   * which will be consumed during a subsequent intialization step (see `initialize` method) which
   * wires everything together.
   *
   * To interact with the DelegateManager system after this transaction is executed it's necessary
   * to get the address of the created SetToken via a SetTokenCreated event logged .
   *
   * An ethers.js recipe for programatically retrieving the relevant log can be found in `set-protocol-v2`'s
   * protocol utilities here:
   *
   * https://github.com/SetProtocol/set-protocol-v2/blob/master/utils/common/protocolUtils.ts
   *
   * @param components       Addresses of components for initial Positions
   * @param units            Units. Each unit is the # of components per 10^18 of a SetToken
   * @param name             Name of the SetToken
   * @param symbol           Symbol of the SetToken
   * @param owner            Address to set as the DelegateManager's `owner` role
   * @param methodologist    Address to set as the DelegateManager's methodologist role
   * @param modules          Modules to enable. All modules must be approved by the Controller
   * @param operators        Operators authorized for the DelegateManager
   * @param assets           Assets DelegateManager can trade. When empty, asset allow list is not enforced
   * @param extensions       Extensions authorized for the DelegateManager
   * @param callerAddress    Address of caller (optional)
   * @param txOpts           Overrides for transaction (optional)
   *
   * @return                 Transaction hash of the initialize transaction
   */
  public async createSetAndManagerAsync(
    components: Address[],
    units: BigNumberish[],
    name: string,
    symbol: string,
    owner: Address,
    methodologist: Address,
    modules: Address[],
    operators: Address[],
    assets: Address[],
    extensions: Address[],
    callerAddress: Address = undefined,
    txOpts: TransactionOverrides = {}
  ): Promise<ContractTransaction> {
    this.assert.schema.isValidAddressList('components', components);
    this.assert.schema.isValidNumberList('units', units);
    this.assert.schema.isValidString('name', name);
    this.assert.schema.isValidString('symbol', symbol);
    this.assert.schema.isValidAddress('methodologist', methodologist);
    this.assert.schema.isValidAddressList('modules', modules);
    this.assert.schema.isValidAddressList('operators', operators);
    this.assert.schema.isValidAddressList('assets', assets);
    this.assert.schema.isValidAddressList('extensions', extensions);

    this.assert.common.isNotEmptyArray(
      components,
      'Component addresses must contain at least one component.'
    );
    this.assert.common.isEqualLength(
      components,
      units,
      'Component addresses and units must be equal length.'
    );

    return await this.DelegatedManagerFactoryWrapper.createSetAndManager(
      components,
      units,
      name,
      symbol,
      owner,
      methodologist,
      modules,
      operators,
      assets,
      extensions,
      callerAddress,
      txOpts
    );
  }

  /**
   * Wires SetToken, DelegatedManager, global manager extensions, and modules together into a functioning
   * package. `initializeTargets` and `initializeBytecode` params are isomorphic, e.g the arrays must
   * be the same length and the bytecode at `initializeBytecode[i]` will be called on `initializeTargets[i]`;
   *
   * Use the generateBytecode methods provided by this API to prepare parameters for calls to `initialize`
   * as below:
   *
   * ```
   * tradeModuleBytecodeData = api.getTradeModuleInitializationBytecode(setTokenAddress)
   * initializeTargets.push(tradeModuleAddress);
   * initializeBytecode.push(tradeModuleBytecodeData);
   * ```
   *
   * @param setTokenAddress        Address of deployed SetToken to initialize
   * @param ownerFeeSplit          % of fees in precise units (10^16 = 1%) sent to owner, rest to methodologist
   * @param ownerFeeRecipient      Address which receives operator's share of fees when they're distributed
   * @param initializeTargets      Addresses of extensions or modules which should be initialized
   * @param initializeBytecode     Array of encoded calls to a target's initialize function
   * @param callerAddress          Address of caller (optional)
   * @param txOpts                 Overrides for transaction (optional)
   *
   * @return                       Transaction hash of the initialize transaction
   */
  public async initializeAsync(
    setTokenAddress: Address,
    ownerFeeSplit: BigNumberish,
    ownerFeeRecipient: Address,
    initializeTargets: Address[],
    initializeBytecode: BytesLike[],
    callerAddress: Address = undefined,
    txOpts: TransactionOverrides = {}
  ): Promise<ContractTransaction> {
    this.assert.schema.isValidAddress('setTokenAddress', setTokenAddress);
    this.assert.schema.isValidNumber('ownerFeeSplit', ownerFeeSplit);
    this.assert.schema.isValidAddress('ownerFeeRecipient', ownerFeeRecipient);
    this.assert.schema.isValidAddressList('initializeTargets', initializeTargets);
    this.assert.schema.isValidBytesList('initializeBytecode', initializeBytecode);

    this.assert.common.isNotEmptyArray(
      initializeTargets,
      'initializationTargets array must contain at least one element.'
    );

    this.assert.common.isEqualLength(
      initializeTargets,
      initializeBytecode,
      'initializeTargets and initializeBytecode arrays must be equal length.'
    );

    return await this.DelegatedManagerFactoryWrapper.initialize(
      setTokenAddress,
      ownerFeeSplit,
      ownerFeeRecipient,
      initializeTargets,
      initializeBytecode,
      callerAddress,
      txOpts
    );
  }
}
