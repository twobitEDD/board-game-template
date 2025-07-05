const { ethers } = require("hardhat");

async function main() {
  console.log("🎮 Placing tiles in existing game on Base Sepolia...");
  
  // Get the deployed contract
  const contractAddress = "0x80f80B22D1839F2216F7f7814398e7039Fc17546";
  const contract = await ethers.getContractAt("FivesGame", contractAddress);
  
  // Get the player address (deployer)
  const accounts = await ethers.getSigners();
  const player = accounts[0];
  
  console.log("📍 Contract:", contractAddress);
  console.log("🌐 Network:", network.name);
  console.log("👤 Player:", player.address);
  
  const gameId = 1; // Use game 1
  
  try {
    // Check game state
    console.log(`\n🔍 Checking game ${gameId}...`);
    const gameData = await contract.getGame(gameId);
    console.log("Game state:", Number(gameData[0]) === 0 ? "Setup" : Number(gameData[0]) === 1 ? "In Progress" : "Other");
    console.log("Players:", gameData[7].length);
    console.log("Turn number:", Number(gameData[4]));
    console.log("Player addresses:", gameData[7]);
    
    // Check current placed tiles
    const placedTilesBefore = await contract.getPlacedTiles(gameId);
    console.log("Tiles already placed:", placedTilesBefore[0].length);
    
    // If game is in setup, we need to start it somehow
    if (Number(gameData[0]) === 0) {
      console.log("\n🚀 Game is in setup. Checking if we're in the game...");
      
      // Check if we're already in the game
      const isPlayerInGame = gameData[7].includes(player.address);
      console.log("Are we in the game?", isPlayerInGame);
      
      if (!isPlayerInGame) {
        console.log("🚪 Joining the game first...");
        const joinTx = await contract.joinGame(gameId, "Solo Player", {
          gasLimit: 300000
        });
        await joinTx.wait();
        console.log("✅ Joined game");
        
        // Get updated game data
        const updatedGameData = await contract.getGame(gameId);
        console.log("Updated game state:", Number(updatedGameData[0]) === 0 ? "Setup" : Number(updatedGameData[0]) === 1 ? "In Progress" : "Other");
        console.log("Updated players:", updatedGameData[7].length);
      }
      
      // Try to start the game manually if we're the creator
      const currentGameData = await contract.getGame(gameId);
      if (currentGameData[1] === player.address && Number(currentGameData[0]) === 0) {
        console.log("🚀 Starting the game as creator...");
        try {
          const startTx = await contract.startGame(gameId, {
            gasLimit: 300000
          });
          await startTx.wait();
          console.log("✅ Game started");
        } catch (startError) {
          console.log(`❌ Could not start game: ${startError.message}`);
          return;
        }
      }
    }
    
    // Get updated game state
    const finalGameData = await contract.getGame(gameId);
    console.log("\n📊 Final game state:", Number(finalGameData[0]) === 1 ? "In Progress" : "Other");
    
    if (Number(finalGameData[0]) !== 1) {
      console.log("❌ Game is not in progress, cannot place tiles");
      return;
    }
    
    // Get player's hand using correct function
    console.log("\n🃏 Getting player hand...");
    const playerData = await contract.getPlayer(gameId, player.address);
    const hand = playerData[2]; // hand is the 3rd element in the return tuple
    console.log("Player hand:", hand.map(n => Number(n)));
    
    if (hand.length === 0) {
      console.log("❌ No tiles in hand");
      return;
    }
    
    // Now place tiles using playTurn with TilePlacement array
    console.log("\n🎯 Placing tiles to create a pattern...");
    
    const tilesToPlace = [
      { x: 7, y: 7, name: "Center" },
      { x: 8, y: 7, name: "Right" },
      { x: 7, y: 8, name: "Below" },
      { x: 6, y: 7, name: "Left" },
      { x: 7, y: 6, name: "Above" }
    ];
    
    for (let i = 0; i < Math.min(tilesToPlace.length, hand.length); i++) {
      try {
        // Get current hand (it changes after each placement)
        const currentPlayerData = await contract.getPlayer(gameId, player.address);
        const currentHand = currentPlayerData[2];
        
        if (currentHand.length === 0) {
          console.log("❌ No more tiles in hand");
          break;
        }
        
        const tile = Number(currentHand[0]); // Use first tile in hand
        const { x, y, name } = tilesToPlace[i];
        
        console.log(`🎯 Placing tile ${tile} at (${x},${y}) - ${name}...`);
        
        // Create TilePlacement struct array (note: just one placement per turn)
        const placements = [{
          number: tile,
          x: x,
          y: y
        }];
        
        const placeTx = await contract.playTurn(gameId, placements, {
          gasLimit: 600000
        });
        await placeTx.wait();
        console.log(`✅ Placed tile ${tile} at (${x},${y})`);
        
        // Small delay to avoid overwhelming the network
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.log(`❌ Could not place tile at (${tilesToPlace[i].x},${tilesToPlace[i].y}): ${error.message}`);
        
        // If it's not our turn, skip this iteration
        if (error.message.includes("Not your turn")) {
          console.log("⏭️ Not our turn, skipping...");
          continue;
        }
        
        // If placement is invalid, try next position
        if (error.message.includes("Invalid")) {
          console.log("⏭️ Invalid placement, trying next...");
          continue;
        }
        
        // For other errors, break
        break;
      }
    }
    
    // Check final board state
    console.log("\n🔍 Checking final board state...");
    const finalPlacedTiles = await contract.getPlacedTiles(gameId);
    const [xPositions, yPositions, numbers, turnNumbers] = finalPlacedTiles;
    
    console.log(`📋 Total tiles placed: ${xPositions.length}`);
    console.log("Tile positions:");
    for (let i = 0; i < Math.min(xPositions.length, 10); i++) {
      console.log(`  Tile ${i + 1}: (${Number(xPositions[i])}, ${Number(yPositions[i])}) = ${Number(numbers[i])}`);
    }
    if (xPositions.length > 10) {
      console.log(`  ... and ${xPositions.length - 10} more tiles`);
    }
    
    console.log(`\n🎉 SUCCESS! Game ${gameId} now has ${xPositions.length} tiles placed!`);
    console.log("🔗 Gallery should now show board preview with tiles");
    console.log("💡 Refresh the gallery page to see the board preview");
    
  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error("Full error details:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 