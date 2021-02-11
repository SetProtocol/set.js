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
import { ADDRESS_ZERO } from '@setprotocol/set-protocol-v2/dist/utils/constants';
import { TransactionOverrides } from '@setprotocol/set-protocol-v2/dist/typechain';
import { BigNumber } from 'ethers/lib/ethers';

import DebtIssuanceModuleWrapper from '../wrappers/set-protocol-v2/DebtIssuanceModuleWrapper';
import Assertions from '../assertions';

/**
 * @title  DebtIssuanceAPI
 * @author Set Protocol
 *
 * The DebtIssuanceAPI exposes simple issuance and redemption functions of the DebtIssuanceModule
 * to allow minting and burning of SetTokens from the Positions of the Set
 *
 */
export default class DebtIssuanceAPI {
  private debtIssuanceModuleWrapper: DebtIssuanceModuleWrapper;
  private assert: Assertions;

  public constructor(provider: Provider, debtIssuanceModuleAddress: Address, assertions?: Assertions) {
    this.debtIssuanceModuleWrapper = new DebtIssuanceModuleWrapper(provider, debtIssuanceModuleAddress);
    this.assert = assertions || new Assertions();
  }

  /**
   * Initializes the DebtIssuanceModule to the SetToken. Only callable by the SetToken's manager.
   *
   * @param setTokenAddress             Address of the SetToken to initialize
   * @param maxManagerFee               Maximum fee that can be charged on issue and redeem
   * @param managerIssueFee             Fee to charge on issuance
   * @param managerRedeemFee            Fee to charge on redemption
   * @param feeRecipient                Address to send fees to
   * @param managerIssuanceHook         Instance of the Manager Contract with the Pre-Issuance Hook function
   * @param txOpts                      Overrides for transaction (optional)
   *
   * @return                            Transaction hash of the initialize transaction
   */
  public async initializeAsync(
    setTokenAddress: Address,
    maxManagerFee: BigNumber,
    managerIssueFee: BigNumber,
    managerRedeemFee: BigNumber,
    feeRecipient: Address,
    managerIssuanceHook: Address = ADDRESS_ZERO,
    callerAddress: Address = undefined,
    txOpts: TransactionOverrides = {}
  ): Promise<ContractTransaction> {
    this.assert.schema.isValidAddress('setTokenAddress', setTokenAddress);
    this.assert.schema.isValidAddress('feeRecipient', feeRecipient);

    return await this.debtIssuanceModuleWrapper.initialize(
      setTokenAddress,
      maxManagerFee,
      managerIssueFee,
      managerRedeemFee,
      feeRecipient,
      managerIssuanceHook,
      callerAddress,
      txOpts,
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
  public async issueAsync(
    setTokenAddress: Address,
    quantity: BigNumber,
    setTokenRecipientAddress: Address,
    callerAddress: Address = undefined,
    txOpts: TransactionOverrides = {}
  ): Promise<ContractTransaction> {
    this.assert.schema.isValidAddress('setAddress', setTokenAddress);
    this.assert.schema.isValidAddress('setTokenRecipientAddress', setTokenRecipientAddress);

    return await this.debtIssuanceModuleWrapper.issue(
      setTokenAddress,
      quantity,
      setTokenRecipientAddress,
      callerAddress,
      txOpts
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
  public async redeemAsync(
    setTokenAddress: Address,
    quantity: BigNumber,
    setTokenRecipientAddress: Address,
    callerAddress: Address = undefined,
    txOpts: TransactionOverrides = {}
  ): Promise<ContractTransaction> {
    this.assert.schema.isValidAddress('setAddress', setTokenAddress);

    return await this.debtIssuanceModuleWrapper.redeem(
      setTokenAddress,
      quantity,
      setTokenRecipientAddress,
      callerAddress,
      txOpts
    );
  }
}
