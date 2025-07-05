const { ethers } = require("hardhat");

async function main() {
  console.log("🎮 Creating game with reasonable gas settings...");
  
  // Use the single-player enabled contract
  const contractAddress = "0xa296A27561B207d235CA61DF3C2cBa431A0ad88C";
  const contract = await ethers.getContractAt("FivesGame", contractAddress);
  
  console.log("📍 Contract:", contractAddress);
  console.log("🌐 Network:", network.name);
  
  // Get the player address (deployer)
  const accounts = await ethers.getSigners();
  const player = accounts[0];
  console.log("👤 Player:", player.address);
  
  // Check balance
  const balance = await ethers.provider.getBalance(player.address);
  console.log("💰 Balance:", ethers.formatEther(balance), "ETH");
  
  try {
    const currentGameId = await contract.nextGameId();
    console.log("📊 Next game ID:", Number(currentGameId));
    
    // Get current network gas price
    const feeData = await ethers.provider.getFeeData();
    console.log("⛽ Current gas price:", ethers.formatUnits(feeData.gasPrice, "gwei"), "gwei");
    
    // Create game with reasonable gas settings for Base Sepolia
    console.log("\n🎯 Creating 2-player game with reasonable gas...");
    const createTx = await contract.createGame(
      1, // maxPlayers = 1 (single player!)
      true, // allowIslands
      100, // winningScore (minimum)
      "Solo", // short name
      { 
        gasLimit: 500000, // Reasonable gas limit
        // Let ethers auto-estimate gas price (Base Sepolia is usually very cheap)
      }
    );
    
    console.log("🔄 Transaction sent, waiting for confirmation...");
    const receipt = await createTx.wait();
    console.log("✅ Game created! Gas used:", Number(receipt.gasUsed));
    console.log("💰 Gas cost:", ethers.formatEther(receipt.gasUsed * receipt.gasPrice), "ETH");
    
    const gameId = Number(currentGameId);
    console.log("🎲 Game ID:", gameId);
    
    // Check game state
    const gameData = await contract.getGame(gameId);
    console.log("📊 Game created successfully:", {
      state: Number(gameData[0]) === 0 ? "Setup" : "Other",
      players: gameData[7].length,
      maxPlayers: Number(gameData[2])
    });
    
    // Single player game should auto-start when maxPlayers=1 and we have 1 player
    if (Number(gameData[0]) === 0) {
      console.log("\n🚀 Starting single player game...");
      try {
        const startTx = await contract.startGame(gameId, {
          gasLimit: 300000
        });
        await startTx.wait();
        console.log("✅ Single player game started!");
        
        // Check if game is now in progress
        const updatedGameData = await contract.getGame(gameId);
        console.log("📊 Game after start:", {
          state: Number(updatedGameData[0]) === 1 ? "In Progress" : "Other",
          players: updatedGameData[7].length
        });
        
        if (Number(updatedGameData[0]) === 1) {
          console.log("🎉 Game is in progress! Now we can place tiles!");
          
          // Get player hand
          const playerData = await contract.getPlayer(gameId, player.address);
          const hand = playerData[2];
          console.log("🃏 Player hand:", hand.map(n => Number(n)));
          
          if (hand.length > 0) {
            console.log("\n🎯 Placing tiles...");
            
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
            
            // Place more tiles
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
                console.log(`❌ Could not place more tile: ${moreTileError.message}`);
                break;
              }
            }
            
            // Check final placed tiles
            const placedTiles = await contract.getPlacedTiles(gameId);
            console.log(`📋 Final tiles on board: ${placedTiles[0].length}`);
            
            if (placedTiles[0].length > 0) {
              console.log("\n🎉 SUCCESS! Single player game with tiles created!");
              console.log(`🔗 Game ${gameId} now has ${placedTiles[0].length} tiles for gallery preview`);
              console.log("💡 Refresh the gallery to see board preview");
              
              // Log tile positions for verification
              for (let i = 0; i < placedTiles[0].length; i++) {
                console.log(`  Tile ${i+1}: (${Number(placedTiles[0][i])}, ${Number(placedTiles[1][i])}) = ${Number(placedTiles[2][i])}`);
              }
            }
          } else {
            console.log("❌ No tiles in hand after game start");
          }
        }
        
      } catch (startError) {
        console.log(`❌ Could not start single player game: ${startError.message}`);
      }
    }
    
  } catch (error) {
    console.error("❌ Error:", error.message);
    
    if (error.message.includes("insufficient funds")) {
      console.log("💡 Still need more ETH. Current balance may not be enough.");
    } else if (error.message.includes("cannot estimate gas")) {
      console.log("💡 Gas estimation failed - transaction would likely fail");
    } else {
      console.log("💡 Contract validation error:", error.message);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 