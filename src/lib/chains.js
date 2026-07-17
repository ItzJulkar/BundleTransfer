/** Supported EVM chains for MultiSend (mainnets only) */

export const CHAINS = {
  1: {
    chainId: 1,
    hex: '0x1',
    name: 'Ethereum',
    nativeSymbol: 'ETH',
    explorer: 'https://etherscan.io',
    rpcHint: 'https://ethereum.publicnode.com',
  },
  56: {
    chainId: 56,
    hex: '0x38',
    name: 'BNB Smart Chain',
    nativeSymbol: 'BNB',
    explorer: 'https://bscscan.com',
    rpcHint: 'https://bsc-dataseed.binance.org',
  },
  137: {
    chainId: 137,
    hex: '0x89',
    name: 'Polygon',
    nativeSymbol: 'POL',
    explorer: 'https://polygonscan.com',
    rpcHint: 'https://polygon-rpc.com',
  },
  42161: {
    chainId: 42161,
    hex: '0xa4b1',
    name: 'Arbitrum One',
    nativeSymbol: 'ETH',
    explorer: 'https://arbiscan.io',
    rpcHint: 'https://arb1.arbitrum.io/rpc',
  },
  10: {
    chainId: 10,
    hex: '0xa',
    name: 'Optimism',
    nativeSymbol: 'ETH',
    explorer: 'https://optimistic.etherscan.io',
    rpcHint: 'https://mainnet.optimism.io',
  },
  8453: {
    chainId: 8453,
    hex: '0x2105',
    name: 'Base',
    nativeSymbol: 'ETH',
    explorer: 'https://basescan.org',
    rpcHint: 'https://mainnet.base.org',
  },
  43114: {
    chainId: 43114,
    hex: '0xa86a',
    name: 'Avalanche C-Chain',
    nativeSymbol: 'AVAX',
    explorer: 'https://snowtrace.io',
    rpcHint: 'https://api.avax.network/ext/bc/C/rpc',
  },
  4663: {
    chainId: 4663,
    hex: '0x1237',
    name: 'Robinhood Chain',
    nativeSymbol: 'ETH',
    explorer: 'https://robinhoodchain.blockscout.com',
    rpcHint: 'https://rpc.mainnet.chain.robinhood.com',
  },
  // Monad L1 mainnet (EVM) — Multicall3 live @ 0xcA11…CA11; Disperse not deployed
  143: {
    chainId: 143,
    hex: '0x8f',
    name: 'Monad',
    nativeSymbol: 'MON',
    explorer: 'https://monadvision.com',
    rpcHint: 'https://rpc.monad.xyz',
  },
};

/** Default-first order in the network dropdown */
export const CHAIN_ORDER = [1, 56, 137, 42161, 8453, 10, 43114, 4663, 143];

export function getChain(chainId) {
  return CHAINS[Number(chainId)] || null;
}

export function explorerTx(chainId, hash) {
  const c = getChain(chainId);
  if (!c || !hash) return '#';
  return `${c.explorer}/tx/${hash}`;
}

export function explorerAddress(chainId, address) {
  const c = getChain(chainId);
  if (!c || !address) return '#';
  return `${c.explorer}/address/${address}`;
}
