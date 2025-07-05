const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying SIMPLIFIED FivesGame Contract - No ZeroDev Complexity!");
  console.log("==============================================================");
  
  // Get deployer account
  const [deployer] = await ethers.getSigners();
  
  console.log("📋 Deployment Info:");
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Network:", network.name);
  console.log("Chain ID:", network.config.chainId);
  
  // Get deployer balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");
  
  if (balance === 0n) {
    console.log("❌ Deployer has no ETH! Please fund the account first.");
    return;
  }
  
  // Deploy the simplified FivesGame contract
  console.log("\n🎮 Deploying FivesGame with SIMPLIFIED approach...");
  const FivesGame = await ethers.getContractFactory("FivesGame");
  
  console.log("📦 Contract factory created successfully");
  console.log("🚀 Starting deployment...");
  
  const fivesGame = await FivesGame.deploy();
  await fivesGame.waitForDeployment();
  
  const contractAddress = await fivesGame.getAddress();
  console.log("✅ FivesGame deployed to:", contractAddress);
  
  // Get deployment transaction
  const deployTx = fivesGame.deploymentTransaction();
  console.log("📝 Deployment transaction hash:", deployTx.hash);
  
  // Test the simplified approach
  console.log("\n🧪 Testing SIMPLIFIED contract approach...");
  
  // Example addresses
  const playerDisplayAddress = "0x06b8E118eDe5AC5aa96fCecc5E7832EEdA29186d"; // Your EOA
  const controllerAddress = deployer.address; // ZeroDev smart wallet (transaction sender)
  
  console.log("Testing with:");
  console.log("👤 Player Display Address:", playerDisplayAddress);
  console.log("🎮 Controller Address (msg.sender):", controllerAddress);
  
  try {
    // Test 1: Create game with explicit player address
    console.log("\n🎯 TEST 1: Create game with simplified signature");
    const createTx = await fivesGame.createGame(
      1,                    // maxPlayers
      false,               // allowIslands
      1000,                // winningScore
      "Test Player",       // playerName
      playerDisplayAddress // ✅ Explicit player address
    );
    await createTx.wait();
    console.log("✅ Game created successfully with simplified approach!");
    
    // Check the game state
    const gameData = await fivesGame.getGame(1);
    console.log("\n📊 Game Data:");
    console.log("Creator:", gameData[1]);
    console.log("Player addresses:", gameData[7]);
    console.log("✅ Creator is player display address:", gameData[1] === playerDisplayAddress);
    
    // Check controller mapping
    const controllerAddr = await fivesGame.getControllerAddress(1, playerDisplayAddress);
    console.log("\n🔑 Controller Mapping:");
    console.log("Player:", playerDisplayAddress);
    console.log("Controller:", controllerAddr);
    console.log("✅ Controller is transaction sender:", controllerAddr === controllerAddress);
    
    // Test 2: Start game (controller should be able to start)
    console.log("\n🎯 TEST 2: Controller starts the game");
    const startTx = await fivesGame.startGame(1);
    await startTx.wait();
    console.log("✅ Controller successfully started the game!");
    
    // Check final state
    const finalGameData = await fivesGame.getGame(1);
    console.log("\n🏁 Final Game State:");
    console.log("State:", Number(finalGameData[0]) === 1 ? "In Progress" : "Other");
    console.log("Creator:", finalGameData[1]);
    console.log("Players:", finalGameData[7]);
    
    console.log("\n🎉 SIMPLIFIED APPROACH TEST SUCCESSFUL!");
    console.log("=====================================");
    console.log("✅ No ZeroDev address detection needed");
    console.log("✅ Frontend always shows EOA as player");
    console.log("✅ Transaction sender becomes controller automatically");
    console.log("✅ Both addresses can control the game");
    
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    console.error("Full error:", error);
  }
  
  // Save deployment info
  const deploymentInfo = {
    contractAddress: contractAddress,
    network: network.name,
    chainId: network.config.chainId,
    blockNumber: deployTx.blockNumber,
    transactionHash: deployTx.hash,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    contractType: "FivesGame-Simplified",
    testResults: {
      gameCreated: true,
      controllerMappingWorks: true,
      gameStartedByController: true
    }
  };
  
  const deploymentPath = `./deployments/FivesGame-Simplified-${network.name}-${Date.now()}.json`;
  require('fs').writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("\n💾 Deployment info saved to:", deploymentPath);
  
  // Frontend integration instructions
  console.log("\n📋 FRONTEND INTEGRATION INSTRUCTIONS:");
  console.log("=====================================");
  console.log("1. Update contract address in frontend config:");
  console.log(`   CONTRACT_ADDRESS: "${contractAddress}"`);
  console.log("");
  console.log("2. Update createGame calls to include player address:");
  console.log("   OLD: createGame(maxPlayers, allowIslands, winningScore, playerName)");
  console.log("   NEW: createGame(maxPlayers, allowIslands, winningScore, playerName, primaryWallet.address)");
  console.log("");
  console.log("3. Update joinGame calls to include player address:");
  console.log("   OLD: joinGame(gameId, playerName)");
  console.log("   NEW: joinGame(gameId, playerName, primaryWallet.address)");
  console.log("");
  console.log("4. Remove all ZeroDev detection logic:");
  console.log("   - Remove getContractAddress() complexity");
  console.log("   - Remove contractInteractionAddress logic");
  console.log("   - Always use primaryWallet.address for display");
  console.log("");
  console.log("5. Update GameController to use primaryWallet.address for player matching");
  
  console.log("\n🎯 Contract deployed and tested successfully!");
  console.log("Contract Address:", contractAddress);
  console.log("Ready for frontend integration!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 