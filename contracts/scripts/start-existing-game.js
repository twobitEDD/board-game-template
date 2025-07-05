const { ethers } = require("hardhat");

async function main() {
  console.log("🎮 Starting existing game as creator...");
  
  // Use the single-player enabled contract
  const contractAddress = "0xa296A27561B207d235CA61DF3C2cBa431A0ad88C";
  const contract = await ethers.getContractAt("FivesGame", contractAddress);
  
  console.log("📍 Contract:", contractAddress);
  console.log("🌐 Network:", network.name);
  
  // Get the player address
  const accounts = await ethers.getSigners();
  const player = accounts[0];
  console.log("👤 Player:", player.address);
  
  // Check balance
  const balance = await ethers.provider.getBalance(player.address);  
  console.log("💰 Balance:", ethers.formatEther(balance), "ETH");
  
  try {
    // Try to start game 1 as creator
    const gameId = 1;
    console.log(`\n🚀 Attempting to start game ${gameId} as creator...`);
    
    // Check game state first
    const gameData = await contract.getGame(gameId);
    console.log(`Game ${gameId} current state:`, {
      state: Number(gameData[0]) === 0 ? "Setup" : Number(gameData[0]) === 1 ? "In Progress" : "Other",
      creator: gameData[1],
      players: gameData[7].length,
      maxPlayers: Number(gameData[2])
    });
    
    if (gameData[1] === player.address) {
      console.log("✅ You are the creator of this game");
      
      if (Number(gameData[0]) === 0) {
        console.log("🎯 Game is in setup, attempting to start...");
        
        try {
          const startTx = await contract.startGame(gameId, {
            gasLimit: 300000
          });
          
          console.log("🔄 Start transaction sent, waiting for confirmation...");
          const receipt = await startTx.wait();
          console.log("✅ Game started! Gas used:", Number(receipt.gasUsed));
          
          // Check if game is now in progress
          const updatedGameData = await contract.getGame(gameId);
          console.log("📊 Game after start:", {
            state: Number(updatedGameData[0]) === 1 ? "In Progress" : "Other",
            players: updatedGameData[7].length
          });
          
          if (Number(updatedGameData[0]) === 1) {
            console.log("🎉 Game successfully started!");
            
            // Now try to place tiles
            await attemptTilePlacement(contract, gameId, player);
          }
          
        } catch (startError) {
          console.log("❌ Could not start game:", startError.message);
          console.log("💡 This may be because the game requires 2 players");
        }
        
      } else if (Number(gameData[0]) === 1) {
        console.log("🎉 Game is already in progress!");
        await attemptTilePlacement(contract, gameId, player);
      }
      
    } else {
      console.log("❌ You are not the creator of this game");
    }
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

async function attemptTilePlacement(contract, gameId, player) {
  try {
    console.log("\n🎯 Attempting to place tiles...");
    
    // Get player hand
    const playerData = await contract.getPlayer(gameId, player.address);
    const hand = playerData[2];
    console.log("🃏 Player hand:", hand.map(n => Number(n)));
    
    if (hand.length === 0) {
      console.log("❌ No tiles in hand");
      return;
    }
    
    // Place first tile at center
    const tile = Number(hand[0]);
    console.log(`Placing tile ${tile} at (7,7)...`);
    
    const placements = [{
      number: tile,
      x: 7,
      y: 7
    }];
    
    const placeTx = await contract.playTurn(gameId, placements, {
      gasLimit: 600000
    });
    await placeTx.wait();
    console.log(`✅ Placed tile ${tile} at (7,7)!`);
    
    // Place more tiles if possible
    const moreTiles = [
      { x: 8, y: 7 },
      { x: 7, y: 8 },
      { x: 6, y: 7 },
      { x: 7, y: 6 }
    ];
    
    for (let i = 0; i < moreTiles.length; i++) {
      try {
        const currentPlayerData = await contract.getPlayer(gameId, player.address);
        const currentHand = currentPlayerData[2];
        
        if (currentHand.length === 0) {
          console.log("No more tiles in hand");
          break;
        }
        
        const nextTile = Number(currentHand[0]);
        const { x, y } = moreTiles[i];
        
        console.log(`Placing tile ${nextTile} at (${x},${y})...`);
        
        const nextPlacements = [{
          number: nextTile,
          x: x,
          y: y
        }];
        
        const nextTx = await contract.playTurn(gameId, nextPlacements, {
          gasLimit: 600000
        });
        await nextTx.wait();
        console.log(`✅ Placed tile ${nextTile} at (${x},${y})`);
        
        // Small delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (moreTileError) {
        console.log(`❌ Could not place more tile: ${moreTileError.message}`);
        if (moreTileError.message.includes("not your turn")) {
          console.log("💡 Turn ended - this is normal");
          break;
        }
      }
    }
    
    // Check final placed tiles
    const placedTiles = await contract.getPlacedTiles(gameId);
    console.log(`📋 Final tiles on board: ${placedTiles[0].length}`);
    
    if (placedTiles[0].length > 0) {
      console.log("\n🎉 SUCCESS! Game with tiles created!");
      console.log(`🔗 Game ${gameId} now has ${placedTiles[0].length} tiles for gallery preview`);
      console.log("💡 Refresh the gallery to see board preview");
      
      // Log tile positions for verification
      for (let i = 0; i < placedTiles[0].length; i++) {
        console.log(`  Tile ${i+1}: (${Number(placedTiles[0][i])}, ${Number(placedTiles[1][i])}) = ${Number(placedTiles[2][i])}`);
      }
    }
    
  } catch (tileError) {
    console.log("❌ Could not place tiles:", tileError.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 