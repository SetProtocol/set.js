/*
  Copyright 2021 Set Labs Inc.

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

'use strict';

import { BigNumber, FixedNumber, utils as ethersUtils } from 'ethers';
import BigDecimal from 'js-big-decimal';

import {
  CoinGeckoCoinPrices,
  CoinGeckoTokenMap,
  QuoteOptions,
  TradeQuote,
  TokenResponse,
} from '../../../types/index';

import SetTokenAPI from '../../SetTokenAPI';

import {
  CoinGeckoDataService,
  USD_CURRENCY_CODE
} from './coingecko';

import { GasOracleService } from './gasOracle';
import { ZeroExTradeQuoter } from './zeroex';

export const ZERO_EX_ADAPTER_NAME = 'ZeroExApiAdapterV3';
import { Address } from '@setprotocol/set-protocol-v2/utils/types';

const SCALE = BigNumber.from(10).pow(18);

/**
 * @title TradeQuoteAPI
 * @author Set Protocol
 *
 * A utility library to generate trade quotes for token pairs associated with a
 * set for Ethereum and Polygon chains. Uses 0xAPI to get quote and requires a valid
 * 0x api key.
 */

export class TradeQuoteAPI {
  private setToken: SetTokenAPI;
  private tokenMap: CoinGeckoTokenMap;
  private largeTradeGasCostBase: number = 150000;
  private tradeQuoteGasBuffer: number = 5;
  private zeroExApiKey: string;

  constructor(setToken: SetTokenAPI, zeroExApiKey: string = '') {
    this.setToken = setToken;
    this.zeroExApiKey = zeroExApiKey;
  }

  /**
   * Generates a trade quote for a token pair in a SetToken. This method requires
   * a token metadata map (passed with the options) which can be generated using
   * the CoinGeckoDataService in '.api/utils/coingecko.ts'.
   *
   * @param  options  QuoteOptions: options / config to generate the quote
   * @return          TradeQuote: trade quote object
   */
  async generate(options: QuoteOptions): Promise<TradeQuote> {
    this.tokenMap = options.tokenMap;
    const feePercentage = options.feePercentage || 0;
    const isFirmQuote = options.isFirmQuote || false;
    const chainId = options.chainId;
    const exchangeAdapterName = ZERO_EX_ADAPTER_NAME;

    const {
      fromTokenAddress,
      toTokenAddress,
      fromAddress,
    } = this.sanitizeAddress(options.fromToken, options.toToken, options.fromAddress);

    const amount = this.sanitizeAmount(fromTokenAddress, options.rawAmount);

    const setOnChainDetails = await this.setToken.fetchSetDetailsAsync(
      fromAddress, [fromTokenAddress, toTokenAddress]
    );

    const fromTokenRequestAmount = this.calculateFromTokenAmount(
      setOnChainDetails,
      fromTokenAddress,
      amount
    );

    const {
      fromTokenAmount,
      fromUnits,
      toTokenAmount,
      toUnits,
      calldata,
      zeroExGas,
    } = await this.fetchZeroExQuote( // fetchQuote (and switch...)
      fromTokenAddress,
      toTokenAddress,
      fromTokenRequestAmount,
      setOnChainDetails.manager,
      (setOnChainDetails as any).totalSupply, // Typings incorrect,
      chainId,
      isFirmQuote,
      options.slippagePercentage
    );

    // Sanity check response from quote APIs
    this.validateQuoteValues(
      setOnChainDetails,
      fromTokenAddress,
      toTokenAddress,
      fromUnits,
      toUnits
    );

    const gas = this.estimateGasCost(zeroExGas);

    const coinGecko = new CoinGeckoDataService(chainId);
    const coinPrices = await coinGecko.fetchCoinPrices({
      contractAddresses: [this.chainCurrencyAddress(chainId), fromTokenAddress, toTokenAddress],
      vsCurrencies: [ USD_CURRENCY_CODE, USD_CURRENCY_CODE, USD_CURRENCY_CODE ],
    });

    const gasOracle = new GasOracleService(chainId);
    const gasPrice = await gasOracle.fetchGasPrice();

    return {
      from: fromAddress,
      fromTokenAddress,
      toTokenAddress,
      exchangeAdapterName,
      calldata,
      gas: gas.toString(),
      gasPrice: gasPrice.toString(),
      slippagePercentage: this.formatAsPercentage(options.slippagePercentage),
      fromTokenAmount: fromUnits.toString(),
      toTokenAmount: toUnits.toString(),
      display: {
        inputAmountRaw: options.rawAmount.toString(),
        inputAmount: amount.toString(),
        quoteAmount: fromTokenRequestAmount.toString(),
        fromTokenDisplayAmount: this.tokenDisplayAmount(fromTokenAmount, fromTokenAddress),
        toTokenDisplayAmount: this.tokenDisplayAmount(toTokenAmount, toTokenAddress),
        fromTokenPriceUsd: this.tokenPriceUsd(fromTokenAmount, fromTokenAddress, coinPrices),
        toTokenPriceUsd: this.tokenPriceUsd(toTokenAmount, toTokenAddress, coinPrices),
        toToken: this.tokenResponse(toTokenAddress),
        fromToken: this.tokenResponse(fromTokenAddress),
        gasCostsUsd: this.gasCostsUsd(gasPrice, gas, coinPrices, chainId),
        gasCostsChainCurrency: this.gasCostsChainCurrency(gasPrice, gas, chainId),
        feePercentage: this.formatAsPercentage(feePercentage),
        slippage: this.calculateSlippage(
          fromTokenAmount,
          toTokenAmount,
          fromTokenAddress,
          toTokenAddress,
          coinPrices
        ),
      },
    };
  }

  private sanitizeAddress(fromToken: Address, toToken: Address, fromAddress: Address) {
    return {
      fromTokenAddress: fromToken.toLowerCase(),
      toTokenAddress: toToken.toLowerCase(),
      fromAddress: fromAddress.toLowerCase(),
    };
  }

  private sanitizeAmount(fromTokenAddress: Address, rawAmount: string): BigNumber {
    const decimals = this.tokenMap[fromTokenAddress].decimals;
    return ethersUtils.parseUnits(rawAmount, decimals);
  }

  private async fetchZeroExQuote(
    fromTokenAddress: Address,
    toTokenAddress: Address,
    fromTokenRequestAmount: BigNumber,
    manager: Address,
    setTotalSupply: BigNumber,
    chainId: number,
    isFirmQuote: boolean,
    slippagePercentage: number
  ) {
    const zeroEx = new ZeroExTradeQuoter({
      chainId: chainId,
      zeroExApiKey: this.zeroExApiKey,
    });

    const quote = await zeroEx.fetchTradeQuote(
      fromTokenAddress,
      toTokenAddress,
      fromTokenRequestAmount,
      manager,
      isFirmQuote
    );

    const fromTokenAmount = quote.sellAmount;

    // Convert to BigDecimal to get cieling in fromUnits calculation
    // This is necessary to derive the trade amount ZeroEx expects when scaling is
    // done in the TradeModule contract. (ethers.FixedNumber does not work for this case)
    const fromTokenAmountBD = new BigDecimal(fromTokenAmount.toString());
    const scaleBD = new BigDecimal(SCALE.toString());
    const setTotalSupplyBD = new BigDecimal(setTotalSupply.toString());

    const fromUnitsBD = fromTokenAmountBD.multiply(scaleBD).divide(setTotalSupplyBD, 10).ceil();
    const fromUnits = BigNumber.from(fromUnitsBD.getValue());

    const toTokenAmount = quote.buyAmount;

    // BigNumber does not do fixed point math & FixedNumber underflows w/ numbers less than 1
    // Multiply the slippage by a factor and divide the end result by same...
    const percentMultiplier = 1000;
    const slippageToleranceBN = percentMultiplier * this.outputSlippageTolerance(slippagePercentage);
    const toTokenAmountMinusSlippage = toTokenAmount.mul(slippageToleranceBN).div(percentMultiplier);
    const toUnits = toTokenAmountMinusSlippage.mul(SCALE).div(setTotalSupply);

    return {
      fromTokenAmount,
      fromUnits,
      toTokenAmount,
      toUnits,
      calldata: quote.calldata,
      zeroExGas: quote.gas,
    };
  }

  private validateQuoteValues(
    setOnChainDetails: any,
    fromTokenAddress: Address,
    toTokenAddress: Address,
    quoteFromRemainingUnits: BigNumber,
    quoteToUnits: BigNumber
  ) {
    // fromToken
    const positionForFromToken = setOnChainDetails
      .positions
      .find((p: any) => p.component.toLowerCase() === fromTokenAddress.toLowerCase());

    const currentPositionUnits = BigNumber.from(positionForFromToken.unit);
    const remainingPositionUnits = currentPositionUnits.sub(quoteFromRemainingUnits);
    const remainingPositionUnitsTooSmall = remainingPositionUnits.gt(0) && remainingPositionUnits.lt(50);

    if (remainingPositionUnitsTooSmall) {
      throw new Error('Remaining units too small, incorrectly attempting max');
    }

    // toToken
    const positionForToToken = setOnChainDetails
      .positions
      .find((p: any) => p.component.toLowerCase() === toTokenAddress.toLowerCase());

    const newToPositionUnits = (positionForToToken !== undefined)
      ? positionForToToken.unit.add(quoteToUnits)
      : quoteToUnits;

    const newToUnitsTooSmall = newToPositionUnits.gt(0) && newToPositionUnits.lt(50);

    if (newToUnitsTooSmall) {
      throw new Error('Receive units too small');
    }
  }

  private calculateFromTokenAmount(
    setOnChainDetails: any,
    fromTokenAddress: Address,
    amount: BigNumber
  ): BigNumber {
    const positionForFromToken = setOnChainDetails
      .positions
      .find((p: any) => p.component.toLowerCase() === fromTokenAddress.toLowerCase());

    if (positionForFromToken === undefined) {
      throw new Error('Invalid fromToken input');
    }

    const totalSupply = setOnChainDetails.totalSupply;
    const impliedMaxNotional = positionForFromToken.unit.mul(totalSupply).div(SCALE);
    const isGreaterThanMax = amount.gt(impliedMaxNotional);
    const isMax = amount.eq(impliedMaxNotional);

    if (isGreaterThanMax) {
      throw new Error('Amount is greater than quantity of component in Set');
    } else if (isMax) {
      return impliedMaxNotional.toString();
    } else {
      const amountMulScaleOverTotalSupply = amount.mul(SCALE).div(totalSupply);
      return amountMulScaleOverTotalSupply.mul(totalSupply).div(SCALE);
    }
  }

  private tokenDisplayAmount(amount: BigNumber, address: Address): string {
    return this.normalizeTokenAmount(amount, address).toString();
  }

  private tokenResponse(address: Address): TokenResponse {
    const tokenEntry = this.tokenMap[address];
    return {
      symbol: tokenEntry.symbol,
      name: tokenEntry.name,
      address,
      decimals: tokenEntry.decimals,
    };
  }

  private chainCurrencyAddress(chainId: number): Address {
    switch (chainId) {
      case 1:   return '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'; // WETH
      case 137: return '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270'; // WMATIC
      default: throw new Error(`chainId: ${chainId} is not supported`);
    }
  }

  private normalizeTokenAmount(amount: BigNumber, address: Address): number {
    const tokenScale = BigNumber.from(10).pow(this.tokenMap[address].decimals);
    return FixedNumber.from(amount).divUnsafe(FixedNumber.from(tokenScale)).toUnsafeFloat();
  }

  private tokenPriceUsd(amount: BigNumber, address: Address, coinPrices: CoinGeckoCoinPrices): string {
    const coinPrice = coinPrices[address][USD_CURRENCY_CODE];
    const normalizedAmount = this.normalizeTokenAmount(amount, address) * coinPrice;
    return new Intl.NumberFormat('en-US', {style: 'currency', currency: 'USD'}).format(normalizedAmount);
  }

  private formatAsPercentage(percentage: number): string {
    return percentage.toFixed(2) + '%';
  }

  private totalGasCost(gasPrice: number, gas: number): number {
    return (gasPrice / 1e9) * gas;
  }

  private gasCostsUsd(
    gasPrice: number,
    gas: number,
    coinPrices: CoinGeckoCoinPrices,
    chainId: number
  ): string {
    const totalGasCost = this.totalGasCost(gasPrice, gas);
    const chainCurrencyAddress = this.chainCurrencyAddress(chainId);
    const coinPrice = coinPrices[chainCurrencyAddress][USD_CURRENCY_CODE];
    const cost = totalGasCost * coinPrice;

    // Polygon prices are low - using 4 significant digits here so something besides zero appears
    const options = {
      style: 'currency',
      currency: 'USD',
      maximumSignificantDigits: (chainId === 137) ? 4 : undefined,
    };
    return new Intl.NumberFormat('en-US', options).format(cost);
  }

  private gasCostsChainCurrency(gasPrice: number, gas: number, chainId: number): string {
    const chainCurrency = this.chainCurrency(chainId);
    const totalGasCostText = this.totalGasCost(gasPrice, gas).toFixed(7).toString();
    return `${totalGasCostText} ${chainCurrency}`;
  }

  private chainCurrency(chainId: number): string {
    switch (chainId) {
      case 1:   return 'ETH';
      case 137: return 'MATIC';
      default:  return '';
    }
  }

  private estimateGasCost(zeroExGas: number): number {
    const gas = zeroExGas + this.largeTradeGasCostBase;
    const gasCostBuffer = (100 + this.tradeQuoteGasBuffer) / 100;
    return Math.floor(gas * gasCostBuffer);
  }

  private calculateSlippage(
    fromTokenAmount: BigNumber,
    toTokenAmount: BigNumber,
    fromTokenAddress: Address,
    toTokenAddress: Address,
    coinPrices: CoinGeckoCoinPrices
  ): string {
    const fromTokenPriceUsd = coinPrices[fromTokenAddress][USD_CURRENCY_CODE];
    const toTokenPriceUsd = coinPrices[toTokenAddress][USD_CURRENCY_CODE];

    const fromTokenTotalUsd = this.normalizeTokenAmount(fromTokenAmount, fromTokenAddress) * fromTokenPriceUsd;
    const toTokenTotalUsd = this.normalizeTokenAmount(toTokenAmount, toTokenAddress) * toTokenPriceUsd;

    const slippageRaw = (fromTokenTotalUsd - toTokenTotalUsd) / fromTokenTotalUsd;
    return this.formatAsPercentage(slippageRaw * 100);
  }

  private outputSlippageTolerance(slippagePercentage: number): number {
    return (100 - slippagePercentage) / 100;
  }
}