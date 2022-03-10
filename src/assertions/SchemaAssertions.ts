/*
  Copyright 2020 Set Labs Inc.

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

import { schemaAssertionsError } from '../errors';
import { schemas, Schema, SchemaValidator } from '../schemas';

/*
 * A bunch of this has been borrowed from the awesome Dharma.js's repo
 */
export class SchemaAssertions {
  private validator: SchemaValidator;

  constructor() {
    this.validator = new SchemaValidator();
  }

  /**
   * Throws if a given input is not a valid Ethereum Address.
   *
   * @param variableName    Variable name being validated. Used for displaying error messages.
   * @param value           Value being validated.
   */
  public isValidAddress(variableName: string, value: any) {
    this.assertConformsToSchema(variableName, value, schemas.addressSchema);
  }

  /**
   * Throws if a given array of inputs is not a valid Ethereum Address.
   *
   * @param variableName    Variable name being validated. Used for displaying error messages.
   * @param value           Value being validated.
   */
  public isValidAddressList(variableName: string, values: string[]) {
    for (const value of values) {
      this.isValidAddress(variableName, value);
    }
  }

  /**
   * Throws if a given input is not a valid 32 Byte String.
   *
   * @param variableName    Variable name being validated. Used for displaying error messages.
   * @param value           Value being validated.
   */
  public isValidBytes32(variableName: string, value: any) {
    this.assertConformsToSchema(variableName, value, schemas.bytes32Schema);
  }

  /**
   * Throws if a given input is not a valid Byte String.
   *
   * @param variableName    Variable name being validated. Used for displaying error messages.
   * @param value           Value being validated.
   */
  public isValidBytes(variableName: string, value: any) {
    this.assertConformsToSchema(variableName, value, schemas.bytesSchema);
  }

  /**
   * Throws if a given input is not a valid list of Byte Strings.
   *
   * @param variableName    Variable name being validated. Used for displaying error messages.
   * @param values          Values being validated.
   */
  public isValidBytesList(variableName: string, values: any) {
    for (const value of values) {
      this.assertConformsToSchema(variableName, value, schemas.bytesSchema);
    }
  }

  /**
   * Throws if a given input is not a number.
   *
   * @param variableName    Variable name being validated. Used for displaying error messages.
   * @param value           Value being validated.
   */
  public isValidNumber(variableName: string, value: any) {
    this.assertConformsToSchema(variableName, value, schemas.numberSchema);
  }

  /**
   * Throws if a given input is not a valid list of numbers.
   *
   * @param variableName    Variable name being validated. Used for displaying error messages.
   * @param values          Values being validated.
   */
  public isValidNumberList(variableName: string, values: any) {
    for (const value of values) {
      this.assertConformsToSchema(variableName, value, schemas.numberSchema);
    }
  }

  /**
   * Throws if a given input is not a whole number.
   *
   * @param variableName    Variable name being validated. Used for displaying error messages.
   * @param value           Value being validated.
   */
  public IsValidWholeNumber(variableName: string, value: any) {
    this.assertConformsToSchema(variableName, value, schemas.wholeNumberSchema);
  }

  /**
   * Throws if a given input is not a native JS number.
   *
   * @param variableName    Variable name being validated. Used for displaying error messages.
   * @param value           Value being validated.
   */
  public isValidJsNumber(variableName: string, value: any) {
    this.assertConformsToSchema(variableName, value, schemas.jsNumberSchema);
  }

  /**
   * Throws if a given input is not a string.
   *
   * @param variableName    Variable name being validated. Used for displaying error messages.
   * @param value           Value being validated.
   */
  public isValidString(variableName: string, value: any) {
    this.assertConformsToSchema(variableName, value, schemas.stringSchema);
  }

  private assertConformsToSchema(
    variableName: string,
    value: any,
    schema: Schema
  ): void {
    const validationResult = this.validator.validate(value, schema);
    const hasValidationErrors = validationResult.errors.length > 0;

    if (hasValidationErrors) {
      throw new Error(
        schemaAssertionsError.DOES_NOT_CONFORM_TO_SCHEMA(
          variableName,
          schema.id,
          value,
          validationResult
        )
      );
    }
  }
}
