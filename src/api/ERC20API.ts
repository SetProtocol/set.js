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

import { Address } from 'set-protocol-v2/utils/types';
import { TransactionOverrides } from 'set-protocol-v2/dist/typechain';
import { BigNumber } from 'ethers/utils';
import { Provider } from 'ethers/providers';
import { generateTxOpts } from '@src/utils/transactions';

import { ERC20Wrapper } from '../wrappers/set-protocol-v2/ERC20Wrapper';
import { Assertions } from '@src/assertions';

export interface ERC20APIConfig {
  assertions: Assertions;
  erc20Wrapper: ERC20Wrapper;
}

/**
 * @title  ERC20Wrapper
 * @author Set Protocol
 *
 * The ERC20 Wrapper contract gives basic functionality common to all ERC20 tokens
 *
 */
export class ERC20API {
  private assert: Assertions;
  private erc20Wrapper: ERC20Wrapper;

  public constructor(provider: Provider, options?: ERC20APIConfig) {
    this.assert = (options?.assertions) || new Assertions(provider);
    this.erc20Wrapper = (options?.erc20Wrapper) || new ERC20Wrapper(provider);
  }

  /**
   * Gets balance of the ERC20 token
   *
   * @param  tokenAddress  Address of the ERC20 token
   * @param  userAddress   Address of the user
   * @return               The balance of the ERC20 token
   */
  public async getBalanceAsync(tokenAddress: Address, userAddress: Address): Promise<BigNumber> {
    this.assert.schema.isValidAddress('tokenAddress', tokenAddress);
    this.assert.schema.isValidAddress('userAddress', userAddress);

    return this.erc20Wrapper.balanceOf(tokenAddress, userAddress);
  }

  /**
   * Gets name of the ERC20 token
   *
   * @param  tokenAddress  Address of the ERC20 token
   * @return               The name of the ERC20 token
   */
  public async getTokenNameAsync(tokenAddress: Address): Promise<string> {
    this.assert.schema.isValidAddress('tokenAddress', tokenAddress);

    return this.erc20Wrapper.name(tokenAddress);
  }

  /**
   * Gets balance of the ERC20 token
   *
   * @param  tokenAddress  Address of the ERC20 token
   * @return               The symbol of the ERC20 token
   */
  public async getTokenSymbolAsync(tokenAddress: Address): Promise<string> {
    this.assert.schema.isValidAddress('tokenAddress', tokenAddress);

    return this.erc20Wrapper.symbol(tokenAddress);
  }

  /**
   * Gets the total supply of the ERC20 token
   *
   * @param  tokenAddress  Address of the ERC20 token
   * @return               The symbol of the ERC20 token
   */
  public async getTotalSupplyAsync(tokenAddress: Address): Promise<BigNumber> {
    this.assert.schema.isValidAddress('tokenAddress', tokenAddress);

    return this.erc20Wrapper.totalSupply(tokenAddress);
  }

  /**
   * Gets decimals of the ERC20 token
   *
   * @param  tokenAddress  Address of the ERC20 token
   * @param  userAddress   Address of the user
   * @return               The decimals of the ERC20 token
   */
  public async getDecimalsAsync(tokenAddress: Address): Promise<BigNumber> {
    this.assert.schema.isValidAddress('tokenAddress', tokenAddress);

    return this.erc20Wrapper.decimals(tokenAddress);
  }

  /**
   * Gets the allowance of the spender by the owner account
   *
   * @param  tokenAddress      Address of the token
   * @param  ownerAddress      Address of the owner
   * @param  spenderAddress    Address of the spender
   * @return                   The allowance of the spender
   */
  public async getAllowanceAsync(
    tokenAddress: Address,
    ownerAddress: Address,
    spenderAddress: Address,
  ): Promise<BigNumber> {
    this.assert.schema.isValidAddress('tokenAddress', tokenAddress);
    this.assert.schema.isValidAddress('ownerAddress', ownerAddress);
    this.assert.schema.isValidAddress('spenderAddress', spenderAddress);

    return this.erc20Wrapper.allowance(tokenAddress, ownerAddress, spenderAddress);
  }

  /**
   * Asynchronously transfer value denominated in the specified ERC20 token to
   * the address specified.
   *
   * @param  tokenAddress   The address of the token being used.
   * @param  to             To whom the transfer is being made.
   * @param  value          The amount being transferred.
   * @param  callerAddress  The address of user transferring from.
   * @param  txOpts         Any parameters necessary to modify the transaction.
   * @return                The hash of the resulting transaction.
   */
  public async transferAsync(
    tokenAddress: Address,
    to: Address,
    value: BigNumber,
    callerAddress: Address = undefined,
    txOpts?: TransactionOverrides,
  ): Promise<string> {
    this.assert.schema.isValidAddress('tokenAddress', tokenAddress);
    this.assert.schema.isValidAddress('toAddress', to);
    this.assert.schema.isValidNumber('value', value);

    return this.erc20Wrapper.transfer(tokenAddress, to, value, callerAddress, txOpts);
  }

  /**
   * Asynchronously transfer the value amount in the token specified so long
   * as the sender of the message has received sufficient allowance on behalf
   * of `from` to do so.
   *
   * @param  tokenAddress   The address of the token being used.
   * @param  from           From whom are the funds being transferred.
   * @param  to             To whom are the funds being transferred.
   * @param  value          The amount to be transferred.
   * @param  txOpts         Any parameters necessary to modify the transaction.
   * @return                The hash of the resulting transaction.
   */
  public async proxyTransferAsync(
    tokenAddress: Address,
    from: Address,
    to: Address,
    value: BigNumber,
    callerAddress: Address = undefined,
    txOpts?: TransactionOverrides,
  ): Promise<string> {
    this.assert.schema.isValidAddress('tokenAddress', tokenAddress);
    this.assert.schema.isValidAddress('toAddress', to);
    this.assert.schema.isValidAddress('fromAddress', from);
    this.assert.schema.isValidNumber('value', value);

    return this.erc20Wrapper.transferFrom(tokenAddress, from, to, value, callerAddress, txOpts);
  }

  /**
   * Asynchronously approves the value amount of the spender from the owner
   *
   * @param  tokenAddress         the address of the token being used.
   * @param  spenderAddress       the spender.
   * @param  value                the amount to be approved.
   * @param  callerAddress        the address of user giving the approval.
   * @param  txOpts               any parameters necessary to modify the transaction.
   * @return                      the hash of the resulting transaction.
   */
  public async approveProxyAsync(
    tokenAddress: Address,
    spenderAddress: Address,
    value: BigNumber,
    callerAddress: Address = undefined,
    txOpts?: TransactionOverrides,
  ): Promise<string> {
    this.assert.schema.isValidAddress('tokenAddress', tokenAddress);
    this.assert.schema.isValidAddress('spenderAddress', spenderAddress);
    this.assert.schema.isValidNumber('value', value);

    return this.erc20Wrapper.approve(tokenAddress, spenderAddress, value, callerAddress, txOpts);
  }
}
