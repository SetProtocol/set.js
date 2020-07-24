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

import Web3 from 'web3';

/**
 * @title Set
 * @author Set Protocol
 *
 * The Set class that exposes all functionality for interacting with the Set smart contracts. Methods
 * that require interaction with the Ethereum blockchain are exposed after instantiating a new instance
 * of Set with the web3 provider argument
 */
class Set {
  private web3: Web3;

  /**
   * Instantiates a new Set instance that provides the public interface to the Set.js library
   */
  constructor() {
    this.web3 = new Web3();
  }
}

export default Set;