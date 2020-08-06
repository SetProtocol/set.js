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

// Assertions
import { CommonAssertions } from './CommonAssertions';
import { SchemaAssertions } from './SchemaAssertions';
import { Provider } from 'ethers/providers';

export class Assertions {
  public schema: SchemaAssertions;
  public common: CommonAssertions;
  // public erc20: ERC20Assertions;
  // public setToken: SetTokenAssertions;

  public constructor(provider: Provider) {
    this.schema = new SchemaAssertions();
    this.common = new CommonAssertions();
    // this.erc20 = new ERC20Assertions(web3);
    // this.setToken = new SetTokenAssertions(web3);
  }
}
