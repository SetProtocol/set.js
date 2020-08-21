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

import { ContractTransaction } from 'ethers';
import { Provider } from 'ethers/providers';

import { Address } from '@setprotocol/set-protocol-v2/utils/types';
import { TransactionOverrides } from '@setprotocol/set-protocol-v2/dist/typechain';
import { BigNumber } from 'ethers/utils';

import BasicIssuanceModuleWrapper from '../wrappers/set-protocol-v2/BasicIssuanceModuleWrapper';
import Assertions from '../assertions';

/**
 * @title  IssuanceAPI
 * @author Set Protocol
 *
 * The IssuanceAPI exposes simple issuance and redemption functions of the BasicIssuanceModule
 * to allow minting and burning of SetTokens from the Positions of the Set
 *
 */
export default class IssuanceAPI {
  private basicIssuanceModuleWrapper: BasicIssuanceModuleWrapper;
  private assert: Assertions;

  public constructor(provider: Provider, basicIssuanceModuleAddress: Address, assertions?: Assertions) {
    this.basicIssuanceModuleWrapper = new BasicIssuanceModuleWrapper(provider, basicIssuanceModuleAddress);
    this.assert = assertions || new Assertions();
  }

  /**
   * Issue SetToken from its Position components. Each token must be approved to the Controller
   *
   * @param  setTokenAddress             Address of the SetToken contract to issue
   * @param  quantity                    Quantity to issue
   * @param  setTokenRecipientAddress    Address of the recipient of the issuance
   * @param  callerAddress               Address of caller (optional)
   * @return                             Transaction hash
   */
  public async issueAsync(
    setTokenAddress: Address,
    quantity: BigNumber,
    setTokenRecipientAddress: Address,
    callerAddress: Address = undefined,
    txOpts: TransactionOverrides = {}
  ): Promise<ContractTransaction> {
    this.assert.schema.isValidAddress('setAddress', setTokenAddress);
    this.assert.schema.isValidAddress('setTokenRecipientAddress', setTokenRecipientAddress);

    return await this.basicIssuanceModuleWrapper.issue(
      setTokenAddress,
      quantity,
      setTokenRecipientAddress,
      callerAddress,
      txOpts
    );
  }

  /**
   * Redeem a SetToken into its underlying positions
   *
   * @param  setTokenAddress           Address of the SetToken contract
   * @param  quantity                  Quantity to issue
   * @param  setTokenRecipientAddress  Address of recipient of component tokens from redemption
   * @param  callerAddress             Address of caller (optional)
   * @return                           Transaction hash of the redemption transaction
   */
  public async redeemAsync(
    setTokenAddress: Address,
    quantity: BigNumber,
    setTokenRecipientAddress: Address,
    callerAddress: Address = undefined,
    txOpts: TransactionOverrides = {}
  ): Promise<ContractTransaction> {
    this.assert.schema.isValidAddress('setAddress', setTokenAddress);

    return await this.basicIssuanceModuleWrapper.redeem(
      setTokenAddress,
      quantity,
      setTokenRecipientAddress,
      callerAddress,
      txOpts
    );
  }
}
