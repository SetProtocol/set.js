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

import { Address } from '@setprotocol/set-protocol-v2/utils/types';
import { ContractTransaction } from 'ethers';
import { TransactionOverrides } from '@setprotocol/set-protocol-v2/dist/typechain';
import { BigNumber } from 'ethers/lib/ethers';
import { Provider } from '@ethersproject/providers';
import { generateTxOpts } from '../../utils/transactions';

import ContractWrapper from './ContractWrapper';

/**
 * @title  TradeModuleWrapper
 * @author Set Protocol
 *
 * The TradeModuleWrapper forwards functionality from the TradeModule contract
 *
 */
export default class TradeModuleWrapper {
  private provider: Provider;
  private contracts: ContractWrapper;

  private tradeModuleAddress: Address;

  public constructor(provider: Provider, tradeModuleAddress: Address) {
    this.provider = provider;
    this.contracts = new ContractWrapper(this.provider);
    this.tradeModuleAddress = tradeModuleAddress;
  }

  /**
   * Initializes this module to the SetToken. Only callable by the SetToken's manager.
   *
   * @param setTokenAddress             Address of the SetToken to initialize
   * @param callerAddress               Address of caller (optional)
   * @param txOpts                      Overrides for transaction (optional)
   */
  public async initialize(
    setTokenAddress: Address,
    callerAddress: Address = undefined,
    txOpts: TransactionOverrides = {}
  ): Promise<ContractTransaction> {
    const txOptions = await generateTxOpts(txOpts);
    const tradeModuleInstance = await this.contracts.loadTradeModuleAsync(
      this.tradeModuleAddress,
      callerAddress
    );

    return await tradeModuleInstance.initialize(
      setTokenAddress,
      txOptions,
    );
  }

  /**
   * Executes a trade on a supported DEX. Only callable by the SetToken's manager.
   *
   * @dev Although the SetToken units are passed in for the send and receive quantities, the total quantity
   * sent and received is the quantity of SetToken units multiplied by the SetToken totalSupply.
   *
   * @param setTokenAddress             Address of the SetToken to trade
   * @param exchangeName                Human readable name of the exchange in the integrations registry
   * @param sendTokenAddress            Address of the token to be sent to the exchange
   * @param sendQuantity                Units of token in SetToken sent to the exchange
   * @param receiveTokenAddress         Address of the token that will be received from the exchange
   * @param minReceiveQuantity          Min units of token in SetToken to be received from the exchange
   * @param data                        Arbitrary bytes to be used to construct trade call data
   * @param callerAddress               Address of caller (optional)
   * @param txOpts                      Overrides for transaction (optional)
   *
   * @return                            Transaction hash of the trade transaction
   */
  public async trade(
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
    const txOptions = await generateTxOpts(txOpts);
    const tradeModuleInstance = await this.contracts.loadTradeModuleAsync(
      this.tradeModuleAddress,
      callerAddress
    );

    return await tradeModuleInstance.trade(
      setTokenAddress,
      exchangeName,
      sendTokenAddress,
      sendQuantity,
      receiveTokenAddress,
      minReceivedQuantity,
      data,
      txOptions
    );
  }

  /**
   * Estimate gas cost for executing a trade on a supported DEX.
   *
   * @dev Although the SetToken units are passed in for the send and receive quantities, the total quantity
   * sent and received is the quantity of SetToken units multiplied by the SetToken totalSupply.
   *
   * @param setTokenAddress             Address of the SetToken to trade
   * @param exchangeName                Human readable name of the exchange in the integrations registry
   * @param sendTokenAddress            Address of the token to be sent to the exchange
   * @param sendQuantity                Units of token in SetToken sent to the exchange
   * @param receiveTokenAddress         Address of the token that will be received from the exchange
   * @param minReceiveQuantity          Min units of token in SetToken to be received from the exchange
   * @param data                        Arbitrary bytes to be used to construct trade call data
   * @param callerAddress               Address of caller
   *
   * @return                            Transaction hash of the trade transaction
   */
  public async estimateGasForTradeAsync(
    setTokenAddress: Address,
    exchangeName: string,
    sendTokenAddress: Address,
    sendQuantity: BigNumber,
    receiveTokenAddress: Address,
    minReceivedQuantity: BigNumber,
    data: string,
    callerAddress: Address
  ): Promise<BigNumber> {
    const tradeModuleInstance = this.contracts.loadTradeModuleWithoutSigner(
      this.tradeModuleAddress,
    );

    const tx = await tradeModuleInstance.populateTransaction.trade(
      setTokenAddress,
      exchangeName,
      sendTokenAddress,
      sendQuantity,
      receiveTokenAddress,
      minReceivedQuantity,
      data,
      { from: callerAddress }
    );

    return this.provider.estimateGas(tx);
  }
}
