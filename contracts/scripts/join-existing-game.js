const { ethers } = require("hardhat");

async function main() {
  console.log("🎮 Joining existing game to place tiles...");
  
  // Use the working contract with existing games
  const contractAddress = "0x80f80B22D1839F2216F7f7814398e7039Fc17546";
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
    const currentGameId = await contract.nextGameId();
    console.log("📊 Next game ID:", Number(currentGameId));
    
    // Check existing games
    console.log("\n🔍 Checking existing games...");
    for (let gameId = 1; gameId < Number(currentGameId); gameId++) {
      try {
        const gameData = await contract.getGame(gameId);
        console.log(`Game ${gameId}:`, {
          state: Number(gameData[0]) === 0 ? "Setup" : Number(gameData[0]) === 1 ? "In Progress" : "Other",
          players: gameData[7].length,
          maxPlayers: Number(gameData[2]),
          creator: gameData[1]
        });
        
        // Try to join game if it's in setup and has space
        if (Number(gameData[0]) === 0 && gameData[7].length < Number(gameData[2])) {
          console.log(`\n🎯 Attempting to join game ${gameId}...`);
          
          try {
            const joinTx = await contract.joinGame(gameId, "Player2", {
              gasLimit: 300000
            });
            await joinTx.wait();
            console.log(`✅ Joined game ${gameId}!`);
            
            // Check if game auto-started (when full)
            const updatedGameData = await contract.getGame(gameId);
            console.log("📊 Game after join:", {
              state: Number(updatedGameData[0]) === 1 ? "In Progress" : "Setup",
              players: updatedGameData[7].length
            });
            
            if (Number(updatedGameData[0]) === 1) {
              console.log("🎉 Game started automatically!");
              await attemptTilePlacement(contract, gameId, player);
              return; // Success!
            } else if (updatedGameData[7].length === Number(updatedGameData[2])) {
              // Game is full but didn't auto-start, try manual start
              console.log("🚀 Trying to start full game manually...");
              try {
                const startTx = await contract.startGame(gameId, {
                  gasLimit: 300000
                });
                await startTx.wait();
                console.log("✅ Game started manually!");
                await attemptTilePlacement(contract, gameId, player);
                return; // Success!
              } catch (startError) {
                console.log("❌ Could not start game:", startError.message);
              }
            }
            
          } catch (joinError) {
            if (joinError.message.includes("Already in this game")) {
              console.log("👤 Already in this game, checking if we can start it or place tiles");
              
              // Check current game state
              const currentGameData = await contract.getGame(gameId);
              if (Number(currentGameData[0]) === 1) {
                console.log("🎉 Game is in progress!");
                await attemptTilePlacement(contract, gameId, player);
                return; // Success!
              } else if (Number(currentGameData[0]) === 0) {
                // Try to start as creator
                try {
                  const startTx = await contract.startGame(gameId, {
                    gasLimit: 300000
                  });
                  await startTx.wait();
                  console.log("✅ Started game as creator!");
                  await attemptTilePlacement(contract, gameId, player);
                  return; // Success!
                } catch (startError) {
                  console.log("❌ Could not start game:", startError.message);
                }
              }
            } else {
              console.log(`❌ Could not join game ${gameId}:`, joinError.message);
            }
          }
        }
        
      } catch (gameError) {
        console.log(`❌ Could not get game ${gameId}:`, gameError.message);
      }
    }
    
    console.log("\n🎲 No joinable games found, creating a new 2-player game...");
    
    // If no existing games work, try creating a new one with minimal parameters
    try {
      const createTx = await contract.createGame(
        2, // maxPlayers
        true, // allowIslands
        100, // winningScore (minimum)
        "Creator", // name
        { 
          gasLimit: 800000, // Higher gas limit
        }
      );
      
      console.log("🔄 Transaction sent, waiting for confirmation...");
      const receipt = await createTx.wait();
      console.log("✅ Game created! Gas used:", Number(receipt.gasUsed));
      
      const newGameId = Number(currentGameId);
      console.log("🎲 New Game ID:", newGameId);
      
      // Try to start it immediately (creator only)
      console.log("🚀 Attempting to start as creator...");
      try {
        const startTx = await contract.startGame(newGameId, {
          gasLimit: 300000
        });
        await startTx.wait();
        console.log("❌ Game started with only 1 player (unexpected for 2-player game)");
        await attemptTilePlacement(contract, newGameId, player);
      } catch (startError) {
        console.log("✅ Game requires 2 players (as expected)");
        console.log("💡 Game created and waiting for second player");
      }
      
    } catch (createError) {
      console.error("❌ Could not create game:", createError.message);
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
    
    // Try to place a few more tiles
    const moreTiles = [
      { x: 8, y: 7, name: "Right" },
      { x: 7, y: 8, name: "Below" },
      { x: 6, y: 7, name: "Left" }
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
        const { x, y, name } = moreTiles[i];
        
        console.log(`Placing tile ${nextTile} at (${x},${y}) - ${name}...`);
        
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
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (moreTileError) {
        console.log(`❌ Could not place tile: ${moreTileError.message}`);
        if (moreTileError.message.includes("not your turn")) {
          console.log("💡 Waiting for other player - this is normal in multiplayer");
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