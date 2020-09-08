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
import { BigNumber, Arrayish } from 'ethers/utils';
import { Provider } from 'ethers/providers';

import ContractWrapper from './ContractWrapper';

/**
 * @title  OneInchExchangeAdapterWrapper
 * @author Set Protocol
 *
 * The OneInchExchangeAdapterWrapper forwards functionality from the OneInchExchangeAdapter contract
 *
 */
export default class OneInchExchangeAdapterWrapper {
  private provider: Provider;
  private contracts: ContractWrapper;

  private oneInchExchangeAdapterAddress: Address;

  public constructor(provider: Provider, oneInchExchangeAdapterAddress: Address) {
    this.provider = provider;
    this.contracts = new ContractWrapper(this.provider);
    this.oneInchExchangeAdapterAddress = oneInchExchangeAdapterAddress;
  }

  /**
   * Return 1inch calldata which is already generated from the 1inch API
   *
   * @param  sourceToken              Address of source token to be sold
   * @param  destinationToken         Address of destination token to buy
   * @param  sourceQuantity           Amount of source token to sell
   * @param  minDestinationQuantity   Min amount of destination token to buy
   * @param  data                     Arbitrage bytes containing trade call data
   *
   * @return address                  Target contract address
   * @return uint256                  Call value
   * @return bytes                    Trade calldata
   */
  public async getTradeCalldata(
    sourceToken: Address,
    destinationToken: Address,
    destinationAddress: Address,
    sourceQuantity: BigNumber,
    minDestinationQuantity: BigNumber,
    data: Arrayish,
    callerAddress?: Address,
  ): Promise<[Address, BigNumber, Arrayish]> {
    const oneInchExchangeAdapterInstance = await this.contracts.loadOneInchExchangeAdapterAsync(
      this.oneInchExchangeAdapterAddress,
      callerAddress
    );

    return await oneInchExchangeAdapterInstance.getTradeCalldata(
      sourceToken,
      destinationToken,
      destinationAddress,
      sourceQuantity,
      minDestinationQuantity,
      data
    );
  }
}
