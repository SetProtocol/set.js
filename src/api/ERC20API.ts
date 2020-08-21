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
import { TransactionOverrides } from '@setprotocol/set-protocol-v2/dist/typechain';
import { BigNumber } from 'ethers/utils';
import { Provider } from 'ethers/providers';

import ERC20Wrapper from '../wrappers/set-protocol-v2/ERC20Wrapper';
import Assertions from '../assertions';

/**
 * @title  ERC20Wrapper
 * @author Set Protocol
 *
 * The ERC20API exposes basic functionality common to all ERC-20 tokens.
 *
 */
export default class ERC20API {
  private assert: Assertions;
  private erc20Wrapper: ERC20Wrapper;

  public constructor(provider: Provider, assertions?: Assertions) {
    this.erc20Wrapper = new ERC20Wrapper(provider);
    this.assert = assertions || new Assertions(provider);
  }

  /**
   * Gets balance of the ERC20 token
   *
   * @param  tokenAddress  Address of the ERC20 token
   * @param  userAddress   Address of the user
   * @return               The balance of the ERC20 token in BigNumber format
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
   * Gets symbol of the ERC20 token
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
   * @return               The total supply of ERC-20 in BigNumber format
   */
  public async getTotalSupplyAsync(tokenAddress: Address): Promise<BigNumber> {
    this.assert.schema.isValidAddress('tokenAddress', tokenAddress);

    return this.erc20Wrapper.totalSupply(tokenAddress);
  }

  /**
   * Gets decimals of the ERC20 token
   *
   * @param  tokenAddress  Address of the ERC20 token
   * @return               The decimals of the ERC20 token
   */
  public async getDecimalsAsync(tokenAddress: Address): Promise<BigNumber> {
    this.assert.schema.isValidAddress('tokenAddress', tokenAddress);

    return this.erc20Wrapper.decimals(tokenAddress);
  }

  /**
   * Gets the token allowance of the spender by the owner account
   *
   * @param  tokenAddress      Address of the token
   * @param  ownerAddress      Address of the owner
   * @param  spenderAddress    Address of the spender
   * @return                   The allowance of the spender in BigNumber format
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
   * Asynchronously transfer target ERC20 tokens from the caller's wallet to
   * the target address
   *
   * @param  tokenAddress   The address of the token being transferred.
   * @param  to             To whom the transfer is being made.
   * @param  value          The amount being transferred.
   * @param  callerAddress  Optional. The address of user transferring from.
   * @param  txOpts         Optional. Any parameters necessary to modify the transaction.
   * @return                The approval transaction hash.
   */
  public async transferAsync(
    tokenAddress: Address,
    to: Address,
    value: BigNumber,
    callerAddress: Address = undefined,
    txOpts: TransactionOverrides = {},
  ): Promise<string> {
    this.assert.schema.isValidAddress('tokenAddress', tokenAddress);
    this.assert.schema.isValidAddress('toAddress', to);
    this.assert.schema.isValidNumber('value', value);

    return await this.erc20Wrapper.transfer(tokenAddress, to, value, callerAddress, txOpts);
  }

  /**
   * Approve a proxy address to conduct tokens transfers from the method caller's wallet.
   *
   * @param  tokenAddress         The address of the token being transferred.
   * @param  spenderAddress       The proxy address that is being approved.
   * @param  value                The spendable token quantity being approved.
   * @param  callerAddress        Optional. The address of user giving the approval.
   * @param  txOpts               Any parameters necessary to modify the transaction.
   * @return                      The approval transaction hash.
   */
  public async approveProxyAsync(
    tokenAddress: Address,
    spenderAddress: Address,
    value: BigNumber,
    callerAddress: Address = undefined,
    txOpts: TransactionOverrides = {}
  ): Promise<string> {
    this.assert.schema.isValidAddress('tokenAddress', tokenAddress);
    this.assert.schema.isValidAddress('spenderAddress', spenderAddress);
    this.assert.schema.isValidNumber('value', value);

    return this.erc20Wrapper.approve(tokenAddress, spenderAddress, value, callerAddress, txOpts);
  }

  /**
   * Conduct a token transfer on behalf of a target wallet.
   *
   * @param  tokenAddress   The address of the token being transferred.
   * @param  from           From whom are the tokens being transferred.
   * @param  to             To whom are the tokens being transferred.
   * @param  value          The amount to be transferred.
   * @param  callerAddress  Optional. The address of the user conducting transfer.
   * @param  txOpts         Optional. Any parameters necessary to modify the transaction.
   * @return                The transfer transaction hash.
   */
  public async proxyTransferAsync(
    tokenAddress: Address,
    from: Address,
    to: Address,
    value: BigNumber,
    callerAddress: Address = undefined,
    txOpts: TransactionOverrides = {},
  ): Promise<string> {
    this.assert.schema.isValidAddress('tokenAddress', tokenAddress);
    this.assert.schema.isValidAddress('toAddress', to);
    this.assert.schema.isValidAddress('fromAddress', from);
    this.assert.schema.isValidNumber('value', value);

    return this.erc20Wrapper.transferFrom(tokenAddress, from, to, value, callerAddress, txOpts);
  }
}
