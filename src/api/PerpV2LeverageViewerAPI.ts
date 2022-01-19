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
import { TransactionOverrides } from '@setprotocol/set-protocol-v2/dist/typechain';
import { BigNumber } from 'ethers/lib/ethers';
import { VAssetDisplayInfo } from '../types';

import PerpV2LeverageModuleViewerWrapper from '../wrappers/set-protocol-v2/PerpV2LeverageModuleViewerWrapper';
import Assertions from '../assertions';

/**
 * @title  PerpV2LeverageViewerAPI
 * @author Set Protocol
 *
 * The PerpV2LeverageViewerAPI exposes issue and redeem functionality for Sets that contain poitions that accrue
 * interest per block. The getter function syncs the position balance to the current block, so subsequent blocks
 * will cause the position value to be slightly out of sync (a buffer is needed). This API is primarily used for Sets
 * that rely on the ALM contracts to manage debt. The manager can define arbitrary issuance logic
 * in the manager hook, as well as specify issue and redeem fees.
 *
 */
export default class PerpV2LeverageViewerAPI {
  private perpV2LeverageModuleViewerWrapper: PerpV2LeverageModuleViewerWrapper;
  private assert: Assertions;

  public constructor(provider: Provider, perpV2LeverageModuleViewerAddress: Address, assertions?: Assertions) {
    this.perpV2LeverageModuleViewerWrapper = new PerpV2LeverageModuleViewerWrapper(
      provider,
      perpV2LeverageModuleViewerAddress
    );
    this.assert = assertions || new Assertions();
  }

  /**
   * Initializes the PerpV2LeverageModuleViewer to the SetToken. Only callable by the SetToken's manager.
   *
   * @param setTokenAddress             Address of the SetToken to initialize
   * @param callerAddress               The address of user transferring from (optional)
   * @param txOpts                      Overrides for transaction (optional)
   *
   * @return                            Transaction hash of the initialize transaction
   */
  public async initializeAsync(
    setTokenAddress: Address,
    callerAddress: Address = undefined,
    txOpts: TransactionOverrides = {}
  ): Promise<ContractTransaction> {
    this.assert.schema.isValidAddress('setTokenAddress', setTokenAddress);

    return await this.perpV2LeverageModuleViewerWrapper.initialize(
      setTokenAddress,
      callerAddress,
      txOpts,
    );
  }

  /**
   * Gets the address of the collateral token
   *
   * @param  callerAddress            The address of user transferring from (optional)
   * @return                          The address of the ERC20 collateral token
   */
   public async getCollateralTokenAsync(
    callerAddress: Address = undefined,
  ): Promise<Address> {
    return await this.perpV2LeverageModuleViewerWrapper.collateralToken(callerAddress);
  }

  /**
   * Returns the maximum amount of Sets that can be issued. Because upon issuance we lever up the Set
   * before depositing collateral there is a ceiling on the amount of Sets that can be issued before the max
   * leverage ratio is met. In order to accurately predict this amount the user must pass in an expected
   * slippage amount, this amount should be calculated relative to Index price(s) of vAssets held by the Set,
   * not the mid-market prices. The formulas used here are based on the "conservative" definition of free
   * collateral as defined in PerpV2's docs.
   *
   * @param setTokenAddress           Instance of SetToken
   * @param slippage                  Expected slippage from entering position in precise units (1% = 10^16)
   * @param callerAddress             Address of the method caller
   *
   * @return                          Maximum amount of Sets that can be issued
   */
  public async getMaximumSetTokenIssueAmountAsync(
    setTokenAddress: Address,
    slippage: BigNumber,
    callerAddress: Address = undefined,
  ): Promise<BigNumber> {
    this.assert.schema.isValidAddress('setTokenAddress', setTokenAddress);

    return await this.perpV2LeverageModuleViewerWrapper.getMaximumSetTokenIssueAmount(
      setTokenAddress,
      slippage,
      callerAddress,
    );
  }

  /**
   * Returns the position unit for total collateral value as defined by Perpetual Protocol.
   *
   * @param setTokenAddress           Instance of SetToken
   * @param callerAddress             Address of the method caller
   *
   * @return                          Collateral token address
   * @return                          Total collateral value position unit
   */
  public async getTotalCollateralUnitAsync(
    setTokenAddress: Address,
    callerAddress: Address = undefined,
  ): Promise<[Address, BigNumber]> {
    this.assert.schema.isValidAddress('setTokenAddress', setTokenAddress);

    return await this.perpV2LeverageModuleViewerWrapper.getTotalCollateralUnit(
      setTokenAddress,
      callerAddress,
    );
  }

  /**
   * Returns relevant data for displaying current positions. Identifying info for each position plus current
   * size, index price, and leverage of each vAsset with an open position is returned. The sum quantity of vUSDC
   * is returned along with identifying info in last index of array.
   *
   * @param setTokenAddress           Instance of the SetToken
   * @param callerAddress             Address of the method caller
   *
   * @return                          Array of info concerning size and leverage of current vAsset positions
   */
  public async getVirtualAssetsDisplayInfoAsync(
    setTokenAddress: Address,
    callerAddress: Address = undefined,
  ): Promise<VAssetDisplayInfo[]> {
    this.assert.schema.isValidAddress('setTokenAddress', setTokenAddress);

    return await this.perpV2LeverageModuleViewerWrapper.getVirtualAssetsDisplayInfo(
      setTokenAddress,
      callerAddress,
    );
  }
}
