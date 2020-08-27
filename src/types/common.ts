import { Address } from 'set-protocol-v2/utils/types';

export interface SetJSConfig {
  basicIssuanceModuleAddress: Address;
  controllerAddress: Address;
  streamingFeeModuleAddress: Address;
  protocolViewerAddress: Address;
}

export enum ModuleState {
  'NONE',
  'PENDING',
  'INITIALIZED',
}
