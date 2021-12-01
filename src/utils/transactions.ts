import { TransactionOverrides } from '@setprotocol/set-protocol-v2/dist/typechain';
import { DEFAULT_GAS_LIMIT, DEFAULT_GAS_PRICE } from './constants';

export async function generateTxOpts(
  txOverrides?: TransactionOverrides,
): Promise<TransactionOverrides> {
  return {
    gasLimit: DEFAULT_GAS_LIMIT,
    // Do not set the gasPrice if EIP-1559 transaction overrides are being set.
    ...((!txOverrides?.maxPriorityFeePerGas && !txOverrides?.maxFeePerGas) && {
      gasPrice: DEFAULT_GAS_PRICE,
    }),
    ...txOverrides,
  };
}