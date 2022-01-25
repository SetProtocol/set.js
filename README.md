<p align="center"><img src="https://s3-us-west-1.amazonaws.com/set-protocol/img/assets/set-protocol-logo.png" width="64" /></p>

<p align="center">
  <a href="https://circleci.com/gh/SetProtocol/set.js">
    <img src="https://img.shields.io/circleci/build/gh/SetProtocol/set.js/master" />
  </a>
  <a href='https://github.com/SetProtocol/set.js/blob/master/LICENSE' target="_blank" rel="noopener">
    <img src='https://img.shields.io/badge/License-Apache%202.0-blue.svg' alt='License' />
  </a>
  <a href='https://www.npmjs.com/package/setprotocol.js'>
    <img src='https://img.shields.io/npm/v/set.js.svg' alt='NPM' />
  </a>
</p>

# set.js

`set.js` is a library for interacting with Set Protocol V2 smart contracts.
This library enables you to create, issue, redeem, and trade for Sets.

## Getting Started

1. Add this package to your project: `yarn install set.js`
1. Configure your Set.js instance to read & write to [Ethereum, Polygon, or Optimism contracts](https://docs.tokensets.com/developers/contracts/deployed/protocol).
1. Pass in an ethereum provider to your Set.js instance (either an [ethers.js](https://docs.ethers.io/v5/) or [web3.js](https://web3js.readthedocs.io/en/v1.7.0/) will work).
1. Begin using the Set Protocol. Try this command to see if your instance has been set up correctly (for ethereum production mainnet):

```
mySetJsInstance
  .setToken
  .fetchSetDetailsAsync(
    "0x1494CA1F11D487c2bBe4543E90080AeBa4BA3C2b",   // DeFi Pulse Index Set Token
    ["0xd8EF3cACe8b4907117a45B0b125c68560532F94D"], // Basic Issuance Module
    myAccount
  )
```

A list of all of Set's protocol contracts for mainnet [can be found here.](https://docs.tokensets.com/developers/contracts/deployed/protocol)

#### Take a look at our [developer portal](https://docs.tokensets.com/) for more information on Set Protocol.
