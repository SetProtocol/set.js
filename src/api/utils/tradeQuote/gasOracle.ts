/*
  Copyright 2021 Set Labs Inc.

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

import axios from 'axios';
import Assertions from '../../../assertions';

import {
  EthGasStationData,
  GasOracleSpeed,
} from '../../../types';

/**
 * @title GasOracleService
 * @author Set Protocol
 *
 * A utility library for fetching current gas prices by speed for Ethereum and Polygon chains
 */
export class GasOracleService {
  chainId: number;
  private assert: Assertions;

  static AVERAGE: GasOracleSpeed = 'average';
  static FAST: GasOracleSpeed = 'fast';
  static FASTEST: GasOracleSpeed = 'fastest';

  constructor(chainId: number) {
    this.assert = new Assertions();
    this.assert.common.isSupportedChainId(chainId);
    this.chainId = chainId;
  }

  /**
   * Returns current gas price estimate for one of 'average', 'fast', 'fastest' speeds.
   * Default speed is 'fast'
   *
   * @param  speed  speed at which tx hopes to be mined / validated by platform
   * @return        gas price to use
   */
  async fetchGasPrice(speed: GasOracleSpeed = 'fast'): Promise<number> {
    this.assert.common.includes(['average', 'fast', 'fastest'], speed, 'Unsupported speed');

    switch (this.chainId) {
      case 1: return this.getEthereumGasPrice(speed);
      case 137: return this.getPolygonGasPrice(speed);

      // This case should never run because chainId is validated
      // Needed to stop TS complaints about return sig
      default: return 0;
    }
  }

  private async getEthereumGasPrice(speed: GasOracleSpeed): Promise<number> {
    const url = 'https://ethgasstation.info/json/ethgasAPI.json';
    const data: EthGasStationData = (await axios.get(url)).data;

    // EthGasStation returns gas price in x10 Gwei (divite by 10 to convert it to gwei)
    switch (speed) {
      case GasOracleService.AVERAGE: return data.average / 10;
      case GasOracleService.FAST:    return data.fast / 10;
      case GasOracleService.FASTEST: return data.fastest / 10;
    }
  }

  private async getPolygonGasPrice(speed: GasOracleSpeed): Promise<number> {
    const url = 'https://gasstation-mainnet.matic.network';
    const data = (await axios.get(url)).data;

    switch (speed) {
      case GasOracleService.AVERAGE: return data.standard;
      case GasOracleService.FAST:    return data.fast;
      case GasOracleService.FASTEST: return data.fastest;
    }
  }
}
