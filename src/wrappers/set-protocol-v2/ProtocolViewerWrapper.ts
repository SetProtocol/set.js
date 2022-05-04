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

import { Provider, JsonRpcProvider } from '@ethersproject/providers';
import { Address } from '@setprotocol/set-protocol-v2/utils/types';

import ContractWrapper from './ContractWrapper';
import { SetDetails, StreamingFeeInfo } from '../../types';
import { BigNumber } from 'ethers/lib/ethers';

/**
 * @title ProtocolViewerWrapper
 * @author Set Protocol
 *
 * The ProtocolViewer API handles all functions on the Protocol Viewer smart contract
 *
 */
export default class ProtocolViewerWrapper {
  private provider: Provider;
  private contracts: ContractWrapper;

  private protocolViewerAddress: Address;
  private streamingFeeModuleAddress: Address;

  public constructor(provider: Provider, protocolViewerAddress: Address, streamingFeeModuleAddress: Address) {
    this.provider = provider;
    this.contracts = new ContractWrapper(this.provider);
    this.protocolViewerAddress = protocolViewerAddress;
    this.streamingFeeModuleAddress = streamingFeeModuleAddress;
  }

  /**
   * Fetches the managers of set tokens
   *
   * @param  tokenAddresses    Addresses of ERC20 contracts to check managers for
   * @param  callerAddress     Address to use as the caller (optional)
   */
  public async batchFetchManagers(
    tokenAddresses: Address[],
    callerAddress?: Address,
  ): Promise<Address[]> {
    const protocolViewerInstance = await this.contracts.loadProtocolViewerContractAsync(
      this.protocolViewerAddress,
      (this.provider as JsonRpcProvider).getSigner(callerAddress)
    );

    return await protocolViewerInstance.batchFetchManagers(tokenAddresses);
  }

  /**
   * Fetches the streaming fee info of set tokens
   *
   * @param   tokenAddresses    Addresses of ERC20 contracts to check streaming fee for
   * @param   callerAddress     Address to use as the caller (optional)
   */
  public async batchFetchStreamingFeeInfo(
    tokenAddresses: Address[],
    callerAddress?: Address,
  ): Promise<StreamingFeeInfo[]> {
    const protocolViewerInstance = await this.contracts.loadProtocolViewerContractAsync(
      this.protocolViewerAddress,
      (this.provider as JsonRpcProvider).getSigner(callerAddress)
    );

    return await protocolViewerInstance.batchFetchStreamingFeeInfo(
      this.streamingFeeModuleAddress,
      tokenAddresses
    );
  }

  /**
   * Fetches the balance of list of set tokens and user addresses
   *
   * @param   tokenAddresses    Addresses of ERC20 contracts to check balance for
   * @param   userAddresses     Addresses of users to check balances for matched up with token index
   * @param   callerAddress     Address to use as the caller (optional)
   */
  public async batchFetchBalancesOf(
    tokenAddresses: Address[],
    userAddresses: Address[],
    callerAddress?: Address,
  ): Promise<BigNumber[]> {
    const protocolViewerInstance = await this.contracts.loadProtocolViewerContractAsync(
      this.protocolViewerAddress,
      (this.provider as JsonRpcProvider).getSigner(callerAddress)
    );

    return await protocolViewerInstance.batchFetchBalancesOf(
      tokenAddresses,
      userAddresses
    );
  }

  /**
   * Fetches the allowances of list of set tokens and owner/spender addresses
   *
   * @param   tokenAddresses    Addresses of ERC20 contracts to check alloances for
   * @param   ownerAddresses    Addresses of owners of token matched up with token index
   * @param   spenderAddresses  Addresses of spenders of token matched up with token index
   * @param   callerAddress     Address to use as the caller (optional)
   */
  public async batchFetchAllowances(
    tokenAddresses: Address[],
    ownerAddresses: Address[],
    spenderAddresses: Address[],
    callerAddress?: Address,
  ): Promise<BigNumber[]> {
    const protocolViewerInstance = await this.contracts.loadProtocolViewerContractAsync(
      this.protocolViewerAddress,
      (this.provider as JsonRpcProvider).getSigner(callerAddress)
    );

    return await protocolViewerInstance.batchFetchAllowances(
      tokenAddresses,
      ownerAddresses,
      spenderAddresses
    );
  }

  /**
   * Fetches the details of the SetToken. Accepts an array of module addresses and returns
   * the initialization statuses of each of the modules for the SetToken
   *
   * @param  setTokenAddress    Address of SetToken to fetch details for
   * @param  moduleAddresses    Addresses of modules to check initialization statuses for
   * @param  callerAddress      Address to use as the caller (optional)
   */
  public async getSetDetails(
    setTokenAddress: Address,
    moduleAddresses: Address[],
    callerAddress?: Address,
  ): Promise<SetDetails> {
    const protocolViewerInstance = await this.contracts.loadProtocolViewerContractAsync(
      this.protocolViewerAddress,
      (this.provider as JsonRpcProvider).getSigner(callerAddress)
    );

    const setDetails = await protocolViewerInstance.getSetDetails(setTokenAddress, moduleAddresses);

    return {
      name: setDetails.name,
      symbol: setDetails.symbol,
      manager: setDetails.manager,
      modules: setDetails.modules,
      moduleStatuses: setDetails.moduleStatuses,
      positions: setDetails.positions,
      totalSupply: setDetails.totalSupply,
    };
  }

  /**
   * Fetches the details of multiple SetToken contract. Accepts an array of module addresses
   * and returns the initialization statuses of each of the modules for the SetToken
   *
   * @param  setTokenAddresses    Addresses of SetToken to fetch details for
   * @param  moduleAddresses      Addresses of ERC20 contracts to check balance for
   * @param  callerAddress        Address to use as the caller (optional)
   */
  public async batchFetchDetails(
    setTokenAddress: Address[],
    moduleAddresses: Address[],
    callerAddress?: Address,
  ): Promise<SetDetails[]> {
    const protocolViewerInstance = await this.contracts.loadProtocolViewerContractAsync(
      this.protocolViewerAddress,
      (this.provider as JsonRpcProvider).getSigner(callerAddress)
    );

    /*
      Returns the result as an array of actual SetDetails objects rather than class instances
      which get translated to an array of data when passed to clients.
      Tests remain unchanged because while it is still an class instance, it can be called with `.name` or whatever key
      but once it gets translated to a string in the response, it'll be improperly rendered as an array if we don't
      do this.
    */
    return (await protocolViewerInstance.batchFetchDetails(setTokenAddress, moduleAddresses))
      .map((setDetails: SetDetails) => {
        return {
          name: setDetails.name,
          symbol: setDetails.symbol,
          manager: setDetails.manager,
          modules: setDetails.modules,
          moduleStatuses: setDetails.moduleStatuses,
          positions: setDetails.positions,
          totalSupply: setDetails.totalSupply,
        };
      });
  }
}