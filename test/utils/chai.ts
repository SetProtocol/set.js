const chaiAsPromised = require('chai-as-promised');
const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const chaiJestMocks = require('chai-jest-mocks');

chai.use(chaiAsPromised);
chai.use(sinonChai);
chai.use(chaiJestMocks);

const assert = chai.assert;
const expect = chai.expect;

export {
  assert,
  expect,
  sinon,
};
