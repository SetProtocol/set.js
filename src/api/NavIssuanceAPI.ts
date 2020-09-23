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
import { Provider } from 'ethers/providers';
import { Address } from 'set-protocol-v2/utils/types';
import { TransactionOverrides } from 'set-protocol-v2/dist/typechain';
import { BigNumber } from 'ethers/utils';

import NavIssuanceModuleWrapper from '../wrappers/set-protocol-v2/NavIssuanceModuleWrapper';
import Assertions from '../assertions';

/**
 * @title  NavIssuanceAPI
 * @author Set Protocol
 *
 * The NavIssuanceAPI exposes issuance and redemption functions of the NavIssuanceModule
 * to allow minting and redeeming of SetTokens based on the Net Asset Value.
 *
 */
export default class NavIssuanceAPI {
  private navIssuanceModuleWrapper: NavIssuanceModuleWrapper;
  private assert: Assertions;

  public constructor(provider: Provider, navIssuanceModuleAddress: Address, assertions?: Assertions) {
    this.navIssuanceModuleWrapper = new NavIssuanceModuleWrapper(provider, navIssuanceModuleAddress);
    this.assert = assertions || new Assertions();
  }

  /**
   * Deposits the allowed reserve asset into the SetToken and mints the appropriate % of Net Asset Value of the SetToken
   * to the specified to address.
   *
   * @param setTokenAddress              Address of the SetToken contract
   * @param reserveAsset                 Address of the reserve asset to issue with
   * @param reserveAssetQuantity         Quantity of the reserve asset to issue with
   * @param minSetTokenReceiveQuantity   Min quantity of SetToken to receive after issuance
   * @param to                           Address to mint SetToken to
   * @param callerAddress                Address of caller (optional)
   * @param txOpts                       Overrides for transaction (optional)
   *
   * @return                             Transaction hash of the trade transaction
   */
  public async issueAsync(
    setTokenAddress: Address,
    reserveAsset: Address,
    reserveAssetQuantity: BigNumber,
    minSetTokenReceiveQuantity: BigNumber,
    to: Address,
    callerAddress: Address = undefined,
    txOpts: TransactionOverrides = {}
  ): Promise<ContractTransaction> {
    this.assert.schema.isValidAddress('setAddress', setTokenAddress);
    this.assert.schema.isValidAddress('reserveAsset', reserveAsset);
    this.assert.schema.isValidAddress('to', to);
    this.assert.common.greaterThanZero(reserveAssetQuantity, 'reserveAssetQuantity needs to be greater than zero');

    return await this.navIssuanceModuleWrapper.issue(
      setTokenAddress,
      reserveAsset,
      reserveAssetQuantity,
      minSetTokenReceiveQuantity,
      to,
      callerAddress,
      txOpts
    );
  }

  /**
   * Wraps ETH and deposits WETH if allowed into the SetToken and mints the appropriate % of
   * Net Asset Value of the SetToken to the specified to address.
   *
   * @param setTokenAddress              Address of the SetToken contract
   * @param minSetTokenReceiveQuantity   Min quantity of SetToken to receive after issuance
   * @param to                           Address to mint SetToken to
   * @param callerAddress                Address of caller (optional)
   * @param txOpts                       Overrides for transaction (optional)
   *
   * @return                             Transaction hash of the trade transaction
   */
  public async issueWithEtherAsync(
    setTokenAddress: Address,
    quantity: BigNumber,
    setTokenRecipientAddress: Address,
    callerAddress: Address = undefined,
    txOpts: TransactionOverrides = {}
  ): Promise<ContractTransaction> {
    this.assert.schema.isValidAddress('setAddress', setTokenAddress);
    this.assert.schema.isValidAddress('setTokenRecipientAddress', setTokenRecipientAddress);
    this.assert.common.greaterThanZero(quantity, 'quantity needs to be greater than zero');


    return await this.navIssuanceModuleWrapper.issueWithEther(
      setTokenAddress,
      quantity,
      setTokenRecipientAddress,
      callerAddress,
      txOpts
    );
  }

  /**
   * Redeems a SetToken into a valid reserve asset representing the appropriate % of Net Asset Value of the SetToken
   * to the specified to address. Only valid if there are available reserve units on the SetToken.
   *
   * @param setTokenAddress              Address of the SetToken contract
   * @param reserveAsset                 Address of the reserve asset to redeem with
   * @param setTokenQuantity             Quantity of SetTokens to redeem
   * @param minReserveReceiveQuantity    Min quantity of reserve asset to receive
   * @param to                           Address to redeem reserve asset to
   * @param callerAddress                Address of caller (optional)
   * @param txOpts                       Overrides for transaction (optional)
   *
   * @return                             Transaction hash of the trade transaction
   */
  public async redeemAsync(
    setTokenAddress: Address,
    reserveAsset: Address,
    setTokenQuantity: BigNumber,
    minReserveReceiveQuantity: BigNumber,
    to: Address,
    callerAddress: Address = undefined,
    txOpts: TransactionOverrides = {}
  ): Promise<ContractTransaction> {
    this.assert.schema.isValidAddress('setAddress', setTokenAddress);
    this.assert.schema.isValidAddress('reserveAsset', reserveAsset);
    this.assert.schema.isValidAddress('to', to);
    this.assert.common.greaterThanZero(setTokenQuantity, 'setTokenQuantity needs to be greater than zero');

    return await this.navIssuanceModuleWrapper.redeem(
      setTokenAddress,
      reserveAsset,
      setTokenQuantity,
      minReserveReceiveQuantity,
      to,
      callerAddress,
      txOpts
    );
  }

  /**
   * Redeems a SetToken into Ether (if WETH is valid) representing the appropriate % of Net Asset Value of the SetToken
   * to the specified to address. Only valid if there are available WETH units on the SetToken.
   *
   * @param setTokenAddress              Address of the SetToken contract
   * @param setTokenQuantity             Quantity of SetTokens to redeem
   * @param minReserveReceiveQuantity    Min quantity of reserve asset to receive
   * @param to                           Address to redeem reserve asset to
   * @param callerAddress                Address of caller (optional)
   * @param txOpts                       Overrides for transaction (optional)
   *
   * @return                             Transaction hash of the trade transaction
   */
  public async redeemIntoEtherAsync(
    setTokenAddress: Address,
    setTokenQuantity: BigNumber,
    minReserveReceiveQuantity: BigNumber,
    to: Address,
    callerAddress: Address = undefined,
    txOpts: TransactionOverrides = {}
  ): Promise<ContractTransaction> {
    this.assert.schema.isValidAddress('setAddress', setTokenAddress);
    this.assert.schema.isValidAddress('to', to);
    this.assert.common.greaterThanZero(setTokenQuantity, 'setTokenQuantity needs to be greater than zero');

    return await this.navIssuanceModuleWrapper.redeemIntoEther(
      setTokenAddress,
      setTokenQuantity,
      minReserveReceiveQuantity,
      to,
      callerAddress,
      txOpts
    );
  }

  /**
   * Get reserve asset addresses for token
   *
   * @param setTokenAddress              Address of the SetToken contract
   *
   * @return                             Returns the reserve asset addresses for token
   */
  public async getReserveAssetsAsync(
    setTokenAddress: Address,
  ): Promise<Address[]> {
    this.assert.schema.isValidAddress('setAddress', setTokenAddress);

    return this.navIssuanceModuleWrapper.getReserveAssets(setTokenAddress);
  }

  /**
   * Get boolean to see if reserve asset is valid
   *
   * @param setTokenAddress              Address of the SetToken contract
   * @param reserveAsset                 Address of reserve asset token
   *
   * @return                             Returns true if reserve asset is valid
   */
  public async isValidReserveAssetAsync(
    setTokenAddress: Address,
    reserveAsset: Address
  ): Promise<boolean> {
    this.assert.schema.isValidAddress('setAddress', setTokenAddress);
    this.assert.schema.isValidAddress('reserveAsset', reserveAsset);

    return this.navIssuanceModuleWrapper.isValidReserveAsset(setTokenAddress, reserveAsset);
  }

  /**
   * Get the issue premium of the set
   *
   * @param setTokenAddress              Address of the SetToken contract
   * @param reserveAsset                 Address of reserve asset token
   * @param reserveAssetQuantity         Quantity being used for reserve asset
   *
   * @return                             Returns the issue premium amount
   */
  public async getIssuePremiumAsync(
    setTokenAddress: Address,
    reserveAsset: Address,
    reserveAssetQuantity: BigNumber
  ): Promise<BigNumber> {
    this.assert.schema.isValidAddress('setAddress', setTokenAddress);
    this.assert.schema.isValidAddress('reserveAsset', reserveAsset);
    this.assert.common.greaterThanZero(reserveAssetQuantity, 'reserveAssetQuantity needs to be greater than zero');

    return this.navIssuanceModuleWrapper.getIssuePremium(
      setTokenAddress,
      reserveAsset,
      reserveAssetQuantity
    );
  }

  /**
   * Get the redeem premium of the set
   *
   * @param setTokenAddress              Address of the SetToken contract
   * @param reserveAsset                 Address of reserve asset token
   * @param setTokenQuantity             Quantity being redeemed
   *
   * @return                             Returns the redeem premium amount
   */
  public async getRedeemPremiumAsync(
    setTokenAddress: Address,
    reserveAsset: Address,
    setTokenQuantity: BigNumber
  ): Promise<BigNumber> {
    this.assert.schema.isValidAddress('setAddress', setTokenAddress);
    this.assert.schema.isValidAddress('reserveAsset', reserveAsset);
    this.assert.common.greaterThanZero(setTokenQuantity, 'setTokenQuantity needs to be greater than zero');

    return this.navIssuanceModuleWrapper.getRedeemPremium(
      setTokenAddress,
      reserveAsset,
      setTokenQuantity
    );
  }

  /**
   * Get the manager fee of the set
   *
   * @param setTokenAddress              Address of the SetToken contract
   * @param managerFeeIndex              Index of manager fee to check
   *
   * @return                             The manager fee
   */
  public async getManagerFeeAsync(
    setTokenAddress: Address,
    managerFeeIndex: BigNumber
  ): Promise<BigNumber> {
    this.assert.schema.isValidAddress('setAddress', setTokenAddress);

    return this.navIssuanceModuleWrapper.getManagerFee(
      setTokenAddress,
      managerFeeIndex
    );
  }

  /**
   * Get the expected SetTokens minted to recipient on issuance
   *
   * @param setTokenAddress               Address of the SetToken
   * @param reserveAsset                  Address of the reserve asset
   * @param reserveAssetQuantity          Quantity of the reserve asset to issue with
   *
   * @return                              Expected amount of set tokens minted
   */
  public async getExpectedSetTokenIssueQuantityAsync(
    setTokenAddress: Address,
    reserveAsset: Address,
    reserveAssetQuantity: BigNumber
  ): Promise<BigNumber> {
    this.assert.schema.isValidAddress('setAddress', setTokenAddress);
    this.assert.schema.isValidAddress('reserveAsset', reserveAsset);
    this.assert.common.greaterThanZero(reserveAssetQuantity, 'reserveAssetQuantity needs to be greater than zero');

    return this.navIssuanceModuleWrapper.getExpectedSetTokenIssueQuantity(
      setTokenAddress,
      reserveAsset,
      reserveAssetQuantity
    );
  }

  /**
   * Get the expected reserve asset to be redeemed
   *
   * @param setTokenAddress              Address of the SetToken
   * @param reserveAsset                 Address of the reserve asset
   * @param setTokenQuantity             Quantity of SetTokens to redeem
   *
   * @return                             Expected reserve asset quantity redeemed
   */
  public async getExpectedReserveRedeemQuantityAsync(
    setTokenAddress: Address,
    reserveAsset: Address,
    setTokenQuantity: BigNumber
  ): Promise<BigNumber> {
    this.assert.schema.isValidAddress('setAddress', setTokenAddress);
    this.assert.schema.isValidAddress('reserveAsset', reserveAsset);
    this.assert.common.greaterThanZero(setTokenQuantity, 'setTokenQuantity needs to be greater than zero');

    return this.navIssuanceModuleWrapper.getExpectedReserveRedeemQuantity(
      setTokenAddress,
      reserveAsset,
      setTokenQuantity
    );
  }

  /**
   * Checks if issue is valid
   *
   * @param setTokenAddress              Address of the SetToken
   * @param reserveAsset                 Address of the reserve asset
   * @param reserveAssetQuantity         Quantity of the reserve asset to issue with
   *
   * @return                             Returns true if issue is valid
   */
  public async isIssueValidAsync(
    setTokenAddress: Address,
    reserveAsset: Address,
    reserveAssetQuantity: BigNumber
  ): Promise<boolean> {
    this.assert.schema.isValidAddress('setAddress', setTokenAddress);
    this.assert.schema.isValidAddress('reserveAsset', reserveAsset);
    this.assert.common.greaterThanZero(reserveAssetQuantity, 'reserveAssetQuantity needs to be greater than zero');

    return this.navIssuanceModuleWrapper.isIssueValid(
      setTokenAddress,
      reserveAsset,
      reserveAssetQuantity
    );
  }

  /**
   * Checks if redeem is valid
   *
   * @param setTokenAddress              Address of the SetToken
   * @param reserveAsset                 Address of the reserve asset
   * @param setTokenQuantity             Quantity of SetTokens to redeem
   *
   * @return                             Returns true if redeem is valid
   */
  public async isRedeemValidAsync(
    setTokenAddress: Address,
    reserveAsset: Address,
    setTokenQuantity: BigNumber
  ): Promise<boolean> {
    this.assert.schema.isValidAddress('setAddress', setTokenAddress);
    this.assert.schema.isValidAddress('reserveAsset', reserveAsset);
    this.assert.common.greaterThanZero(setTokenQuantity, 'setTokenQuantity needs to be greater than zero');

    return this.navIssuanceModuleWrapper.isRedeemValid(
      setTokenAddress,
      reserveAsset,
      setTokenQuantity
    );
  }
}
