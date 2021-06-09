import { Address } from '@setprotocol/set-protocol-v2/utils/types';
import { BigNumber } from 'ethers/lib/ethers';

export type CurrencyCodePriceMap = {
  [key: string]: number
};
export type CoinGeckoCoinPrices = {
  [key: string]: CurrencyCodePriceMap
};

export type CoinGeckoTokenData = {
  chainId: number,
  address: string,
  name: string,
  symbol: string,
  decimals: number,
  logoURI?: string,
};

export type SushiswapTokenData = CoinGeckoTokenData & {
  volumeUSD: number
};

export type CoinGeckoTokenMap = {
  [key: string]: CoinGeckoTokenData
};

export type CoinPricesParams = {
  contractAddresses: string[],
  vsCurrencies: string[]
};

export type PolygonMappedTokenData = {
  [key: string]: string,
};

export type QuoteOptions = {
  fromToken: Address,
  toToken: Address,
  rawAmount: string,
  fromAddress: Address,
  chainId: number,
  tokenMap: CoinGeckoTokenMap,
  slippagePercentage: number,
  isFirmQuote?: boolean,
  feePercentage?: number
};

export type ZeroExQuote = {
  fromTokenAmount: BigNumber,
  fromUnits: BigNumber,
  toTokenAmount: BigNumber
  toUnits: BigNumber,
  calldata: string,
  zeroExGas: number
};

export type TokenResponse = {
  symbol: string,
  name: string,
  address: Address,
  decimals: number
};

export type TradeQuote = {
  from: Address,
  fromTokenAddress: Address,
  toTokenAddress: Address,
  exchangeAdapterName: string,
  calldata: string,
  gas: string,
  gasPrice: string,
  slippagePercentage: string,
  fromTokenAmount: string,
  toTokenAmount: string,
  display: {
    inputAmountRaw: string,
    inputAmount: string,
    quoteAmount: string,
    fromTokenDisplayAmount: string,
    toTokenDisplayAmount: string,
    fromTokenPriceUsd: string,
    toTokenPriceUsd: string,
    toToken: TokenResponse,
    fromToken: TokenResponse,
    gasCostsUsd: string,
    gasCostsChainCurrency: string,
    feePercentage: string,
    slippage: string
  }
};

export type ZeroExTradeQuoterOptions = {
  chainId: number,
  zeroExApiKey: string,
};

export type ZeroExQueryParams = {
  sellToken: Address,
  buyToken: Address,
  sellAmount: string,
  slippagePercentage: number,
  takerAddress: Address,
  excludedSources: string,
  skipValidation: boolean,
  feeRecipient: Address,
  buyTokenPercentageFee: number
  affiliateAddress: Address,
  intentOnFilling: boolean
};

export type ZeroExTradeQuote = {
  guaranteedPrice: number,
  price: number,
  sellAmount: BigNumber,
  buyAmount: BigNumber,
  calldata: string,
  gas: number
};

export type GasNowData = {
  standard: number,
  fast: number,
  rapid: number
};

export type GasOracleSpeed = 'average' | 'fast' | 'fastest';


