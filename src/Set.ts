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

import { SetJSConfig, DelegatedManagerSystemExtensions } from './types';
import Assertions from './assertions';
import {
  BlockchainAPI,
  ERC20API,
  FeeAPI,
  IssuanceAPI,
  SetTokenAPI,
  SystemAPI,
  TradeAPI,
  NavIssuanceAPI,
  PriceOracleAPI,
  DebtIssuanceAPI,
  DebtIssuanceV2API,
  SlippageIssuanceAPI,
  PerpV2LeverageAPI,
  PerpV2LeverageViewerAPI,
  UtilsAPI,
  DelegatedManagerFactoryAPI,
  IssuanceExtensionAPI,
  TradeExtensionAPI,
  StreamingFeeExtensionAPI,
} from './api/index';

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
   * An instance of the NavIssuanceAPI class. Contains interfaces for interacting
   * with Net Asset Value Issuance Modules to mint and redeem SetTokens.
   */
  public navIssuance: NavIssuanceAPI;

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
   * An instance of the TradeAPI class. Contains interfaces for interacting
   * with the TradeModule contract and OneInchExchangeAdapter to make trades.
   */
  public trade: TradeAPI;

  /**
   * An instance of the PriceOracleAPI class. Contains interfaces for interacting
   * with the PriceOracle contract
   */
  public priceOracle: PriceOracleAPI;

  /**
   * An instance of the DebtIssuanceAPI class. Contains interfaces for interacting
   * with the DebtIssuance contract to issue and redeem tokens.
   */
  public debtIssuance: DebtIssuanceAPI;

  /**
   * An instance of the DebtIssuanceV2API class. Contains interfaces for interacting
   * with the DebtIssuanceModuleV2 contract to issue and redeem tokens that accrue interest.
   * Primarily used for ALM.
   */
  public debtIssuanceV2: DebtIssuanceV2API;

  /**
   * An instance of the DebtIssuanceV2API class. Contains interfaces for interacting
   * with the IssuanceModule contract (an alternatively named DebtIssuanceV2 module instance)
   * to issue and redeem tokens that accrue interest. Primarily used for contracts deployed via
   * the DelegatedManagerSystem
   */
  public issuanceV2: DebtIssuanceV2API;

  /**
   * An instance of the SlippageIssuanceAPI class. Contains interfaces for interacting
   * with the SlippageIssuanceAPI contract to to trade into/from tokens during the issuance and
   * redemption step. Initially used for Perpetual Leverage Tokens.
   */
  public slippageIssuance: SlippageIssuanceAPI;

  /**
   * An instance of the PerpV2LeverageAPI class. Contains getters for fetching
   * positional (per Set) and notional (across all Sets) units for collateral, vAssets, and debt.
   * Getters return low level data; for more abstracted data use the PerpV2LeverageViewerAPI.
   */
  public perpV2Leverage: PerpV2LeverageAPI;

  /**
   * An instance of the PerpV2LeverageViewerAPI class. Contains getters for fetching total
   * collateral balance (which includes PnL and funding), virtual component leverage ratios,
   * and maximum issuance quantity computed from token supply.
   */
  public perpV2LeverageViewer: PerpV2LeverageViewerAPI;

  /**
   * Another instance of the PerpV2LeverageAPI class, but for more specialized BasisTradingModule
   * Sets.
   */
  public perpV2BasisTrading: PerpV2LeverageAPI;

  /**
   * Another instance of the PerpV2LeverageViewerAPI class, but for more specialized BasisTradingModule
   * Sets.
   */
  public perpV2BasisTradingViewer: PerpV2LeverageViewerAPI;

  /**
   * An instance of DelegatedManagerFactory class. Contains methods for deploying and initializing
   * DelegatedManagerSystem deployed SetTokens and Manager contracts
   */
  public delegatedManagerFactory: DelegatedManagerFactoryAPI;

  /**
   * Group of extension for interacting with SetTokens managed by with DelegatedManager system contracts
   */
  public extensions: DelegatedManagerSystemExtensions;

  /**
   * An instance of the UtilsAPI class. Contains interfaces for fetching swap quotes from 0x Protocol,
   * prices and token metadata from coingecko, and network gas prices from various sources
   */
  public utils: UtilsAPI;

  /**
   * An instance of the BlockchainAPI class. Contains interfaces for
   * interacting with the blockchain
   */
  public blockchain: BlockchainAPI;

  /**
   * Instantiates a new Set instance that provides the public interface to the Set.js library
   */
  constructor(config: SetJSConfig) {
    if (!config.ethersProvider && !config.web3Provider) {
      throw new Error('SetJS requires an ethersProvider or web3Provider passed in as part of the configuration');
    }
    const ethersProvider = config.ethersProvider || new ethersProviders.Web3Provider(config.web3Provider);
    const assertions = new Assertions();

    this.erc20 = new ERC20API(ethersProvider, assertions);
    this.fees = new FeeAPI(ethersProvider, config.protocolViewerAddress, config.streamingFeeModuleAddress, assertions);
    this.issuance = new IssuanceAPI(ethersProvider, config.basicIssuanceModuleAddress, assertions);
    this.setToken = new SetTokenAPI(
      ethersProvider,
      config.protocolViewerAddress,
      config.streamingFeeModuleAddress,
      config.setTokenCreatorAddress,
      assertions
    );
    this.system = new SystemAPI(ethersProvider, config.controllerAddress);
    this.trade = new TradeAPI(ethersProvider, config.tradeModuleAddress, config.zeroExApiKey, config.zeroExApiUrls);
    this.navIssuance = new NavIssuanceAPI(ethersProvider, config.navIssuanceModuleAddress);
    this.priceOracle = new PriceOracleAPI(ethersProvider, config.masterOracleAddress);
    this.debtIssuance = new DebtIssuanceAPI(ethersProvider, config.debtIssuanceModuleAddress);
    this.debtIssuanceV2 = new DebtIssuanceV2API(ethersProvider, config.debtIssuanceModuleV2Address);
    this.issuanceV2 = new DebtIssuanceV2API(ethersProvider, config.issuanceModuleAddress);
    this.slippageIssuance = new SlippageIssuanceAPI(ethersProvider, config.slippageIssuanceModuleAddress);
    this.perpV2Leverage = new PerpV2LeverageAPI(ethersProvider, config.perpV2LeverageModuleAddress);
    this.perpV2LeverageViewer = new PerpV2LeverageViewerAPI(ethersProvider, config.perpV2LeverageModuleViewerAddress);
    this.perpV2BasisTrading = new PerpV2LeverageAPI(ethersProvider, config.perpV2BasisTradingModuleAddress);
    this.perpV2BasisTradingViewer = new PerpV2LeverageViewerAPI(ethersProvider,
                                                                config.perpV2BasisTradingModuleViewerAddress);
    this.blockchain = new BlockchainAPI(ethersProvider, assertions);
    this.utils = new UtilsAPI(ethersProvider, config.zeroExApiKey, config.zeroExApiUrls);

    this.delegatedManagerFactory = new DelegatedManagerFactoryAPI(
      ethersProvider,
      config.delegatedManagerFactoryAddress
    );

    this.extensions = {
      streamingFeeExtension: new StreamingFeeExtensionAPI(ethersProvider, config.streamingFeeExtensionAddress),
      issuanceExtension: new IssuanceExtensionAPI(ethersProvider, config.issuanceExtensionAddress),
      tradeExtension: new TradeExtensionAPI(ethersProvider, config.tradeExtensionAddress),
    };
  }
}

export default Set;
