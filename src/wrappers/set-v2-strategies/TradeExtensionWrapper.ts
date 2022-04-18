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

import { Address } from '@setprotocol/set-protocol-v2/utils/types';
import { BigNumberish, BytesLike, ContractTransaction } from 'ethers';
import { TransactionOverrides } from '@setprotocol/set-protocol-v2/dist/typechain';
import { Provider } from '@ethersproject/providers';
import { generateTxOpts } from '../../utils/transactions';

import ContractWrapper from './ContractWrapper';

/**
 * @title  TradeExtensionWrapper
 * @author Set Protocol
 *
 * The TradeExtensionWrapper forwards functionality from the TradeExtension contract.
 *
 */
export default class TradeExtensionWrapper {
  private provider: Provider;
  private contracts: ContractWrapper;

  private tradeExtensionAddress: Address;

  public constructor(provider: Provider, tradeExtensionAddress: Address) {
    this.provider = provider;
    this.contracts = new ContractWrapper(this.provider);
    this.tradeExtensionAddress = tradeExtensionAddress;
  }

  /**
   * Executes a trade on a supported DEX. Must be called an address authorized for the `operator` role
   * on the TradeExtension
   *
   * NOTE: Although SetToken units are passed in for the send and receive quantities, the total quantity
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
   * @param txOptions            Overrides for transaction (optional)
   */
  public async tradeWithOperator(
    setTokenAddress: Address,
    exchangeName: Address,
    sendToken: Address,
    sendQuantity: BigNumberish,
    receiveToken: Address,
    minReceiveQuantity: BigNumberish,
    data: BytesLike,
    callerAddress: Address = undefined,
    txOpts: TransactionOverrides = {}
  ): Promise<ContractTransaction> {
    const txOptions = await generateTxOpts(txOpts);
    const tradeExtensionInstance = await this.contracts.loadTradeExtensionAsync(
      this.tradeExtensionAddress,
      callerAddress
    );

    return await tradeExtensionInstance.trade(
      setTokenAddress,
      exchangeName,
      sendToken,
      sendQuantity,
      receiveToken,
      minReceiveQuantity,
      data,
      txOptions
    );
  }
}
