/*
  Copyright 2022 Set Labs Inc.

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

import { ContractTransaction, BigNumberish, BytesLike, utils as EthersUtils } from 'ethers';
import { Provider } from '@ethersproject/providers';
import { Address } from '@setprotocol/set-protocol-v2/utils/types';
import { TransactionOverrides } from '@setprotocol/set-protocol-v2/dist/typechain';
import { IssuanceModule__factory } from '@setprotocol/set-protocol-v2/dist/typechain/factories/IssuanceModule__factory';
import { IssuanceExtension__factory } from '@setprotocol/set-v2-strategies/dist/typechain/factories/IssuanceExtension__factory';

import IssuanceExtensionWrapper from '../../wrappers/set-v2-strategies/IssuanceExtensionWrapper';
import Assertions from '../../assertions';

/**
 * @title  IssuanceExtensionAPI
 * @author Set Protocol
 *
 * The IssuanceExtensionAPI exposes methods to distribute and configure issuance fees for SetTokens
 * using the DelegatedManager system. The API also provides some helper methods to generate bytecode data packets
 * that encode module and extension initialization method calls.
 */
export default class IssuanceExtensionAPI {
  private issuanceExtensionWrapper: IssuanceExtensionWrapper;
  private assert: Assertions;

  public constructor(
    provider: Provider,
    IssuanceExtensionAddress: Address,
    assertions?: Assertions) {
    this.issuanceExtensionWrapper = new IssuanceExtensionWrapper(provider, IssuanceExtensionAddress);
    this.assert = assertions || new Assertions();
  }

  /**
   * Distributes issuance and redemption fees calculates fees for. Calculates fees for owner and methodologist
   * and sends to owner fee recipient and methodologist respectively. (Anyone can call this method.)
   *
   * @param setTokenAddress      Address of the deployed SetToken to distribute fees for
   * @param callerAddress        Address of caller (optional)
   * @param txOpts               Overrides for transaction (optional)
   */
  public async distribute(
    setTokenAddress: Address,
    callerAddress: Address = undefined,
    txOpts: TransactionOverrides = {}
  ): Promise<ContractTransaction> {
    this.assert.schema.isValidAddress('setTokenAddress', setTokenAddress);

    return await this.issuanceExtensionWrapper.distribute(
      setTokenAddress,
      callerAddress,
      txOpts
    );
  }

  /**
   * Generates IssuanceExtension initialize call bytecode to be passed as an element in the  `initializeBytecode`
   * array for the DelegatedManagerFactory's `initializeAsync` method.
   *
   * @param setTokenAddress              Instance of deployed setToken to initialize the IssuanceExtension for
   * @param maxManagerFee                Maximum fee that can be charged on issue and redeem
   * @param managerIssueFee              Fee to charge on issuance
   * @param managerRedeemFee             Fee to charge on redemption
   * @param feeRecipient                 Address to send fees to
   * @param managerIssuanceHook          Address of contract implementing pre-issuance hook function (ex: SupplyCapHook)
   *
   * @return                             Initialization bytecode
   */
  public getIssuanceExtensionInitializationBytecode(
    delegatedManagerAddress: Address
  ): BytesLike {
    this.assert.schema.isValidAddress('delegatedManagerAddress', delegatedManagerAddress);

    const moduleInterface = new EthersUtils.Interface(IssuanceExtension__factory.abi);
    return moduleInterface.encodeFunctionData('initialize', [ delegatedManagerAddress ]);
  }

  /**
   * Generates IssuanceModule initialize call bytecode to be passed as an element in the  `initializeBytecode`
   * array for the `initializeAsync` method.
   *
   * @param delegatedManagerAddress      Instance of deployed DelegatedManager to initialize the IssuanceExtension for
   *
   * @return                             Initialization bytecode
   */
  public getIssuanceModuleInitializationBytecode(
    setTokenAddress: Address,
    maxManagerFee: BigNumberish,
    managerIssueFee: BigNumberish,
    managerRedeemFee: BigNumberish,
    feeRecipientAddress: Address,
    managerIssuanceHookAddress: Address
  ): BytesLike {
    this.assert.schema.isValidAddress('setTokenAddress', setTokenAddress);
    this.assert.schema.isValidNumber('maxManagerFee', maxManagerFee);
    this.assert.schema.isValidNumber('managerIssueFee', managerIssueFee);
    this.assert.schema.isValidNumber('managerRedeemFee', managerRedeemFee);
    this.assert.schema.isValidAddress('feeRecipientAddress', feeRecipientAddress);
    this.assert.schema.isValidAddress('managerIssuanceHookAddress', managerIssuanceHookAddress);

    const moduleInterface = new EthersUtils.Interface(IssuanceModule__factory.abi);
    return moduleInterface.encodeFunctionData('initialize', [
      setTokenAddress,
      maxManagerFee,
      managerIssueFee,
      managerRedeemFee,
      feeRecipientAddress,
      managerIssuanceHookAddress,
    ]);
  }
}
