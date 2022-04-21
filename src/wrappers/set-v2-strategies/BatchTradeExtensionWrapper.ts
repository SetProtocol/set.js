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
import { ContractTransaction, constants, BigNumber } from 'ethers';
import { TransactionOverrides } from '@setprotocol/set-protocol-v2/dist/typechain';
import { Provider } from '@ethersproject/providers';
import { generateTxOpts } from '../../utils/transactions';
import { TradeInfo, BatchTradeResult } from '../../types';
import { RevertError } from '@0x/utils';

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

  /**
   * Estimate gas cost for executing a batch trade on a supported DEX
   *
   * @param setTokenAddress      Address of the deployed SetToken to trade on behalf of
   * @param trades               Array of TradeInfo objects to execute as a batch of trades
   * @param callerAddress        Address of caller
   */
  public async estimateGasForBatchTradeWithOperator(
    setTokenAddress: Address,
    trades: TradeInfo[],
    callerAddress: Address
  ): Promise<BigNumber> {
    const batchTradeExtensionInstance = await this.contracts.loadBatchTradeExtensionWithoutSigner(
      this.batchTradeExtensionAddress
    );

    const tx = await batchTradeExtensionInstance.populateTransaction.batchTrade(
      setTokenAddress,
      trades,
      {from: callerAddress }
    );

    return this.provider.estimateGas(tx);
  }

  /**
   * Given the transaction hash of `batchTradeWithOperator` tx, fetches success statuses of all trades
   * executed including the revert reason if a trade failed. If a revert reason is formatted as a
   * custom error, invokes customErrorParser to transform it into a human readable string.
   * (Uses a ZeroEx custom error parser by default)
   *
   *
   * @param  transactionHash         Transaction hash of a batchTradeWithOperator tx
   * @param  trades                  Array of trades executed by batchTrade
   */
  public async getBatchTradeResults(
    transactionHash: string,
    trades: TradeInfo[],
    customErrorParser: (hexEncodedErr: string) => string = this.decodeZeroExCustomError
  ): Promise<BatchTradeResult[]> {
    const batchTradeExtensionInstance = await this.contracts.loadBatchTradeExtensionAsync(
      this.batchTradeExtensionAddress,
      constants.AddressZero
    );

    const receipt = await this.provider.getTransactionReceipt(transactionHash);
    const results: BatchTradeResult[] = [];

    for (const trade of trades) {
      results.push({
        success: true,
        tradeInfo: trade,
      });
    }

    for (const log of receipt.logs) {
      try {
        const decodedLog = batchTradeExtensionInstance.interface.parseLog({
          data: log.data,
          topics: log.topics,
        });

        if (decodedLog.name === 'StringTradeFailed') {
          const tradeIndex = (decodedLog.args as any)._index.toNumber();
          results[tradeIndex].success = false;
          results[tradeIndex].revertReason = (decodedLog.args as any)._reason;
        }

        if (decodedLog.name === 'BytesTradeFailed') {
          const tradeIndex = (decodedLog.args as any)._index.toNumber();
          results[tradeIndex].success = false;
          results[tradeIndex].revertReason = customErrorParser((decodedLog.args as any)._reason);
        }
      } catch (e) {
        // ignore all non-batch trade events
      }
    }

    return results;
  }

  private decodeZeroExCustomError(hexEncodedErr: string): string {
    return RevertError.decode(hexEncodedErr).message;
  }
}
