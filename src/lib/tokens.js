/** Curated, high-trust tokens only — name search never returns random/viral junk. */

export const TRUSTED_TOKENS = {
  // Ethereum mainnet
  1: [
    { symbol: 'USDT', name: 'Tether USD', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6 },
    { symbol: 'USDC', name: 'USD Coin', address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6 },
    { symbol: 'WETH', name: 'Wrapped Ether', address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', decimals: 18 },
    { symbol: 'WBTC', name: 'Wrapped Bitcoin', address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', decimals: 8 },
    { symbol: 'DAI', name: 'Dai Stablecoin', address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', decimals: 18 },
    { symbol: 'LINK', name: 'Chainlink', address: '0x514910771AF9Ca656af840dff83E8264EcF986CA', decimals: 18 },
    { symbol: 'UNI', name: 'Uniswap', address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', decimals: 18 },
    { symbol: 'AAVE', name: 'Aave', address: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9', decimals: 18 },
    { symbol: 'PEPE', name: 'Pepe', address: '0x6982508145454Ce325dDbE47a25d4ec3d2311933', decimals: 18 },
    { symbol: 'SHIB', name: 'Shiba Inu', address: '0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE', decimals: 18 },
    { symbol: 'ARB', name: 'Arbitrum', address: '0xB50721BCf8d664c30412Cfbc6cf7a15145234ad1', decimals: 18 },
    { symbol: 'LDO', name: 'Lido DAO', address: '0x5A98FcBEA516Cf06857215779Fd812CA3beF1B32', decimals: 18 },
    { symbol: 'MKR', name: 'Maker', address: '0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2', decimals: 18 },
    { symbol: 'CRV', name: 'Curve DAO', address: '0xD533a949740bb3306d119CC777fa900bA034cd52', decimals: 18 },
    { symbol: 'stETH', name: 'Lido Staked ETH', address: '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84', decimals: 18 },
  ],
  // BNB Smart Chain
  56: [
    { symbol: 'USDT', name: 'Tether USD', address: '0x55d398326f99059fF775485246999027B3197955', decimals: 18 },
    { symbol: 'USDC', name: 'USD Coin', address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', decimals: 18 },
    { symbol: 'BUSD', name: 'Binance USD (legacy)', address: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56', decimals: 18 },
    { symbol: 'WBNB', name: 'Wrapped BNB', address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', decimals: 18 },
    { symbol: 'ETH', name: 'Ethereum Token', address: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8', decimals: 18 },
    { symbol: 'BTCB', name: 'Bitcoin BEP2', address: '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c', decimals: 18 },
    { symbol: 'DAI', name: 'Dai Token', address: '0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3', decimals: 18 },
    { symbol: 'CAKE', name: 'PancakeSwap', address: '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82', decimals: 18 },
    { symbol: 'XRP', name: 'XRP Token', address: '0x1D2F0da169ceB9fC7B3144628dB156f3F6c60dBE', decimals: 18 },
    { symbol: 'DOGE', name: 'Dogecoin', address: '0xbA2aE424d960c26247Dd6c32edC70B295c744C43', decimals: 8 },
    { symbol: 'ADA', name: 'Cardano Token', address: '0x3EE2200Efb3400fAbB9AacF31297cBdD1d435D47', decimals: 18 },
    { symbol: 'LINK', name: 'ChainLink Token', address: '0xF8A0BF9cF54Bb92F17374d9e9A321E6a111a51bD', decimals: 18 },
  ],
  // Polygon
  137: [
    { symbol: 'USDT', name: 'Tether USD', address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', decimals: 6 },
    { symbol: 'USDC', name: 'USD Coin (native)', address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', decimals: 6 },
    { symbol: 'USDC.e', name: 'Bridged USD Coin', address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', decimals: 6 },
    { symbol: 'WETH', name: 'Wrapped Ether', address: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619', decimals: 18 },
    { symbol: 'WMATIC', name: 'Wrapped POL', address: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270', decimals: 18 },
    { symbol: 'DAI', name: 'Dai Stablecoin', address: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063', decimals: 18 },
    { symbol: 'WBTC', name: 'Wrapped Bitcoin', address: '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6', decimals: 8 },
    { symbol: 'LINK', name: 'Chainlink', address: '0x53E0bca35eC356BD5ddDFebbD1Fc0fD03FaBad39', decimals: 18 },
    { symbol: 'AAVE', name: 'Aave', address: '0xD6DF932A45C0f255f85145f286eA0b292B21C90B', decimals: 18 },
  ],
  // Arbitrum One
  42161: [
    { symbol: 'USDT', name: 'Tether USD', address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', decimals: 6 },
    { symbol: 'USDC', name: 'USD Coin', address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', decimals: 6 },
    { symbol: 'USDC.e', name: 'Bridged USD Coin', address: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8', decimals: 6 },
    { symbol: 'WETH', name: 'Wrapped Ether', address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', decimals: 18 },
    { symbol: 'WBTC', name: 'Wrapped Bitcoin', address: '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f', decimals: 8 },
    { symbol: 'DAI', name: 'Dai Stablecoin', address: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', decimals: 18 },
    { symbol: 'ARB', name: 'Arbitrum', address: '0x912CE59144191C1204E64559FE8253a0e49E6548', decimals: 18 },
    { symbol: 'LINK', name: 'Chainlink', address: '0xf97f4df75117a78c1A5a0DBb814Af92458539FB4', decimals: 18 },
    { symbol: 'GMX', name: 'GMX', address: '0xfc5A1A6EB076a2C7aD06eD22C90d7E710E35ad0a', decimals: 18 },
  ],
  // Optimism
  10: [
    { symbol: 'USDT', name: 'Tether USD', address: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58', decimals: 6 },
    { symbol: 'USDC', name: 'USD Coin', address: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85', decimals: 6 },
    { symbol: 'USDC.e', name: 'Bridged USD Coin', address: '0x7F5c764cBc14f9669B88837ca1490cCa17c31607', decimals: 6 },
    { symbol: 'WETH', name: 'Wrapped Ether', address: '0x4200000000000000000000000000000000000006', decimals: 18 },
    { symbol: 'DAI', name: 'Dai Stablecoin', address: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', decimals: 18 },
    { symbol: 'WBTC', name: 'Wrapped Bitcoin', address: '0x68f180fcCe6836688e9084f035309E29Bf0A2095', decimals: 8 },
    { symbol: 'OP', name: 'Optimism', address: '0x4200000000000000000000000000000000000042', decimals: 18 },
    { symbol: 'LINK', name: 'Chainlink', address: '0x350a791Bfc2C21F9Ed5d10980Dad2e2638ffa7f6', decimals: 18 },
  ],
  // Base
  8453: [
    { symbol: 'USDC', name: 'USD Coin', address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', decimals: 6 },
    { symbol: 'USDbC', name: 'Bridged USD Coin', address: '0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA', decimals: 6 },
    { symbol: 'WETH', name: 'Wrapped Ether', address: '0x4200000000000000000000000000000000000006', decimals: 18 },
    { symbol: 'DAI', name: 'Dai Stablecoin', address: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb', decimals: 18 },
    { symbol: 'cbETH', name: 'Coinbase Wrapped Staked ETH', address: '0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22', decimals: 18 },
    { symbol: 'cbBTC', name: 'Coinbase Wrapped BTC', address: '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf', decimals: 8 },
    { symbol: 'AERO', name: 'Aerodrome', address: '0x940181a94A35A4569E4529A3CDfB74e38FD98631', decimals: 18 },
  ],
  // Avalanche C-Chain
  43114: [
    { symbol: 'USDT', name: 'Tether USD', address: '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7', decimals: 6 },
    { symbol: 'USDC', name: 'USD Coin', address: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E', decimals: 6 },
    { symbol: 'USDC.e', name: 'Bridged USD Coin', address: '0xA7D7079b0FEaD91F3e65f86E8915Cb59c1a4C664', decimals: 6 },
    { symbol: 'WAVAX', name: 'Wrapped AVAX', address: '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7', decimals: 18 },
    { symbol: 'WETH.e', name: 'Wrapped Ether', address: '0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB', decimals: 18 },
    { symbol: 'WBTC.e', name: 'Wrapped Bitcoin', address: '0x50b7545627a5162F82A992c33b87aDc75187B218', decimals: 8 },
    { symbol: 'DAI.e', name: 'Dai Stablecoin', address: '0xd586E7F844cEa2F87f50152665BCbc2C279D8d70', decimals: 18 },
    { symbol: 'LINK.e', name: 'Chainlink', address: '0x5947BB275c521040051D82396192181b413227A3', decimals: 18 },
  ],
  // Robinhood Chain — new L2; curated list starts empty beyond native.
  // Name search returns nothing until tokens are verified & added here.
  // Custom contract paste still allowed with explicit warning.
  4663: [],
};

/**
 * Does query match the chain's native gas coin (ETH / BNB / POL / AVAX…)?
 * Native is NOT an ERC-20 — surface it so "eth" finds real ETH, not only WETH.
 */
export function matchesNativeQuery(query, nativeSymbol) {
  const q = String(query || '').trim().toLowerCase();
  if (!nativeSymbol) return !q; // empty query always offers native first
  const sym = String(nativeSymbol).toLowerCase();
  if (!q) return true;
  if (q === 'native' || q === 'coin' || q === 'gas') return true;
  if (q === sym || sym.startsWith(q) || q.startsWith(sym)) return true;
  // common aliases
  if (sym === 'eth' && ['ether', 'ethereum', 'eth'].some((a) => a.startsWith(q) || q.startsWith(a))) return true;
  if (sym === 'bnb' && ['bnb', 'binance'].some((a) => a.startsWith(q) || q.startsWith(a))) return true;
  if ((sym === 'pol' || sym === 'matic') && ['pol', 'matic', 'polygon'].some((a) => a.startsWith(q) || q.startsWith(a))) return true;
  if (sym === 'avax' && ['avax', 'avalanche'].some((a) => a.startsWith(q) || q.startsWith(a))) return true;
  return false;
}

/**
 * Search assets: native coin (if matched) + curated trusted ERC-20s only.
 * Never invents random viral tokens.
 * @param {number|string} chainId
 * @param {string} query
 * @param {{ nativeSymbol?: string, limit?: number }} opts
 * @returns {Array<{kind:'native'|'erc20', symbol, name, address?, decimals?, chainId, score?}>}
 */
export function searchTrustedTokens(chainId, query, opts = {}) {
  const limit = opts.limit ?? 12;
  const nativeSymbol = opts.nativeSymbol || null;
  const list = TRUSTED_TOKENS[Number(chainId)] || [];
  const q = String(query || '').trim().toLowerCase();
  const id = Number(chainId);

  // If looks like address, do NOT name-search — caller handles contract path
  if (/^0x[a-fA-F0-9]{6,}$/.test(q)) {
    return [];
  }

  const out = [];

  if (nativeSymbol && matchesNativeQuery(q, nativeSymbol)) {
    out.push({
      kind: 'native',
      symbol: nativeSymbol,
      name: `Native ${nativeSymbol} (gas coin)`,
      address: null,
      decimals: 18,
      chainId: id,
      score: 1000,
    });
  }

  if (!q) {
    for (const t of list.slice(0, Math.max(0, limit - out.length))) {
      out.push({ ...t, kind: 'erc20', chainId: id, score: 0 });
    }
    return out.slice(0, limit);
  }

  const scored = [];
  for (const t of list) {
    const sym = t.symbol.toLowerCase();
    const name = t.name.toLowerCase();
    let score = 0;
    if (sym === q) score = 100;
    else if (sym.startsWith(q)) score = 80;
    else if (sym.includes(q)) score = 60;
    else if (name.startsWith(q)) score = 50;
    else if (name.includes(q)) score = 30;
    if (score > 0) scored.push({ ...t, kind: 'erc20', chainId: id, score });
  }
  scored.sort((a, b) => b.score - a.score || a.symbol.localeCompare(b.symbol));
  for (const t of scored) {
    if (out.length >= limit) break;
    out.push(t);
  }
  return out;
}

export function findTrustedByAddress(chainId, address) {
  if (!address) return null;
  const list = TRUSTED_TOKENS[Number(chainId)] || [];
  const lower = address.toLowerCase();
  return list.find((t) => t.address.toLowerCase() === lower) || null;
}
