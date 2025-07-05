const { ethers } = require("hardhat");
const hre = require("hardhat");

async function main() {
  console.log("🔍 Checking games on Base Sepolia...");
  
  // Updated to the new contract with startGame sponsorship fix
  const contractAddress = "0xf151B1Af118b8D050B0F26319f58B0372bEA8A75";
  const contract = await ethers.getContractAt("FivesGame", contractAddress);
  
  console.log("📍 Contract:", contractAddress);
  console.log("🌐 Network:", hre.network.name);
  
  try {
    // Get contract instance using Hardhat
    const provider = ethers.provider;
    const blockNumber = await provider.getBlockNumber();
    console.log("✅ Connected! Latest block:", blockNumber);
    
    // Check how many games exist
    console.log("📊 Getting nextGameId...");
    const nextGameId = await contract.nextGameId();
    const totalGames = Number(nextGameId) - 1;
    console.log("📊 Total games:", totalGames);
    
    if (totalGames === 0) {
      console.log("📝 No games found");
      return;
    }
    
    // Check each game
    for (let gameId = 1; gameId <= totalGames; gameId++) {
      console.log(`\n🎮 === GAME ${gameId} ===`);
      
      try {
        const gameData = await contract.getGame(gameId);
        const [state, creator, maxPlayers, currentPlayer, turnNumber, createdAt, allowIslands, playerAddresses, playerScores, tilesRemaining] = gameData;
        
        console.log("📊 Game State:", {
          state: Number(state) === 0 ? "Setup" : Number(state) === 1 ? "In Progress" : Number(state) === 2 ? "Completed" : "Canceled",
          creator: creator,
          maxPlayers: Number(maxPlayers),
          currentPlayer: Number(currentPlayer),
          turnNumber: Number(turnNumber),
          playersJoined: playerAddresses.length,
          allowIslands: allowIslands,
          tilesRemaining: Number(tilesRemaining)
        });
        
        console.log("👥 Players:", playerAddresses.map((addr, i) => `${addr} (${Number(playerScores[i])} points)`));
        
        // Check placed tiles
        try {
          const placedTiles = await contract.getPlacedTiles(gameId);
          const [xPositions, yPositions, numbers, turnNumbers] = placedTiles;
          
          console.log(`🎯 Tiles placed: ${xPositions.length}`);
          if (xPositions.length > 0) {
            console.log("📋 Tile details:");
            for (let i = 0; i < Math.min(xPositions.length, 5); i++) {
              console.log(`  (${Number(xPositions[i])}, ${Number(yPositions[i])}) = ${Number(numbers[i])}`);
            }
            if (xPositions.length > 5) {
              console.log(`  ... and ${xPositions.length - 5} more tiles`);
            }
          }
        } catch (tileError) {
          console.log("❌ Could not get placed tiles:", tileError.message);
        }
        
      } catch (gameError) {
        console.log(`❌ Could not get game ${gameId}:`, gameError.message);
      }
    }
    
  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error("❌ Full error:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 