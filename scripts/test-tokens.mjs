import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const tokensUrl = pathToFileURL(path.join(__dirname, '../src/lib/tokens.js')).href;
const chainsUrl = pathToFileURL(path.join(__dirname, '../src/lib/chains.js')).href;

const { searchTrustedTokens, findTrustedByAddress, TRUSTED_TOKENS } = await import(tokensUrl);
const { CHAINS, CHAIN_ORDER } = await import(chainsUrl);

describe('chains mainnet only', () => {
  it('has no testnets and includes Robinhood + Monad', () => {
    assert.ok(CHAINS[4663], 'Robinhood Chain 4663');
    assert.equal(CHAINS[4663].name, 'Robinhood Chain');
    assert.ok(CHAINS[143], 'Monad mainnet 143');
    assert.equal(CHAINS[143].name, 'Monad');
    assert.equal(CHAINS[143].nativeSymbol, 'MON');
    assert.ok(!CHAINS[11155111], 'Sepolia removed');
    assert.ok(!CHAINS[97], 'BSC testnet removed');
    assert.ok(!CHAINS[10143], 'Monad testnet not included');
    for (const id of CHAIN_ORDER) {
      assert.ok(CHAINS[id], `chain ${id} in order`);
      assert.ok(!CHAINS[id].testnet, `${id} not testnet`);
    }
  });
});

describe('trusted token search', () => {
  it('finds native ETH first when searching eth', () => {
    const hits = searchTrustedTokens(1, 'eth', { nativeSymbol: 'ETH' });
    assert.ok(hits.length >= 1);
    assert.equal(hits[0].kind, 'native');
    assert.equal(hits[0].symbol, 'ETH');
    // wrapped still available further down
    assert.ok(hits.some((h) => h.symbol === 'WETH'));
  });

  it('empty query includes native first', () => {
    const hits = searchTrustedTokens(1, '', { nativeSymbol: 'ETH' });
    assert.equal(hits[0].kind, 'native');
  });

  it('finds USDC on ethereum by name', () => {
    const hits = searchTrustedTokens(1, 'usdc', { nativeSymbol: 'ETH' });
    assert.ok(hits.length >= 1);
    assert.equal(hits.find((h) => h.symbol === 'USDC')?.symbol, 'USDC');
  });

  it('does not invent random viral names', () => {
    const hits = searchTrustedTokens(1, 'super-moon-scam-inu-xyz', { nativeSymbol: 'ETH' });
    // only native would match if query matched eth — this query matches nothing
    assert.equal(hits.filter((h) => h.kind === 'erc20').length, 0);
    assert.equal(hits.length, 0);
  });

  it('returns empty for address-like query (name path blocked)', () => {
    const hits = searchTrustedTokens(1, '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', {
      nativeSymbol: 'ETH',
    });
    assert.equal(hits.length, 0);
  });

  it('findTrustedByAddress works', () => {
    const t = findTrustedByAddress(1, '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48');
    assert.equal(t.symbol, 'USDC');
  });

  it('Robinhood starts with empty curated list but native ETH still matches', () => {
    assert.deepEqual(TRUSTED_TOKENS[4663], []);
    const hits = searchTrustedTokens(4663, 'eth', { nativeSymbol: 'ETH' });
    assert.equal(hits.length, 1);
    assert.equal(hits[0].kind, 'native');
  });

  it('Monad: native MON + curated WMON/USDC', () => {
    const mon = searchTrustedTokens(143, 'mon', { nativeSymbol: 'MON' });
    assert.ok(mon.some((h) => h.kind === 'native' && h.symbol === 'MON'));
    const usdc = searchTrustedTokens(143, 'usdc', { nativeSymbol: 'MON' });
    assert.ok(usdc.some((h) => h.symbol === 'USDC' && h.kind === 'erc20'));
    const wmon = searchTrustedTokens(143, 'wmon', { nativeSymbol: 'MON' });
    assert.ok(wmon.some((h) => h.symbol === 'WMON'));
  });
});
