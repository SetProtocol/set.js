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

import { Address } from 'set-protocol-v2/utils/types';
import { ContractTransaction } from 'ethers';
import { TransactionOverrides } from 'set-protocol-v2/dist/typechain';
import { BigNumber } from 'ethers/utils';
import { Provider } from 'ethers/providers';
import { generateTxOpts } from '@src/utils/transactions';

import { ContractWrapper } from './ContractWrapper';

/**
 * @title  IssuanceModuleWrapper
 * @author Set Protocol
 *
 * The IssuanceModuleWrapper forwards functionality from the IssuanceModule contract
 *
 */
export class IssuanceModuleWrapper {
  private provider: Provider;
  private contracts: ContractWrapper;

  private issuanceModuleAddress: Address;

  public constructor(provider: Provider, issuanceModuleAddress: Address) {
    this.provider = provider;
    this.contracts = new ContractWrapper(this.provider);
    this.issuanceModuleAddress = issuanceModuleAddress;
  }

  /**
   * Issue a SetToken from its underlying positions
   *
   * @param  setTokenAddress  Address of the SetToken contract
   * @param  quantity         Quantity to issue
   * @return                  Transaction hash of the issuance transaction
   */
  public async issue(
    setTokenAddress: Address,
    quantity: BigNumber,
    txOpts: TransactionOverrides = {}
  ): Promise<ContractTransaction> {
    const txOptions = await generateTxOpts(txOpts);
    const tokenInstance = await this.contracts.loadIssuanceModuleAsync(this.issuanceModuleAddress);

    return await tokenInstance.issue(setTokenAddress, quantity);
  }

  /**
   * Redeem a SetToken into its underlying positions
   *
   * @param  setTokenAddress  Address of the SetToken contract
   * @param  quantity         Quantity to issue
   * @return                  Transaction hash of the redemption transaction
   */
  public async redeem(
    setTokenAddress: Address,
    quantity: BigNumber,
    txOpts: TransactionOverrides = {}
  ): Promise<ContractTransaction> {
    const txOptions = await generateTxOpts(txOpts);
    const tokenInstance = await this.contracts.loadIssuanceModuleAsync(this.issuanceModuleAddress);

    return await tokenInstance.redeem(setTokenAddress, quantity);
  }
}
