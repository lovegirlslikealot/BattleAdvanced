import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, network } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log(`Deploying ColorGuess to network: ${network.name}`);
  console.log(`Deployer address: ${deployer}`);

  // 支持在本地Hardhat网络上部署，保持所有FHEVM功能
  if (network.name === "hardhat") {
    console.log("🚀 Deploying to local Hardhat network with full FHEVM support");
    console.log("📋 Network configuration: localhost:8545 (Hardhat node)");
  }

  const deployment = await deploy("ColorGuess", {
    from: deployer,
    args: [],
    log: true,
  });

  console.log(`✅ ColorGuess deployed at: ${deployment.address}`);
  
  // 部署完成后的提示信息
  if (network.name === "hardhat") {
    console.log("📝 Next steps:");
    console.log("   1. Run 'npx ts-node scripts/generate-abi.ts' to generate frontend ABI files");
    console.log("   2. Start the frontend with 'cd frontend && npm run dev'");
    console.log("   3. All FHEVM features are enabled and ready to use!");
  }
};

export default func;
func.tags = ["ColorGuess"];


