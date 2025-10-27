// 生成前端 ABI 与地址映射（ESM）
// - 读取 deployments/{localhost,sepolia}/ColorGuess.json（若存在）
// - 写入 frontend/src/abi/ColorGuessABI.ts 与 ColorGuessAddresses.ts
// - 同时确保 31337（本地）与 11155111（Sepolia）地址映射键存在

import { promises as fs } from 'fs';
import path from 'path';
import url from 'url';

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function readIfExists(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    return JSON.parse(content);
  } catch {
    return undefined;
  }
}

async function main() {
  const root = path.resolve(__dirname, '..');
  const deploymentsDir = path.join(root, 'deployments');
  const outDir = path.join(root, 'frontend', 'src', 'abi');
  await fs.mkdir(outDir, { recursive: true });

  const outputs = {};

  // 优先读取目录名与链 ID 映射
  const networkToChainId = {
    localhost: 31337,
    hardhat: 31337,
    anvil: 31337,
    sepolia: 11155111,
  };

  // 收集所有 network 子目录（若不存在 deployments，容错处理）
  let networks = [];
  try {
    networks = await fs.readdir(deploymentsDir);
  } catch {}

  // 读取部署产物
  for (const network of networks) {
    const f = path.join(deploymentsDir, network, 'ColorGuess.json');
    const json = await readIfExists(f);
    if (!json) continue;

    const chainId = json.network?.chainId ?? networkToChainId[network];
    const address = json.address;
    const abi = json.abi;
    if (!address || !abi || !chainId) continue;

    // 写出 ABI（任一网络的 ABI 等价，写一次即可）
    const abiOut = path.join(outDir, 'ColorGuessABI.ts');
    await fs.writeFile(
      abiOut,
      `export const ColorGuessABI = ${JSON.stringify({ abi }, null, 2)} as const;\n`
    );

    // 记录地址映射：既用链 ID 字符串，也用网络名
    outputs[String(chainId)] = {
      chainId,
      chainName: network,
      address,
    };
    outputs[network] = {
      chainId,
      chainName: network,
      address,
    };
  }

  // 确保 31337 与 11155111 的键存在（即便某个网络未部署，也保留键位）
  if (!outputs['31337']) {
    // 尝试从 localhost 兜底
    const localJson = await readIfExists(path.join(deploymentsDir, 'localhost', 'ColorGuess.json'));
    if (localJson?.address) {
      outputs['31337'] = { chainId: 31337, chainName: 'localhost', address: localJson.address };
      outputs['localhost'] = { chainId: 31337, chainName: 'localhost', address: localJson.address };
    } else if (!outputs['localhost']) {
      // 无地址可用时，留空地址字符串，方便前端检测
      outputs['31337'] = { chainId: 31337, chainName: 'localhost', address: '' };
      outputs['localhost'] = { chainId: 31337, chainName: 'localhost', address: '' };
    }
  }

  if (!outputs['11155111']) {
    const sepoliaJson = await readIfExists(path.join(deploymentsDir, 'sepolia', 'ColorGuess.json'));
    if (sepoliaJson?.address) {
      outputs['11155111'] = { chainId: 11155111, chainName: 'sepolia', address: sepoliaJson.address };
      outputs['sepolia'] = { chainId: 11155111, chainName: 'sepolia', address: sepoliaJson.address };
    } else if (!outputs['sepolia']) {
      outputs['11155111'] = { chainId: 11155111, chainName: 'sepolia', address: '' };
      outputs['sepolia'] = { chainId: 11155111, chainName: 'sepolia', address: '' };
    }
  }

  const addrOut = path.join(outDir, 'ColorGuessAddresses.ts');
  await fs.writeFile(
    addrOut,
    `export const ColorGuessAddresses = ${JSON.stringify(outputs, null, 2)} as const;\n`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


