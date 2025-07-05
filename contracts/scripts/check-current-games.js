const hre = require("hardhat");

async function main() {
  console.log("🔍 Checking Current Blockchain State...\n");
  
  const contractAddress = "0x922D6956C99E12DFeB3224DEA977D0939758A1Fe";
  const [player1] = await hre.ethers.getSigners();
  const FivesGame = await hre.ethers.getContractFactory("FivesGame");
  
  try {
    const game = FivesGame.attach(contractAddress).connect(player1);
    
    console.log("📋 Contract Info:");
    console.log(`  Address: ${contractAddress}`);
    console.log(`  Network: ${hre.network.name}`);
    
    // Check if contract exists
    const code = await hre.ethers.provider.getCode(contractAddress);
    if (code === '0x') {
      console.log("❌ Contract does not exist at this address!");
      return;
    } else {
      console.log("✅ Contract exists");
    }
    
    // Get next game ID
    let nextGameId;
    try {
      nextGameId = await game.nextGameId();
      nextGameId = Number(nextGameId); // Convert BigInt to Number
      console.log(`📊 Next Game ID: ${nextGameId}`);
    } catch (e) {
      console.log("❌ Failed to get nextGameId:", e.message);
      return;
    }
    
    if (nextGameId <= 1) {
      console.log("⚠️ No games exist! NextGameId is 1, so no games have been created.");
      return;
    }
    
    // Check each game
    console.log(`\n🎮 Checking Games 1 to ${nextGameId - 1}:`);
    console.log("=".repeat(50));
    
    for (let gameId = 1; gameId < nextGameId; gameId++) {
      try {
        console.log(`\n🎯 Game ${gameId}:`);
        
        const gameInfo = await game.getGame(gameId);
        const state = Number(gameInfo.state);
        console.log(`  State: ${state} (${['Setup', 'InProgress', 'Completed', 'Cancelled'][state]})`);
        console.log(`  Creator: ${gameInfo.creator}`);
        console.log(`  Max Players: ${Number(gameInfo.maxPlayers)}`);
        console.log(`  Current Player Index: ${Number(gameInfo.currentPlayerIndex)}`);
        console.log(`  Turn Number: ${Number(gameInfo.turnNumber)}`);
        console.log(`  Player Addresses: [${gameInfo.playerAddresses.join(', ')}]`);
        console.log(`  Player Scores: [${gameInfo.playerScores.map(s => Number(s)).join(', ')}]`);
        console.log(`  Created At: ${new Date(Number(gameInfo.createdAt) * 1000).toLocaleString()}`);
        console.log(`  Allow Islands: ${gameInfo.allowIslands}`);
        
        // Check for placed tiles
        console.log(`  Tiles on board:`);
        let tilesFound = 0;
        for (let x = 4; x <= 10; x++) {
          for (let y = 4; y <= 10; y++) {
            try {
              const tile = await game.getTileAt(gameId, x, y);
              if (tile.exists) {
                console.log(`    (${x},${y}): ${tile.number}`);
                tilesFound++;
              }
            } catch (e) {
              // Ignore tile check errors
            }
          }
        }
        console.log(`  Total tiles placed: ${tilesFound}`);
        
      } catch (e) {
        console.log(`  ❌ Error reading game ${gameId}:`, e.message);
      }
    }
    
    // Test the exact same call that the frontend would make
    console.log(`\n🧪 Testing Frontend getAllGames() Logic:`);
    console.log("=".repeat(50));
    
    try {
      console.log("1. Getting nextGameId...");
      const frontendNextGameId = Number(await game.nextGameId());
      console.log(`   NextGameId: ${frontendNextGameId}`);
      
      const totalGames = frontendNextGameId - 1;
      console.log(`   Total games to fetch: ${totalGames}`);
      
      if (totalGames <= 0) {
        console.log("❌ No games to fetch!");
        return;
      }
      
      console.log("2. Fetching game data...");
      const games = [];
      
      for (let j = 1; j <= totalGames; j++) {
        try {
          console.log(`   Fetching game ${j}...`);
          const gameData = await game.getGame(j);
          console.log(`   ✅ Game ${j} data:`, {
            state: Number(gameData[0]),
            creator: gameData[1],
            maxPlayers: Number(gameData[2]),
            turnNumber: Number(gameData[4]),
            playerCount: gameData[7]?.length || 0
          });
          
          const transformedGame = {
            id: j,
            state: Number(gameData[0]),
            creator: gameData[1],
            maxPlayers: Number(gameData[2]),
            currentPlayerIndex: Number(gameData[3]),
            turnNumber: Number(gameData[4]),
            playerAddresses: gameData[7] || [],
            playerScores: Array.isArray(gameData[8]) ? gameData[8].map(score => Number(score)) : [],
            createdAt: Number(gameData[5]) || 0,
            allowIslands: gameData[6],
            tilesRemaining: Number(gameData[9]) || 50
          };
          
          games.push(transformedGame);
          
        } catch (e) {
          console.log(`   ❌ Failed to fetch game ${j}:`, e.message);
        }
      }
      
      console.log(`\n📊 Frontend would receive ${games.length} games:`);
      games.forEach(game => {
        console.log(`   Game ${game.id}: ${['Setup', 'InProgress', 'Completed', 'Cancelled'][game.state]} - Turn ${game.turnNumber} - ${game.playerAddresses.length} players`);
      });
      
    } catch (e) {
      console.log("❌ Frontend simulation failed:", e.message);
    }
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  }); 