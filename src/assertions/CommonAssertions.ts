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

import { BigNumber } from 'ethers/lib/ethers';
import { ZERO } from '@setprotocol/set-protocol-v2/dist/utils/constants';

export class CommonAssertions {
  public greaterThanZero(quantity: BigNumber, errorMessage: string) {
    if (quantity.lte(ZERO)) {
      throw new Error(errorMessage);
    }
  }

  public includes(arr1: any[], val: any, errorMessage: string) {
    if (!arr1.includes(val)) {
      throw new Error(errorMessage);
    }
  }

  public isEqualLength(arr1: any[], arr2: any[], errorMessage: string) {
    if (arr1.length !== arr2.length) {
      throw new Error(errorMessage);
    }
  }

  public isUniqueList(array: any[], errorMessage: string) {
    if ((new Set(array)).size !== array.length) {
      throw new Error(errorMessage);
    }
  }

  public isGreaterThan(quantity1: BigNumber, quantity2: BigNumber, errorMessage: string) {
    if (quantity1.lte(quantity2)) {
      throw new Error(errorMessage);
    }
  }

  public isGreaterOrEqualThan(quantity1: BigNumber, quantity2: BigNumber, errorMessage: string) {
    if (quantity1.lt(quantity2)) {
      throw new Error(errorMessage);
    }
  }

  public isLessOrEqualThan(quantity1: BigNumber, quantity2: BigNumber, errorMessage: string) {
    if (quantity1.gt(quantity2)) {
      throw new Error(errorMessage);
    }
  }

  public isMultipleOf(quantity: BigNumber, baseQuantity: BigNumber, errorMessage: string) {
    if (!quantity.mod(baseQuantity).isZero()) {
      throw new Error(errorMessage);
    }
  }

  public isValidString(value: string, errorMessage: string) {
    if (!value) {
      throw new Error(errorMessage);
    }
  }

  public isNotUndefined(value: any, errorMessage: string) {
    if (!value) {
      throw new Error(errorMessage);
    }
  }

  public isNotEmptyArray(array: any[], errorMessage: string) {
    if (array.length == 0) {
      throw new Error(errorMessage);
    }
  }

  public isValidExpiration(expiration: BigNumber, errorMessage: string) {
    if (Date.now() > expiration.mul(1000).toNumber()) {
      throw new Error(errorMessage);
    }
  }

  public isValidLength(arr: any[], len: number, errorMessage: string) {
    if (arr.length !== len) {
      throw new Error(errorMessage);
    }
  }

  public isEqualBigNumber(bigNumber1: BigNumber, bigNumber2: BigNumber, errorMessage: string) {
    if (!bigNumber1.eq(bigNumber2)) {
      throw new Error(errorMessage);
    }
  }

  public isValidAddress(address: string, errorMessage) {
    if (!address || typeof address !== 'string' || address.length !== 42) {
      throw new Error(errorMessage);
    }
  }

  public isEqualAddress(address1: string, address2: string, errorMessage: string) {
    if (address1.toLowerCase() !== address2.toLowerCase()) {
      throw new Error(errorMessage);
    }
  }

  public isDifferentAddress(address1: string, address2: string, errorMessage: string) {
    if (address1.toLowerCase() == address2.toLowerCase()) {
      throw new Error(errorMessage);
    }
  }

  public isSupportedChainId(chainId: number) {
    const validChainIds = [1, 137];

    if ( !validChainIds.includes(chainId)) {
      throw new Error(`Unsupported chainId: ${chainId}. Must be one of ${validChainIds}`);
    }
  }
}
