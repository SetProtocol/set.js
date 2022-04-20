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

import { Address } from '@setprotocol/set-protocol-v2/dist/utils/types';
import { ContractTransaction } from 'ethers';
import { TransactionOverrides } from '@setprotocol/set-protocol-v2/dist/typechain';
import { ADDRESS_ZERO } from '@setprotocol/set-protocol-v2/dist/utils/constants';
import { BigNumber } from 'ethers/lib/ethers';
import { Provider } from '@ethersproject/providers';
import { generateTxOpts } from '../../utils/transactions';

import ContractWrapper from './ContractWrapper';

/**
 * @title  SlippageIssuanceModuleWrapper
 * @author Set Protocol
 *
 * The SlippageIssuanceModuleWrapper forwards functionality from the SlippageIssuanceModule contract
 *
 */
export default class SlippageIssuanceModuleWrapper {
  private provider: Provider;
  private contracts: ContractWrapper;

  private slippageIssuanceModuleAddress: Address;

  public constructor(provider: Provider, slippageIssuanceModuleAddress: Address) {
    this.provider = provider;
    this.contracts = new ContractWrapper(this.provider);
    this.slippageIssuanceModuleAddress = slippageIssuanceModuleAddress;
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
    const slippageIssuanceModuleInstance = await this.contracts.loadSlippageIssuanceModuleAsync(
      this.slippageIssuanceModuleAddress,
      callerAddress
    );

    return await slippageIssuanceModuleInstance.initialize(
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
   * Deposits components to the SetToken, replicates any external module component positions and mints
   * the SetToken. If the token has a debt position all collateral will be transferred in first then debt
   * will be returned to the minting address. If specified, a fee will be charged on issuance. Issuer can
   * also pass in a max amount of tokens they are willing to pay for each component. They are NOT required
   * to pass in a limit for every component, and may in fact only want to pass in limits for components which
   * incur slippage to replicate (i.e. perpetuals). Passing in empty arrays for _checkComponents and
   * _maxTokenAmountsIn is equivalent to calling issue. NOTE: not passing in limits for positions that require
   * a trade for replication leaves the issuer open to sandwich attacks!
   *
   * @param setTokenAddress             Instance of the SetToken to issue
   * @param quantity                    Quantity of SetToken to issue
   * @param checkedComponents           Array of components to be checked to verify required collateral doesn't exceed
   *                                      defined max. Each entry must be unique.
   * @param maxTokenAmountsIn           Maps to same index in _checkedComponents. Max amount of component willing to
   *                                      transfer in to collateralize _setQuantity amount of _setToken.
   * @param setTokenRecipientAddress    Address to mint SetToken to
   */
  public async issueWithSlippage(
    setTokenAddress: Address,
    quantity: BigNumber,
    checkedComponents: Address[],
    maxTokenAmountsIn: BigNumber[],
    setTokenRecipientAddress: Address,
    callerAddress: Address = undefined,
    txOpts: TransactionOverrides = {}
  ): Promise<ContractTransaction> {
    const txOptions = await generateTxOpts(txOpts);
    const slippageIssuanceModuleInstance = await this.contracts.loadSlippageIssuanceModuleAsync(
      this.slippageIssuanceModuleAddress,
      callerAddress
    );

    return await slippageIssuanceModuleInstance.issueWithSlippage(
      setTokenAddress,
      quantity,
      checkedComponents,
      maxTokenAmountsIn,
      setTokenRecipientAddress,
      txOptions
    );
  }

  /**
   * Returns components from the SetToken, unwinds any external module component positions and burns the SetToken.
   * If the token has debt positions, the module transfers in the required debt amounts from the caller and uses
   * those funds to repay the debts on behalf of the SetToken. All debt will be paid down first then equity positions
   * will be returned to the minting address. If specified, a fee will be charged on redeem. Redeemer can
   * also pass in a min amount of tokens they want to receive for each component. They are NOT required
   * to pass in a limit for every component, and may in fact only want to pass in limits for components which
   * incur slippage to replicate (i.e. perpetuals). Passing in empty arrays for _checkComponents and
   * _minTokenAmountsOut is equivalent to calling redeem. NOTE: not passing in limits for positions that require
   * a trade for replication leaves the redeemer open to sandwich attacks!
   *
   * @param setTokenAddress             Instance of the SetToken to redeem
   * @param quantity                    Quantity of SetToken to redeem
   * @param checkedComponents           Array of components to be checked to verify received collateral isn't less
   *                                      than defined min. Each entry must be unique.
   * @param minTokenAmountsOut          Maps to same index in _checkedComponents. Min amount of component willing to
   *                                      receive to redeem _setQuantity amount of _setToken.
   * @param setTokenRecipientAddress    Address to send collateral to
   */
  public async redeemWithSlippage(
    setTokenAddress: Address,
    quantity: BigNumber,
    checkedComponents: Address[],
    minTokenAmountsOut: BigNumber[],
    setTokenRecipientAddress: Address,
    callerAddress: Address = undefined,
    txOpts: TransactionOverrides = {}
  ): Promise<ContractTransaction> {
    const txOptions = await generateTxOpts(txOpts);
    const slippageIssuanceModuleInstance = await this.contracts.loadSlippageIssuanceModuleAsync(
      this.slippageIssuanceModuleAddress,
      callerAddress
    );

    return await slippageIssuanceModuleInstance.redeemWithSlippage(
      setTokenAddress,
      quantity,
      checkedComponents,
      minTokenAmountsOut,
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
  ): Promise<(Address|BigNumber)[][]> {
    const slippageIssuanceModuleInstance = await this.contracts.loadSlippageIssuanceModuleAsync(
      this.slippageIssuanceModuleAddress,
      callerAddress
    );

    return await slippageIssuanceModuleInstance.callStatic.getRequiredComponentIssuanceUnitsOffChain(
      setTokenAddress,
      quantity,
      {
        gasLimit: BigNumber.from(7000000),
      },
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
    const slippageIssuanceModuleInstance = await this.contracts.loadSlippageIssuanceModuleAsync(
      this.slippageIssuanceModuleAddress,
      callerAddress
    );

    return await slippageIssuanceModuleInstance.callStatic.getRequiredComponentRedemptionUnitsOffChain(
      setTokenAddress,
      quantity,
      {
        gasLimit: BigNumber.from(7000000),
      },
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
   * @param callerAddress    Address of caller (optional)
   *
   * @return BigNumber       Total amount of Sets to be issued/redeemed with fee adjustment
   * @return BigNumber       Sets minted to the manager
   * @return BigNumber       Sets minted to the protocol
   */
  public async calculateTotalFees(
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
    const slippageIssuanceModuleInstance = await this.contracts.loadSlippageIssuanceModuleAsync(
      this.slippageIssuanceModuleAddress,
      callerAddress
    );

    return await slippageIssuanceModuleInstance.calculateTotalFees(
      setTokenAddress,
      quantity,
      isIssue,
    );
  }
}
