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

import { Provider, JsonRpcProvider } from 'ethers/providers';
import { Address } from 'set-protocol-v2/utils/types';

import ContractWrapper from './ContractWrapper';

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
   * @param  tokenAddresses    Addresses of ERC20 contracts to check balance for
   * @param  callerAddress     (Optional) Address to use as the caller
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
   * @param  tokenAddresses    Addresses of ERC20 contracts to check balance for
   * @param  callerAddress     (Optional) Address to use as the caller
   */
  public async batchFetchStreamingFeeInfo(
    tokenAddresses: Address[],
    callerAddress?: Address,
  ): Promise<Address[]> {
    const protocolViewerInstance = await this.contracts.loadProtocolViewerContractAsync(
      this.protocolViewerAddress,
      (this.provider as JsonRpcProvider).getSigner(callerAddress)
    );

    return await protocolViewerInstance.batchFetchStreamingFeeInfo(
      this.streamingFeeModuleAddress,
      tokenAddresses
    );
  }
}