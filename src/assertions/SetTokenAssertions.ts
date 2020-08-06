import { isValidAddress } from '../../utils/commonAssertions';
import * as errorMessages from '../errors';

export const assertGetController = (setAddress: Address) => {
  return isValidAddress(
    setAddress,
    errorMessages.GET_CONTROLLER_ASSERTION_ERROR(setAddress)
  );
};
