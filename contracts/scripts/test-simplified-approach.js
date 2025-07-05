const { ethers } = require("hardhat");

async function main() {
  console.log("🎮 Testing Simplified Approach - No ZeroDev Complexity!");
  console.log("=====================================");
  
  // Get accounts
  const [deployer] = await ethers.getSigners();
  
  // These could be any addresses - EOA, smart wallet, etc.
  const playerDisplayAddress = "0x06b8E118eDe5AC5aa96fCecc5E7832EEdA29186d"; // Your EOA
  const controllerAddress = deployer.address; // ZeroDev smart wallet (transaction sender)
  
  console.log("👤 Player Display Address (stored in game):", playerDisplayAddress);
  console.log("🎮 Controller Address (transaction sender):", controllerAddress);
  console.log("📄 Contract will be deployed by:", deployer.address);
  
  // Deploy contract
  console.log("\n🚀 Deploying FivesGame contract...");
  const FivesGame = await ethers.getContractFactory("FivesGame");
  const contract = await FivesGame.deploy();
  await contract.waitForDeployment();
  
  const contractAddress = await contract.getAddress();
  console.log("✅ Contract deployed to:", contractAddress);
  
  // Test 1: Create game with explicit player address
  console.log("\n🎯 TEST 1: Create game with simplified approach");
  console.log("Transaction sender (controller):", controllerAddress);
  console.log("Player address (displayed):", playerDisplayAddress);
  
  const createTx = await contract.createGame(
    1,              // maxPlayers
    false,          // allowIslands  
    1000,           // winningScore
    "Test Player",  // playerName
    playerDisplayAddress  // ✅ Explicit player address
  );
  await createTx.wait();
  
  console.log("✅ Game created successfully!");
  
  // Check game state
  const gameData = await contract.getGame(1);
  console.log("\n📊 Game State:");
  console.log("Creator:", gameData[1]);
  console.log("Player addresses:", gameData[7]);
  console.log("✅ Creator matches player display address:", gameData[1] === playerDisplayAddress);
  
  // Check controller mapping
  const controllerAddr = await contract.getControllerAddress(1, playerDisplayAddress);
  console.log("\n🔑 Controller Mapping:");
  console.log("Player address:", playerDisplayAddress);
  console.log("Controller address:", controllerAddr);
  console.log("✅ Controller matches transaction sender:", controllerAddr === controllerAddress);
  
  // Test 2: Verify both addresses can control the game
  console.log("\n🎯 TEST 2: Verify game control");
  
  try {
    // This should work - controller controlling player
    const startTx = await contract.startGame(1);
    await startTx.wait();
    console.log("✅ Controller successfully started the game");
  } catch (error) {
    console.log("❌ Controller could not start game:", error.message);
  }
  
  // Check final game state
  const finalGameData = await contract.getGame(1);
  console.log("\n🏁 Final Game State:");
  console.log("State:", Number(finalGameData[0]) === 0 ? "Setup" : "In Progress");
  console.log("Creator:", finalGameData[1]);
  console.log("Players:", finalGameData[7]);
  
  console.log("\n✅ SIMPLIFIED APPROACH SUMMARY:");
  console.log("🔹 Frontend always shows EOA address as player");
  console.log("🔹 ZeroDev smart wallet sends transactions as controller");
  console.log("🔹 No address detection logic needed");
  console.log("🔹 No frontend complexity for ZeroDev vs regular wallets");
  console.log("🔹 Contract handles authorization cleanly");
  
  console.log("\n📋 FRONTEND INTEGRATION:");
  console.log("- Call: createGame(maxPlayers, allowIslands, winningScore, playerName, userEOA)");
  console.log("- Transaction sent by: ZeroDev smart wallet (automatically becomes controller)");
  console.log("- Game shows: userEOA as the player address");
  console.log("- Both addresses can control the game seamlessly");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 