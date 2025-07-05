const { ethers } = require("hardhat");

async function main() {
  console.log("🎮 Force placing tiles in existing games on Base Sepolia...");
  
  // Get the deployed contract (BACK TO WORKING VERSION)
  const contractAddress = "0x80f80B22D1839F2216F7f7814398e7039Fc17546";
  const contract = await ethers.getContractAt("FivesGame", contractAddress);
  
  // Get the player address (deployer)
  const accounts = await ethers.getSigners();
  const player = accounts[0];
  
  console.log("📍 Contract:", contractAddress);
  console.log("🌐 Network:", network.name);
  console.log("👤 Player:", player.address);
  
  try {
    // Check all existing games
    const nextGameId = await contract.nextGameId();
    const totalGames = Number(nextGameId) - 1;
    console.log("Total games:", totalGames);
    
    if (totalGames === 0) {
      console.log("No games exist");
      return;
    }
    
    // Try each game
    for (let gameId = 1; gameId <= totalGames; gameId++) {
      console.log(`\n🎮 === TRYING GAME ${gameId} ===`);
      
      try {
        // Get game state
        const gameData = await contract.getGame(gameId);
        const state = Number(gameData[0]);
        const playerAddresses = gameData[7];
        
        console.log("Game state:", state === 0 ? "Setup" : state === 1 ? "In Progress" : "Other");
        console.log("Players:", playerAddresses.length);
        console.log("Player addresses:", playerAddresses);
        console.log("Am I in game?", playerAddresses.includes(player.address));
        
        // Check if we can get player data (even in setup)
        try {
          const playerData = await contract.getPlayer(gameId, player.address);
          const hand = playerData[2];
          console.log("My hand:", hand.map(n => Number(n)));
          
          if (hand.length > 0) {
            console.log("🎯 I have tiles! Trying to place one...");
            
            const tile = Number(hand[0]);
            console.log(`Attempting to place tile ${tile} at (7,7)...`);
            
            const placements = [{
              number: tile,
              x: 7,
              y: 7
            }];
            
            try {
              const placeTx = await contract.playTurn(gameId, placements, {
                gasLimit: 800000
              });
              const receipt = await placeTx.wait();
              console.log(`✅ SUCCESS! Placed tile ${tile} at (7,7) in game ${gameId}`);
              console.log("Transaction hash:", receipt.hash);
              
              // Check if this started the game
              const updatedGameData = await contract.getGame(gameId);
              const newState = Number(updatedGameData[0]);
              console.log("New game state:", newState === 1 ? "In Progress" : "Setup");
              
              // Try to place more tiles
              if (newState === 1) {
                console.log("🎉 Game started! Placing more tiles...");
                
                const moreTilePositions = [
                  { x: 8, y: 7 },
                  { x: 7, y: 8 },
                  { x: 6, y: 7 },
                  { x: 7, y: 6 }
                ];
                
                for (let i = 0; i < moreTilePositions.length; i++) {
                  try {
                    const currentPlayerData = await contract.getPlayer(gameId, player.address);
                    const currentHand = currentPlayerData[2];
                    
                    if (currentHand.length === 0) {
                      console.log("No more tiles");
                      break;
                    }
                    
                    const nextTile = Number(currentHand[0]);
                    const { x, y } = moreTilePositions[i];
                    
                    console.log(`Placing tile ${nextTile} at (${x},${y})...`);
                    
                    const nextPlacements = [{
                      number: nextTile,
                      x: x,
                      y: y
                    }];
                    
                    const nextTx = await contract.playTurn(gameId, nextPlacements, {
                      gasLimit: 800000
                    });
                    await nextTx.wait();
                    console.log(`✅ Placed tile ${nextTile} at (${x},${y})`);
                    
                    // Small delay
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    
                  } catch (moreTileError) {
                    console.log(`❌ Could not place more tile: ${moreTileError.message}`);
                    if (moreTileError.message.includes("Not your turn")) {
                      console.log("Not my turn anymore, stopping");
                      break;
                    }
                  }
                }
              }
              
              // Check final tiles for this game
              const placedTiles = await contract.getPlacedTiles(gameId);
              const [xPositions, yPositions, numbers] = placedTiles;
              console.log(`🎯 Game ${gameId} final tiles: ${xPositions.length}`);
              
              if (xPositions.length > 0) {
                console.log("Tile positions:");
                for (let i = 0; i < Math.min(xPositions.length, 5); i++) {
                  console.log(`  (${Number(xPositions[i])}, ${Number(yPositions[i])}) = ${Number(numbers[i])}`);
                }
                
                console.log(`\n🎉 SUCCESS! Game ${gameId} has ${xPositions.length} tiles!`);
                console.log("🔗 Gallery should now show board preview");
                return; // Exit after first successful game
              }
              
            } catch (placeError) {
              console.log(`❌ Could not place tile: ${placeError.message}`);
              
              // Try different approach - check if it's a turn/state issue
              if (placeError.message.includes("Setup")) {
                console.log("Game needs to be started first");
              } else if (placeError.message.includes("turn")) {
                console.log("Turn order issue");
              } else if (placeError.message.includes("Invalid")) {
                console.log("Invalid placement");
              }
            }
          } else {
            console.log("No tiles in hand");
          }
        } catch (playerError) {
          console.log(`❌ Could not get player data: ${playerError.message}`);
          
          // Maybe we're not in this game, let's try joining if it's setup
          if (Number(gameData[0]) === 0 && !playerAddresses.includes(player.address)) {
            console.log("🚪 Trying to join this game...");
            try {
              const joinTx = await contract.joinGame(gameId, "Test Player", {
                gasLimit: 400000
              });
              await joinTx.wait();
              console.log("✅ Joined game");
              
              // Now try to get hand
              const newPlayerData = await contract.getPlayer(gameId, player.address);
              const newHand = newPlayerData[2];
              console.log("Hand after joining:", newHand.map(n => Number(n)));
              
              if (newHand.length > 0) {
                console.log("🎯 Now trying to place tile after joining...");
                const tile = Number(newHand[0]);
                const placements = [{
                  number: tile,
                  x: 7,
                  y: 7
                }];
                
                const placeTx = await contract.playTurn(gameId, placements, {
                  gasLimit: 800000
                });
                await placeTx.wait();
                console.log(`✅ SUCCESS! Placed tile ${tile} after joining game ${gameId}`);
                
                // Check final result
                const finalPlacedTiles = await contract.getPlacedTiles(gameId);
                console.log(`🎯 Game ${gameId} now has ${finalPlacedTiles[0].length} tiles!`);
                
                if (finalPlacedTiles[0].length > 0) {
                  console.log("🎉 Gallery should now show board preview");
                  return;
                }
              }
              
            } catch (joinError) {
              console.log(`❌ Could not join: ${joinError.message}`);
            }
          }
        }
        
      } catch (gameError) {
        console.log(`❌ Could not check game ${gameId}: ${gameError.message}`);
      }
    }
    
    console.log("\n❌ Could not place tiles in any game");
    
  } catch (error) {
    console.error("❌ Main error:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 