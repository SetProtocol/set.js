import { BigNumber } from 'ethers';

export const tradeQuoteFixtures = {
  setDetailsResponseDPI: {
    name: 'DefiPulse Index',
    symbol: 'DPI',
    manager: '0x0DEa6d942a2D8f594844F973366859616Dd5ea50',
    positions:
    [
      {
        component: '0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e',
        module: '0x0000000000000000000000000000000000000000',
        unit: BigNumber.from('0x022281f9089b0f'),
        positionState: 0,
        data: '0x',
      },
      {
        component: '0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2',
        module: '0x0000000000000000000000000000000000000000',
        unit: BigNumber.from('0x354e308b36c16b'),
        positionState: 0,
        data: '0x',
      },
    ],
    totalSupply: BigNumber.from('0x5df56bc958049751d8fb'),
  },

  setDetailsResponseBUD: { name: 'BUD Set',
    symbol: 'BUD',
    manager: '0x89A3EFC92f3FAbe59F3DeAa5e5e92773EE29fA37',
    modules: [ '0xE99447aBbD5A7730b26D2D16fCcB2086319e4bC3' ],
    moduleStatuses: [ 0, 0 ],
    positions: [
      {
       component: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
       module: '0x0000000000000000000000000000000000000000',
       unit: BigNumber.from('0x02faf080'),
       positionState: 0,
       data: '0x' },
     {
       component: '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6',
       module: '0x0000000000000000000000000000000000000000',
       unit: BigNumber.from('0x015ad9'),
       positionState: 0,
       data: '0x' },
    ],
    totalSupply: BigNumber.from(10).pow(18),
  },

  zeroExRequestEth: 'https://api.0x.org/swap/v1/quote',
  zeroExReponseEth: {
    data: {
      price: '0.082625382321048146',
      guaranteedPrice: '0.082625382321048146',
      data: '0x415565b00000000000000000000000009f8f72aa9304c8b593d555f12ef6589cc3a579a2',
      buyAmount: '41312691160507030',
      sellAmount: '499999999999793729',
      gas: '346000',
    },
  },

  zeroExRequestPoly: 'https://polygon.api.0x.org/swap/v1/quote',
  zeroExReponsePoly: {
    data: {
      price: '0.00002973',
      guaranteedPrice: '0.00002973',
      data: '0x415565b00000000000000000000000002791bca1f2de4661ed88a30c99a7a9449aa84174',
      gas: '240000',
      buyAmount: '2973',
      sellAmount: '1000000',
    },
  },

  ethGasStationRequest: 'https://ethgasstation.info/api/ethgasAPI.json',
  ethGasStationResponse: {
    data: {
      fast: 610,
      fastest: 610,
      safeLow: 178,
      average: 178,
    },
  },

  maticGasStationRequest: 'https://gasstation-mainnet.matic.network',
  maticGasStationResponse: {
    data: {
      fast: 5,
      fastest: 7.5,
      standard: 1,
    },
  },

  coinGeckoTokenRequestEth: 'https://tokens.coingecko.com/uniswap/all.json',
  coinGeckoTokenResponseEth: {
    data: {
      tokens: [
        { chainId: 1,
         address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
         name: 'Wrapped Eth',
         symbol: 'WETH',
         decimals: 18,
         logoURI: '' },
         { chainId: 1,
         address: '0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e',
         name: 'Maker',
         symbol: 'MKR',
         decimals: 18,
         logoURI: '' },
       { chainId: 1,
         address: '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2',
         name: 'Yearn',
         symbol: 'YFI',
         decimals: 18,
         logoURI: '' }],
    },
  },

  // This is actually an eth call...we use the eth list for image resources
  coinGeckoTokenRequestPoly: 'https://tokens.coingecko.com/polygon-pos/all.json',
  coinGeckoTokenResponsePoly: {
    data: {
      tokens: [
        { chainId: 1,
         address: '0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0',
         name: 'Matic Token',
         symbol: 'MATIC',
         decimals: 18,
         logoURI: '' },
         { chainId: 1,
         address: '0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6',
         name: 'Wrapped BTC',
         symbol: 'WBTC',
         decimals: 8,
         logoURI: '' },
       { chainId: 1,
         address: '0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
         name: 'USD Coin',
         symbol: 'USDC',
         decimals: 6,
         logoURI: '' }],
    },
  },

  coinGeckoPricesRequestEth: 'https://api.coingecko.com/api/v3/simple/token_price/ethereum?contract_addresses=0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2,0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2,0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e&vs_currencies=usd,usd,usd',
  coinGeckoPricesResponseEth: {
    data: {
      '0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e': { usd: 39087 },
      '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2': { usd: 3194.41 },
      '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2': { usd: 2493.12 },
    },
  },

  coinGeckoPricesRequestPoly: 'https://api.coingecko.com/api/v3/simple/token_price/polygon-pos?contract_addresses=0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270,0x2791bca1f2de4661ed88a30c99a7a9449aa84174,0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6&vs_currencies=usd,usd,usd',
  coinGeckoPricesResponsePoly: {
    data: {
      '0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6': { usd: 33595 },
      '0x2791bca1f2de4661ed88a30c99a7a9449aa84174': { usd: 1.01 },
      '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270': { usd: 1.49 },
    },
  },

  setTradeQuoteEth: {
    from: '0x1494ca1f11d487c2bbe4543e90080aeba4ba3c2b',
    fromTokenAddress: '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2',
    toTokenAddress: '0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e',
    exchangeAdapterName: 'ZeroExApiAdapterV4',
    calldata: '0x415565b00000000000000000000000009f8f72aa9304c8b593d555f12ef6589cc3a579a2',
    gas: '315000',
    gasPrice: '61',
    slippagePercentage: '2.00%',
    fromTokenAmount: '1126868991563',
    toTokenAmount: '90314741816',
    display: {
       inputAmountRaw: '.5',
       inputAmount: '500000000000000000',
       quoteAmount: '499999999999793729',
       fromTokenDisplayAmount: '0.4999999999997937',
       toTokenDisplayAmount: '0.04131269116050703',
       fromTokenPriceUsd: '$1,597.20',
       toTokenPriceUsd: '$1,614.79',
       gasCostsUsd: '$47.91',
       gasCostsChainCurrency: '0.0192150 ETH',
       feePercentage: '1.00%',
       slippage: '-1.10%',
    },
  },

  setSwapQuoteEth: {
    from: '0x1494ca1f11d487c2bbe4543e90080aeba4ba3c2b',
    fromTokenAddress: '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2',
    toTokenAddress: '0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e',
    calldata: '0x415565b00000000000000000000000009f8f72aa9304c8b593d555f12ef6589cc3a579a2',
    gas: '346000',
    gasPrice: '10000000',
    slippagePercentage: '2.00%',
    fromTokenAmount: '499999999999793729',
    toTokenAmount: '41312691160507030',
  },

  setTradeQuotePoly: {
    from: '0xd7dc13984d4fe87f389e50067fb3eedb3f704ea0',
    fromTokenAddress: '0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
    toTokenAddress: '0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6',
    exchangeAdapterName: 'ZeroExApiAdapterV4',
    calldata:
     '0x415565b00000000000000000000000002791bca1f2de4661ed88a30c99a7a9449aa84174',
    gas: '315000',
    gasPrice: '5',
    slippagePercentage: '2.00%',
    fromTokenAmount: '1000000',
    toTokenAmount: '2913',
    display:
     { inputAmountRaw: '1',
       inputAmount: '1000000',
       quoteAmount: '1000000',
       fromTokenDisplayAmount: '1',
       toTokenDisplayAmount: '0.00002973',
       fromTokenPriceUsd: '$1.01',
       toTokenPriceUsd: '$1.00',
       gasCostsUsd: '$0.002347',
       gasCostsChainCurrency: '0.0015750 MATIC',
       feePercentage: '0.00%',
       slippage: '1.11%' },
  },

  setSwapQuotePoly: {
    from: '0xd7dc13984d4fe87f389e50067fb3eedb3f704ea0',
    fromTokenAddress: '0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
    toTokenAddress: '0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6',
    calldata:
     '0x415565b00000000000000000000000002791bca1f2de4661ed88a30c99a7a9449aa84174',
    gas: '240000',
    gasPrice: '10000000',
    slippagePercentage: '2.00%',
    fromTokenAmount: '1000000',
    toTokenAmount: '2973',
  },
};
