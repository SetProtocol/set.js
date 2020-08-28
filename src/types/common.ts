import { Address } from 'set-protocol-v2/utils/types';
import { BigNumber } from 'ethers/utils';

export interface SetJSConfig {
  basicIssuanceModuleAddress: Address;
  controllerAddress: Address;
  streamingFeeModuleAddress: Address;
  protocolViewerAddress: Address;
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
