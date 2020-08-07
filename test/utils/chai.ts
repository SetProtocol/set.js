const chaiAsPromised = require('chai-as-promised');
const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

chai.use(chaiAsPromised);
chai.use(sinonChai);

const assert = chai.assert;
const expect = chai.expect;

export {
  assert,
  expect,
  sinon,
};
