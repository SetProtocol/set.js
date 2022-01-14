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

import PerpV2LeverageModuleWrapper from '../wrappers/set-protocol-v2/PerpV2LeverageModuleWrapper';
import Assertions from '../assertions';

/**
 * @title  PerpV2LeverageAPI
 * @author Set Protocol
 *
 * The PerpV2LeverageAPI exposes issue and redeem functionality for Sets that contain poitions that accrue
 * interest per block. The getter function syncs the position balance to the current block, so subsequent blocks
 * will cause the position value to be slightly out of sync (a buffer is needed). This API is primarily used for Sets
 * that rely on the ALM contracts to manage debt. The manager can define arbitrary issuance logic
 * in the manager hook, as well as specify issue and redeem fees.
 *
 */
export default class PerpV2LeverageAPI {
  private perpV2LeverageModuleWrapper: PerpV2LeverageModuleWrapper;
  private assert: Assertions;

  public constructor(provider: Provider, perpV2LeverageModuleAddress: Address, assertions?: Assertions) {
    this.perpV2LeverageModuleWrapper = new PerpV2LeverageModuleWrapper(provider, perpV2LeverageModuleAddress);
    this.assert = assertions || new Assertions();
  }

  /**
   * Initializes the PerpV2LeverageModule to the SetToken. Only callable by the SetToken's manager.
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

    return await this.perpV2LeverageModuleWrapper.initialize(
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
    return await this.perpV2LeverageModuleWrapper.collateralToken(callerAddress);
  }

  /**
   * Gets decimals of the collateral token
   *
   * @param  callerAddress            The address of user transferring from (optional)
   * @return                          The decimals of the ERC20 collateral token
   */
  public async getcollateralDecimalsAsync(
    callerAddress: Address = undefined,
  ): Promise<Number> {
    return await this.perpV2LeverageModuleWrapper.collateralDecimals(callerAddress);
  }

  /**
   * Returns a tuple of arrays representing all positions open for the SetToken.
   *
   * @param _setToken                 Instance of SetToken
   * @param  callerAddress            The address of user transferring from (optional)
   *
   * @return address[]                baseToken: addresses
   * @return BigNumber[]              baseBalance: baseToken balances as notional quantity (10**18)
   * @return BigNumber[]              quoteBalance: USDC quote asset balances as notional quantity (10**18)
   */
  public async getPositionNotionalInfoAsync(
    setTokenAddress: Address,
    callerAddress: Address = undefined,
  ): Promise<(Address|BigNumber)[][]> {
    this.assert.schema.isValidAddress('setTokenAddress', setTokenAddress);

    return await this.perpV2LeverageModuleWrapper.getPositionNotionalInfo(
      setTokenAddress,
      callerAddress,
    );
  }

  /**
   * Returns a tuple of arrays representing all positions open for the SetToken.
   *
   * @param _setToken                 Instance of SetToken
   * @param  callerAddress            The address of user transferring from (optional)
   *
   * @return address[]                baseToken: addresses
   * @return BigNumber[]              baseUnit: baseToken balances as position unit (10**18)
   * @return BigNumber[]              quoteUnit: USDC quote asset balances as position unit (10**18)
   */
  public async getPositionUnitInfoAsync(
    setTokenAddress: Address,
    callerAddress: Address = undefined,
  ): Promise<(Address|BigNumber)[][]> {
    this.assert.schema.isValidAddress('setTokenAddress', setTokenAddress);

    return await this.perpV2LeverageModuleWrapper.getPositionUnitInfo(
      setTokenAddress,
      callerAddress,
    );
  }

  /**
   * Gets Perp account info for SetToken. Returns an AccountInfo struct containing account wide
   * (rather than position specific) balance info
   *
   * @param  _setToken                Instance of the SetToken
   * @param  callerAddress            The address of user transferring from (optional)
   *
   * @return BigNumber                collateral balance (10**18, regardless of underlying collateral decimals)
   * @return BigNumber                owed realized Pnl` (10**18)
   * @return BigNumber                pending funding payments (10**18)
   * @return BigNumber                net quote balance (10**18)
   */
  public async getAccountInfoAsync(
    setTokenAddress: Address,
    callerAddress: Address = undefined,
  ): Promise<BigNumber[]> {
    this.assert.schema.isValidAddress('setTokenAddress', setTokenAddress);

    return await this.perpV2LeverageModuleWrapper.getAccountInfo(
      setTokenAddress,
      callerAddress,
    );
  }
}
