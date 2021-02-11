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
import { ADDRESS_ZERO } from '@setprotocol/set-protocol-v2/dist/utils/constants';
import { BigNumber } from 'ethers/lib/ethers';
import { Provider } from '@ethersproject/providers';
import { generateTxOpts } from '../../utils/transactions';

import ContractWrapper from './ContractWrapper';

/**
 * @title  DebtIssuanceModuleWrapper
 * @author Set Protocol
 *
 * The DebtIssuanceModuleWrapper forwards functionality from the DebtIssuanceModule contract
 *
 */
export default class DebtIssuanceModuleWrapper {
  private provider: Provider;
  private contracts: ContractWrapper;

  private debtIssuanceModuleAddress: Address;

  public constructor(provider: Provider, debtIssuanceModuleAddress: Address) {
    this.provider = provider;
    this.contracts = new ContractWrapper(this.provider);
    this.debtIssuanceModuleAddress = debtIssuanceModuleAddress;
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
   */
  public async initialize(
    setTokenAddress: Address,
    maxManagerFee: BigNumber,
    managerIssueFee: BigNumber,
    managerRedeemFee: BigNumber,
    feeRecipient: Address,
    managerIssuanceHook: Address = ADDRESS_ZERO,
    callerAddress: Address = undefined,
    txOpts: TransactionOverrides = {}
  ): Promise<ContractTransaction> {
    const txOptions = await generateTxOpts(txOpts);
    const debtIssuanceModuleInstance = await this.contracts.loadDebtIssuanceModuleAsync(
      this.debtIssuanceModuleAddress,
      callerAddress
    );

    return await debtIssuanceModuleInstance.initialize(
      setTokenAddress,
      maxManagerFee,
      managerIssueFee,
      managerRedeemFee,
      feeRecipient,
      managerIssuanceHook,
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
    const debtIssuanceModuleInstance = await this.contracts.loadDebtIssuanceModuleAsync(
      this.debtIssuanceModuleAddress,
      callerAddress
    );

    return await debtIssuanceModuleInstance.issue(
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
    const debtIssuanceModuleInstance = await this.contracts.loadDebtIssuanceModuleAsync(
      this.debtIssuanceModuleAddress,
      callerAddress
    );

    return await debtIssuanceModuleInstance.redeem(
      setTokenAddress,
      quantity,
      setTokenRecipientAddress,
      txOptions
    );
  }

  /**
   * Calculates the amount of each component needed to collateralize passed issue quantity plus fees of Sets as well
   * as amount of debt that will be returned to caller. Values DO NOT take into account any updates from pre action
   * manager or module hooks.
   *
   * @param  setTokenAddress           Address of the SetToken contract
   * @param  quantity                  Quantity to issue
   * @param  callerAddress             Address of caller (optional)
   *
   * @return address[]                 Array of component addresses making up the Set
   * @return BigNumber[]               Array of equity notional amounts of each component, respectively, represented
   *                                   as a BigNumber
   * @return BigNumber[]               Array of debt notional amounts of each component, respectively, represented
   *                                   as a BigNumber
   */
  public async getRequiredComponentIssuanceUnits(
    setTokenAddress: Address,
    quantity: BigNumber,
    callerAddress: Address = undefined,
  ): Promise<ContractTransaction> {
    const debtIssuanceModuleInstance = await this.contracts.loadDebtIssuanceModuleAsync(
      this.debtIssuanceModuleAddress,
      callerAddress
    );

    return await debtIssuanceModuleInstance.getRequiredComponentIssuanceUnits(
      setTokenAddress,
      quantity,
    );
  }

  /**
   * Calculates the amount of each component will be returned on redemption net of fees as well as how much debt needs
   * to be paid down to redeem. Values DO NOT take into account any updates from pre action manager or module hooks.
   *
   * @param  setTokenAddress           Address of the SetToken contract
   * @param  quantity                  Quantity to issue
   * @param  callerAddress             Address of caller (optional)
   *
   * @return address[]                 Array of component addresses making up the Set
   * @return BigNumber[]               Array of equity notional amounts of each component, respectively, represented as
   *                                   a BigNumber
   * @return BigNumber[]               Array of debt notional amounts of each component, respectively, represented as
   *                                   a BigNumber
   */
  public async getRequiredComponentRedemptionUnits(
    setTokenAddress: Address,
    quantity: BigNumber,
    callerAddress: Address = undefined,
  ): Promise<ContractTransaction> {
    const debtIssuanceModuleInstance = await this.contracts.loadDebtIssuanceModuleAsync(
      this.debtIssuanceModuleAddress,
      callerAddress
    );

    return await debtIssuanceModuleInstance.getRequiredComponentRedemptionUnits(
      setTokenAddress,
      quantity,
    );
  }
}
