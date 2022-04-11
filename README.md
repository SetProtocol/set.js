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
2. Configure your Set.js instance to read from & write to [Ethereum, Polygon, or Optimism contracts](https://docs.tokensets.com/developers/contracts/deployed/protocol).
   Your configuration for Ethereum Mainnet (Production) might look like this:

```
const SetJsEthereumMainnetAddresses = {
  controllerAddress: "0xF1B12A7b1f0AF744ED21eEC7d3E891C48Fd3c329",
  setTokenCreatorAddress: "0x026d25C2B70Ddbb8D759f1f38d6fD6e23b60B6DF",
  basicIssuanceModuleAddress: "0x508910aA6fF3D029Dc358dD0f775877A355BA35B",
  debtIssuanceModuleAddress: "0x338BEf3f37794dd199d6910E6109125D3eCa6048",
  debtIssuanceModuleV2Address: "0x3C0CC7624B1c408cF2cF11b3961301949f2F7820",
  streamingFeeModuleAddress: "0x3D8d14b7eFb8e342189ee14c3d40dCe005EB901B",
  tradeModuleAddress: "0x45D67b9dbEA9bd51ED2B67832addEAF839628fAa",
  navIssuanceModuleAddress: "0x33f6184b1695a8Fe344Ea6b7De11aA35A74Ec300",
  protocolViewerAddress: "0x15D860670b7DC211714282f1583CF591Cc3A945E"
}
```

3. Pass in an ethereum provider to your Set.js instance (either an [ethers.js](https://docs.ethers.io/v5/) or [web3.js](https://web3js.readthedocs.io/en/v1.7.0/) will work). Your Set.js initialization might look like this:

```
const SetJsConfig = {
  ethersProvider: new ethers.providers.Web3Provider(myProvider),
  ...SetJsEthereumMainnetAddresses,
};

const SetJsInstance = new SetJs(SetJsConfig);
```

4. Begin using the Set Protocol. Try this command to see if your instance has been set up correctly (for ethereum production mainnet):

```
mySetJsInstance
  .setToken
  .fetchSetDetailsAsync(
    "0x1494CA1F11D487c2bBe4543E90080AeBa4BA3C2b",   // DeFi Pulse Index Set Token
    ["0xd8EF3cACe8b4907117a45B0b125c68560532F94D"], // Basic Issuance Module
    myAccount
  )
```

#### Take a look at our [developer portal](https://docs.tokensets.com/) for more information on Set Protocol.
