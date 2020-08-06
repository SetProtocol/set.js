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
import { Contract, Signer } from 'ethers';
import { Address } from 'set-protocol-v2/utils/types';

import { Controller } from 'set-protocol-v2/dist/typechain/Controller';
import { ControllerFactory } from 'set-protocol-v2/dist/typechain/ControllerFactory';
import { ERC20 } from 'set-protocol-v2/dist/utils/contracts';
import { Erc20Factory } from 'set-protocol-v2/dist/typechain/Erc20Factory';
import { IssuanceModule } from 'set-protocol-v2/dist/utils/contracts';
import { IssuanceModuleFactory } from 'set-protocol-v2/dist/typechain/IssuanceModuleFactory';
import { SetToken } from 'set-protocol-v2/dist/utils/contracts';
import { SetTokenFactory } from 'set-protocol-v2/dist/typechain/SetTokenFactory';

/**
 * @title ContractWrapper
 * @author Set Protocol
 *
 * The Contracts API handles all functions that load contracts
 *
 */
export class ContractWrapper {
  private provider: Provider;
  private cache: { [contractName: string]: Contract };

  public constructor(provider: Provider) {
    this.provider = provider;
    this.cache = {};
  }

  /**
   * Load Controller contract
   *
   * @param  controllerAddress  Address of the Controller contract
   * @param  signer             Caller of the methods
   * @return                    The Controller Contract
   */
  public async loadControllerContractAsync(
    controllerAddress: Address,
    signer: Signer,
  ): Controller {
    const cacheKey = `Controller_${controllerAddress}_${await signer.getAddress()}`;

    if (cacheKey in this.cache) {
      return this.cache[cacheKey] as Controller;
    } else {
      const controllerContract = ControllerFactory.connect(
        controllerAddress,
        signer
      );

      this.cache[cacheKey] = controllerContract;
      return controllerContract;
    }
  }

  /**
   * Load ERC20 token contract
   *
   * @param  tokenAddress       Address of the token contract
   * @param  callerAddress      Address of caller, uses first one on node if none provided.
   * @return                    ERC20 token contract instance
   */
  public async loadERC20Async(
    tokenAddress: Address,
    callerAddress?: Address,
  ): SetToken {
    const signer = (this.provider as JsonRpcProvider).getSigner(callerAddress);
    const cacheKey = `ERC20_${tokenAddress}_${await signer.getAddress()}`;

    if (cacheKey in this.cache) {
      return this.cache[cacheKey] as ERC20;
    } else {
      const tokenContract = Erc20Factory.connect(
        tokenAddress,
        signer
      );

      this.cache[cacheKey] = tokenContract;
      return tokenContract;
    }
  }

  /**
   * Load IssuanceModule contract
   *
   * @param  issuanceModuleAddress   Address of the token contract
   * @param  callerAddress           Address of caller, uses first one on node if none provided.
   * @return                         IssuanceModule contract instance
   */
  public async loadIssuanceModuleAsync(
    issuanceModuleAddress: Address,
    callerAddress?: Address,
  ): IssuanceModule {
    const signer = (this.provider as JsonRpcProvider).getSigner(callerAddress);
    const cacheKey = `ERC20_${issuanceModuleAddress}_${await signer.getAddress()}`;

    if (cacheKey in this.cache) {
      return this.cache[cacheKey] as ERC20;
    } else {
      const issuanceModuleContract = IssuanceModuleFactory.connect(
        issuanceModuleAddress,
        signer
      );

      this.cache[cacheKey] = issuanceModuleContract;
      return issuanceModuleContract;
    }
  }

  /**
   * Load Set Token contract
   *
   * @param  setTokenAddress    Address of the SetToken contract
   * @param  callerAddress      Address of caller, uses first one on node if none provided.
   * @return                    SetToken contract instance
   */
  public async loadSetTokenAsync(
    setTokenAddress: Address,
    callerAddress?: Address,
  ): SetToken {
    const signer = (this.provider as JsonRpcProvider).getSigner(callerAddress);
    const cacheKey = `SetToken_${setTokenAddress}_${await signer.getAddress()}`;

    if (cacheKey in this.cache) {
      return this.cache[cacheKey] as SetToken;
    } else {
      const setTokenContract = SetTokenFactory.connect(
        setTokenAddress,
        signer
      );

      this.cache[cacheKey] = setTokenContract;
      return setTokenContract;
    }
  }
}
