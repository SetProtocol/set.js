import { Address } from 'set-protocol-v2/utils/types';

export interface SetJSConfig {
  controllerAddress: Address;
  basicIssuanceModuleAddress: Address;
}

export enum ModuleState {
  'NONE',
  'PENDING',
  'INITIALIZED',
}
