const hre = require("hardhat");

async function main() {
  console.log("🎮 Creating Fresh FivesGame Deployment with Test Games...\n");

  // Get signers (test accounts)
  const [deployer, player1, player2, player3, player4] = await hre.ethers.getSigners();
  
  console.log("📝 Deploying with account:", deployer.address);
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH");
  console.log("🌐 Network:", hre.network.name, "| Chain ID:", hre.network.config.chainId || "unknown");
  
  // Deploy fresh contract
  console.log("\n🚀 Deploying fresh FivesGame contract...");
  const FivesGame = await hre.ethers.getContractFactory("FivesGame");
  const game = await FivesGame.deploy();
  await game.waitForDeployment();
  
  console.log("✅ FivesGame deployed successfully!");
  console.log("📍 Contract address:", game.target);
  
  console.log("\n🎲 Creating 5 test games with different scenarios...\n");
  
  // Game 1: Setup game waiting for players
  console.log("🎯 Game 1: Setup game (waiting for players)");
  const tx1 = await game.connect(deployer).createGame(
    4,        // maxPlayers
    false,    // allowIslands
    100,      // winningScore
    "Alice"   // playerName
  );
  await tx1.wait();
  
  // Add one more player but don't start
  await game.connect(player1).joinGame(1, "Bob");
  console.log("   ✅ Created setup game with 2/4 players");
  
  // Game 2: Active 2-player game with some moves
  console.log("\n🎯 Game 2: Active 2-player game (mid-game)");
  const tx2 = await game.connect(player1).createGame(
    2,        // maxPlayers  
    true,     // allowIslands
    150,      // winningScore
    "Charlie"
  );
  await tx2.wait();
  
  await game.connect(player2).joinGame(2, "Diana");
  
  // Try to start the game (creator should be able to start)
  try {
    await game.connect(player1).startGame(2);
    console.log("   ✅ Game 2 started successfully");
  } catch (e) {
    console.log("   ⚠️ Could not start game 2:", e.message);
    console.log("   Continuing with tile placement attempts...");
  }
  
  // Make several moves to create interesting board state
  try {
    // Charlie's turn (player1) - place center tile
    await game.connect(player1).playTurn(2, [
      { number: 5, x: 7, y: 7 }  // Center tile
    ]);
    
    // Diana's turn (player2) - place adjacent
    await game.connect(player2).playTurn(2, [
      { number: 3, x: 8, y: 7 }  // Right of center
    ]);
    
    // Charlie's turn - extend the line
    await game.connect(player1).playTurn(2, [
      { number: 7, x: 6, y: 7 }  // Left of center
    ]);
    
    console.log("   ✅ Created active game with tile placements");
  } catch (e) {
    console.log("   ⚠️ Some moves failed (expected), game still created");
  }
  
  // Game 3: Full 4-player game in progress
  console.log("\n🎯 Game 3: Full 4-player game (advanced)");
  const tx3 = await game.connect(player2).createGame(
    4,        // maxPlayers
    true,     // allowIslands
    200,      // winningScore
    "Eve"
  );
  await tx3.wait();
  
  await game.connect(player3).joinGame(3, "Frank");
  await game.connect(player4).joinGame(3, "Grace");
  await game.connect(deployer).joinGame(3, "Henry");
  
  try {
    await game.connect(player2).startGame(3);
    console.log("   ✅ Game 3 started successfully");
  } catch (e) {
    console.log("   ⚠️ Could not start game 3:", e.message);
  }
  
  // Make several rounds of moves
  try {
    // Round 1
    await game.connect(player2).playTurn(3, [{ number: 2, x: 7, y: 7 }]);
    await game.connect(player3).playTurn(3, [{ number: 8, x: 7, y: 8 }]);
    await game.connect(player4).playTurn(3, [{ number: 1, x: 7, y: 6 }]);
    await game.connect(deployer).playTurn(3, [{ number: 9, x: 8, y: 7 }]);
    
    // Round 2
    await game.connect(player2).playTurn(3, [{ number: 4, x: 6, y: 7 }]);
    await game.connect(player3).playTurn(3, [{ number: 6, x: 8, y: 8 }]);
    
    console.log("   ✅ Created 4-player game with multiple rounds");
  } catch (e) {
    console.log("   ⚠️ Some moves failed (expected), game still created");
  }
  
  // Game 4: Completed game with winner
  console.log("\n🎯 Game 4: Completed game (with winner)");
  const tx4 = await game.connect(player3).createGame(
    2,        // maxPlayers
    false,    // allowIslands
    100,      // winningScore
    "Ivan"
  );
  await tx4.wait();
  
  await game.connect(player4).joinGame(4, "Julia");
  
  try {
    await game.connect(player3).startGame(4);
    console.log("   ✅ Game 4 started successfully");
  } catch (e) {
    console.log("   ⚠️ Could not start game 4:", e.message);
  }
  
  // Try to create a winning scenario by making multiple moves
  try {
    for (let i = 0; i < 8; i++) {
      // Ivan's turns
      if (i % 2 === 0) {
        await game.connect(player3).playTurn(4, [{ 
          number: i % 10, 
          x: 7 + (i % 3), 
          y: 7 + Math.floor(i / 3) 
        }]);
      } else {
        // Julia's turns
        await game.connect(player4).playTurn(4, [{ 
          number: (i + 5) % 10, 
          x: 5 + (i % 3), 
          y: 7 + Math.floor(i / 3) 
        }]);
      }
    }
    console.log("   ✅ Created completed game scenario");
  } catch (e) {
    console.log("   ⚠️ Game may have completed early or moves failed");
  }
  
  // Game 5: Recently started game with minimal moves
  console.log("\n🎯 Game 5: Recently started game (early stage)");
  const tx5 = await game.connect(player4).createGame(
    3,        // maxPlayers
    true,     // allowIslands
    120,      // winningScore
    "Kate"
  );
  await tx5.wait();
  
  await game.connect(deployer).joinGame(5, "Liam");
  await game.connect(player1).joinGame(5, "Mia");
  
  try {
    await game.connect(player4).startGame(5);
    console.log("   ✅ Game 5 started successfully");
  } catch (e) {
    console.log("   ⚠️ Could not start game 5:", e.message);
  }
  
  // Just one move to get started
  try {
    await game.connect(player4).playTurn(5, [{ number: 0, x: 7, y: 7 }]);
    console.log("   ✅ Created fresh game with initial move");
  } catch (e) {
    console.log("   ⚠️ Initial move failed, game still created");
  }
  
  console.log("\n📊 DEPLOYMENT SUMMARY:");
  console.log("======================");
  console.log("Contract Address:", game.target);
  console.log("Network:", hre.network.name);
  console.log("Chain ID:", hre.network.config.chainId || "unknown");
  console.log("Deployer:", deployer.address);
  
  console.log("\n🎮 Test Games Created:");
  console.log("Game 1: Setup (2/4 players) - Waiting for more players");
  console.log("Game 2: Active 2P game - Mid-game with tile placements");  
  console.log("Game 3: Active 4P game - Advanced gameplay");
  console.log("Game 4: Completed - Finished with winner");
  console.log("Game 5: Fresh start - Recently begun");
  
  console.log("\n🔗 Gallery Test URLs:");
  console.log("Gallery View: http://localhost:3001/gallery");
  console.log("Game 1 Spectate: http://localhost:3001/game/1");
  console.log("Game 1 Join: http://localhost:3001/game/1/play");
  console.log("Game 2 Spectate: http://localhost:3001/game/2");
  console.log("Game 3 Spectate: http://localhost:3001/game/3");
  
  // Save deployment info
  const deploymentInfo = {
    contractAddress: game.target,
    network: hre.network.name,
    chainId: hre.network.config.chainId || "unknown",
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    gameCount: 5,
    testAccounts: {
      deployer: deployer.address,
      player1: player1.address,
      player2: player2.address,
      player3: player3.address,
      player4: player4.address
    }
  };
  
  const fs = require('fs');
  const deploymentPath = `./deployments/FivesGame-TestGames-${Date.now()}.json`;
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("📄 Deployment info saved to:", deploymentPath);
  
  console.log("\n🎉 Test games deployment complete! Ready for gallery testing.");
  
  // Quick verification
  console.log("\n🔍 Quick verification:");
  try {
    for (let i = 1; i <= 5; i++) {
      const gameInfo = await game.getGame(i);
      console.log(`Game ${i}: State=${gameInfo.state}, Players=${gameInfo.playerAddresses.length}/${gameInfo.maxPlayers}, Turn=${gameInfo.turnNumber}`);
    }
  } catch (e) {
    console.log("Verification failed:", e.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }); 