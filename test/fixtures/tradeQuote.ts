import { BigNumber } from 'ethers';

export const tradeQuoteFixtures = {
  setDetailsResponse: {
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

  zeroExRequest: 'https://api.0x.org/swap/v1/quote',
  zeroExReponse: {
    data: {
      price: '0.082625382321048146',
      guaranteedPrice: '0.082625382321048146',
      data: '0x415565b00000000000000000000000009f8f72aa9304c8b593d555f12ef6589cc3a579a2',
      buyAmount: '41312691160507030',
      sellAmount: '499999999999793729',
      gas: '346000',
    },
  },

  ethGasStationRequest: 'https://ethgasstation.info/json/ethgasAPI.json',
  ethGasStationResponse: {
    data: {
      fast: 610,
      fastest: 610,
      safeLow: 178,
      average: 178,
    },
  },

  coinGeckoTokenRequest: 'https://tokens.coingecko.com/uniswap/all.json',
  coinGeckoTokenResponse: {
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

  coinGeckoPricesRequest: 'https://api.coingecko.com/api/v3/simple/token_price/ethereum?contract_addresses=0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2,0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2,0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e&vs_currencies=usd,usd,usd',
  coinGeckoPricesResponse: {
    data: {
      '0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e': { usd: 39087 },
      '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2': { usd: 3194.41 },
      '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2': { usd: 2493.12 },
    },
  },

  setTradeQuote: {
    from: '0x1494ca1f11d487c2bbe4543e90080aeba4ba3c2b',
    fromTokenAddress: '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2',
    toTokenAddress: '0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e',
    exchangeAdapterName: 'ZeroExApiAdapterV3',
    calldata: '0x415565b00000000000000000000000009f8f72aa9304c8b593d555f12ef6589cc3a579a2',
    gas: '520800',
    gasPrice: '61',
    slippagePercentage: '2.00%',
    fromTokenAmount: '1126868991563',
    toTokenAmount: '91245821628',
    display: {
       inputAmountRaw: '.5',
       inputAmount: '500000000000000000',
       quoteAmount: '499999999999793729',
       fromTokenDisplayAmount: '0.4999999999997937',
       toTokenDisplayAmount: '0.04131269116050703',
       fromTokenPriceUsd: '$1,597.20',
       toTokenPriceUsd: '$1,614.79',
       toToken:
        { symbol: 'MKR',
          name: 'Maker',
          address: '0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e',
          decimals: 18 },
       fromToken:
        { symbol: 'YFI',
          name: 'Yearn',
          address: '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2',
          decimals: 18 },
       gasCostsUsd: '$79.20',
       gasCostsChainCurrency: '0.0317688 ETH',
       feePercentage: '0.00%',
       slippage: '-1.10%',
    },
  },
};
