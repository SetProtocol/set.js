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

import ContractWrapper from './ContractWrapper';

/**
 * @title  PerpV2LeverageModuleWrapper
 * @author Set Protocol
 *
 * The PerpV2LeverageModuleWrapper forwards functionality from the PerpV2LeverageModule contract.
 *
 */
export default class PerpV2LeverageModuleWrapper {
  private provider: Provider;
  private contracts: ContractWrapper;

  private perpV2LeverageModuleAddress: Address;

  public constructor(provider: Provider, perpV2LeverageModuleAddress: Address) {
    this.provider = provider;
    this.contracts = new ContractWrapper(this.provider);
    this.perpV2LeverageModuleAddress = perpV2LeverageModuleAddress;
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
    const perpV2LeverageModuleInstance = await this.contracts.loadPerpV2LeverageModuleAsync(
      this.perpV2LeverageModuleAddress,
      callerAddress
    );

    return await perpV2LeverageModuleInstance.initialize(
      setTokenAddress,
      txOptions,
    );
  }

  /**
   * Gets the address of the collateral token
   *
   * @param  callerAddress Address of the method caller
   * @return               The address of the ERC20 collateral token
   */
  public async collateralToken(
    callerAddress: Address = undefined,
  ): Promise<Address> {
    const perpV2LeverageModuleInstance = await this.contracts.loadPerpV2LeverageModuleAsync(
      this.perpV2LeverageModuleAddress,
      callerAddress
    );

    return await perpV2LeverageModuleInstance.collateralToken();
  }

  /**
   * Gets decimals of the collateral token
   *
   * @param  callerAddress Address of the method caller
   * @return               The decimals of the ERC20 collateral token
   */
  public async collateralDecimals(
    callerAddress: Address = undefined,
  ): Promise<Number> {
    const perpV2LeverageModuleInstance = await this.contracts.loadPerpV2LeverageModuleAsync(
      this.perpV2LeverageModuleAddress,
      callerAddress
    );

    return await perpV2LeverageModuleInstance.collateralDecimals();
  }

  /**
   * Returns a PositionUnitNotionalInfo array representing all positions open for the SetToken.
   *
   * @param _setToken         Instance of SetToken
   *
   * @return address[]        baseToken: addresses
   * @return BigNumber[]      baseBalance: baseToken balances as notional quantity (10**18)
   * @return BigNumber[]      quoteBalance: USDC quote asset balances as notional quantity (10**18)
   */
  public async getPositionNotionalInfo(
    setTokenAddress: Address,
    callerAddress: Address = undefined,
  ): Promise<(Address|BigNumber)[][]> {
    const perpV2LeverageModuleInstance = await this.contracts.loadPerpV2LeverageModuleAsync(
      this.perpV2LeverageModuleAddress,
      callerAddress
    );

    return await perpV2LeverageModuleInstance.getPositionNotionalInfo(
      setTokenAddress,
    );
  }

  /**
   * Returns a PositionUnitInfo array representing all positions open for the SetToken.
   *
   * @param _setToken         Instance of SetToken
   *
   * @return address[]        baseToken: addresses
   * @return BigNumber[]      baseUnit: baseToken balances as position unit (10**18)
   * @return BigNumber[]      quoteUnit: USDC quote asset balances as position unit (10**18)
   */
  public async getPositionUnitInfo(
    setTokenAddress: Address,
    callerAddress: Address = undefined,
  ): Promise<(Address|BigNumber)[][]> {
    const perpV2LeverageModuleInstance = await this.contracts.loadPerpV2LeverageModuleAsync(
      this.perpV2LeverageModuleAddress,
      callerAddress
    );

    return await perpV2LeverageModuleInstance.getPositionUnitInfo(
      setTokenAddress,
    );
  }

  /**
   * Gets Perp account info for SetToken. Returns an AccountInfo struct containing account wide
   * (rather than position specific) balance info
   *
   * @param  _setToken            Instance of the SetToken
   *
   * @return BigNumber            collateral balance (10**18, regardless of underlying collateral decimals)
   * @return BigNumber            owed realized Pnl` (10**18)
   * @return BigNumber            pending funding payments (10**18)
   * @return BigNumber            net quote balance (10**18)
   */
  public async getAccountInfo(
    setTokenAddress: Address,
    callerAddress: Address = undefined,
  ): Promise<BigNumber[]> {
    const perpV2LeverageModuleInstance = await this.contracts.loadPerpV2LeverageModuleAsync(
      this.perpV2LeverageModuleAddress,
      callerAddress
    );

    return await perpV2LeverageModuleInstance.getAccountInfo(
      setTokenAddress,
    );
  }
}