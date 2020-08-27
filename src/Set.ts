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

import { provider as Web3CoreProvider } from 'web3-core';

import { SetJSConfig } from './types';
import Assertions from './assertions';
import {
  ERC20API,
  FeeAPI,
  IssuanceAPI,
  SetTokenAPI,
  SystemAPI
} from '@src/api/index';

const ethersProviders = require('ethers').providers;

/**
 * @title Set
 * @author Set Protocol
 *
 * The Set class that exposes all functionality for interacting with the Set smart contracts. Methods
 * that require interaction with the Ethereum blockchain are exposed after instantiating a new instance
 * of Set with the web3 provider argument
 */
class Set {
  /**
   * An instance of the ERC20API class. Contains interfaces for interacting
   * with standard ERC20 methods such as name and symbol.
   */
  public erc20: ERC20API;

  /**
   * An instance of the FeeAPI class. Contains interfaces for interacting
   * with Fee modules.
   */
  public fees: FeeAPI;

  /**
   * An instance of the IssuanceAPI class. Contains interfaces for interacting
   * with Issuance Modules to mint and redeem SetTokens.
   */
  public issuance: IssuanceAPI;

  /**
   * An instance of the SetTokenAPI class. Contains interfaces for interacting
   * with Set Tokens.
   */
  public setToken: SetTokenAPI;

  /**
   * An instance of the SystemAPI class. Contains interfaces for interacting
   * with the Controller contract to read system state
   */
  public system: SystemAPI;

  /**
   * Instantiates a new Set instance that provides the public interface to the Set.js library
   */
  constructor(provider: Web3CoreProvider, config: SetJSConfig) {
    const ethersProvider = new ethersProviders.Web3Provider(provider);
    const assertions = new Assertions(provider);

    this.erc20 = new ERC20API(ethersProvider, assertions);
    this.fees = new FeeAPI(ethersProvider, config.streamingFeeModuleAddress, assertions);
    this.issuance = new IssuanceAPI(ethersProvider, config.basicIssuanceModuleAddress, assertions);
    this.setToken = new SetTokenAPI(
      ethersProvider,
      config.protocolViewerAddress,
      config.streamingFeeModuleAddress,
      assertions
    );
    this.system = new SystemAPI(ethersProvider, config.controllerAddress, assertions);
  }
}

export default Set;
