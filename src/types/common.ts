import { Address } from 'set-protocol-v2/utils/types';
import { BigNumber } from 'ethers/utils';
import { Address } from 'cluster';

export interface SetJSConfig {
  basicIssuanceModuleAddress: Address;
  controllerAddress: Address;
  streamingFeeModuleAddress: Address;
  protocolViewerAddress: Address;
  tradeModuleAddress: Address;
  navIssuanceModuleAddress: Address;
  masterOracleAddress: Address;
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
