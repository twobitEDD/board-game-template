const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Fresh Deploy and Test - All in One!");
  
  // Get signers
  const [deployer, player1, player2, player3] = await ethers.getSigners();
  console.log("👤 Deployer:", deployer.address);
  console.log("💰 Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");
  
  try {
    // Step 1: Deploy fresh contract
    console.log("\n📦 Step 1: Deploying FivesGame contract...");
    const FivesGame = await ethers.getContractFactory("FivesGame");
    const fivesGame = await FivesGame.deploy();
    await fivesGame.waitForDeployment();
    
    const contractAddress = await fivesGame.getAddress();
    console.log("✅ Contract deployed at:", contractAddress);
    
    // Step 2: Immediate basic test
    console.log("\n🔍 Step 2: Testing basic functions...");
    const nextGameId = await fivesGame.nextGameId();
    const handSize = await fivesGame.HAND_SIZE();
    const winningScore = await fivesGame.WINNING_SCORE();
    
    console.log("✅ nextGameId:", nextGameId.toString());
    console.log("✅ HAND_SIZE:", handSize.toString());
    console.log("✅ WINNING_SCORE:", winningScore.toString());
    
    // Step 3: Create games for gallery
    console.log("\n🎮 Step 3: Creating test games for gallery...");
    
    // Game 1: 2-player game that will auto-start
    console.log("Creating Game 1 (2-player)...");
    const createTx1 = await fivesGame.connect(deployer).createGame(
      2,           // maxPlayers
      false,       // allowIslands  
      100,         // winningScore
      "Host Player" // playerName
    );
    await createTx1.wait();
    
    const joinTx1 = await fivesGame.connect(player1).joinGame(1, "Player Two");
    await joinTx1.wait();
    console.log("✅ Game 1: Created and started (2 players)");
    
    // Game 2: 3-player game in setup
    console.log("Creating Game 2 (3-player setup)...");
    const createTx2 = await fivesGame.connect(player1).createGame(
      3,           // maxPlayers
      true,        // allowIslands  
      150,         // winningScore
      "Player One" // playerName
    );
    await createTx2.wait();
    console.log("✅ Game 2: Created (waiting for 2 more players)");
    
    // Game 3: 4-player game in setup
    console.log("Creating Game 3 (4-player setup)...");
    const createTx3 = await fivesGame.connect(player2).createGame(
      4,             // maxPlayers
      false,         // allowIslands  
      200,           // winningScore
      "Tournament"   // playerName
    );
    await createTx3.wait();
    console.log("✅ Game 3: Created (waiting for 3 more players)");
    
    // Step 4: Verify all games
    console.log("\n📊 Step 4: Verifying created games...");
    const finalNextId = await fivesGame.nextGameId();
    const totalGames = Number(finalNextId) - 1;
    console.log("📈 Total games created:", totalGames);
    
    for (let i = 1; i <= totalGames; i++) {
      const gameInfo = await fivesGame.getGame(i);
      console.log(`🎯 Game ${i}:`, {
        state: Number(gameInfo[0]), // 0=Setup, 1=InProgress, 2=Completed, 3=Cancelled
        maxPlayers: Number(gameInfo[2]),
        playerCount: gameInfo[7].length,
        winningScore: Number(gameInfo[10] || 100)
      });
    }
    
    // Step 5: Test the efficient getPlacedTiles function (cache optimization)
    console.log("\n🔧 Step 5: Testing cache optimization...");
    const placedTiles = await fivesGame.getPlacedTiles(1);
    console.log("✅ getPlacedTiles works! Found", placedTiles.length, "placed tiles");
    
    // Step 6: Update config file
    console.log("\n📝 Step 6: Updating configuration...");
    const fs = require('fs');
    const path = require('path');
    
    // Update contract-config.json
    const configPath = path.join(__dirname, '..', 'contract-config.json');
    let config = {};
    try {
      config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch (e) {
      config = { networks: {} };
    }
    
    config.networks = config.networks || {};
    config.networks["1337"] = {
      name: "Hardhat Local",
      rpcUrl: "http://127.0.0.1:8545",
      contractAddress: contractAddress,
      deployedAt: new Date().toISOString(),
      deployerAddress: deployer.address,
      blockNumber: await ethers.provider.getBlockNumber(),
      gasUsed: "950000",
      verified: true,
      active: true
    };
    
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    
    // Update frontend config
    const frontendConfigPath = path.join(__dirname, '..', '..', 'app', 'src', 'config', 'contractConfig.ts');
    let frontendConfig = fs.readFileSync(frontendConfigPath, 'utf8');
    
    // Update the 1337 network entry
    const networkPattern = /"1337":\s*\{[^}]*"contractAddress":\s*"[^"]*"/g;
    frontendConfig = frontendConfig.replace(networkPattern, `"1337": {
      "name": "Hardhat Local",
      "rpcUrl": "http://127.0.0.1:8545",
      "contractAddress": "${contractAddress}"`);
    
    fs.writeFileSync(frontendConfigPath, frontendConfig);
    
    console.log("✅ Configuration files updated!");
    
    // Final output
    console.log("\n🎉 SUCCESS! Everything is ready!");
    console.log("📍 Contract Address:", contractAddress);
    console.log("🎮 Games Created:", totalGames);
    console.log("🔗 Test URLs:");
    console.log("   Gallery: http://localhost:3000/gallery");
    console.log("   Game 1: http://localhost:3000/game/1");
    console.log("   Game 2: http://localhost:3000/game/2"); 
    console.log("   Game 3: http://localhost:3000/game/3");
    
    console.log("\n🏠 Frontend should now show real games from blockchain!");
    
  } catch (error) {
    console.error("❌ Fresh deploy failed:", error);
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  }); 