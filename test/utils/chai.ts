const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const chaiJestMocks = require('chai-jest-mocks');

chai.use(chaiAsPromised);
chai.use(chaiJestMocks);

const assert = chai.assert;
const expect = chai.expect;

export {
  assert,
  expect,
};
