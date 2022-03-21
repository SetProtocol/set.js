import { Provider } from '@ethersproject/providers';
import { provider as Web3CoreProvider } from 'web3-core';
import { Address } from '@setprotocol/set-protocol-v2/utils/types';
import { BigNumber } from 'ethers/lib/ethers';
import { ZeroExApiUrls } from './utils';

export { TransactionReceipt } from 'ethereum-types';

/**
 * SetJSConfig is needed to initialize a new Set instance. SetJSConfig needs an
 * Ethereum provider (either ethers or web3). SetJSConfig also needs Set module
 * addresses which can be found on
 * https://docs.tokensets.com/contracts/deployed/protocol
 */
export interface SetJSConfig {
  ethersProvider?: Provider;
  web3Provider?: Web3CoreProvider;
  basicIssuanceModuleAddress: Address;
  controllerAddress: Address;
  masterOracleAddress: Address;
  navIssuanceModuleAddress: Address;
  protocolViewerAddress: Address;
  setTokenCreatorAddress: Address;
  streamingFeeModuleAddress: Address;
  tradeModuleAddress: Address;
  governanceModuleAddress: Address;
  debtIssuanceModuleAddress: Address;
  zeroExApiKey?: string;
  zeroExApiUrls?: ZeroExApiUrls;
  debtIssuanceModuleV2Address: Address;
  slippageIssuanceModuleAddress: Address;
  perpV2LeverageModuleAddress: Address;
  perpV2LeverageModuleViewerAddress: Address;
  perpV2BasisTradingModuleAddress: Address;
  perpV2BasisTradingModuleViewerAddress: Address;
}

export type SetDetails = {
  name: string;
  symbol: string;
  manager: string;
  modules: Address[];
  moduleStatuses: number[];
  positions: Position[]
  totalSupply: BigNumber;
};

/**
 * The base definition of a SetToken Position
 */
export type Position = {
  /**
   * Address of token in the Position
   */
  component: string;
  /**
   * If not in default state, the address of associated module
   */
  module: Address;
  /**
   * Each unit is the # of components per 10^18 of a SetToken
   */
  unit: BigNumber;
  /**
   * The type of position denoted as a uint8
   */
  positionState: number;
  /**
   * Arbitrary data
   */
  data: string;
};

export type StreamingFeeInfo = {
  /**
   * Address to accrue fees to
   */
  feeRecipient: string;
  /**
   * Percent of Set accruing to manager annually (1% = 1e16, 100% = 1e18)
   */
  streamingFeePercentage: BigNumber;
  /**
   * The amount of streaming fees that haven't been actualized to the fee receipient yet
   */
  unaccruedFees: BigNumber;
};

export type SetDetailsWithStreamingInfo = {
  /**
   * Set name (e.g. "DeFi Pulse Index")
   */
  name: string;
  /**
   * Set symbol (e.g. "DPI")
   */
  symbol: string;
  /**
   * The address of the set manager
   */
  manager: string;
  /**
   * List of module addresses that have been abled on this set
   */
  modules: Address[];
  /**
   * Status of each module represented as 0, 1, or 2. Every element in this list
   * corresponds to an element of the same index in modules.
   *
   * 0 => NONE
   * 1 => PENDING
   * 2 => INITIALIZED
   */
  moduleStatuses: number[];
  /**
   * A list of positions that compose this Set
   */
  positions: Position[];
  /**
   * Address to accrue fees to
   */
  feeRecipient: string;
  /**
   * Percent of Set accruing to manager annually (1% = 1e16, 100% = 1e18)
   */
  streamingFeePercentage: BigNumber;
  /**
   * The amount of streaming fees that haven't been actualized to the fee receipient yet
   */
  unaccruedFees: BigNumber;
};

export type Log = {
  event: string;
  address: Address;
  args: any;
};

export enum ModuleState {
  'NONE',
  'PENDING',
  'INITIALIZED',
}

// For PerpV2LeverageModuleViewerWrapper
export type VAssetDisplayInfo = {
  symbol: string;
  vAssetAddress: Address;
  positionUnit: BigNumber; // 10^18 decimals
  indexPrice: BigNumber; // 10^18 decimals
  currentLeverageRatio: BigNumber; // 10^18 decimals
};
