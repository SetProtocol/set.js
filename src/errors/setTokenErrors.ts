import { Address } from 'set-protocol-v2/utils/types';

export const setTokenErrors = {
  GET_CONTROLLER_ASSERTION_ERROR: (setAddress: Address) =>
    `Provided address ${setAddress} is not a valid address.`,
};
