import { Address } from '@setprotocol/set-protocol-v2/utils/types';
import { BigNumber } from 'ethers/lib/ethers';

export interface SetJSConfig {
  basicIssuanceModuleAddress: Address;
  controllerAddress: Address;
  masterOracleAddress: Address;
  navIssuanceModuleAddress: Address;
  protocolViewerAddress: Address;
  setTokenCreatorAddress: Address;
  streamingFeeModuleAddress: Address;
  tradeModuleAddress: Address;
}

export type StreamingFeeInfo = {
  feeRecipient: string;
  streamingFeePercentage: BigNumber;
  unaccruedFees: BigNumber;
};

export enum ModuleState {
  'NONE',
  'PENDING',
  'INITIALIZED',
}
