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

import ContractWrapper from './ContractWrapper';

/**
 * @title  IssuanceExtensionWrapper
 * @author Set Protocol
 *
 * The IssuanceExtensionWrapper forwards functionality from the IssuanceExtension contract.
 *
 */
export default class IssuanceExtensionWrapper {
  private provider: Provider;
  private contracts: ContractWrapper;

  private issuanceExtensionAddress: Address;

  public constructor(provider: Provider, issuanceExtensionAddress: Address) {
    this.provider = provider;
    this.contracts = new ContractWrapper(this.provider);
    this.issuanceExtensionAddress = issuanceExtensionAddress;
  }

  /**
   * Distributes issuance and redemption fees calculates fees for. Calculates fees for owner and methodologist
   * and sends to owner fee recipient and methodologist respectively. (Anyone can call this method.)
   *
   * @param setTokenAddress      Instance of deployed SetToken to distribute issuance fees for
   *
   * @return                     Initialization bytecode
   */
  public async distributeFees(
    setTokenAddress: Address,
    callerAddress: Address = undefined,
    txOpts: TransactionOverrides = {}
  ): Promise<ContractTransaction> {
    const txOptions = await generateTxOpts(txOpts);
    const issuanceExtensionInstance = await this.contracts.loadIssuanceExtensionAsync(
      this.issuanceExtensionAddress,
      callerAddress
    );

    return await issuanceExtensionInstance.distributeFees(setTokenAddress, txOptions);
  }
}