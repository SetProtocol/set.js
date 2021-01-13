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
import { Provider } from '@ethersproject/providers';
import { Address } from '@setprotocol/set-protocol-v2/utils/types';
import { TransactionOverrides } from '@setprotocol/set-protocol-v2/dist/typechain';
import { BigNumber } from 'ethers/lib/ethers';

import TradeModuleWrapper from '../wrappers/set-protocol-v2/TradeModuleWrapper';
import Assertions from '../assertions';

/**
 * @title  TradeAPI
 * @author Set Protocol
 *
 * The TradeAPI exposes methods to generate the calldata needed for 1inch exchange trades
 * and a simple trade interface for making the actual trades.
 *
 */
export default class TradeAPI {
  private tradeModuleWrapper: TradeModuleWrapper;
  private assert: Assertions;

  public constructor(
    provider: Provider,
    tradeModuleAddress: Address,
    assertions?: Assertions
  ) {
    this.tradeModuleWrapper = new TradeModuleWrapper(provider, tradeModuleAddress);
    this.assert = assertions || new Assertions();
  }

  /**
   * Executes a trade on a supported DEX. Only callable by the SetToken's manager.
   *
   * @dev Although the SetToken units are passed in for the send and receive quantities, the total quantity
   * sent and received is the quantity of SetToken units multiplied by the SetToken totalSupply.
   *
   * @param setTokenAddress             Instance of the SetToken to trade
   * @param exchangeName                Human readable name of the exchange in the integrations registry
   * @param sendTokenAddress            Address of the token to be sent to the exchange
   * @param sendQuantity                Units of token in SetToken sent to the exchange
   * @param receiveTokenAddress         Address of the token that will be received from the exchange
   * @param minReceiveQuantity          Min units of token in SetToken to be received from the exchange
   * @param data                        Arbitrary bytes to be used to construct trade call data
   *
   * @return                            Transaction hash of the trade transaction
   */
  public async tradeAsync(
    setTokenAddress: Address,
    exchangeName: string,
    sendTokenAddress: Address,
    sendQuantity: BigNumber,
    receiveTokenAddress: Address,
    minReceivedQuantity: BigNumber,
    data: string,
    callerAddress: Address = undefined,
    txOpts: TransactionOverrides = {}
  ): Promise<ContractTransaction> {
    this.assert.schema.isValidAddress('sendTokenAddress', sendTokenAddress);
    this.assert.schema.isValidAddress('setTokenAddress', setTokenAddress);
    this.assert.schema.isValidAddress('receiveTokenAddress', receiveTokenAddress);
    this.assert.common.greaterThanZero(sendQuantity, 'sendQuantity needs to be greater than zero');

    return await this.tradeModuleWrapper.trade(
      setTokenAddress,
      exchangeName,
      sendTokenAddress,
      sendQuantity,
      receiveTokenAddress,
      minReceivedQuantity,
      data,
      callerAddress,
      txOpts
    );
  }
}
