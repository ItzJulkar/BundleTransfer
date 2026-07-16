import {
  JsonRpcProvider,
  getCreate2Address,
  keccak256,
  zeroPadValue,
} from 'ethers';
import { MULTISEND_BYTECODE } from '../src/lib/multisendArtifact.js';

const p = new JsonRpcProvider('https://rpc.mainnet.chain.robinhood.com');
const DETERMINISTIC = '0x4e59b44847b379578588920cA78FbF26c0B4956C';
const code = await p.getCode(DETERMINISTIC);
console.log('CREATE2 deployer', code === '0x' || code === '0x0' ? 'MISSING' : 'LIVE len=' + code.length);

const salt = zeroPadValue('0x01', 32);
const initCodeHash = keccak256(MULTISEND_BYTECODE);
console.log('bytecode bytes', (MULTISEND_BYTECODE.length - 2) / 2);
console.log('initCodeHash', initCodeHash);

if (code && code !== '0x') {
  const addr = getCreate2Address(DETERMINISTIC, salt, initCodeHash);
  console.log('predicted MultiSend', addr);
  const at = await p.getCode(addr);
  console.log('already deployed?', at === '0x' || at === '0x0' ? 'no' : 'YES');
}

const fee = await p.getFeeData();
console.log('feeData', {
  gasPrice: fee.gasPrice?.toString(),
  maxFee: fee.maxFeePerGas?.toString(),
  tip: fee.maxPriorityFeePerGas?.toString(),
});

// estimate simple transfer gas price * 21000
const gp = fee.gasPrice || fee.maxFeePerGas || 0n;
console.log('simple 21k gas cost wei', (21000n * gp).toString());
console.log('multicall rough 7*35k gas cost wei', (7n * 35000n * gp).toString());
