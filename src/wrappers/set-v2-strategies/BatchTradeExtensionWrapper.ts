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
import { ContractTransaction } from 'ethers';
import { TransactionOverrides } from '@setprotocol/set-protocol-v2/dist/typechain';
import { Provider } from '@ethersproject/providers';
import { generateTxOpts } from '../../utils/transactions';
import { TradeInfo } from '../../types';

import ContractWrapper from './ContractWrapper';

/**
 * @title  BatchTradeExtensionWrapper
 * @author Set Protocol
 *
 * The BatchTradeExtensionWrapper forwards functionality from the BatchTradeExtension contract.
 *
 */
export default class BatchTradeExtensionWrapper {
  private provider: Provider;
  private contracts: ContractWrapper;

  private batchTradeExtensionAddress: Address;

  public constructor(provider: Provider, batchTradeExtensionAddress: Address) {
    this.provider = provider;
    this.contracts = new ContractWrapper(this.provider);
    this.batchTradeExtensionAddress = batchTradeExtensionAddress;
  }

  /**
   * Executes a batch of trades on a supported DEX. Must be called an address authorized for the `operator` role
   * on the BatchTradeExtension
   *
   * NOTE: Although SetToken units are passed in for each TradeInfo entry's send and receive quantities, the
   * total quantity sent and received is the quantity of SetToken units multiplied by the SetToken totalSupply.
   *
   * @param setTokenAddress      Address of the deployed SetToken to trade on behalf of
   * @param trades               Array of TradeInfo objects to execute as a batch of trades
   * @param callerAddress        Address of caller (optional)
   * @param txOptions            Overrides for transaction (optional)
   */
  public async batchTradeWithOperatorAsync(
    setTokenAddress: Address,
    trades: TradeInfo[],
    callerAddress: Address = undefined,
    txOpts: TransactionOverrides = {}
  ): Promise<ContractTransaction> {
    const txOptions = await generateTxOpts(txOpts);
    const batchTradeExtensionInstance = await this.contracts.loadBatchTradeExtensionAsync(
      this.batchTradeExtensionAddress,
      callerAddress
    );

    return await batchTradeExtensionInstance.batchTrade(
      setTokenAddress,
      trades,
      txOptions
    );
  }
}
