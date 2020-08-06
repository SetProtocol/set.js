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

import values from 'lodash/values';
import { Schema, Validator, ValidatorResult } from 'jsonschema';

import { schemas } from './schemas';

/**
 * Borrowed, with slight modification, from the wonderful dharma codebase and 0x.js project codebase:
 * https://github.com/0xProject/0x.js/tree/development/packages/json-schemas
 */
export class SchemaValidator {
  private _validator: Validator;

  constructor() {
    this._validator = new Validator();

    for (const schema of values(schemas)) {
      this._validator.addSchema(schema, schema.id);
    }
  }

  public addSchema(schema: Schema) {
    this._validator.addSchema(schema, schema.id);
  }

  public validate(instance: any, schema: Schema): ValidatorResult {
    return this._validator.validate(instance, schema);
  }

  public isValid(instance: any, schema: Schema): boolean {
    const isValid = this.validate(instance, schema).errors.length === 0;
    return isValid;
  }
}
