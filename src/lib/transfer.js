/**
 * ONE-transaction multi-send. No surprise deploys.
 *
 * Native ETH path (Robinhood & most L2s):
 *   Multicall3.aggregate3Value — already on-chain, 1 sign, no setup fee
 *
 * If classic Disperse / shared MultiSend already live → use those (slightly cheaper)
 * Never auto-deploy contracts on first send (kills trust / first-tx UX).
 */

import {
  Contract,
  parseUnits,
  formatUnits,
  MaxUint256,
  getCreate2Address,
  keccak256,
  zeroPadValue,
} from 'ethers';
import { BrowserProvider } from './wallet.js';
import { compareDecimals } from './parse.js';
import { MULTISEND_ABI, MULTISEND_BYTECODE } from './multisendArtifact.js';

export const DISPERSE_ADDRESS = '0xD152f549545093347A162Dce210e7293f1452150';

const DISPERSE_ABI = [
  'function disperseEther(address[] recipients, uint256[] values) payable',
  'function disperseToken(address token, address[] recipients, uint256[] values)',
];

const MULTICALL3 = '0xcA11bde05977b3631167028862bE2a173976CA11';
const MULTICALL3_ABI = [
  'function aggregate3Value((address target, bool allowFailure, uint256 value, bytes callData)[] calls) payable returns ((bool success, bytes returnData)[] returnData)',
];

/** Optional pre-existing CREATE2 MultiSend — only used if already deployed by someone */
export const CREATE2_DEPLOYER = '0x4e59b44847b379578588920cA78FbF26c0B4956C';
export const MULTISEND_SALT = zeroPadValue('0x01', 32);
export const MULTISEND_CREATE2_ADDRESS = getCreate2Address(
  CREATE2_DEPLOYER,
  MULTISEND_SALT,
  keccak256(MULTISEND_BYTECODE)
);

const ERC20_ABI = [
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function transfer(address to, uint256 amount) returns (bool)',
];

const LS_KEY = 'multisend.batchContract.v1';

export function assertEnoughBalance({ totalAmount, balanceFormatted, symbol }) {
  if (compareDecimals(balanceFormatted, totalAmount) < 0) {
    throw new Error(
      `Insufficient ${symbol} balance. Need ${totalAmount}, have ${trimNum(balanceFormatted)}.`
    );
  }
}

function trimNum(s) {
  if (!s.includes('.')) return s;
  const [a, b] = s.split('.');
  return `${a}.${b.slice(0, 8)}`;
}

async function hasCode(provider, address) {
  if (!address) return false;
  try {
    const code = await provider.getCode(address);
    return !!(code && code !== '0x' && code.length > 2);
  } catch {
    return false;
  }
}

function loadStoredBatch(chainId) {
  try {
    const all = JSON.parse(localStorage.getItem(LS_KEY) || '{}');
    return all[String(chainId)] || null;
  } catch {
    return null;
  }
}

/**
 * Prefer already-live low-overhead batchers; else Multicall3 (no deploy).
 * NEVER returns "please deploy".
 */
export async function resolveBatchExecutor(provider, chainId) {
  if (await hasCode(provider, DISPERSE_ADDRESS)) {
    return { type: 'disperse', address: DISPERSE_ADDRESS };
  }
  if (await hasCode(provider, MULTISEND_CREATE2_ADDRESS)) {
    return { type: 'multisend', address: MULTISEND_CREATE2_ADDRESS };
  }
  const stored = loadStoredBatch(chainId);
  if (stored && (await hasCode(provider, stored))) {
    return { type: 'multisend', address: stored };
  }
  if (await hasCode(provider, MULTICALL3)) {
    return { type: 'multicall3', address: MULTICALL3 };
  }
  return { type: 'none', address: null };
}

function buildArrays(valid, mode, tokenDecimals) {
  const recipients = valid.map((r) => r.address);
  const decimals = mode === 'native' ? 18 : tokenDecimals;
  const values = valid.map((r) => parseUnits(r.amount, decimals));
  const total = values.reduce((a, b) => a + b, 0n);
  return { recipients, values, total };
}

/** Minimal fee overrides — tight gasLimit, network base fee, tip 0 on L2s. */
async function txOverrides(provider, gasEstimate) {
  const fee = await provider.getFeeData();
  const o = {};
  if (gasEstimate != null) {
    // 5% headroom only
    o.gasLimit = (gasEstimate * 105n) / 100n;
  }
  if (fee.maxFeePerGas != null) {
    // Use network maxFee; zero tip when chain uses tip=0 (Robinhood)
    o.maxFeePerGas = fee.maxFeePerGas;
    o.maxPriorityFeePerGas = fee.maxPriorityFeePerGas ?? 0n;
  } else if (fee.gasPrice != null) {
    o.gasPrice = fee.gasPrice;
  }
  return o;
}

export async function estimateBatchGas({
  signer,
  rows,
  mode,
  tokenAddress,
  tokenDecimals,
  chainId,
}) {
  const valid = rows.filter((r) => r.ok);
  if (!valid.length) throw new Error('No valid rows');
  const provider = signer.provider;
  let exec = await resolveBatchExecutor(provider, chainId);
  if (mode === 'erc20' && exec.type === 'multicall3') {
    exec = { type: 'none', address: null };
  }
  const { recipients, values, total } = buildArrays(valid, mode, tokenDecimals);
  const from = await signer.getAddress();

  let gas;
  try {
    if (exec.type === 'disperse' && mode === 'native') {
      gas = await new Contract(exec.address, DISPERSE_ABI, provider).disperseEther.estimateGas(
        recipients,
        values,
        { from, value: total }
      );
    } else if (exec.type === 'disperse' && mode === 'erc20') {
      gas = await new Contract(exec.address, DISPERSE_ABI, provider).disperseToken.estimateGas(
        tokenAddress,
        recipients,
        values,
        { from }
      );
    } else if (exec.type === 'multisend' && mode === 'native') {
      gas = await new Contract(exec.address, MULTISEND_ABI, provider).disperseEther.estimateGas(
        recipients,
        values,
        { from, value: total }
      );
    } else if (exec.type === 'multisend' && mode === 'erc20') {
      gas = await new Contract(exec.address, MULTISEND_ABI, provider).disperseToken.estimateGas(
        tokenAddress,
        recipients,
        values,
        { from }
      );
    } else if (exec.type === 'multicall3' && mode === 'native') {
      const calls = recipients.map((to, i) => ({
        target: to,
        allowFailure: false,
        value: values[i],
        callData: '0x',
      }));
      gas = await new Contract(exec.address, MULTICALL3_ABI, provider).aggregate3Value.estimateGas(
        calls,
        { from, value: total }
      );
    } else {
      // ERC-20 with no batcher: N sequential estimate
      gas = 65000n * BigInt(valid.length);
    }
  } catch {
    gas = 30000n * BigInt(valid.length) + 50000n;
  }

  const feeData = await provider.getFeeData();
  const gasPrice = feeData.gasPrice || feeData.maxFeePerGas || 0n;
  return {
    totalGas: gas,
    feeWei: gas * gasPrice,
    feeFormatted: formatUnits(gas * gasPrice, 18),
    batch: exec.type !== 'none',
    executor: exec,
  };
}

/**
 * One batch tx. No contract deployment in this path.
 */
export async function executeTransfers({
  signer,
  rows,
  mode,
  tokenAddress,
  tokenDecimals,
  chainId,
  onProgress,
  onStatus,
}) {
  const provider = signer.provider || new BrowserProvider(window.ethereum);
  const results = rows.map((r) => ({ ...r }));
  const validIdx = [];
  results.forEach((r, i) => {
    if (r.ok) validIdx.push(i);
    else r.status = 'skipped';
  });
  onProgress?.(results);
  if (!validIdx.length) {
    return { sent: 0, failed: 0, results, batch: false, txHash: null };
  }

  const valid = validIdx.map((i) => results[i]);
  const { recipients, values, total } = buildArrays(valid, mode, tokenDecimals);
  let exec = await resolveBatchExecutor(provider, chainId);

  // Multicall3 cannot pull ERC-20 from user wallet
  if (mode === 'erc20' && (exec.type === 'multicall3' || exec.type === 'none')) {
    markAll(results, validIdx, 'failed', 'No ERC-20 batch contract on this chain');
    onProgress?.(results);
    return {
      sent: 0,
      failed: validIdx.length,
      results,
      batch: false,
      txHash: null,
      error:
        'This chain has no token multi-send contract. Use native coin, or another network with Disperse.',
    };
  }

  if (mode === 'native' && exec.type === 'none') {
    if (await hasCode(provider, MULTICALL3)) {
      exec = { type: 'multicall3', address: MULTICALL3 };
    } else {
      markAll(results, validIdx, 'failed', 'No batch path');
      onProgress?.(results);
      return {
        sent: 0,
        failed: validIdx.length,
        results,
        batch: false,
        txHash: null,
        error: 'No 1-tx batch available on this chain.',
      };
    }
  }

  try {
    if (exec.type === 'disperse' || exec.type === 'multisend') {
      return await runDisperseStyle({
        signer,
        provider,
        address: exec.address,
        abi: exec.type === 'disperse' ? DISPERSE_ABI : MULTISEND_ABI,
        mode,
        tokenAddress,
        recipients,
        values,
        total,
        results,
        validIdx,
        onProgress,
        onStatus,
        executor: exec.type,
      });
    }
    if (exec.type === 'multicall3' && mode === 'native') {
      return await runMulticall3Native({
        signer,
        provider,
        address: exec.address,
        recipients,
        values,
        total,
        results,
        validIdx,
        onProgress,
        onStatus,
      });
    }
  } catch (err) {
    markAll(results, validIdx, 'failed', humanError(err));
    onProgress?.(results);
    return {
      sent: 0,
      failed: validIdx.length,
      results,
      batch: true,
      txHash: null,
      error: humanError(err),
    };
  }

  markAll(results, validIdx, 'failed', 'No batch path');
  onProgress?.(results);
  return {
    sent: 0,
    failed: validIdx.length,
    results,
    batch: false,
    txHash: null,
    error: 'No single-tx batch path on this chain.',
  };
}

async function ensureErc20Allowance({ signer, tokenAddress, spender, amount, onStatus }) {
  const token = new Contract(tokenAddress, ERC20_ABI, signer);
  const owner = await signer.getAddress();
  const current = await token.allowance(owner, spender);
  if (current >= amount) return null;
  onStatus?.('Approve token once for batch…');
  const o = await txOverrides(signer.provider);
  const tx = await token.approve(spender, MaxUint256, o);
  await tx.wait(1);
  return tx.hash;
}

async function runDisperseStyle(ctx) {
  const {
    signer,
    provider,
    address,
    abi,
    mode,
    tokenAddress,
    recipients,
    values,
    total,
    results,
    validIdx,
    onProgress,
    onStatus,
    executor,
  } = ctx;
  const c = new Contract(address, abi, signer);
  markAll(results, validIdx, 'pending');
  onProgress?.(results);

  let approveHash = null;
  if (mode === 'erc20') {
    approveHash = await ensureErc20Allowance({
      signer,
      tokenAddress,
      spender: address,
      amount: total,
      onStatus,
    });
  }

  onStatus?.(`Confirm 1 batch tx · ${recipients.length} wallets…`);
  let tx;
  if (mode === 'native') {
    const gas = await c.disperseEther.estimateGas(recipients, values, { value: total });
    const o = await txOverrides(provider, gas);
    tx = await c.disperseEther(recipients, values, { value: total, ...o });
  } else {
    const gas = await c.disperseToken.estimateGas(tokenAddress, recipients, values);
    const o = await txOverrides(provider, gas);
    tx = await c.disperseToken(tokenAddress, recipients, values, o);
  }
  return finishBatch({ provider, tx, results, validIdx, onProgress, approveHash, executor });
}

async function runMulticall3Native(ctx) {
  const {
    signer,
    provider,
    address,
    recipients,
    values,
    total,
    results,
    validIdx,
    onProgress,
    onStatus,
  } = ctx;
  const c = new Contract(address, MULTICALL3_ABI, signer);
  markAll(results, validIdx, 'pending');
  onProgress?.(results);
  onStatus?.(`Confirm 1 batch tx · ${recipients.length} wallets…`);

  const calls = recipients.map((to, i) => ({
    target: to,
    allowFailure: false,
    value: values[i],
    callData: '0x',
  }));
  const gas = await c.aggregate3Value.estimateGas(calls, { value: total });
  const o = await txOverrides(provider, gas);
  const tx = await c.aggregate3Value(calls, { value: total, ...o });
  return finishBatch({ provider, tx, results, validIdx, onProgress, executor: 'multicall3' });
}

async function finishBatch({
  provider,
  tx,
  results,
  validIdx,
  onProgress,
  approveHash = null,
  executor,
}) {
  applyTxHash(results, validIdx, tx.hash);
  markAll(results, validIdx, 'sent');
  onProgress?.(results);
  const receipt = await provider.waitForTransaction(tx.hash, 1);
  if (receipt && receipt.status === 0) {
    markAll(results, validIdx, 'failed', 'Batch reverted');
    onProgress?.(results);
    return {
      sent: 0,
      failed: validIdx.length,
      results,
      batch: true,
      txHash: tx.hash,
      approveHash,
      error: 'Batch reverted',
      executor,
    };
  }
  markAll(results, validIdx, 'confirmed');
  onProgress?.(results);
  return {
    sent: validIdx.length,
    failed: 0,
    results,
    batch: true,
    txHash: tx.hash,
    approveHash,
    executor,
  };
}

function markAll(results, idxs, status, error = null) {
  for (const i of idxs) {
    results[i].status = status;
    if (error) results[i].error = error;
  }
}

function applyTxHash(results, idxs, hash) {
  for (const i of idxs) results[i].txHash = hash;
}

function isUserReject(err) {
  const code = err?.code ?? err?.info?.error?.code;
  const msg = String(err?.shortMessage || err?.message || '').toLowerCase();
  return (
    code === 4001 ||
    code === 'ACTION_REJECTED' ||
    msg.includes('user rejected') ||
    msg.includes('user denied')
  );
}

function humanError(err) {
  if (isUserReject(err)) return 'Rejected in wallet';
  return String(err?.shortMessage || err?.reason || err?.message || 'Failed').slice(0, 160);
}
