# BundleTransfer

Batch-send **native coins or ERC-20 tokens** from your browser wallet to **many addresses** in one signature flow.

**Live:** https://bundletransfer.vercel.app

- X: https://x.com/Web3Julkar
- GitHub: https://github.com/ItzJulkar

## Features

- **Client-side only** — keys stay in MetaMask / Rabby / your wallet
- **1-tx batch** multi-send (no sequential N signatures for native)
- Chains: Ethereum, BSC, Polygon, Arbitrum, Base, Optimism, Avalanche, **Robinhood Chain** (mainnets)
- Token **name search** = curated trusted list only (anti-scam)
- Custom contract = optional Advanced mode + warning
- Equal-split default (addresses only + amount each)
- Local tx history in the browser
- Dark / light theme

## Safety

1. Confirm network + asset (trusted vs custom) before sending.
2. Wrong chain / wrong contract = permanent loss. This site never holds funds.
3. Non-EVM (BTC, Solana) not supported.

## Local

```bash
npm install
npm run dev
npm test
npm run build
npx vercel --prod
```

## Recipient formats

Equal-split (default):

```
0xAbc...123
0xDef...456
```

+ amount each field.

CSV mode:

```
0xAbc...123, 0.05
0xDef...456 0.1
```

Max 200 recipients per run.

## Stack

Vite · vanilla JS · ethers v6 · Vercel static hosting
