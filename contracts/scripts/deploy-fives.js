const { ethers } = require("hardhat");

async function main() {
  console.log("🎮 Deploying FivesGame Contract...\n");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);
  
  // Check balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ETH");
  
  if (balance < ethers.parseEther("0.001")) {
    console.log("⚠️  WARNING: Low balance! You may need more ETH for deployment.");
  }

  // Get the network info
  const network = await ethers.provider.getNetwork();
  console.log("🌐 Network:", network.name, "| Chain ID:", network.chainId.toString());
  console.log("🔗 Network URL:", network.chainId === 8453n ? "Base Mainnet" : 
                                 network.chainId === 84532n ? "Base Sepolia" : 
                                 "Unknown Network");

  console.log("\n🚀 Starting deployment...");

  // Deploy the FivesGame contract
  const FivesGame = await ethers.getContractFactory("FivesGame");
  
  // Estimate deployment gas
  const deploymentData = FivesGame.bytecode;
  const estimatedGas = await ethers.provider.estimateGas({
    data: deploymentData
  });
  
  console.log("⛽ Estimated gas for deployment:", estimatedGas.toString());
  
  // Get current gas price
  const feeData = await ethers.provider.getFeeData();
  const gasPrice = feeData.gasPrice;
  console.log("💨 Current gas price:", ethers.formatUnits(gasPrice, "gwei"), "gwei");
  
  // Calculate estimated cost
  const estimatedCost = gasPrice * estimatedGas;
  console.log("💵 Estimated deployment cost:", ethers.formatEther(estimatedCost), "ETH");

  // Deploy the contract
  const fivesGame = await FivesGame.deploy();
  console.log("⏳ Transaction sent, waiting for confirmation...");
  
  // Wait for deployment
  await fivesGame.waitForDeployment();
  const contractAddress = await fivesGame.getAddress();
  
  console.log("\n✅ FivesGame deployed successfully!");
  console.log("📍 Contract address:", contractAddress);
  console.log("📊 Transaction hash:", fivesGame.deploymentTransaction().hash);
  
  // Get actual gas used
  const receipt = await fivesGame.deploymentTransaction().wait();
  console.log("⛽ Actual gas used:", receipt.gasUsed.toString());
  console.log("💰 Actual cost:", ethers.formatEther(receipt.gasUsed * receipt.gasPrice), "ETH");

  // Verify contract constants
  console.log("\n🔍 Verifying contract deployment...");
  const handSize = await fivesGame.HAND_SIZE();
  const winningScore = await fivesGame.WINNING_SCORE();
  console.log("🃏 Hand size:", handSize.toString());
  console.log("🏆 Default winning score:", winningScore.toString());

  console.log("\n📋 DEPLOYMENT SUMMARY:");
  console.log("======================");
  console.log("Contract: FivesGame");
  console.log("Address:", contractAddress);
  console.log("Network:", network.chainId === 8453n ? "Base Mainnet" : 
                        network.chainId === 84532n ? "Base Sepolia" : 
                        "Chain ID " + network.chainId.toString());
  console.log("Deployer:", deployer.address);
  console.log("Gas used:", receipt.gasUsed.toString());
  console.log("Cost:", ethers.formatEther(receipt.gasUsed * receipt.gasPrice), "ETH");
  
  // Block explorer links
  if (network.chainId === 8453n) {
    console.log("🔍 BaseScan:", `https://basescan.org/address/${contractAddress}`);
  } else if (network.chainId === 84532n) {
    console.log("🔍 BaseScan Sepolia:", `https://sepolia.basescan.org/address/${contractAddress}`);
  }

  console.log("\n🎉 Deployment complete! Your game contract is ready to use.");
  
  // Save deployment info to file
  const deploymentInfo = {
    contractName: "FivesGame",
    contractAddress: contractAddress,
    networkName: network.name,
    chainId: network.chainId.toString(),
    deployerAddress: deployer.address,
    transactionHash: fivesGame.deploymentTransaction().hash,
    gasUsed: receipt.gasUsed.toString(),
    gasPrice: receipt.gasPrice.toString(),
    deploymentCost: ethers.formatEther(receipt.gasUsed * receipt.gasPrice),
    timestamp: new Date().toISOString(),
    blockNumber: receipt.blockNumber
  };

  // Write to file
  const fs = require('fs');
  const path = require('path');
  const deploymentsDir = path.join(__dirname, '..', 'deployments');
  
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }
  
  const fileName = `FivesGame-${network.chainId}-${Date.now()}.json`;
  const filePath = path.join(deploymentsDir, fileName);
  
  fs.writeFileSync(filePath, JSON.stringify(deploymentInfo, null, 2));
  console.log("📄 Deployment info saved to:", filePath);

  return contractAddress;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }); 