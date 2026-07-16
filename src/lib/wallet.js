import { BrowserProvider, Contract, formatUnits, getAddress, isAddress, parseUnits } from 'ethers';
import { CHAINS, getChain } from './chains.js';

const ERC20_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function balanceOf(address) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
];

export function hasEthereum() {
  return typeof window !== 'undefined' && !!window.ethereum;
}

export async function connectWallet() {
  if (!hasEthereum()) {
    throw new Error('No browser wallet found. Install MetaMask or another EVM wallet.');
  }
  const provider = new BrowserProvider(window.ethereum);
  await provider.send('eth_requestAccounts', []);
  const signer = await provider.getSigner();
  const address = await signer.getAddress();
  const network = await provider.getNetwork();
  const chainId = Number(network.chainId);
  return { provider, signer, address, chainId };
}

export async function getAccounts() {
  if (!hasEthereum()) return [];
  const provider = new BrowserProvider(window.ethereum);
  const accounts = await provider.send('eth_accounts', []);
  return accounts.map((a) => getAddress(a));
}

export async function getChainId() {
  if (!hasEthereum()) return null;
  const provider = new BrowserProvider(window.ethereum);
  const network = await provider.getNetwork();
  return Number(network.chainId);
}

export async function switchChain(chainId) {
  if (!hasEthereum()) throw new Error('No wallet');
  const chain = getChain(chainId);
  if (!chain) throw new Error(`Unsupported chain ${chainId}`);
  const eth = window.ethereum;
  try {
    await eth.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: chain.hex }],
    });
  } catch (err) {
    // 4902 = chain not added
    if (err?.code === 4902 || err?.error?.code === 4902) {
      await eth.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: chain.hex,
            chainName: chain.name,
            nativeCurrency: {
              name: chain.nativeSymbol,
              symbol: chain.nativeSymbol,
              decimals: 18,
            },
            rpcUrls: [chain.rpcHint],
            blockExplorerUrls: [chain.explorer],
          },
        ],
      });
      return;
    }
    throw err;
  }
}

export async function getNativeBalance(address, chainId) {
  const provider = new BrowserProvider(window.ethereum);
  const bal = await provider.getBalance(address);
  const chain = getChain(chainId);
  return {
    raw: bal,
    formatted: formatUnits(bal, 18),
    symbol: chain?.nativeSymbol || 'ETH',
  };
}

export async function loadErc20(tokenAddress, owner) {
  if (!isAddress(tokenAddress)) throw new Error('Invalid token address');
  const provider = new BrowserProvider(window.ethereum);
  const checksum = getAddress(tokenAddress);
  const contract = new Contract(checksum, ERC20_ABI, provider);
  const [symbol, decimals, balance] = await Promise.all([
    contract.symbol().catch(() => 'TOKEN'),
    contract.decimals(),
    owner ? contract.balanceOf(owner) : Promise.resolve(0n),
  ]);
  return {
    address: checksum,
    symbol: String(symbol),
    decimals: Number(decimals),
    balance,
    balanceFormatted: formatUnits(balance, decimals),
    contract,
  };
}

export function erc20WithSigner(tokenAddress, signer) {
  return new Contract(getAddress(tokenAddress), ERC20_ABI, signer);
}

export { getAddress, isAddress, parseUnits, formatUnits, BrowserProvider, ERC20_ABI, CHAINS };
