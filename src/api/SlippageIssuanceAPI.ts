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

import { ContractTransaction } from 'ethers';
import { Provider } from '@ethersproject/providers';
import { Address } from '@setprotocol/set-protocol-v2/utils/types';
import { ADDRESS_ZERO } from '@setprotocol/set-protocol-v2/dist/utils/constants';
import { TransactionOverrides } from '@setprotocol/set-protocol-v2/dist/typechain';
import { BigNumber } from 'ethers/lib/ethers';

import SlippageIssuanceModuleWrapper from '../wrappers/set-protocol-v2/SlippageIssuanceModuleWrapper';
import Assertions from '../assertions';

/**
 * @title  SlippageIssuanceAPI
 * @author Set Protocol
 *
 * The SlippageIssuanceModuleAPI exposes issue and redeem functionality for Sets that contain poitions that accrue
 * interest per block. The getter function syncs the position balance to the current block, so subsequent blocks
 * will cause the position value to be slightly out of sync (a buffer is needed). This API is primarily used for Sets
 * that rely on the ALM contracts to manage debt. The manager can define arbitrary issuance logic
 * in the manager hook, as well as specify issue and redeem fees.
 *
 */
export default class SlippageIssuanceAPI {
  private slippageIssuanceModuleWrapper: SlippageIssuanceModuleWrapper;
  private assert: Assertions;

  public constructor(provider: Provider, slippageIssuanceModuleAddress: Address, assertions?: Assertions) {
    this.slippageIssuanceModuleWrapper = new SlippageIssuanceModuleWrapper(provider, slippageIssuanceModuleAddress);
    this.assert = assertions || new Assertions();
  }

  /**
   * Initializes the SlippageIssuanceModule to the SetToken. Only callable by the SetToken's manager.
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
    this.assert.schema.isValidAddress('managerIssuanceHook', managerIssuanceHook);

    return await this.slippageIssuanceModuleWrapper.initialize(
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
   * @param  checkedComponents           Array of components to be checked to verify required collateral doesn't
   *                                       exceed defined max. Each entry must be unique.
   * @param  maxTokenAmountsIn           Max amount of component willing to transfer in to collateralize quantity
   *                                       amount of setToken.
   * @param  setTokenRecipientAddress    Address of the recipient of the issued SetToken
   * @param  callerAddress               Address of caller (optional)
   * @return                             Transaction hash of the issuance transaction
   */
  public async issueWithSlippageAsync(
    setTokenAddress: Address,
    quantity: BigNumber,
    checkedComponents: Address[],
    maxTokenAmountsIn: BigNumber[],
    setTokenRecipientAddress: Address,
    callerAddress: Address = undefined,
    txOpts: TransactionOverrides = {}
  ): Promise<ContractTransaction> {
    this.assert.schema.isValidAddress('setAddress', setTokenAddress);
    this.assert.schema.isValidAddress('setTokenRecipientAddress', setTokenRecipientAddress);
    this.assert.common.isUniqueList(checkedComponents, 'checkedComponents List needs to be unique');
    this.assert.common.isEqualLength(checkedComponents, maxTokenAmountsIn,
      'checkedComponents and maxTokenAmountsIn need to be equal length');

    return await this.slippageIssuanceModuleWrapper.issueWithSlippage(
      setTokenAddress,
      quantity,
      checkedComponents,
      maxTokenAmountsIn,
      setTokenRecipientAddress,
      callerAddress,
      txOpts
    );
  }

  /**
   * Redeem a SetToken into its underlying positions
   *
   * @param  setTokenAddress           Address of the SetToken contract
   * @param  quantity                  Quantity to redeem
   * @param  checkedComponents         Array of components to be checked to verify required collateral doesn't
   *                                     exceed defined max. Each entry must be unique.
   * @param  minTokenAmountsOut        Min amount of component willing to receive to redeem quantity
   *                                     amount of setToken.
   * @param  setTokenRecipientAddress  Address of recipient of component tokens from redemption
   * @param  callerAddress             Address of caller (optional)
   * @return                           Transaction hash of the redemption transaction
   */
  public async redeemWithSlippageAsync(
    setTokenAddress: Address,
    quantity: BigNumber,
    checkedComponents: Address[],
    minTokenAmountsOut: BigNumber[],
    setTokenRecipientAddress: Address,
    callerAddress: Address = undefined,
    txOpts: TransactionOverrides = {}
  ): Promise<ContractTransaction> {
    this.assert.schema.isValidAddress('setAddress', setTokenAddress);
    this.assert.schema.isValidAddress('setTokenRecipientAddress', setTokenRecipientAddress);
    this.assert.common.isUniqueList(checkedComponents, 'checkedComponents List needs to be unique');
    this.assert.common.isEqualLength(checkedComponents, minTokenAmountsOut,
      'checkedComponents and minTokenAmountsOut need to be equal length');

    return await this.slippageIssuanceModuleWrapper.redeemWithSlippage(
      setTokenAddress,
      quantity,
      checkedComponents,
      minTokenAmountsOut,
      setTokenRecipientAddress,
      callerAddress,
      txOpts
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
  ): Promise<(Address|BigNumber)[][]> {
    this.assert.schema.isValidAddress('setAddress', setTokenAddress);

    return await this.slippageIssuanceModuleWrapper.getRequiredComponentIssuanceUnits(
      setTokenAddress,
      quantity,
      callerAddress,
    );
  }

  /**
   * Calculates the amount of each component will be returned on redemption net of fees as well as how much debt needs
   * to be paid down to redeem. Values DO NOT take into account any updates from pre action manager or module hooks.
   *
   * @param  setTokenAddress           Address of the SetToken contract
   * @param  quantity                  Quantity to redeem
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
  ): Promise<(Address|BigNumber)[][]> {
    this.assert.schema.isValidAddress('setAddress', setTokenAddress);

    return await this.slippageIssuanceModuleWrapper.getRequiredComponentRedemptionUnits(
      setTokenAddress,
      quantity,
      callerAddress,
    );
  }

  /**
   * Calculates the manager fee, protocol fee and resulting totalQuantity to use when calculating unit amounts. If fees
   * are charged they are added to the total issue quantity, for example 1% fee on 100 Sets means 101 Sets are minted
   * by caller, the _to address receives 100 and the feeRecipient receives 1. Conversely, on redemption the redeemer
   * will only receive the collateral that collateralizes 99 Sets, while the additional Set is given to the
   * feeRecipient.
   *
   * @param setTokenAddress  Instance of the SetToken to issue
   * @param quantity         Amount of SetToken issuer wants to receive/redeem
   * @param isIssue          If issuing or redeeming
   *
   * @return BigNumber       Total amount of Sets to be issued/redeemed with fee adjustment
   * @return BigNumber       Sets minted to the manager
   * @return BigNumber       Sets minted to the protocol
   */
  public async calculateTotalFeesAsync(
    setTokenAddress: Address,
    quantity: BigNumber,
    isIssue: boolean,
    callerAddress: Address = undefined,
  ): Promise<
      [BigNumber, BigNumber, BigNumber] & {
        totalQuantity: BigNumber;
        managerFee: BigNumber;
        protocolFee: BigNumber;
      }
    > {
    this.assert.schema.isValidAddress('setAddress', setTokenAddress);
    this.assert.common.isNotUndefined(isIssue, 'isIssue arg must be a boolean.');

    return await this.slippageIssuanceModuleWrapper.calculateTotalFees(
      setTokenAddress,
      quantity,
      isIssue,
      callerAddress,
    );
  }
}
