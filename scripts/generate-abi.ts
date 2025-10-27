/*
  生成前端 ABI 与地址映射，模式与官方模板一致：
  - 读取 deployments 目录 ColorGuess.json
  - 输出到 frontend/src/abi/ColorGuessABI.ts 与 ColorGuessAddresses.ts
*/
import { promises as fs } from "fs";
import path from "path";

async function main() {
  const root = process.cwd();
  const deploymentsDir = path.join(root, "deployments");
  const outDir = path.join(root, "frontend", "src", "abi");
  await fs.mkdir(outDir, { recursive: true });

  const perChain: Record<string, { chainId: number; chainName?: string; address: string }> = {};

  const chains = await fs.readdir(deploymentsDir);
  for (const chainName of chains) {
    const f = path.join(deploymentsDir, chainName, "ColorGuess.json");
    try {
      const content = await fs.readFile(f, "utf8");
      const json = JSON.parse(content);
      // 以目录名（如 localhost）作为键
      const detectedChainId = (json.network?.chainId ?? (chainName === "localhost" ? 31337 : undefined)) as number | undefined;
      perChain[chainName] = {
        chainId: detectedChainId ?? 0,
        chainName,
        address: json.address,
      };
      // 同时以链ID字符串（如 "31337"）作为键，便于运行时通过 chainId 查找
      const cid = String(detectedChainId ?? "");
      if (cid) {
        perChain[cid] = {
          chainId: detectedChainId!,
          chainName,
          address: json.address,
        };
      }
      // ABI
      const abiOut = path.join(outDir, "ColorGuessABI.ts");
      await fs.writeFile(
        abiOut,
        `export const ColorGuessABI = ${JSON.stringify({ abi: json.abi }, null, 2)} as const;\n`
      );
    } catch {}
  }

  const addrOut = path.join(outDir, "ColorGuessAddresses.ts");
  await fs.writeFile(
    addrOut,
    `export const ColorGuessAddresses = ${JSON.stringify(perChain, null, 2)} as const;\n`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


