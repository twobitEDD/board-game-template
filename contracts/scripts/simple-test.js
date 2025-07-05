const { ethers } = require("hardhat");

async function main() {
  console.log("🧪 Testing FivesGame Contract...");
  
  // Use the deployed contract address
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  
  // Get signers
  const [deployer, player1, player2] = await ethers.getSigners();
  
  // Get contract instance
  const FivesGame = await ethers.getContractFactory("FivesGame");
  const fivesGame = FivesGame.attach(contractAddress);
  
  console.log("📍 Contract address:", contractAddress);
  console.log("👤 Deployer:", deployer.address);
  
  try {
    // Test 1: Check if contract is responsive
    console.log("\n🔍 Test 1: Basic contract interaction...");
    const nextGameId = await fivesGame.nextGameId();
    console.log("✅ Contract is responsive! Next game ID:", nextGameId.toString());
    
    // Test 2: Create a simple game
    console.log("\n🔍 Test 2: Creating a simple game...");
    const createTx = await fivesGame.connect(deployer).createGame(
      2,       // maxPlayers
      false,   // allowIslands  
      100,     // winningScore
      "Test Player" // playerName
    );
    await createTx.wait();
    console.log("✅ Game created successfully!");
    
    // Test 3: Check the created game
    console.log("\n🔍 Test 3: Checking created game...");
    const gameId = nextGameId;
    const gameInfo = await fivesGame.getGame(gameId);
    
    console.log("📊 Game Info:");
    console.log("   Game ID:", gameId.toString());
    console.log("   State:", gameInfo[0].toString(), "(0=Setup, 1=InProgress, 2=Completed, 3=Cancelled)");
    console.log("   Creator:", gameInfo[1]);
    console.log("   Max Players:", gameInfo[2].toString());
    console.log("   Current Player Index:", gameInfo[3].toString());
    console.log("   Turn Number:", gameInfo[4].toString());
    console.log("   Player Addresses:", gameInfo[7]);
    console.log("   Player Scores:", gameInfo[8].map(score => score.toString()));
    console.log("   Winning Score:", gameInfo[10] ? gameInfo[10].toString() : "100");
    
    // Test 4: Create more games for gallery
    console.log("\n🔍 Test 4: Creating additional games...");
    
    // Game 2 - 2 players, auto-start
    const createTx2 = await fivesGame.connect(player1).createGame(2, false, 150, "Player One");
    await createTx2.wait();
    
    const game2Id = Number(nextGameId) + 1;
    const joinTx = await fivesGame.connect(player2).joinGame(game2Id, "Player Two");
    await joinTx.wait();
    console.log("✅ Game 2 created and started with 2 players");
    
    // Game 3 - 4 players, setup phase
    const createTx3 = await fivesGame.connect(player2).createGame(4, true, 200, "Tournament Host");
    await createTx3.wait();
    console.log("✅ Game 3 created (waiting for more players)");
    
    // Final check
    const finalNextId = await fivesGame.nextGameId();
    console.log("\n🎉 Created", (Number(finalNextId) - Number(nextGameId)), "test games!");
    console.log("📊 Total games:", (Number(finalNextId) - 1));
    
    console.log("\n🔗 Gallery URLs:");
    console.log("   Main Gallery: http://localhost:3000/gallery");
    for (let i = Number(nextGameId); i < Number(finalNextId); i++) {
      console.log(`   Game ${i}: http://localhost:3000/game/${i}`);
    }
    
  } catch (error) {
    console.error("❌ Test failed:", error);
    console.error("Full error:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  }); 