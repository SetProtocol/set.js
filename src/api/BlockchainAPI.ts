/*
  Copyright 2018 Set Labs Inc.

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

import * as _ from 'lodash';
import { Provider } from '@ethersproject/providers';

import { TransactionReceipt } from '../types/common';
import Assertions from '../assertions';
import { IntervalManager } from '../utils';

export const BlockchainAPIErrors = {
  AWAIT_MINE_TX_TIMED_OUT: (txHash: string) =>
    `Timeout has been exceeded in awaiting mining of transaction with hash ${txHash}.`,
};

/**
 * The following default timeout is provided to the IntervalManager when awaiting mined
 * transactions. The value is represented in milliseconds.
 *
 * @type {number}
 */
export const DEFAULT_TIMEOUT_FOR_TX_MINED = 30000;

/**
 * @title BlockchainAPI
 * @author Set Protocol
 *
 * A utility library for managing blockchain operations
 */
export default class BlockchainAPI {
  private provider: Provider;
  private assert: Assertions;
  private intervalManager: IntervalManager;

  /**
   * Instantiates a new BlockchainAPI instance that contains methods for miscellaneous blockchain functionality
   *
   * @param provider    Ethers Provider instance you would like the SetProtocol.js library to use for interacting with
   *                      the Ethereum network
   * @param assertions  An instance of the Assertion library
   */
  constructor(provider: Provider, assertions?: Assertions) {
    this.provider = provider;
    this.assert = assertions || new Assertions();

    this.intervalManager = new IntervalManager();
  }

  /**
   * Polls the Ethereum blockchain until the specified transaction has been mined or the timeout limit is reached,
   * whichever occurs first
   *
   * @param  txHash               Transaction hash to poll
   * @param  pollingIntervalMs    Interval at which the blockchain should be polled. Defaults to 1000
   * @param  timeoutMs            Number of milliseconds until this process times out. Defaults to 60000
   * @return                      Transaction receipt resulting from the mining process
   */
  public async awaitTransactionMinedAsync(
    txHash: string,
    pollingIntervalMs: number = 1000,
    timeoutMs: number = DEFAULT_TIMEOUT_FOR_TX_MINED,
  ): Promise<TransactionReceipt> {
    this.assert.schema.isValidBytes32('txHash', txHash);

    const intervalManager = this.intervalManager;
    return new Promise<TransactionReceipt>((resolve, reject) => {
      intervalManager.setInterval(
        txHash,
        async (): Promise<boolean> => {
          try {
            const receipt: any = await this.provider.getTransactionReceipt(txHash);
            if (receipt) {
              resolve(receipt);
              // Stop the interval.
              return false;
            } else {
              // Continue the interval.
              return true;
            }
          } catch (e) {
            reject(e);
          }
          return false;
        },
        async () => {
          reject(new Error(BlockchainAPIErrors.AWAIT_MINE_TX_TIMED_OUT(txHash)));
        },
        pollingIntervalMs,
        timeoutMs,
      );
    });
  }
}
