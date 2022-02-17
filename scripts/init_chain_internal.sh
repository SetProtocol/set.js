# #!/bin/bash

SET_PROTOCOL_JS=`pwd`

rm -rf blockchain && cp -r snapshots/0x-Kyber-Compound blockchain

ganache \
  --chain.networkId 50 \
  --miner.blockGasLimit 20000000 \
  --wallet.totalAccounts 20  \
  --wallet.defaultBalance 10000000000 \
  --wallet.mnemonic 'concert load couple harbor equip island argue ramp clarify fence smart topic'