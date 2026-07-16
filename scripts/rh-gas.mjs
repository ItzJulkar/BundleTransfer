import { JsonRpcProvider, formatEther } from 'ethers';

const p = new JsonRpcProvider('https://rpc.mainnet.chain.robinhood.com');
const fee = await p.getFeeData();
const gp = fee.gasPrice || fee.maxFeePerGas;
console.log('gasPrice gwei', Number(gp) / 1e9);
console.log('simple 21k eth', formatEther(21000n * gp));
console.log('7x simple eth', formatEther(7n * 21000n * gp));
console.log('7x 35k multicall eth', formatEther(7n * 35000n * gp));
console.log('7x 28k tight loop eth', formatEther(7n * 28000n * gp));
console.log('deploy ~800k eth', formatEther(800000n * gp));

for (const [n, a] of Object.entries({
  disperse: '0xD152f549545093347A162Dce210e7293f1452150',
  multicall3: '0xcA11bde05977b3631167028862bE2a173976CA11',
  create2: '0x4e59b44847b379578588920cA78FbF26c0B4956C',
  multisendCreate2: '0xC0E68f37D50cd028356A6cA8a72E831b3f3B329d',
})) {
  const c = await p.getCode(a);
  console.log(n, c === '0x' || c === '0x0' ? 'NO' : 'YES', c.length);
}
