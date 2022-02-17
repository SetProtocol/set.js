import { Address } from '@setprotocol/set-protocol-v2/utils/types';
import { BigNumber } from 'ethers/lib/ethers';
import type { Provider } from '@ethersproject/providers';
import type SetTokenAPI  from '../api/SetTokenAPI';
import type TradeModuleWrapper from '../wrappers/set-protocol-v2/TradeModuleWrapper';


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

export type CoinGeckoTokenMap = {
  [key: string]: CoinGeckoTokenData
};

export type CoinPricesParams = {
  contractAddresses: string[],
  vsCurrencies: string[]
};

export type TradeQuoteOptions = {
  fromToken: Address,
  toToken: Address,
  fromTokenDecimals: number,
  toTokenDecimals: number,
  rawAmount: string,
  fromAddress: Address,
  chainId: number,
  setToken: SetTokenAPI,
  tradeModule: TradeModuleWrapper,
  provider: Provider,
  gasPrice?: number,
  slippagePercentage?: number,
  isFirmQuote?: boolean,
  feePercentage?: number,
  feeRecipient?: Address,
  excludedSources?: string[],
};

export type SwapQuoteOptions = {
  fromToken: Address,
  toToken: Address,
  rawAmount: string,
  fromAddress: Address,
  chainId: number,
  setToken: SetTokenAPI,
  gasPrice?: number,
  slippagePercentage?: number,
  isFirmQuote?: boolean,
  feePercentage?: number,
  feeRecipient?: Address,
  excludedSources?: string[],
};

export type ZeroExQuote = {
  fromTokenAmount: BigNumber,
  fromUnits: BigNumber,
  toTokenAmount: BigNumber
  toUnits: BigNumber,
  calldata: string,
  zeroExGas: number
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
    gasCostsUsd: string,
    gasCostsChainCurrency: string,
    feePercentage: string,
    slippage: string
  }
};

export type SwapQuote = {
  from: Address,
  fromTokenAddress: Address,
  toTokenAddress: Address,
  calldata: string,
  gas: string,
  gasPrice: string,
  slippagePercentage: string,
  fromTokenAmount: string,
  toTokenAmount: string,
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

export type EthGasStationData = {
  fast: number,
  fastest: number,
  safeLow: number,
  average: number
};

export type GasOracleSpeed = 'average' | 'fast' | 'fastest';


