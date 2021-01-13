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

import { Address } from '@setprotocol/set-protocol-v2/dist/utils/types';
import { ContractTransaction } from 'ethers';
import { TransactionOverrides } from '@setprotocol/set-protocol-v2/dist/typechain';
import { BigNumber } from 'ethers/lib/ethers';
import { Provider } from '@ethersproject/providers';
import { generateTxOpts } from '../../utils/transactions';

import ContractWrapper from './ContractWrapper';

/**
 * @title  BasicIssuanceModuleWrapper
 * @author Set Protocol
 *
 * The BasicIssuanceModuleWrapper forwards functionality from the IssuanceModule contract
 *
 */
export default class BasicIssuanceModuleWrapper {
  private provider: Provider;
  private contracts: ContractWrapper;

  private basicIssuanceModuleAddress: Address;

  public constructor(provider: Provider, basicIssuanceModuleAddress: Address) {
    this.provider = provider;
    this.contracts = new ContractWrapper(this.provider);
    this.basicIssuanceModuleAddress = basicIssuanceModuleAddress;
  }

  /**
   * Initializes this module to the SetToken. Only callable by the SetToken's manager.
   *
   * @param setTokenAddress             Address of the SetToken to initialize
   * @param preIssuanceHook             Address of the preIssuanceHook
   * @param callerAddress               Address of caller (optional)
   * @param txOpts                      Overrides for transaction (optional)
   */
  public async initialize(
    setTokenAddress: Address,
    preIssuanceHook: Address,
    callerAddress: Address = undefined,
    txOpts: TransactionOverrides = {}
  ): Promise<ContractTransaction> {
    const txOptions = await generateTxOpts(txOpts);
    const basicIssuanceModuleInstance = await this.contracts.loadBasicIssuanceModuleAsync(
      this.basicIssuanceModuleAddress,
      callerAddress
    );

    return await basicIssuanceModuleInstance.initialize(
      setTokenAddress,
      preIssuanceHook,
      txOptions,
    );
  }

  /**
   * Issue a SetToken from its underlying positions
   *
   * @param  setTokenAddress             Address of the SetToken contract to issue
   * @param  quantity                    Quantity to issue
   * @param  setTokenRecipientAddress    Address of the recipient of the issued SetToken
   * @param  callerAddress               Address of caller (optional)
   * @return                             Transaction hash of the issuance transaction
   */
  public async issue(
    setTokenAddress: Address,
    quantity: BigNumber,
    setTokenRecipientAddress: Address,
    callerAddress: Address = undefined,
    txOpts: TransactionOverrides = {}
  ): Promise<ContractTransaction> {
    const txOptions = await generateTxOpts(txOpts);
    const issuanceModuleInstance = await this.contracts.loadBasicIssuanceModuleAsync(
      this.basicIssuanceModuleAddress,
      callerAddress
    );

    return await issuanceModuleInstance.issue(
      setTokenAddress,
      quantity,
      setTokenRecipientAddress,
      txOptions
    );
  }

  /**
   * Redeem a SetToken into its underlying positions
   *
   * @param  setTokenAddress           Address of the SetToken contract
   * @param  quantity                  Quantity to issue
   * @param  setTokenRecipientAddress  Address of recipient of component tokens from redemption
   * @param  callerAddress             Address of caller (optional)
   * @return                           Transaction hash of the redemption transaction
   */
  public async redeem(
    setTokenAddress: Address,
    quantity: BigNumber,
    setTokenRecipientAddress: Address,
    callerAddress: Address = undefined,
    txOpts: TransactionOverrides = {}
  ): Promise<ContractTransaction> {
    const txOptions = await generateTxOpts(txOpts);
    const issuanceModuleInstance = await this.contracts.loadBasicIssuanceModuleAsync(
      this.basicIssuanceModuleAddress,
      callerAddress
    );

    return await issuanceModuleInstance.redeem(
      setTokenAddress,
      quantity,
      setTokenRecipientAddress,
      txOptions
    );
  }
}
