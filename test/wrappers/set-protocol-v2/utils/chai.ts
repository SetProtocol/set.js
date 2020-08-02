const chaiAsPromised = require('chai-as-promised');
const chai = require('chai');

chai.use(chaiAsPromised);

const assert = chai.assert;
const expect = chai.expect;

export {
  assert,
  expect,
};
