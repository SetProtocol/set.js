import { Provider } from '@ethersproject/providers';
import { provider as Web3CoreProvider } from 'web3-core';
import { Address } from '@setprotocol/set-protocol-v2/utils/types';
import { BigNumber } from 'ethers/lib/ethers';

export { TransactionReceipt } from 'ethereum-types';

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
}

export type SetDetails = {
  name: string;
  symbol: string;
  manager: string;
  modules: Address[];
  moduleStatuses: number[];
  positions: Position[]
};

export type Position = {
  component: string;
  module: Address;
  unit: BigNumber;
  positionState: number;
  data: string;
};

export type StreamingFeeInfo = {
  feeRecipient: string;
  streamingFeePercentage: BigNumber;
  unaccruedFees: BigNumber;
};

export type SetDetailsWithStreamingInfo = {
  name: string;
  symbol: string;
  manager: string;
  modules: Address[];
  moduleStatuses: number[];
  positions: Position[];
  feeRecipient: string;
  streamingFeePercentage: BigNumber;
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
