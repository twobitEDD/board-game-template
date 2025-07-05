const { ethers } = require("hardhat");

async function main() {
  console.log("🎮 Creating a solo game and placing tiles on Base Sepolia...");
  
  // Get the deployed contract
  const contractAddress = "0x80f80B22D1839F2216F7f7814398e7039Fc17546";
  const contract = await ethers.getContractAt("FivesGame", contractAddress);
  
  // Get the player address (deployer)
  const accounts = await ethers.getSigners();
  const player = accounts[0];
  
  console.log("📍 Contract:", contractAddress);
  console.log("🌐 Network:", network.name);
  console.log("👤 Player:", player.address);
  
  try {
    // First, check what games already exist
    const currentNextGameId = await contract.nextGameId();
    console.log("Current next game ID:", Number(currentNextGameId));
    
    // Create a new game with just 1 player allowed
    console.log("\n🎯 Creating new single-player game...");
    const createTx = await contract.createGame(
      1, // maxPlayers = 1 (trying solo)
      true, // allowIslands
      500, // winningScore
      "Solo Test Player",
      { gasLimit: 500000 }
    );
    await createTx.wait();
    console.log("✅ Game created");
    
    const gameId = Number(currentNextGameId);
    console.log("🎲 New game ID:", gameId);
    
    // Check the new game state
    console.log(`\n🔍 Checking game ${gameId}...`);
    const gameData = await contract.getGame(gameId);
    console.log("Game state:", Number(gameData[0]) === 0 ? "Setup" : Number(gameData[0]) === 1 ? "In Progress" : "Other");
    console.log("Players:", gameData[7].length);
    console.log("Max players:", Number(gameData[2]));
    console.log("Creator:", gameData[1]);
    
    // Try to start the game since we have max players (1)
    if (Number(gameData[0]) === 0) {
      console.log("\n🚀 Attempting to start single player game...");
      try {
        const startTx = await contract.startGame(gameId, {
          gasLimit: 300000
        });
        await startTx.wait();
        console.log("✅ Game started successfully!");
      } catch (startError) {
        console.log(`❌ Could not start game: ${startError.message}`);
        
        // If starting fails, the contract probably requires 2+ players minimum
        // Let's try creating with 2 players instead
        console.log("\n🔄 Trying with 2-player game...");
        const createTx2 = await contract.createGame(
          2, // maxPlayers = 2 
          true, // allowIslands
          500, // winningScore
          "Test Player",
          { gasLimit: 500000 }
        );
        await createTx2.wait();
        
        const gameId2 = gameId + 1;
        console.log("✅ Created 2-player game:", gameId2);
        
        // Check if this auto-started or if we can manually place tiles
        const gameData2 = await contract.getGame(gameId2);
        console.log("New game state:", Number(gameData2[0]) === 0 ? "Setup" : Number(gameData2[0]) === 1 ? "In Progress" : "Other");
        
        // Try to get player hand even in setup state
        console.log("\n🃏 Checking if we have tiles in setup state...");
        try {
          const playerData = await contract.getPlayer(gameId2, player.address);
          const hand = playerData[2];
          console.log("Player hand in setup:", hand.map(n => Number(n)));
          
          if (hand.length > 0) {
            console.log("\n🎯 We have tiles! Trying to place one to trigger game start...");
            
            const tile = Number(hand[0]);
            const placements = [{
              number: tile,
              x: 7,
              y: 7
            }];
            
            const placeTx = await contract.playTurn(gameId2, placements, {
              gasLimit: 600000
            });
            await placeTx.wait();
            console.log(`✅ Placed tile ${tile} at (7,7) - this may have started the game!`);
            
            // Check if this started the game
            const updatedGameData = await contract.getGame(gameId2);
            console.log("Game state after tile placement:", Number(updatedGameData[0]) === 1 ? "In Progress" : "Setup");
            
            if (Number(updatedGameData[0]) === 1) {
              console.log("🎉 Game is now in progress! Placing more tiles...");
              
              // Place a few more tiles
              const moreTiles = [
                { x: 8, y: 7, name: "Right" },
                { x: 7, y: 8, name: "Below" },
                { x: 6, y: 7, name: "Left" }
              ];
              
              for (let i = 0; i < moreTiles.length; i++) {
                try {
                  const currentPlayerData = await contract.getPlayer(gameId2, player.address);
                  const currentHand = currentPlayerData[2];
                  
                  if (currentHand.length === 0) break;
                  
                  const nextTile = Number(currentHand[0]);
                  const { x, y, name } = moreTiles[i];
                  
                  console.log(`🎯 Placing tile ${nextTile} at (${x},${y}) - ${name}...`);
                  
                  const nextPlacements = [{
                    number: nextTile,
                    x: x,
                    y: y
                  }];
                  
                  const nextPlaceTx = await contract.playTurn(gameId2, nextPlacements, {
                    gasLimit: 600000
                  });
                  await nextPlaceTx.wait();
                  console.log(`✅ Placed tile ${nextTile} at (${x},${y})`);
                  
                  await new Promise(resolve => setTimeout(resolve, 2000));
                  
                } catch (placeError) {
                  console.log(`❌ Could not place tile: ${placeError.message}`);
                  break;
                }
              }
            }
          }
        } catch (handError) {
          console.log(`❌ Could not get player hand: ${handError.message}`);
        }
        
        // Check final board state for the successful game
        const workingGameId = gameId2;
        console.log(`\n🔍 Checking final board state for game ${workingGameId}...`);
        const finalPlacedTiles = await contract.getPlacedTiles(workingGameId);
        const [xPositions, yPositions, numbers, turnNumbers] = finalPlacedTiles;
        
        console.log(`📋 Total tiles placed: ${xPositions.length}`);
        for (let i = 0; i < xPositions.length; i++) {
          console.log(`  Tile ${i + 1}: (${Number(xPositions[i])}, ${Number(yPositions[i])}) = ${Number(numbers[i])}`);
        }
        
        if (xPositions.length > 0) {
          console.log(`\n🎉 SUCCESS! Game ${workingGameId} now has ${xPositions.length} tiles!`);
          console.log("🔗 Gallery should now show board preview with tiles");
          console.log("💡 Refresh the gallery page to see the board preview");
        }
        
        return;
      }
    }
    
    // If we reach here, the single player game started successfully
    console.log("\n🃏 Getting player hand for solo game...");
    const playerData = await contract.getPlayer(gameId, player.address);
    const hand = playerData[2];
    console.log("Player hand:", hand.map(n => Number(n)));
    
    if (hand.length > 0) {
      console.log("\n🎯 Placing tiles in solo game...");
      
      const tilesToPlace = [
        { x: 7, y: 7, name: "Center" },
        { x: 8, y: 7, name: "Right" },
        { x: 7, y: 8, name: "Below" }
      ];
      
      for (let i = 0; i < Math.min(tilesToPlace.length, hand.length); i++) {
        try {
          const currentPlayerData = await contract.getPlayer(gameId, player.address);
          const currentHand = currentPlayerData[2];
          
          if (currentHand.length === 0) break;
          
          const tile = Number(currentHand[0]);
          const { x, y, name } = tilesToPlace[i];
          
          console.log(`🎯 Placing tile ${tile} at (${x},${y}) - ${name}...`);
          
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
          
          await new Promise(resolve => setTimeout(resolve, 2000));
          
        } catch (error) {
          console.log(`❌ Could not place tile: ${error.message}`);
          break;
        }
      }
    }
    
    // Check final board state
    console.log(`\n🔍 Checking final board state for game ${gameId}...`);
    const finalPlacedTiles = await contract.getPlacedTiles(gameId);
    const [xPositions, yPositions, numbers, turnNumbers] = finalPlacedTiles;
    
    console.log(`📋 Total tiles placed: ${xPositions.length}`);
    for (let i = 0; i < xPositions.length; i++) {
      console.log(`  Tile ${i + 1}: (${Number(xPositions[i])}, ${Number(yPositions[i])}) = ${Number(numbers[i])}`);
    }
    
    if (xPositions.length > 0) {
      console.log(`\n🎉 SUCCESS! Game ${gameId} now has ${xPositions.length} tiles!`);
      console.log("🔗 Gallery should now show board preview with tiles");
      console.log("💡 Refresh the gallery page to see the board preview");
    }
    
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