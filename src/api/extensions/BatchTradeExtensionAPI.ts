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

import { ContractTransaction, BytesLike, utils as EthersUtils } from 'ethers';
import { Provider } from '@ethersproject/providers';
import { Address } from '@setprotocol/set-protocol-v2/utils/types';
import { TransactionOverrides } from '@setprotocol/set-protocol-v2/dist/typechain';
import { BatchTradeExtension__factory } from '@setprotocol/set-v2-strategies/dist/typechain/factories/BatchTradeExtension__factory';

import BatchTradeExtensionWrapper from '../../wrappers/set-v2-strategies/BatchTradeExtensionWrapper';
import Assertions from '../../assertions';
import { TradeInfo } from '../../types';

/**
 * @title  BatchTradeExtensionAPI
 * @author Set Protocol
 *
 * The BatchTradeExtensionAPI exposes methods to trade SetToken components in batches using the TradeModule for
 * SetTokens using the DelegatedManager system. The API also provides some helper methods to generate bytecode
 * data packets that encode module and extension initialization method calls.
 */
export default class BatchTradeExtensionAPI {
  private batchTradeExtensionWrapper: BatchTradeExtensionWrapper;
  private assert: Assertions;

  public constructor(
    provider: Provider,
    batchTradeExtensionAddress: Address,
    assertions?: Assertions) {
    this.batchTradeExtensionWrapper = new BatchTradeExtensionWrapper(provider, batchTradeExtensionAddress);
    this.assert = assertions || new Assertions();
  }

  /**
   * Executes a batch of trades on a supported DEX. Must be called an address authorized for the `operator` role
   * on the BatchTradeExtension
   *
   * NOTE: Although SetToken units are passed in for the send and receive quantities, the total quantity
   * sent and received is the quantity of SetToken units multiplied by the SetToken totalSupply.
   *
   * @param setTokenAddress      Address of the deployed SetToken to trade on behalf of
   * @param trades               Array of TradeInfo objects to execute as a batch of trades
   * @param callerAddress        Address of caller (optional)
   * @param txOpts               Overrides for transaction (optional)
   */
  public async batchTradeWithOperatorAsync(
    setTokenAddress: Address,
    trades: TradeInfo[],
    callerAddress: Address = undefined,
    txOpts: TransactionOverrides = {}
  ): Promise<ContractTransaction> {
    this._validateTrades(trades);
    this.assert.schema.isValidAddress('setTokenAddress', setTokenAddress);

    return await this.batchTradeExtensionWrapper.batchTradeWithOperatorAsync(
      setTokenAddress,
      trades,
      callerAddress,
      txOpts
    );
  }

  /**
   * Generates TradeExtension initialize call bytecode to be passed as an element in the  `initializeBytecode`
   * array for the DelegatedManagerFactory's `initializeAsync` method.
   *
   * @param delegatedManagerAddress      Instance of deployed DelegatedManager to initialize the TradeExtension for
   *
   * @return                             Initialization bytecode
   */
  public getTradeExtensionInitializationBytecode(
    delegatedManagerAddress: Address
  ): BytesLike {
    this.assert.schema.isValidAddress('delegatedManagerAddress', delegatedManagerAddress);

    const extensionInterface = new EthersUtils.Interface(BatchTradeExtension__factory.abi);
    return extensionInterface.encodeFunctionData('initializeExtension', [ delegatedManagerAddress ]);
  }

  /**
   * Generates `moduleAndExtensionInitialization` bytecode to be passed as an element in the  `initializeBytecode`
   * array for the `initializeAsync` method.
   *
   * @param setTokenAddress              Instance of deployed setToken to initialize the TradeModule for
   *
   * @return                             Initialization bytecode
   */
  public getTradeModuleAndExtensionInitializationBytecode(delegatedManagerAddress: Address): BytesLike {
    this.assert.schema.isValidAddress('delegatedManagerAddress', delegatedManagerAddress);

    const extensionInterface = new EthersUtils.Interface(BatchTradeExtension__factory.abi);
    return extensionInterface.encodeFunctionData('initializeModuleAndExtension', [ delegatedManagerAddress ]);
  }

  private _validateTrades(trades: TradeInfo[]) {
    for (const trade of trades) {
      this.assert.schema.isValidString('exchangeName', trade.exchangeName);
      this.assert.schema.isValidAddress('sendToken', trade.sendToken);
      this.assert.schema.isValidNumber('sendQuantity', trade.sendQuantity);
      this.assert.schema.isValidAddress('receiveToken', trade.receiveToken);
      this.assert.schema.isValidNumber('minReceiveQuantity', trade.minReceiveQuantity);
      this.assert.schema.isValidBytes('data', trade.data);
    }
  }
}
