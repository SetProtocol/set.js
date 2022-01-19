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
import { BigNumber, ContractTransaction } from 'ethers';
import { TransactionOverrides } from '@setprotocol/set-protocol-v2/dist/typechain';
import { Provider } from '@ethersproject/providers';
import { generateTxOpts } from '../../utils/transactions';
import { VAssetDisplayInfo } from '../../types';

import ContractWrapper from './ContractWrapper';

/**
 * @title  PerpV2LeverageModuleViewerWrapper
 * @author Set Protocol
 *
 * The PerpV2LeverageModuleViewerWrapper forwards functionality from the PerpV2LeverageModule contract.
 *
 */
export default class PerpV2LeverageModuleViewerWrapper {
  private provider: Provider;
  private contracts: ContractWrapper;

  private perpV2LeverageModuleViewerAddress: Address;

  public constructor(provider: Provider, perpV2LeverageModuleViewerAddress: Address) {
    this.provider = provider;
    this.contracts = new ContractWrapper(this.provider);
    this.perpV2LeverageModuleViewerAddress = perpV2LeverageModuleViewerAddress;
  }

  /**
   * Initializes this module to the SetToken. Only callable by the SetToken's manager.
   *
   * @param setTokenAddress             Address of the SetToken to initialize
   * @param callerAddress               Address of caller (optional)
   * @param txOpts                      Overrides for transaction (optional)
   */
  public async initialize(
    setTokenAddress: Address,
    callerAddress: Address = undefined,
    txOpts: TransactionOverrides = {}
  ): Promise<ContractTransaction> {
    const txOptions = await generateTxOpts(txOpts);
    const perpV2LeverageModuleViewerInstance = await this.contracts.loadPerpV2LeverageModuleViewerAsync(
      this.perpV2LeverageModuleViewerAddress,
      callerAddress
    );

    return await perpV2LeverageModuleViewerInstance.initialize(
      setTokenAddress,
      txOptions,
    );
  }

  /**
   * Gets the address of the collateral token
   *
   * @param  callerAddress            Address of the method caller
   * @return                          The address of the ERC20 collateral token
   */
  public async collateralToken(
    callerAddress: Address = undefined,
  ): Promise<Address> {
    const perpV2LeverageModuleViewerInstance = await this.contracts.loadPerpV2LeverageModuleViewerAsync(
      this.perpV2LeverageModuleViewerAddress,
      callerAddress
    );

    return await perpV2LeverageModuleViewerInstance.collateralToken();
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
  public async getMaximumSetTokenIssueAmount(
    setTokenAddress: Address,
    slippage: BigNumber,
    callerAddress: Address = undefined,
  ): Promise<BigNumber> {
    const perpV2LeverageModuleViewerInstance = await this.contracts.loadPerpV2LeverageModuleViewerAsync(
      this.perpV2LeverageModuleViewerAddress,
      callerAddress
    );

    return await perpV2LeverageModuleViewerInstance.getMaximumSetTokenIssueAmount(
      setTokenAddress,
      slippage,
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
  public async getTotalCollateralUnit(
    setTokenAddress: Address,
    callerAddress: Address = undefined,
  ): Promise<[Address, BigNumber]> {
    const perpV2LeverageModuleViewerInstance = await this.contracts.loadPerpV2LeverageModuleViewerAsync(
      this.perpV2LeverageModuleViewerAddress,
      callerAddress
    );

    return await perpV2LeverageModuleViewerInstance.getTotalCollateralUnit(
      setTokenAddress,
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
  public async getVirtualAssetsDisplayInfo(
    setTokenAddress: Address,
    callerAddress: Address = undefined,
  ): Promise<VAssetDisplayInfo[]> {
    const perpV2LeverageModuleViewerInstance = await this.contracts.loadPerpV2LeverageModuleViewerAsync(
      this.perpV2LeverageModuleViewerAddress,
      callerAddress
    );

    return await perpV2LeverageModuleViewerInstance.getVirtualAssetsDisplayInfo(
      setTokenAddress,
    );
  }
}