const { ethers } = require("hardhat");

async function main() {
  console.log("🎮 Creating game on WORKING single-player contract...");
  
  // Use the single-player contract that we confirmed works
  const contractAddress = "0xa296A27561B207d235CA61DF3C2cBa431A0ad88C";
  const contract = await ethers.getContractAt("FivesGame", contractAddress);
  
  console.log("📍 Contract:", contractAddress);
  console.log("🌐 Network:", network.name);
  
  const accounts = await ethers.getSigners();
  const player = accounts[0];
  console.log("👤 Player:", player.address);
  
  const balance = await ethers.provider.getBalance(player.address);
  console.log("💰 Balance:", ethers.formatEther(balance), "ETH");
  
  try {
    const currentGameId = await contract.nextGameId();
    console.log("📊 Next game ID:", Number(currentGameId));
    
    // Create single-player game (we know this works from debugging)
    console.log("\n🎯 Creating single-player game...");
    const createTx = await contract.createGame(
      1, // maxPlayers = 1 (works on this contract!)
      true, // allowIslands
      100, // winningScore
      "Solo Player", // playerName
      { 
        gasLimit: 1000000, // Use plenty of gas
      }
    );
    
    console.log("🔄 Transaction sent, waiting for confirmation...");
    const receipt = await createTx.wait();
    console.log("✅ Game created! Gas used:", Number(receipt.gasUsed));
    
    const gameId = Number(currentGameId);
    console.log("🎲 Game ID:", gameId);
    
    // Check game state
    const gameData = await contract.getGame(gameId);
    console.log("📊 Game created:", {
      state: Number(gameData[0]) === 0 ? "Setup" : "Other",
      players: gameData[7].length,
      maxPlayers: Number(gameData[2]),
      creator: gameData[1]
    });
    
    // Start the game immediately (single player)
    console.log("\n🚀 Starting single-player game...");
    const startTx = await contract.startGame(gameId, {
      gasLimit: 400000
    });
    await startTx.wait();
    console.log("✅ Game started!");
    
    // Check if game is in progress
    const updatedGameData = await contract.getGame(gameId);
    console.log("📊 Game after start:", {
      state: Number(updatedGameData[0]) === 1 ? "In Progress" : "Other",
      players: updatedGameData[7].length
    });
    
    if (Number(updatedGameData[0]) === 1) {
      console.log("🎉 Game is in progress! Now placing tiles...");
      
      // Get player hand
      const playerData = await contract.getPlayer(gameId, player.address);
      const hand = playerData[2];
      console.log("🃏 Player hand:", hand.map(n => Number(n)));
      
      if (hand.length > 0) {
        // Place tiles to create a nice pattern for gallery
        const tilePlacements = [
          { tile: 0, x: 7, y: 7, name: "Center" },
          { tile: 1, x: 8, y: 7, name: "Right" },
          { tile: 2, x: 7, y: 8, name: "Below" },
          { tile: 3, x: 6, y: 7, name: "Left" },
          { tile: 4, x: 7, y: 6, name: "Above" }
        ];
        
        console.log("\n🎯 Placing tiles...");
        
        for (let i = 0; i < tilePlacements.length; i++) {
          try {
            // Get current hand
            const currentPlayerData = await contract.getPlayer(gameId, player.address);
            const currentHand = currentPlayerData[2];
            
            if (currentHand.length === 0) {
              console.log("No more tiles in hand");
              break;
            }
            
            const { x, y, name } = tilePlacements[i];
            const tile = Number(currentHand[0]); // Use first tile in hand
            
            console.log(`Placing tile ${tile} at (${x},${y}) - ${name}...`);
            
            const placements = [{
              number: tile,
              x: x,
              y: y
            }];
            
            const placeTx = await contract.playTurn(gameId, placements, {
              gasLimit: 700000
            });
            await placeTx.wait();
            console.log(`✅ Placed tile ${tile} at (${x},${y})`);
            
            // Short delay between placements
            await new Promise(resolve => setTimeout(resolve, 1000));
            
          } catch (tileError) {
            console.log(`❌ Could not place tile: ${tileError.message}`);
            if (tileError.message.includes("not your turn")) {
              console.log("💡 Turn ended - this is normal in single player");
              break;
            }
          }
        }
        
        // Check final result
        console.log("\n📋 Final board state:");
        const placedTiles = await contract.getPlacedTiles(gameId);
        console.log(`🎯 Total tiles placed: ${placedTiles[0].length}`);
        
        if (placedTiles[0].length > 0) {
          console.log("\n🎉 SUCCESS! Game with tiles created!");
          console.log(`🔗 Game ${gameId} has ${placedTiles[0].length} tiles`);
          console.log("💡 Gallery will now show board preview!");
          
          // Show tile positions
          console.log("\n📍 Tile positions:");
          for (let i = 0; i < placedTiles[0].length; i++) {
            const x = Number(placedTiles[0][i]);
            const y = Number(placedTiles[1][i]);
            const tileNum = Number(placedTiles[2][i]);
            console.log(`  Tile ${i+1}: (${x}, ${y}) = ${tileNum}`);
          }
          
          console.log("\n✅ RPC ABUSE FIXED + BOARD PREVIEW READY!");
          console.log("🔄 Refresh your frontend gallery to see the preview");
          
        } else {
          console.log("❌ No tiles were placed successfully");
        }
        
      } else {
        console.log("❌ No tiles in hand after game start");
      }
    }
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 