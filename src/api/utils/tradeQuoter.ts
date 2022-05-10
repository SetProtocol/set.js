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

import BigDecimal from 'js-big-decimal';
import { BigNumber, FixedNumber, utils as ethersUtils } from 'ethers';
import type TradeModuleWrapper from '@src/wrappers/set-protocol-v2/TradeModuleWrapper';

import {
  CoinGeckoCoinPrices,
  TradeQuoteOptions,
  SwapQuoteOptions,
  TradeQuote,
  SwapQuote,
  TradeOrderPair,
  ZeroExApiUrls
} from '../../types/index';

import {
  CoinGeckoDataService,
  USD_CURRENCY_CODE
} from './coingecko';

import { Address } from '@setprotocol/set-protocol-v2/utils/types';
import { GasOracleService } from './gasOracle';
import { ZeroExTradeQuoter } from './zeroex';
import SetTokenAPI from '../SetTokenAPI';
import { SetDetails, SetDetailsWithStreamingInfo } from '../../types/common';
import { NULL_ADDRESS } from '../../utils/constants';

export const ZERO_EX_ADAPTER_NAME = 'ZeroExApiAdapterV5';

const SCALE = BigNumber.from(10).pow(18);

/**
 * @title TradeQuote
 * @author Set Protocol
 *
 * A utility library to generate trade quotes for token pairs associated with a
 * set for Ethereum and Polygon chains. Uses 0xAPI to get quote and requires a valid
 * 0x api key.
 */

export class TradeQuoter {
  private tradeQuoteGasBuffer: number = 5;
  private feeRecipient: Address = '0xD3D555Bb655AcBA9452bfC6D7cEa8cC7b3628C55';
  private feePercentage: number = 0;
  private isFirmQuote: boolean = true;
  private slippagePercentage: number = 2;
  private excludedSources: string[] = ['Kyber', 'Eth2Dai', 'Mesh'];
  private zeroExApiKey: string;
  private zeroExApiUrls: ZeroExApiUrls;

  constructor(zeroExApiKey?: string, zeroExApiUrls?: ZeroExApiUrls) {
    this.zeroExApiKey = zeroExApiKey;
    this.zeroExApiUrls = zeroExApiUrls;
  }

  /**
   * Generates a trade quote for a token pair in a SetToken. This method is useful for
   * operations like rebalancing where the ratio of existing SetToken components is modified.
   *
   * @param  options  TradeQuoteOptions: options / config to generate the trade quote
   * @return          TradeQuote: trade quote object
   */
  async generateQuoteForTrade(options: TradeQuoteOptions): Promise<TradeQuote> {
    const chainId = options.chainId;
    const feePercentage = options.feePercentage || this.feePercentage;
    const isFirmQuote = (options.isFirmQuote === false) ? false : this.isFirmQuote;
    const slippagePercentage = options.slippagePercentage || this.slippagePercentage;
    const feeRecipient = options.feeRecipient || this.feeRecipient;
    const excludedSources = options.excludedSources || this.excludedSources;

    const exchangeAdapterName = ZERO_EX_ADAPTER_NAME;

    const {
      fromTokenAddress,
      toTokenAddress,
      fromAddress,
    } = this.sanitizeAddress(options.fromToken, options.toToken, options.fromAddress);

    const amount = this.sanitizeAmount(options.rawAmount, options.fromTokenDecimals);

    const setOnChainDetails = await options.setToken.fetchSetDetailsAsync(
      fromAddress, [NULL_ADDRESS]
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
    } = await this.fetchZeroExQuoteForTradeModule( // fetchQuote (and switch...)
      fromTokenAddress,
      toTokenAddress,
      fromTokenRequestAmount,
      setOnChainDetails,
      chainId,
      isFirmQuote,
      slippagePercentage,
      feeRecipient,
      excludedSources,
      feePercentage,
    );

    // Check that the trade data we return to front-end will not generate dust positions.
    this.validateTradeDoesNotProduceDustPositions(
      setOnChainDetails,
      fromTokenAddress,
      fromUnits,
      toTokenAddress,
      toUnits
    );

    // We should use the zeroex estimates plus a constant...
    const gas = await this.estimateGasCost(
      options.tradeModule,
      fromTokenAddress,
      fromUnits,
      toTokenAddress,
      toUnits,
      exchangeAdapterName,
      fromAddress,
      calldata,
      setOnChainDetails.manager
    );

    const coinGecko = new CoinGeckoDataService(chainId);
    const coinPrices = await coinGecko.fetchCoinPrices({
      contractAddresses: [this.chainCurrencyAddress(chainId), fromTokenAddress, toTokenAddress],
      vsCurrencies: [ USD_CURRENCY_CODE, USD_CURRENCY_CODE, USD_CURRENCY_CODE ],
    });

    if (!options.gasPrice) {
      const gasOracle = new GasOracleService(chainId);
      options.gasPrice = await gasOracle.fetchGasPrice();
    }

    return {
      from: fromAddress,
      fromTokenAddress,
      toTokenAddress,
      exchangeAdapterName,
      calldata,
      gas: gas.toString(),
      gasPrice: options.gasPrice.toString(),
      slippagePercentage: this.formatAsPercentage(slippagePercentage),
      fromTokenAmount: fromUnits.toString(),
      toTokenAmount: toUnits.toString(),
      display: {
        inputAmountRaw: options.rawAmount.toString(),
        inputAmount: amount.toString(),
        quoteAmount: fromTokenRequestAmount.toString(),
        fromTokenDisplayAmount: this.tokenDisplayAmount(fromTokenAmount, options.fromTokenDecimals),
        toTokenDisplayAmount: this.tokenDisplayAmount(toTokenAmount, options.toTokenDecimals),
        fromTokenPriceUsd: this.tokenPriceUsd(
          fromTokenAmount,
          fromTokenAddress,
          options.fromTokenDecimals,
          coinPrices
        ),
        toTokenPriceUsd: this.tokenPriceUsd(
          toTokenAmount,
          toTokenAddress,
          options.toTokenDecimals,
          coinPrices
        ),
        gasCostsUsd: this.gasCostsUsd(options.gasPrice, gas, coinPrices, chainId),
        gasCostsChainCurrency: this.gasCostsChainCurrency(options.gasPrice, gas, chainId),
        feePercentage: this.formatAsPercentage(feePercentage),
        slippage: this.calculateSlippage(
          fromTokenAmount,
          toTokenAmount,
          fromTokenAddress,
          toTokenAddress,
          options.fromTokenDecimals,
          options.toTokenDecimals,
          coinPrices
        ),
      },
    };
  }

  /**
   * Generates a ZeroEx swap quote for any token pair. This method is useful for operations
   * like ExchangeIssuance where a liquid token or native chain currency is used to acquire a
   * SetToken component that will be supplied to a SetToken issuance flow.
   *
   * @param  options  SwapQuoteOptions: options / config to generate the swap quote
   * @return          SwapQuote: swap quote object
   */
  async generateQuoteForSwap(options: SwapQuoteOptions): Promise<SwapQuote> {
    const chainId = options.chainId;
    const useBuyAmount = options.useBuyAmount;
    const feeRecipient = options.feeRecipient || this.feeRecipient;
    const excludedSources = options.excludedSources || this.excludedSources;

    const isFirmQuote = (options.isFirmQuote === false)
      ? false
      : this.isFirmQuote;

    const slippagePercentage = (options.slippagePercentage !== undefined)
      ? options.slippagePercentage
      : this.slippagePercentage;

    const feePercentage = (options.feePercentage !== undefined)
      ? options.feePercentage
      : this.feePercentage;

    const {
      fromTokenAddress,
      toTokenAddress,
      fromAddress,
    } = this.sanitizeAddress(options.fromToken, options.toToken, options.fromAddress);

    const amount = BigNumber.from(options.rawAmount);

    const setManager = await options.setToken.getManagerAddressAsync(fromAddress);

    const zeroEx = new ZeroExTradeQuoter({
      chainId: chainId,
      zeroExApiKey: this.zeroExApiKey,
      zeroExApiUrls: this.zeroExApiUrls,
    });

    const quote = await zeroEx.fetchTradeQuote(
      fromTokenAddress,
      toTokenAddress,
      amount,
      useBuyAmount,
      setManager,
      isFirmQuote,
      (slippagePercentage / 100),
      feeRecipient,
      excludedSources,
      (feePercentage / 100)
    );

    return {
      from: fromAddress,
      fromTokenAddress,
      toTokenAddress,
      calldata: quote.calldata,
      gas: quote.gas.toString(),
      gasPrice: options.gasPrice.toString(),
      slippagePercentage: this.formatAsPercentage(slippagePercentage),
      fromTokenAmount: quote.sellAmount.toString(),
      toTokenAmount: quote.buyAmount.toString(),
      _quote: quote._quote,
    };
  }

  private sanitizeAddress(fromToken: Address, toToken: Address, fromAddress: Address) {
    return {
      fromTokenAddress: fromToken.toLowerCase(),
      toTokenAddress: toToken.toLowerCase(),
      fromAddress: fromAddress.toLowerCase(),
    };
  }

  private sanitizeAmount(rawAmount: string, decimals: number): BigNumber {
    return ethersUtils.parseUnits(rawAmount, decimals);
  }

  /**
   * ZeroEx returns the total quantity of component to be traded as order data.
   * This order data is submitted to Set's Trade Module, but it's format must be tweaked.
   * Set's Trade Module accepts the quantity of components to be traded per Set Token
   * in Total Supply.
   *
   * This helper converts ZeroEx's trade order data to something Trade Module can consume.
   * The converted data:
   * 1. Bakes a fee percentage to be paid to the Set Protocol.
   * 2. Is also used to complete sanity checks on possible dust positions.
   * 3. is eventually returned to the front-end, to be submitted on-chain directly.
   * (ethers.FixedNumber does not work for this case)
   * @param tokenQuantity       Component quantity to be converted.
   * @param setTotalSupply      Total supply of the Set.
   * @param isReceiveQuantity   Boolean. True if the token is being received.
   * @param slippagePercentage  The amount of slippage allowed on  the trade.
   * @param feePercentage       The fee percentage to be paid to Set. Applied if isReceiveQuantity is true.
   */
  private convertTotalSetQuantitiesToPerTokenQuantities(
    tokenQuantity: string,
    setTotalSupply: string,
    isReceiveQuantity?: boolean,
    slippagePercentage?: number,
    feePercentage?: number,
  ): BigNumber {
    if (!isReceiveQuantity) {
      const tokenAmountBD = new BigDecimal(tokenQuantity.toString());
      const scaleBD = new BigDecimal(SCALE.toString());
      const setTotalSupplyBD = new BigDecimal(setTotalSupply.toString());

      const tokenUnitsBD = tokenAmountBD.multiply(scaleBD).divide(setTotalSupplyBD, 10).ceil();
      return BigNumber.from(tokenUnitsBD.getValue());
    }

    // If we are converting "buy" quantities, we need to account for a trade fee percentage
    // & slippage. We seem to lose some precisien merely multiplying the above
    // by slippageTolerance so we re-do the math in full here.
    const percentMultiplier = 1000;
    const slippageAndFee = slippagePercentage + feePercentage;
    const slippageToleranceBN = Math.floor(percentMultiplier * this.outputSlippageTolerance(slippageAndFee));
    const tokenAmountMinusSlippage = BigNumber.from(tokenQuantity).mul(slippageToleranceBN).div(percentMultiplier);

    return tokenAmountMinusSlippage.mul(SCALE).div(setTotalSupply);
  }

  private async fetchZeroExQuoteForTradeModule(
    fromTokenAddress: Address,
    toTokenAddress: Address,
    fromTokenRequestAmount: BigNumber,
    setOnChainDetails: SetDetails | SetDetailsWithStreamingInfo,
    chainId: number,
    isFirmQuote: boolean,
    slippagePercentage: number,
    feeRecipient: Address,
    excludedSources: string[],
    feePercentage: number,
  ) {
    const manager = setOnChainDetails.manager;
    const setTotalSupply = (setOnChainDetails as any).totalSupply;

    const zeroEx = new ZeroExTradeQuoter({
      chainId: chainId,
      zeroExApiKey: this.zeroExApiKey,
      zeroExApiUrls: this.zeroExApiUrls,
    });

    const quote = await zeroEx.fetchTradeQuote(
      fromTokenAddress,
      toTokenAddress,
      fromTokenRequestAmount,
      false, // Input amount is `sellAmount` of fromToken
      manager,
      isFirmQuote,
      (slippagePercentage / 100),
      feeRecipient,
      excludedSources,
      (feePercentage / 100)
    );

    const positionForFromToken = setOnChainDetails
      .positions
      .find((p: any) => p.component.toLowerCase() === fromTokenAddress.toLowerCase());

    const currentPositionUnits = BigNumber.from(positionForFromToken.unit);
    const fromTokenImpliedMaxPositionInSet =
      currentPositionUnits
        .mul(setTotalSupply)
        .div(SCALE.toString());

    // If the trade quote returned form ZeroEx equals the target sell token's implied max
    // position in the Set, we simply return the components current position in the Set as the
    // "sell quantity" to be submitted to the Trade Module.
    // If we tried to convert the ZeroEx trade quote data to the per-token quantity, we may
    // to incorrectly calculate the per-token position, resulting in a dust position being created.
    // Remember: the Trade Module accepts trade quantities on a per-token basis.
    const fromTokenAmount = quote.sellAmount;
    let fromUnits: BigNumber;

    if (fromTokenAmount.eq(fromTokenImpliedMaxPositionInSet)) {
      fromUnits = currentPositionUnits;
    } else {
      fromUnits = this.convertTotalSetQuantitiesToPerTokenQuantities(
        fromTokenAmount.toString(),
        setTotalSupply.toString(),
      );
    }

    const toTokenAmount = quote.buyAmount;
    const toUnits = this.convertTotalSetQuantitiesToPerTokenQuantities(
      quote.buyAmount.toString(),
      setTotalSupply.toString(),
      true,
      slippagePercentage,
      feePercentage,
    );

    return {
      fromTokenAmount,
      fromUnits,
      toTokenAmount,
      toUnits,
      calldata: quote.calldata,
    };
  }


  /**
   * Check that a given batch trade does not produce dust positions in tokens being
   * sold across multiple trades. This may happen when a user tries to max sell
   * out of a token position across multiple trades in a single batch.
   *
   * @param orderPairs       A list of all trades to be made in a given batch trade txn
   * @param setToken         An instance fo the Set Token API, used to fetch total supply
   *                         required to complete validation
   * @param setTokenAddress  Set Token that will be executing the batch trade txn
   */
  public async validateBatchTradeDoesNotProduceDustPosition(
    orderPairs: TradeOrderPair[],
    setToken: SetTokenAPI,
    setTokenAddress: Address
  ): Promise<void> {
    const allSellQuantitiesByAddress = {};
    const sellTokensPresentInMultipleTrades = {};

    orderPairs.forEach((orderEntry: TradeOrderPair) => {
      const { fromToken: fromTokenAddress, fromTokenDecimals } = orderEntry;

      const fromTokenScaleBN = BigNumber.from(10).pow(fromTokenDecimals);
      const fromTokenScaleBD = new BigDecimal(fromTokenScaleBN.toString());
      const fromTokenAmountBD = new BigDecimal(orderEntry.rawAmount).multiply(fromTokenScaleBD);
      const fromTokenAmountBN = BigNumber.from(fromTokenAmountBD.getValue());

      const totalSellQuantityForComponent = allSellQuantitiesByAddress[fromTokenAddress];

      if (!totalSellQuantityForComponent) {
        allSellQuantitiesByAddress[fromTokenAddress] = fromTokenAmountBN;
      } else {
        allSellQuantitiesByAddress[fromTokenAddress] = totalSellQuantityForComponent.add(fromTokenAmountBN);
        sellTokensPresentInMultipleTrades[fromTokenAddress] = true;
      }
    });

    const setOnChainDetails = await setToken.fetchSetDetailsAsync(
      setTokenAddress, [NULL_ADDRESS]
    );

    // Check that each component being sold will not have dust position leftover.
    // We only want to check poential sell tokens that are spread across multiple trades.
    // We have other logic in place in fetchZeroExTradeQuoteForTradeModule to allow users to
    // properly max sell out of a position in a single trade.
    Object.keys(sellTokensPresentInMultipleTrades).forEach(
      (fromTokenAddress: Address) => {
        const totalSellQuantity = allSellQuantitiesByAddress[fromTokenAddress];
        const perTokenSellQuantity = this.convertTotalSetQuantitiesToPerTokenQuantities(
          totalSellQuantity.toString(),
          (setOnChainDetails as any).totalSupply,
        );

        this.validateTradeDoesNotProduceDustPositions(
          setOnChainDetails,
          fromTokenAddress,
          perTokenSellQuantity,
        );
      }
    );
  }

  /**
   * Ensures that a sell or buy quantity generated by a trade quote would not result
   * in the target Set having a very small dust position upon trade execution.
   *
   * @param setOnChainDetails  Set Token whose components are being traded
   * @param fromTokenAddress   Address of token being sold
   * @param toTokenAddress     Quantity of token being sold
   * @param fromTokenQuantity  Address of token being bought
   * @param toTokenQuantity    Quantity of token being bought
   */
  private validateTradeDoesNotProduceDustPositions(
    setOnChainDetails: any,
    fromTokenAddress: Address,
    fromTokenQuantity: BigNumber,
    toTokenAddress?: Address,
    toTokenQuantity?: BigNumber
  ) {
    // fromToken
    const positionForFromToken = setOnChainDetails
      .positions
      .find((p: any) => p.component.toLowerCase() === fromTokenAddress.toLowerCase());

    const currentPositionUnits = BigNumber.from(positionForFromToken.unit);
    const remainingPositionUnits = currentPositionUnits.sub(fromTokenQuantity);
    const remainingPositionUnitsTooSmall = remainingPositionUnits.gt(0) && remainingPositionUnits.lt(50);

    if (remainingPositionUnitsTooSmall) {
      throw new Error('Remaining units too small, incorrectly attempting sell max');
    }

    // Sometimes we use this method to only check for dust positions
    // in the sell component.
    if (!toTokenAddress && !toTokenQuantity) return;

    // toToken
    const positionForToToken = setOnChainDetails
      .positions
      .find((p: any) => p.component.toLowerCase() === toTokenAddress.toLowerCase());

    const newToPositionUnits = (positionForToToken !== undefined)
      ? positionForToToken.unit.add(toTokenQuantity)
      : toTokenQuantity;

    const newToUnitsTooSmall = newToPositionUnits.gt(0) && newToPositionUnits.lt(50);

    if (newToUnitsTooSmall) {
      throw new Error('Receive units too small, attempting to purchase dust quantity of tokens');
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

  private tokenDisplayAmount(amount: BigNumber, decimals: number): string {
    return this.normalizeTokenAmount(amount, decimals).toString();
  }

  private chainCurrencyAddress(chainId: number): Address {
    switch (chainId) {
      case 1:   return '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'; // WETH
      case 10:  return '0x4200000000000000000000000000000000000006'; // Optimism WETH
      case 137: return '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270'; // WMATIC
      default: throw new Error(`chainId: ${chainId} is not supported`);
    }
  }

  private normalizeTokenAmount(amount: BigNumber, decimals: number): number {
    const tokenScale = BigNumber.from(10).pow(decimals);
    return FixedNumber.from(amount).divUnsafe(FixedNumber.from(tokenScale)).toUnsafeFloat();
  }

  private tokenPriceUsd(
    amount: BigNumber,
    address: Address,
    decimals: number,
    coinPrices: CoinGeckoCoinPrices
  ): string {
    const coinPrice = coinPrices[address][USD_CURRENCY_CODE];
    const normalizedAmount = this.normalizeTokenAmount(amount, decimals) * coinPrice;
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

  private async estimateGasCost(
    tradeModule: TradeModuleWrapper,
    fromTokenAddress: Address,
    fromTokenUnits: BigNumber,
    toTokenAddress: Address,
    toTokenUnits: BigNumber,
    adapterName: string,
    fromAddress: Address,
    calldata: string,
    managerAddress: Address
  ): Promise<number> {
    try {
      const gas = await tradeModule.estimateGasForTradeAsync(
        fromAddress,
        adapterName,
        fromTokenAddress,
        fromTokenUnits,
        toTokenAddress,
        toTokenUnits,
        calldata,
        managerAddress
      );
      const gasCostBuffer = (100 + this.tradeQuoteGasBuffer) / 100;
      return Math.floor(gas.toNumber() * gasCostBuffer);
    } catch (error) {
      throw new Error('Unable to fetch gas cost estimate for trade' + error);
    }
  }

  private calculateSlippage(
    fromTokenAmount: BigNumber,
    toTokenAmount: BigNumber,
    fromTokenAddress: Address,
    toTokenAddress: Address,
    fromTokenDecimals: number,
    toTokenDecimals: number,
    coinPrices: CoinGeckoCoinPrices
  ): string {
    const fromTokenPriceUsd = coinPrices[fromTokenAddress][USD_CURRENCY_CODE];
    const toTokenPriceUsd = coinPrices[toTokenAddress][USD_CURRENCY_CODE];

    const fromTokenTotalUsd = this.normalizeTokenAmount(fromTokenAmount, fromTokenDecimals) * fromTokenPriceUsd;
    const toTokenTotalUsd = this.normalizeTokenAmount(toTokenAmount, toTokenDecimals) * toTokenPriceUsd;

    const slippageRaw = (fromTokenTotalUsd - toTokenTotalUsd) / fromTokenTotalUsd;
    return this.formatAsPercentage(slippageRaw * 100);
  }

  private outputSlippageTolerance(slippagePercentage: number): number {
    return (100 - slippagePercentage) / 100;
  }
}