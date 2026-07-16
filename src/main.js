import './style.css';
import { BrowserProvider, getAddress, isAddress } from 'ethers';
import { CHAIN_ORDER, getChain, explorerTx } from './lib/chains.js';
import { parseRecipients } from './lib/parse.js';
import {
  connectWallet,
  getNativeBalance,
  loadErc20,
  switchChain,
  hasEthereum,
} from './lib/wallet.js';
import { assertEnoughBalance, estimateBatchGas, executeTransfers } from './lib/transfer.js';
import { searchTrustedTokens, findTrustedByAddress } from './lib/tokens.js';
import { runOpeningIntro, startAmbientScramble, scrambleText, enableHoverScramble } from './lib/intro.js';

const state = {
  address: null,
  chainId: null,
  signer: null,
  provider: null,
  tokenMode: 'native',
  token: null,
  nativeBalance: null,
  parseResult: null,
  sending: false,
  searchTimer: null,
};

const el = {
  chainSelect: document.getElementById('chainSelect'),
  connectBtn: document.getElementById('connectBtn'),
  walletStrip: document.getElementById('walletStrip'),
  walletAddress: document.getElementById('walletAddress'),
  walletChain: document.getElementById('walletChain'),
  walletBalance: document.getElementById('walletBalance'),
  modeNative: document.getElementById('modeNative'),
  modeErc20: document.getElementById('modeErc20'),
  tokenField: document.getElementById('tokenField'),
  tokenSearch: document.getElementById('tokenSearch'),
  tokenResults: document.getElementById('tokenResults'),
  selectedTokenChip: document.getElementById('selectedTokenChip'),
  tokenAddress: document.getElementById('tokenAddress'),
  tokenMeta: document.getElementById('tokenMeta'),
  parseMode: document.getElementById('parseMode'),
  equalAmountField: document.getElementById('equalAmountField'),
  equalAmount: document.getElementById('equalAmount'),
  recipients: document.getElementById('recipients'),
  parseBtn: document.getElementById('parseBtn'),
  simulateBtn: document.getElementById('simulateBtn'),
  sendBtn: document.getElementById('sendBtn'),
  stopOnError: document.getElementById('stopOnError'),
  confirmModal: document.getElementById('confirmModal'),
  confirmBody: document.getElementById('confirmBody'),
  confirmOk: document.getElementById('confirmOk'),
  confirmCancel: document.getElementById('confirmCancel'),
  batchHint: document.getElementById('batchHint'),
  previewCount: document.getElementById('previewCount'),
  statValid: document.getElementById('statValid'),
  statInvalid: document.getElementById('statInvalid'),
  statTotal: document.getElementById('statTotal'),
  statGas: document.getElementById('statGas'),
  previewBody: document.getElementById('previewBody'),
  toast: document.getElementById('toast'),
};

// Clean product UI — purposeful motion only (logo + scramble + intro)
fillChainSelect();
wireEvents();
initTheme();
el.tokenField.hidden = false;
showNativeChip();
el.equalAmountField.hidden = el.parseMode.value !== 'equal_split';

// Opening (skip / reduced-motion safe), then warm session + hover scramble
runOpeningIntro().finally(() => {
  tryRestoreSession();
  enableHoverScramble(document.getElementById('app'));
  renderHistory();
  document.getElementById('historyClear')?.addEventListener('click', () => {
    localStorage.removeItem('multisend.history');
    renderHistory();
    toast('History cleared', 'ok');
  });
  const tag = document.getElementById('brandTag');
  startAmbientScramble(tag, [
    '1-sig batch · EVM',
    'many wallets · one sign',
    'client-side · no custody',
    'validate · estimate · send',
  ]);
  const title = document.getElementById('brandTitle');
  if (title) scrambleText(title, 'BundleTransfer', { duration: 600, delay: 80 });
});

const HISTORY_KEY = 'multisend.history';
const HISTORY_MAX = 20;

function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function saveHistoryItem(item) {
  const list = loadHistory();
  list.unshift(item);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(0, HISTORY_MAX)));
  renderHistory();
}

function renderHistory() {
  const box = document.getElementById('historyList');
  if (!box) return;
  const list = loadHistory();
  if (!list.length) {
    box.innerHTML = `<p class="history-empty muted">No batches yet · stored only in this browser</p>`;
    return;
  }
  box.innerHTML = list
    .map((h) => {
      const link = h.txHash && h.chainId ? explorerTx(h.chainId, h.txHash) : null;
      const when = h.ts ? new Date(h.ts).toLocaleString() : '';
      const hash = h.txHash ? shortAddr(h.txHash, 6) : '—';
      return `<article class="hist-item">
        <div class="hist-top">
          <strong class="hist-meta mono">${escapeHtml(String(h.sent ?? 0))} → ${escapeHtml(h.symbol || '')}</strong>
          ${link ? `<a class="tx" href="${link}" target="_blank" rel="noopener">${escapeHtml(hash)}</a>` : `<span class="mono dim">${escapeHtml(hash)}</span>`}
        </div>
        <div class="hist-sub muted">${escapeHtml(h.chainName || '')} · ${escapeHtml(when)}</div>
      </article>`;
    })
    .join('');
}

function initTheme() {
  const saved = localStorage.getItem('multisend.theme');
  const theme = saved === 'light' || saved === 'dark' ? saved : 'dark';
  document.documentElement.setAttribute('data-theme', theme);
  const btn = document.getElementById('themeToggle');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const cur = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    const next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('multisend.theme', next);
  });
}

function fillChainSelect() {
  el.chainSelect.innerHTML = CHAIN_ORDER.map((id) => {
    const c = getChain(id);
    return `<option value="${id}">${c.name} (${c.nativeSymbol})</option>`;
  }).join('');
}

function activeChainId() {
  return state.chainId || Number(el.chainSelect.value);
}

function wireEvents() {
  el.connectBtn.addEventListener('click', onConnect);
  el.chainSelect.addEventListener('change', onChainChange);
  el.modeNative.addEventListener('click', () => setTokenMode('native'));
  el.modeErc20.addEventListener('click', () => setTokenMode('erc20'));
  el.parseMode.addEventListener('change', () => {
    el.equalAmountField.hidden = el.parseMode.value !== 'equal_split';
    clearPreviewActions();
  });
  el.tokenAddress.addEventListener('change', () => onTokenChange({ fromAdvanced: true }));
  el.tokenAddress.addEventListener('blur', () => onTokenChange({ fromAdvanced: true }));
  el.tokenSearch.addEventListener('input', onTokenSearchInput);
  el.tokenSearch.addEventListener('focus', () => {
    renderTokenResults(doSearch(el.tokenSearch.value));
  });
  el.tokenResults.addEventListener('mousedown', (e) => {
    const btn = e.target.closest('[data-token-kind]');
    if (!btn) return;
    e.preventDefault();
    selectTrustedToken({
      kind: btn.dataset.tokenKind,
      address: btn.dataset.tokenAddress || null,
      symbol: btn.dataset.tokenSymbol,
      name: btn.dataset.tokenName,
      decimals: btn.dataset.tokenDecimals ? Number(btn.dataset.tokenDecimals) : 18,
    });
  });
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.token-search-wrap')) {
      el.tokenResults.hidden = true;
    }
  });
  el.parseBtn.addEventListener('click', onParse);
  el.simulateBtn.addEventListener('click', onSimulate);
  el.sendBtn.addEventListener('click', onSend);
  el.recipients.addEventListener('input', () => {
    clearPreviewActions();
  });

  if (hasEthereum()) {
    window.ethereum.on?.('accountsChanged', (accs) => {
      if (!accs?.length) resetWallet();
      else onConnect();
    });
    window.ethereum.on?.('chainChanged', () => {
      onConnect();
    });
  }
}

async function tryRestoreSession() {
  if (!hasEthereum()) return;
  try {
    const provider = new BrowserProvider(window.ethereum);
    const accounts = await provider.send('eth_accounts', []);
    if (accounts?.length) await onConnect();
  } catch {
    /* ignore */
  }
}

async function onConnect() {
  try {
    el.connectBtn.disabled = true;
    const { provider, signer, address, chainId } = await connectWallet();
    state.provider = provider;
    state.signer = signer;
    state.address = address;
    state.chainId = chainId;

    if (getChain(chainId)) {
      el.chainSelect.value = String(chainId);
    }

    el.walletStrip.hidden = false;
    el.walletAddress.textContent = shortAddr(address);
    el.walletAddress.title = address;
    el.connectBtn.textContent = 'Connected';
    await refreshBalances();
    toast('Wallet connected', 'ok');
  } catch (err) {
    toast(err.message || 'Connect failed', 'err');
  } finally {
    el.connectBtn.disabled = false;
  }
}

function resetWallet() {
  state.address = null;
  state.signer = null;
  state.provider = null;
  state.chainId = null;
  state.token = null;
  state.nativeBalance = null;
  el.walletStrip.hidden = true;
  el.connectBtn.textContent = 'Connect Wallet';
  el.walletBalance.textContent = '—';
  clearSelectedTokenUi();
  clearPreviewActions();
}

async function onChainChange() {
  const id = Number(el.chainSelect.value);
  state.token = null;
  clearSelectedTokenUi();
  el.tokenSearch.value = '';
  el.tokenAddress.value = '';
  el.tokenResults.hidden = true;

  if (!state.address) {
    toast(`Network set to ${getChain(id)?.name || id}`, 'ok');
    return;
  }
  try {
    await switchChain(id);
    await onConnect();
  } catch (err) {
    toast(err?.message || 'Network switch failed', 'err');
    if (state.chainId) el.chainSelect.value = String(state.chainId);
  }
}

function setTokenMode(mode, { keepSearch = false } = {}) {
  state.tokenMode = mode;
  el.modeNative.classList.toggle('active', mode === 'native');
  el.modeErc20.classList.toggle('active', mode === 'erc20');
  // Asset search always available — native ETH/BNB also appears in results
  el.tokenField.hidden = false;
  if (!keepSearch) {
    state.token = null;
    clearSelectedTokenUi();
    if (!keepSearch && mode === 'native') {
      el.tokenAddress.value = '';
    }
  }
  if (mode === 'erc20') {
    el.tokenMeta.classList.remove('bad');
    el.tokenMeta.textContent =
      'Type a name: ETH, USDT, USDC… Native coin + trusted tokens only.';
    if (!keepSearch) renderTokenResults(doSearch(''));
  } else {
    el.tokenMeta.classList.remove('bad');
    el.tokenMeta.textContent = `Sending native ${getChain(activeChainId())?.nativeSymbol || 'coin'} — not an ERC-20.`;
    if (!keepSearch) {
      el.tokenResults.hidden = true;
      showNativeChip();
    }
  }
  refreshBalances();
  clearPreviewActions();
}

function doSearch(q) {
  const chain = getChain(activeChainId());
  return searchTrustedTokens(activeChainId(), q, {
    nativeSymbol: chain?.nativeSymbol || null,
  });
}

function onTokenSearchInput() {
  clearTimeout(state.searchTimer);
  const q = el.tokenSearch.value.trim();

  if (/^0x[a-fA-F0-9]{40}$/i.test(q)) {
    el.tokenResults.hidden = true;
    el.tokenAddress.value = q;
    const details = document.getElementById('advContract');
    if (details) details.open = true;
    setTokenMode('erc20', { keepSearch: true });
    onTokenChange({ fromAdvanced: true });
    return;
  }

  state.searchTimer = setTimeout(() => {
    const hits = doSearch(q);
    renderTokenResults(hits, q);
  }, 80);
}

function renderTokenResults(hits, query = '') {
  if (!el.tokenResults) return;
  if (!hits.length) {
    const emptyMsg = query
      ? `No trusted match for “${escapeHtml(query)}”. Viral/unknown coins are blocked. Use Advanced only if you have a verified contract.`
      : 'No curated tokens for this chain yet. Native coin is still available via Native mode.';
    el.tokenResults.innerHTML = `<div class="token-empty">${emptyMsg}</div>`;
    el.tokenResults.hidden = false;
    return;
  }
  el.tokenResults.innerHTML = hits
    .map((t) => {
      if (t.kind === 'native') {
        return `<button type="button" class="token-hit native" data-token-kind="native" data-token-symbol="${escapeHtml(t.symbol)}" data-token-name="${escapeHtml(t.name)}">
        <span class="token-hit-sym">${escapeHtml(t.symbol)}</span>
        <span class="token-hit-name">${escapeHtml(t.name)}</span>
        <span class="token-hit-addr mono">native</span>
        <span class="token-hit-badge native-badge">native</span>
      </button>`;
      }
      return `<button type="button" class="token-hit" data-token-kind="erc20" data-token-address="${t.address}" data-token-symbol="${escapeHtml(t.symbol)}" data-token-name="${escapeHtml(t.name)}" data-token-decimals="${t.decimals}">
        <span class="token-hit-sym">${escapeHtml(t.symbol)}</span>
        <span class="token-hit-name">${escapeHtml(t.name)}</span>
        <span class="token-hit-addr mono">${shortAddr(t.address, 4)}</span>
        <span class="token-hit-badge">trusted</span>
      </button>`;
    })
    .join('');
  el.tokenResults.hidden = false;
}

function showNativeChip() {
  const chain = getChain(activeChainId());
  const sym = chain?.nativeSymbol || 'ETH';
  if (!el.selectedTokenChip) return;
  el.selectedTokenChip.hidden = false;
  el.selectedTokenChip.innerHTML = `
    <strong>${escapeHtml(sym)}</strong>
    <span class="dim">native gas coin</span>
    <span class="chip-badge good">native</span>
  `;
}

async function selectTrustedToken(meta) {
  el.tokenResults.hidden = true;

  // Real ETH / BNB / … = native transfer path (not ERC-20)
  if (meta.kind === 'native' || !meta.address) {
    el.tokenSearch.value = `${meta.symbol} · Native`;
    el.tokenAddress.value = '';
    state.token = null;
    setTokenMode('native', { keepSearch: true });
    showNativeChip();
    el.tokenMeta.textContent = `${meta.symbol} selected · native coin (not a token contract)`;
    toast(`${meta.symbol} native selected`, 'ok');
    await refreshBalances();
    clearPreviewActions();
    return;
  }

  setTokenMode('erc20', { keepSearch: true });
  el.tokenSearch.value = `${meta.symbol} · ${meta.name}`;
  el.tokenAddress.value = meta.address;
  el.tokenMeta.classList.remove('bad');
  el.tokenMeta.textContent = 'Loading trusted token…';

  if (!state.address) {
    state.token = {
      address: getAddress(meta.address),
      symbol: meta.symbol,
      decimals: meta.decimals,
      balanceFormatted: '0',
      trusted: true,
      name: meta.name,
    };
    showSelectedChip(state.token, true);
    el.tokenMeta.textContent = `${meta.symbol} selected · connect wallet to load balance`;
    toast(`${meta.symbol} selected (trusted list)`, 'ok');
    return;
  }

  try {
    const token = await loadErc20(meta.address, state.address);
    state.token = { ...token, trusted: true, name: meta.name };
    showSelectedChip(state.token, true);
    el.tokenMeta.textContent = `${token.symbol} · ${token.decimals} decimals · balance ${trim(token.balanceFormatted)} · trusted list`;
    el.walletBalance.textContent = `${trim(token.balanceFormatted)} ${token.symbol}`;
    toast(`${token.symbol} ready`, 'ok');
  } catch (err) {
    state.token = null;
    clearSelectedTokenUi();
    el.tokenMeta.textContent = err.message || 'Failed to load token';
    el.tokenMeta.classList.add('bad');
    toast(err.message || 'Token load failed', 'err');
  }
  clearPreviewActions();
}

function showSelectedChip(token, trusted) {
  if (!el.selectedTokenChip) return;
  const badge = trusted
    ? '<span class="chip-badge good">trusted</span>'
    : '<span class="chip-badge warn">custom</span>';
  el.selectedTokenChip.hidden = false;
  el.selectedTokenChip.innerHTML = `
    <strong>${escapeHtml(token.symbol || 'TOKEN')}</strong>
    <span class="mono dim">${escapeHtml(shortAddr(token.address))}</span>
    ${badge}
    <button type="button" class="chip-clear" id="clearTokenBtn" title="Clear">×</button>
  `;
  document.getElementById('clearTokenBtn')?.addEventListener('click', () => {
    state.token = null;
    clearSelectedTokenUi();
    el.tokenSearch.value = '';
    el.tokenAddress.value = '';
    el.tokenMeta.textContent =
      'Type a popular name (USDT, USDC…). Random/viral tokens are never listed.';
    el.tokenMeta.classList.remove('bad');
    refreshBalances();
    clearPreviewActions();
  });
}

function clearSelectedTokenUi() {
  if (el.selectedTokenChip) {
    el.selectedTokenChip.hidden = true;
    el.selectedTokenChip.innerHTML = '';
  }
}

async function onTokenChange({ fromAdvanced = false } = {}) {
  if (state.tokenMode !== 'erc20') return;
  const raw = el.tokenAddress.value.trim();
  if (!raw) return;
  if (!isAddress(raw)) {
    el.tokenMeta.textContent = 'Invalid token address';
    el.tokenMeta.classList.add('bad');
    state.token = null;
    clearSelectedTokenUi();
    return;
  }

  const trusted = findTrustedByAddress(activeChainId(), raw);

  if (fromAdvanced && !trusted) {
    const ok = window.confirm(
      'This contract is NOT in the trusted popular list.\n\n' +
        'Fake tokens often copy famous names. Only continue if you verified this address on a block explorer yourself.\n\n' +
        `Contract: ${getAddress(raw)}\n\nLoad anyway?`
    );
    if (!ok) {
      el.tokenAddress.value = '';
      return;
    }
  }

  if (!state.address) {
    state.token = {
      address: getAddress(raw),
      symbol: trusted?.symbol || 'TOKEN',
      decimals: trusted?.decimals ?? 18,
      balanceFormatted: '0',
      trusted: !!trusted,
      name: trusted?.name,
    };
    showSelectedChip(state.token, !!trusted);
    el.tokenMeta.classList.remove('bad');
    el.tokenMeta.textContent = trusted
      ? `${trusted.symbol} · connect wallet to load balance`
      : 'Custom contract selected · connect wallet · VERIFY THIS IS NOT A SCAM';
    return;
  }

  try {
    el.tokenMeta.classList.remove('bad');
    el.tokenMeta.textContent = 'Loading token…';
    const token = await loadErc20(raw, state.address);
    state.token = {
      ...token,
      trusted: !!trusted,
      name: trusted?.name,
    };
    showSelectedChip(state.token, !!trusted);
    const tag = trusted ? 'trusted list' : 'CUSTOM — double-check explorer';
    el.tokenMeta.textContent = `${token.symbol} · ${token.decimals} decimals · balance ${trim(token.balanceFormatted)} · ${tag}`;
    el.walletBalance.textContent = `${trim(token.balanceFormatted)} ${token.symbol}`;
    if (!trusted) {
      el.tokenSearch.value = `${token.symbol} (custom)`;
    }
  } catch (err) {
    state.token = null;
    clearSelectedTokenUi();
    el.tokenMeta.textContent = err.message || 'Failed to load token';
    el.tokenMeta.classList.add('bad');
  }
  clearPreviewActions();
}

async function refreshBalances() {
  if (!state.address || !state.chainId) return;
  const chain = getChain(state.chainId);
  el.walletChain.textContent = chain ? chain.name : `Chain ${state.chainId}`;

  try {
    if (state.tokenMode === 'erc20' && state.token?.address) {
      const token = await loadErc20(state.token.address, state.address);
      const trusted =
        state.token.trusted || !!findTrustedByAddress(state.chainId, state.token.address);
      state.token = {
        ...token,
        trusted,
        name: state.token.name,
      };
      showSelectedChip(state.token, trusted);
      el.walletBalance.textContent = `${trim(token.balanceFormatted)} ${token.symbol}`;
    } else {
      const bal = await getNativeBalance(state.address, state.chainId);
      state.nativeBalance = bal;
      el.walletBalance.textContent = `${trim(bal.formatted)} ${bal.symbol}`;
    }
  } catch {
    el.walletBalance.textContent = '—';
  }
}

function onParse() {
  const result = parseRecipients(el.recipients.value, {
    mode: el.parseMode.value,
    equalAmount: el.equalAmount.value,
    isAddress: (a) => isAddress(a),
    getAddress: (a) => getAddress(a),
  });
  state.parseResult = result;
  renderPreview(result.rows);
  el.previewCount.textContent = `${result.rows.length} rows`;
  el.statValid.textContent = String(result.validCount);
  el.statInvalid.textContent = String(result.invalidCount);
  el.statTotal.textContent = `${result.total} ${activeSymbol()}`;
  el.statGas.textContent = '—';

  const ready = result.validCount > 0 && result.invalidCount === 0;
  el.simulateBtn.disabled = !ready || !state.signer;
  el.sendBtn.disabled = !ready || !state.signer;

  if (result.errors.length && result.validCount === 0) {
    toast(result.errors[0], 'err');
  } else if (result.invalidCount > 0) {
    const first = result.rows.find((r) => !r.ok);
    const detail = first?.error ? ` — ${first.error}` : '';
    toast(`${result.invalidCount} row(s) need fix${detail}`, 'err');
    el.sendBtn.disabled = true;
    el.simulateBtn.disabled = true;
  } else {
    toast(`Validated ${result.validCount} recipient(s). Total ${result.total} ${activeSymbol()}`, 'ok');
  }
}

async function onSimulate() {
  if (!state.parseResult || !state.signer) return;
  if (!(await ensureReadyForSend(false))) return;
  try {
    el.simulateBtn.disabled = true;
    toast('Estimating batch gas…', 'ok');
    const est = await estimateBatchGas({
      signer: state.signer,
      rows: state.parseResult.rows,
      mode: state.tokenMode,
      tokenAddress: state.token?.address,
      tokenDecimals: state.token?.decimals,
      chainId: state.chainId,
    });
    const chain = getChain(state.chainId);
    const kind = est.executor?.type || 'batch';
    el.statGas.textContent = `~${trim(est.feeFormatted, 6)} ${chain?.nativeSymbol || 'ETH'} · 1 tx (${kind})`;
    toast(`Gas for single batch · via ${kind}`, 'ok');
  } catch (err) {
    toast(err?.shortMessage || err?.message || 'Gas estimate failed', 'err');
  } finally {
    el.simulateBtn.disabled = false;
  }
}

function openConfirmModal({ titleHtml, bodyHtml }) {
  return new Promise((resolve) => {
    el.confirmBody.innerHTML = bodyHtml;
    const title = document.getElementById('confirmTitle');
    if (title && titleHtml) title.textContent = titleHtml;
    el.confirmModal.hidden = false;

    const cleanup = (val) => {
      el.confirmModal.hidden = true;
      el.confirmOk.onclick = null;
      el.confirmCancel.onclick = null;
      el.confirmModal.querySelectorAll('[data-modal-close]').forEach((n) => {
        n.onclick = null;
      });
      resolve(val);
    };
    el.confirmOk.onclick = () => cleanup(true);
    el.confirmCancel.onclick = () => cleanup(false);
    el.confirmModal.querySelectorAll('[data-modal-close]').forEach((n) => {
      n.onclick = () => cleanup(false);
    });
  });
}

async function onSend() {
  if (state.sending) return;
  if (!state.parseResult) {
    onParse();
    if (!state.parseResult) return;
  }
  if (!(await ensureReadyForSend(true))) return;

  const total = state.parseResult.total;
  const n = state.parseResult.validCount;
  const symbol = activeSymbol();
  const chain = getChain(state.chainId);
  const customWarn =
    state.tokenMode === 'erc20' && state.token && !state.token.trusted
      ? `<p class="modal-warn">Token is CUSTOM (not on trusted list). Double-check the contract.</p>`
      : '';
  const modeLine =
    state.tokenMode === 'native'
      ? `Native ${symbol}`
      : `ERC-20 ${escapeHtml(state.token.symbol)} <span class="mono dim">${escapeHtml(shortAddr(state.token.address))}</span>`;

  const ok = await openConfirmModal({
      titleHtml: '1 signature only',
      bodyHtml: `
        <div class="confirm-stats">
          <div><span class="label">Total</span><strong class="mono accent">${escapeHtml(total)} ${escapeHtml(symbol)}</strong></div>
          <div><span class="label">Recipients</span><strong class="mono">${n}</strong></div>
          <div><span class="label">Network</span><strong>${escapeHtml(chain?.name || 'Unknown')}</strong></div>
          <div><span class="label">Asset</span><strong>${modeLine}</strong></div>
        </div>
        <p class="confirm-from mono dim">From ${escapeHtml(shortAddr(state.address, 6))}</p>
        ${customWarn}
        <p class="confirm-note">
          <strong>NOT ${n} transactions.</strong>
          You press <strong>Sign once</strong>. All ${n} wallets get paid inside that single batch.
        </p>
        <p class="confirm-note warn-sim">
          Rabby may show ${n} “Send” rows in the preview — that is the batch breakdown, not ${n} separate signs.
          Bottom should show <strong>one Sign button</strong> and one gas fee. Use <em>Slow</em> for lowest fee.
        </p>
      `,
    });
    if (!ok) return;

  state.sending = true;
  el.sendBtn.disabled = true;
  el.simulateBtn.disabled = true;
  el.parseBtn.disabled = true;
  el.connectBtn.disabled = true;
  el.sendBtn.textContent = 'Batching…';

  try {
    const { sent, failed, results, batch, txHash, error } = await executeTransfers({
      signer: state.signer,
      rows: state.parseResult.rows,
      mode: state.tokenMode,
      tokenAddress: state.token?.address,
      tokenDecimals: state.token?.decimals,
      chainId: state.chainId,
      onProgress: (rows) => {
        state.parseResult.rows = rows;
        renderPreview(rows);
      },
      onStatus: (msg) => toast(msg, 'ok'),
    });
    state.parseResult.rows = results;
    renderPreview(results);
    if (batch && sent > 0) {
      const link = txHash && state.chainId ? explorerTx(state.chainId, txHash) : null;
      toast(
        `1 batch tx OK · ${sent} wallets · ${txHash ? shortAddr(txHash, 8) : ''}`,
        'ok'
      );
      saveHistoryItem({
        ts: Date.now(),
        chainId: state.chainId,
        chainName: getChain(state.chainId)?.name || '',
        txHash: txHash || null,
        sent,
        failed,
        total,
        symbol,
        mode: state.tokenMode,
      });
      if (link && el.batchHint) {
        el.batchHint.innerHTML = `Last batch: <a class="tx" href="${link}" target="_blank" rel="noopener">${escapeHtml(txHash)}</a> · ${sent} recipients · single hash`;
      }
    } else if (error) {
      toast(error, 'err');
    } else {
      toast(`Done: ${sent} confirmed, ${failed} failed`, failed ? 'err' : 'ok');
    }
    await refreshBalances();
  } catch (err) {
    toast(err?.message || 'Send failed', 'err');
  } finally {
    state.sending = false;
    el.parseBtn.disabled = false;
    el.connectBtn.disabled = false;
    el.sendBtn.textContent = 'Send in 1 transaction';
    onParse();
  }
}

async function ensureReadyForSend(checkBalance) {
  if (!state.signer || !state.address) {
    toast('Connect wallet first', 'err');
    return false;
  }
  if (!state.parseResult || state.parseResult.validCount === 0) {
    toast('Validate a non-empty recipient list first', 'err');
    return false;
  }
  if (state.parseResult.invalidCount > 0) {
    toast('Fix invalid rows before sending', 'err');
    return false;
  }

  const selected = Number(el.chainSelect.value);
  if (selected !== state.chainId) {
    toast('Switching network…', 'ok');
    try {
      await switchChain(selected);
      await onConnect();
    } catch (err) {
      toast(err?.message || 'Network mismatch', 'err');
      return false;
    }
  }

  if (state.tokenMode === 'erc20') {
    if (!state.token?.address) {
      toast('Search & pick a trusted token first (or paste a verified contract)', 'err');
      return false;
    }
    try {
      const token = await loadErc20(state.token.address, state.address);
      const trusted =
        state.token.trusted || !!findTrustedByAddress(state.chainId, state.token.address);
      state.token = { ...token, trusted, name: state.token.name };
      if (checkBalance) {
        assertEnoughBalance({
          totalAmount: state.parseResult.total,
          balanceFormatted: token.balanceFormatted,
          symbol: token.symbol,
        });
      }
    } catch (err) {
      toast(err.message || 'Token check failed', 'err');
      return false;
    }
  } else if (checkBalance) {
    try {
      const bal = await getNativeBalance(state.address, state.chainId);
      state.nativeBalance = bal;
      assertEnoughBalance({
        totalAmount: state.parseResult.total,
        balanceFormatted: bal.formatted,
        symbol: bal.symbol,
      });
    } catch (err) {
      toast(err.message || 'Balance check failed', 'err');
      return false;
    }
  }

  return true;
}

function renderPreview(rows) {
  if (!rows?.length) {
    el.previewBody.innerHTML = `<tr class="empty"><td colspan="4">Paste recipients and click Validate</td></tr>`;
    return;
  }
  el.previewBody.innerHTML = rows
    .map((r) => {
      const addr = r.address || r.addressRaw || '—';
      const amt = r.ok ? r.amount : r.amountRaw || '—';
      const st = statusBadge(r);
      const link =
        r.txHash && state.chainId
          ? `<a class="tx" href="${explorerTx(state.chainId, r.txHash)}" target="_blank" rel="noopener">tx</a>`
          : '';
      return `<tr class="${r.ok ? '' : 'row-bad'}">
        <td class="mono dim">${r.index}</td>
        <td class="mono addr" title="${escapeHtml(addr)}">${escapeHtml(shortAddr(addr, 6))}</td>
        <td class="mono">${escapeHtml(String(amt))}</td>
        <td>${st} ${link}</td>
      </tr>`;
    })
    .join('');
}

function statusBadge(r) {
  if (!r.ok) {
    const label = shortErr(r.error);
    return `<span class="badge bad" title="${escapeHtml(r.error || '')}">${escapeHtml(label)}</span>`;
  }
  const map = {
    idle: ['wait', ''],
    pending: ['pending', 'pulse'],
    sent: ['sent', ''],
    confirmed: ['ok', 'good'],
    failed: ['fail', 'bad'],
    skipped: ['skip', 'dim'],
  };
  const [label, cls] = map[r.status] || ['—', ''];
  const title = r.error ? ` title="${escapeHtml(r.error)}"` : '';
  return `<span class="badge ${cls}"${title}>${label}</span>`;
}

function shortErr(msg) {
  if (!msg) return 'invalid';
  const m = String(msg);
  if (/missing amount/i.test(m)) return 'no amount';
  if (/duplicate/i.test(m)) return 'duplicate';
  if (/checksum|address/i.test(m)) return 'bad addr';
  if (/amount/i.test(m)) return 'bad amt';
  return m.length > 14 ? `${m.slice(0, 12)}…` : m;
}

function clearPreviewActions() {
  el.simulateBtn.disabled = true;
  el.sendBtn.disabled = true;
  el.statGas.textContent = '—';
}

function activeSymbol() {
  if (state.tokenMode === 'erc20' && state.token?.symbol) return state.token.symbol;
  const chain = getChain(state.chainId || Number(el.chainSelect.value));
  return chain?.nativeSymbol || 'TOKEN';
}

function shortAddr(a, n = 4) {
  if (!a || a.length < 12) return a || '—';
  return `${a.slice(0, 2 + n)}…${a.slice(-n)}`;
}

function trim(s, frac = 6) {
  if (s == null) return '—';
  const str = String(s);
  if (!str.includes('.')) return str;
  const [a, b] = str.split('.');
  return `${a}.${b.slice(0, frac).replace(/0+$/, '') || '0'}`.replace(/\.$/, '');
}

function toast(msg, kind = 'ok') {
  el.toast.textContent = msg;
  el.toast.className = `toast show ${kind}`;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => {
    el.toast.classList.remove('show');
  }, 4200);
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
