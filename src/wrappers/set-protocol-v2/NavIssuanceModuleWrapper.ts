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

import { Address } from '@setprotocol/set-protocol-v2/utils/types';
import { ContractTransaction } from 'ethers';
import { TransactionOverrides } from '@setprotocol/set-protocol-v2/dist/typechain';
import { BigNumber, BigNumberish } from 'ethers/utils';
import { Provider } from 'ethers/providers';
import { generateTxOpts } from '../../utils/transactions';

import ContractWrapper from './ContractWrapper';

/**
 * @title  NavIssuanceModuleWrapper
 * @author Set Protocol
 *
 * The NavIssuanceModuleWrapper forwards functionality from the NavIssuanceModule contract
 *
 */
export default class NavIssuanceModuleWrapper {
  private provider: Provider;
  private contracts: ContractWrapper;

  private navIssuanceModuleAddress: Address;

  public constructor(provider: Provider, navIssuanceModuleAddress: Address) {
    this.provider = provider;
    this.contracts = new ContractWrapper(this.provider);
    this.navIssuanceModuleAddress = navIssuanceModuleAddress;
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
  public async issue(
    setTokenAddress: Address,
    reserveAsset: Address,
    reserveAssetQuantity: BigNumberish,
    minSetTokenReceiveQuantity: BigNumberish,
    to: Address,
    callerAddress: Address = undefined,
    txOpts: TransactionOverrides = {}
  ): Promise<ContractTransaction> {
    const txOptions = await generateTxOpts(txOpts);
    const navIssuanceModuleInstance = await this.contracts.loadNavIssuanceModuleAsync(
      this.navIssuanceModuleAddress,
      callerAddress
    );

    return await navIssuanceModuleInstance.issue(
      setTokenAddress,
      reserveAsset,
      reserveAssetQuantity,
      minSetTokenReceiveQuantity,
      to,
      txOptions
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
  public async issueWithEther(
    setTokenAddress: Address,
    minSetTokenReceiveQuantity: BigNumberish,
    to: Address,
    callerAddress: Address = undefined,
    txOpts: TransactionOverrides = {}
  ): Promise<ContractTransaction> {
    const txOptions = await generateTxOpts(txOpts);
    const navIssuanceModuleInstance = await this.contracts.loadNavIssuanceModuleAsync(
      this.navIssuanceModuleAddress,
      callerAddress
    );

    return await navIssuanceModuleInstance.issueWithEther(
      setTokenAddress,
      minSetTokenReceiveQuantity,
      to,
      txOptions
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
  public async redeem(
    setTokenAddress: Address,
    reserveAsset: Address,
    setTokenQuantity: BigNumberish,
    minReserveReceiveQuantity: BigNumberish,
    to: Address,
    callerAddress: Address = undefined,
    txOpts: TransactionOverrides = {}
  ): Promise<ContractTransaction> {
    const txOptions = await generateTxOpts(txOpts);
    const navIssuanceModuleInstance = await this.contracts.loadNavIssuanceModuleAsync(
      this.navIssuanceModuleAddress,
      callerAddress
    );

    return await navIssuanceModuleInstance.redeem(
      setTokenAddress,
      reserveAsset,
      setTokenQuantity,
      minReserveReceiveQuantity,
      to,
      txOptions
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
  public async redeemIntoEther(
    setTokenAddress: Address,
    setTokenQuantity: BigNumberish,
    minReserveReceiveQuantity: BigNumberish,
    to: Address,
    callerAddress: Address = undefined,
    txOpts: TransactionOverrides = {}
  ): Promise<ContractTransaction> {
    const txOptions = await generateTxOpts(txOpts);
    const navIssuanceModuleInstance = await this.contracts.loadNavIssuanceModuleAsync(
      this.navIssuanceModuleAddress,
      callerAddress
    );

    return await navIssuanceModuleInstance.redeemIntoEther(
      setTokenAddress,
      setTokenQuantity,
      minReserveReceiveQuantity,
      to,
      txOptions
    );
  }

  /**
   * Get reserve asset addresses for token
   *
   * @param setTokenAddress              Address of the SetToken contract
   *
   * @return                             Returns the reserve asset addresses for token
   */
  public async getReserveAssets(
    setTokenAddress: Address,
  ): Promise<Address[]> {
    const navIssuanceModuleInstance = await this.contracts.loadNavIssuanceModuleAsync(
      this.navIssuanceModuleAddress
    );

    return navIssuanceModuleInstance.getReserveAssets(setTokenAddress);
  }

  /**
   * Get boolean to see if reserve asset is valid
   *
   * @param setTokenAddress              Address of the SetToken contract
   * @param reserveAsset                 Address of reserve asset token
   *
   * @return                             Returns true if reserve asset is valid
   */
  public async isValidReserveAsset(
    setTokenAddress: Address,
    reserveAsset: Address
  ): Promise<boolean> {
    const navIssuanceModuleInstance = await this.contracts.loadNavIssuanceModuleAsync(
      this.navIssuanceModuleAddress
    );

    return navIssuanceModuleInstance.isValidReserveAsset(setTokenAddress, reserveAsset);
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
  public async getIssuePremium(
    setTokenAddress: Address,
    reserveAsset: Address,
    reserveAssetQuantity: BigNumberish
  ): Promise<BigNumber> {
    const navIssuanceModuleInstance = await this.contracts.loadNavIssuanceModuleAsync(
      this.navIssuanceModuleAddress
    );

    return navIssuanceModuleInstance.getIssuePremium(
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
  public async getRedeemPremium(
    setTokenAddress: Address,
    reserveAsset: Address,
    setTokenQuantity: BigNumberish
  ): Promise<BigNumber> {
    const navIssuanceModuleInstance = await this.contracts.loadNavIssuanceModuleAsync(
      this.navIssuanceModuleAddress
    );

    return navIssuanceModuleInstance.getRedeemPremium(
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
  public async getManagerFee(
    setTokenAddress: Address,
    managerFeeIndex: BigNumberish
  ): Promise<BigNumber> {
    const navIssuanceModuleInstance = await this.contracts.loadNavIssuanceModuleAsync(
      this.navIssuanceModuleAddress
    );

    return navIssuanceModuleInstance.getManagerFee(
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
  public async getExpectedSetTokenIssueQuantity(
    setTokenAddress: Address,
    reserveAsset: Address,
    reserveAssetQuantity: BigNumberish
  ): Promise<BigNumber> {
    const navIssuanceModuleInstance = await this.contracts.loadNavIssuanceModuleAsync(
      this.navIssuanceModuleAddress
    );

    return navIssuanceModuleInstance.getExpectedSetTokenIssueQuantity(
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
  public async getExpectedReserveRedeemQuantity(
    setTokenAddress: Address,
    reserveAsset: Address,
    setTokenQuantity: BigNumberish
  ): Promise<BigNumber> {
    const navIssuanceModuleInstance = await this.contracts.loadNavIssuanceModuleAsync(
      this.navIssuanceModuleAddress
    );

    return navIssuanceModuleInstance.getExpectedReserveRedeemQuantity(
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
  public async isIssueValid(
    setTokenAddress: Address,
    reserveAsset: Address,
    reserveAssetQuantity: BigNumberish
  ): Promise<boolean> {
    const navIssuanceModuleInstance = await this.contracts.loadNavIssuanceModuleAsync(
      this.navIssuanceModuleAddress
    );

    return navIssuanceModuleInstance.isIssueValid(
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
  public async isRedeemValid(
    setTokenAddress: Address,
    reserveAsset: Address,
    setTokenQuantity: BigNumberish
  ): Promise<boolean> {
    const navIssuanceModuleInstance = await this.contracts.loadNavIssuanceModuleAsync(
      this.navIssuanceModuleAddress
    );

    return navIssuanceModuleInstance.isRedeemValid(
      setTokenAddress,
      reserveAsset,
      setTokenQuantity
    );
  }
}
