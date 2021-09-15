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
import { BigNumber, ContractTransaction } from 'ethers/lib/ethers';
import { Provider } from '@ethersproject/providers';

import { generateTxOpts } from '../../utils/transactions';
import ContractWrapper from './ContractWrapper';

/**
 * @title  ERC20Wrapper
 * @author Set Protocol
 *
 * The ERC20 Wrapper contract gives basic functionality common to all ERC20 tokens
 *
 */
export default class ERC20Wrapper {
  private provider: Provider;
  private contracts: ContractWrapper;

  public constructor(provider: Provider) {
    this.provider = provider;
    this.contracts = new ContractWrapper(this.provider);
  }

  /**
   * Gets balance of the ERC20 token
   *
   * @param  tokenAddress  Address of the ERC20 token
   * @param  userAddress   Address of the user
   * @param  callerAddress Address of the method caller
   * @return               The balance of the ERC20 token
   */
  public async balanceOf(
    tokenAddress: Address,
    userAddress: Address,
    callerAddress: Address = undefined
  ): Promise<BigNumber> {
    const tokenInstance = await this.contracts.loadERC20Async(
      tokenAddress,
      callerAddress
    );

    return await tokenInstance.balanceOf(userAddress);
  }

  /**
   * Gets name of the ERC20 token
   *
   * @param  tokenAddress  Address of the ERC20 token
   * @param  callerAddress Address of the method caller
   * @return               The name of the ERC20 token
   */
  public async name(
    tokenAddress: Address,
    callerAddress: Address = undefined
  ): Promise<string> {
    const tokenInstance = await this.contracts.loadERC20Async(
      tokenAddress,
      callerAddress
    );

    return await tokenInstance.name();
  }

  /**
   * Gets balance of the ERC20 token
   *
   * @param  tokenAddress  Address of the ERC20 token
   * @param  callerAddress Address of the method caller
   * @return               The symbol of the ERC20 token
   */
  public async symbol(
    tokenAddress: Address,
    callerAddress: Address = undefined
  ): Promise<string> {
    const tokenInstance = await this.contracts.loadERC20Async(
      tokenAddress,
      callerAddress
    );

    return await tokenInstance.symbol();
  }

  /**
   * Gets the total supply of the ERC20 token
   *
   * @param  tokenAddress  Address of the ERC20 token
   * @param  callerAddress Address of the method caller
   * @return               The symbol of the ERC20 token
   */
  public async totalSupply(
    tokenAddress: Address,
    callerAddress: Address = undefined
  ): Promise<BigNumber> {
    const tokenInstance = await this.contracts.loadERC20Async(
      tokenAddress,
      callerAddress
    );

    return await tokenInstance.totalSupply();
  }

  /**
   * Gets decimals of the ERC20 token
   *
   * @param  tokenAddress  Address of the ERC20 token
   * @param  callerAddress Address of the method caller
   * @return               The decimals of the ERC20 token
   */
  public async decimals(
    tokenAddress: Address,
    callerAddress: Address = undefined
  ): Promise<number> {
    const tokenInstance = await this.contracts.loadERC20Async(
      tokenAddress,
      callerAddress
    );

    return await tokenInstance.decimals();
  }

  /**
   * Gets the allowance of the spender by the owner account
   *
   * @param  tokenAddress      Address of the token
   * @param  ownerAddress      Address of the owner
   * @param  spenderAddress    Address of the spender
   * @param  callerAddress     Address of the method caller
   * @return                   The allowance of the spender
   */
  public async allowance(
    tokenAddress: Address,
    ownerAddress: Address,
    spenderAddress: Address,
    callerAddress: Address = undefined
  ): Promise<BigNumber> {
    const tokenInstance = await this.contracts.loadERC20Async(
      tokenAddress,
      callerAddress
    );

    return await tokenInstance.allowance(ownerAddress, spenderAddress);
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
  public async transfer(
    tokenAddress: Address,
    to: Address,
    value: BigNumber,
    callerAddress: Address = undefined,
    txOpts?: TransactionOverrides
  ): Promise<ContractTransaction> {
    const txOptions = await generateTxOpts(txOpts);
    const tokenInstance = await this.contracts.loadERC20Async(
      tokenAddress,
      callerAddress
    );

    return await tokenInstance.transfer(to, value, txOptions);
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
  public async transferFrom(
    tokenAddress: Address,
    from: Address,
    to: Address,
    value: BigNumber,
    callerAddress: Address = undefined,
    txOpts?: TransactionOverrides
  ): Promise<ContractTransaction> {
    const tokenInstance = await this.contracts.loadERC20Async(
      tokenAddress,
      callerAddress
    );
    const txOptions = await generateTxOpts(txOpts);

    return await tokenInstance.transferFrom(from, to, value, txOptions);
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
  public async approve(
    tokenAddress: Address,
    spenderAddress: Address,
    value: BigNumber,
    callerAddress: Address = undefined,
    txOpts?: TransactionOverrides
  ): Promise<ContractTransaction> {
    const txOptions = await generateTxOpts(txOpts);
    const tokenInstance = await this.contracts.loadERC20Async(
      tokenAddress,
      callerAddress
    );

    return await tokenInstance.approve(spenderAddress, value, txOptions);
  }
}
