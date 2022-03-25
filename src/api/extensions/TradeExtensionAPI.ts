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

import { BigNumberish, BytesLike, utils as EthersUtils } from 'ethers';
import { Provider } from '@ethersproject/providers';
import { Address } from '@setprotocol/set-protocol-v2/utils/types';
import { TransactionOverrides } from '@setprotocol/set-protocol-v2/dist/typechain';
import { TradeExtension__factory } from '@setprotocol/set-v2-strategies/dist/typechain/factories/TradeExtension__factory';

import TradeExtensionWrapper from '../../wrappers/set-v2-strategies/TradeExtensionWrapper';
import Assertions from '../../assertions';

/**
 * @title  TradeExtensionAPI
 * @author Set Protocol
 *
 * The TradeExtensionAPI exposes methods to trade SetToken components using the TradeModule for SetTokens using
 * the DelegatedManager system. The API also provides some helper methods to generate bytecode data packets
 * that encode module and extension initialization method calls.
 */
export default class TradeExtensionAPI {
  private tradeExtensionWrapper: TradeExtensionWrapper;
  private assert: Assertions;

  public constructor(
    provider: Provider,
    TradeExtensionAddress: Address,
    assertions?: Assertions) {
    this.tradeExtensionWrapper = new TradeExtensionWrapper(provider, TradeExtensionAddress);
    this.assert = assertions || new Assertions();
  }

  /**
   * Executes a trade on a supported DEX. Must be called an address authorized for the `operator` role
   * on the TradeExtension
   *
   * NOTE: Although the SetToken units are passed in for the send and receive quantities, the total quantity
   * sent and received is the quantity of SetToken units multiplied by the SetToken totalSupply.
   *
   * @param setTokenAddress      Address of the deployed SetToken to trade on behalf of
   * @param exchangeName         Human readable name of the exchange in the integrations registry
   * @param sendToken            Address of the token to be sent to the exchange
   * @param sendQuantity         Units of token in SetToken sent to the exchange
   * @param receiveToken         Address of the token that will be received from the exchange
   * @param minReceiveQuantity   Min units of token in SetToken to be received from the exchange
   * @param data                 Arbitrary bytes to be used to construct trade call data
   * @param callerAddress        Address of caller (optional)
   * @param txOpts               Overrides for transaction (optional)
   */
  public async tradeWithOperatorAsync(
    setTokenAddress: Address,
    exchangeName: Address,
    sendToken: Address,
    sendQuantity: BigNumberish,
    receiveToken: Address,
    minReceiveQuantity: BigNumberish,
    data: BytesLike,
    callerAddress: Address = undefined,
    txOpts: TransactionOverrides = {}
  ) {
    this.assert.schema.isValidAddress('setTokenAddress', setTokenAddress);
    this.assert.schema.isValidString('exchangeName', exchangeName);
    this.assert.schema.isValidAddress('sendToken', sendToken);
    this.assert.schema.isValidNumber('sendQuantity', sendQuantity);
    this.assert.schema.isValidAddress('receiveToken', receiveToken);
    this.assert.schema.isValidNumber('minReceiveQuantity', minReceiveQuantity);
    this.assert.schema.isValidBytes('data', data);

    return await this.tradeExtensionWrapper.tradeWithOperator(
      setTokenAddress,
      exchangeName,
      sendToken,
      sendQuantity,
      receiveToken,
      minReceiveQuantity,
      data,
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

    const extensionInterface = new EthersUtils.Interface(TradeExtension__factory.abi);
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

    const extensionInterface = new EthersUtils.Interface(TradeExtension__factory.abi);
    return extensionInterface.encodeFunctionData('initializeExtension', [ delegatedManagerAddress ]);
  }
}
