import { TransactionOverrides } from '@setprotocol/set-protocol-v2/dist/typechain';
import { DEFAULT_GAS_LIMIT, DEFAULT_GAS_PRICE } from './constants';

export async function generateTxOpts(
  txOverrides?: TransactionOverrides,
): Promise<TransactionOverrides> {
  return {
    gasLimit: DEFAULT_GAS_LIMIT,
    gasPrice: DEFAULT_GAS_PRICE,
    ...txOverrides,
  };
}