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

import { Provider } from 'ethers/providers';
import { Address } from 'set-protocol-v2/utils/types';
import { BigNumber } from 'ethers/utils';

import PriceOracleWrapper from '../wrappers/set-protocol-v2/PriceOracleWrapper';
import Assertions from '../assertions';

/**
 * @title  PriceOracleAPI
 * @author Set Protocol
 *
 * The PriceOracleAPI exposes methods to interact with the price oracles such as getting price between
 * two assets
 *
 */
export default class PriceOracleAPI {
  private priceOracleWrapper: PriceOracleWrapper;
  private assert: Assertions;

  public constructor(
    provider: Provider,
    masterOracleAddress: Address,
    assertions?: Assertions
  ) {
    this.priceOracleWrapper = new PriceOracleWrapper(provider, masterOracleAddress);
    this.assert = assertions || new Assertions();
  }

  /**
   *  Find price of passed asset pair, if possible. The steps it takes are:
   *  1) Check to see if a direct or inverse oracle of the pair exists,
   *  2) If not, use masterQuoteAsset to link pairs together (i.e. BTC/ETH and ETH/USDC
   *     could be used to calculate BTC/USDC).
   *  3) If not, check oracle adapters in case one or more of the assets needs external protocol data
   *     to price.
   *  4) If all steps fail, revert.
   *
   * @param assetOne         Address of first asset in pair
   * @param assetTwo         Address of second asset in pair
   *
   * @return                 Price of asset pair to 18 decimals of precision
   */
  public async getPriceAsync(
    assetOne: Address,
    assetTwo: Address,
    callerAddress: Address = undefined
  ): Promise<BigNumber> {
    this.assert.schema.isValidAddress('assetOne', assetOne);
    this.assert.schema.isValidAddress('assetTwo', assetTwo);

    return await this.priceOracleWrapper.getPrice(
      assetOne,
      assetTwo,
      callerAddress
    );
  }
}
