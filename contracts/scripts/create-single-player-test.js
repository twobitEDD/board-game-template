const { ethers } = require("hardhat");

async function main() {
  console.log("🎮 Creating single player test game on Base Sepolia...");
  
  // Get the deployed contract (UPDATED for single-player support)
  const contractAddress = "0xa296A27561B207d235CA61DF3C2cBa431A0ad88C";
  const contract = await ethers.getContractAt("FivesGame", contractAddress);
  
  console.log("📍 Contract:", contractAddress);
  console.log("🌐 Network:", network.name);
  
  // Check current state
  const currentGameId = await contract.nextGameId();
  console.log("📊 Current next game ID:", Number(currentGameId));
  
  try {
    // Create single player game (NOW SUPPORTED!)
    console.log("\n🎯 Creating single player game...");
    const createTx = await contract.createGame(
      1, // maxPlayers = 1 (NOW ALLOWED!)
      true, // allowIslands
      500, // winningScore
      "Single Player Test",
      { gasLimit: 500000 }
    );
    const createReceipt = await createTx.wait();
    console.log("✅ Single player game created");
    
    const gameId = Number(currentGameId);
    console.log("🎲 Game ID:", gameId);
    
    // Get the game state
    const gameData = await contract.getGame(gameId);
    console.log("📊 Game state:", {
      state: Number(gameData[0]) === 0 ? "Setup" : Number(gameData[0]) === 1 ? "In Progress" : "Other",
      creator: gameData[1],
      maxPlayers: Number(gameData[2]),
      currentPlayer: Number(gameData[3]),
      turnNumber: Number(gameData[4])
    });
    
    // Since it's a single player game, it should auto-start!
    if (Number(gameData[0]) === 0) {
      console.log("🚀 Starting the single player game...");
      const startTx = await contract.startGame(gameId, {
        gasLimit: 300000
      });
      await startTx.wait();
      console.log("✅ Game started");
    }
    
    // Get player hand for tile placement
    console.log("\n🃏 Getting player hand...");
    const playerData = await contract.getPlayer(gameId, (await ethers.getSigners())[0].address);
    const hand = playerData[2];
    console.log("Player hand:", hand.map(n => Number(n)));
    
    if (hand.length === 0) {
      console.log("❌ No tiles in hand, cannot place tiles");
      return;
    }
    
    // Place some tiles to create a visible pattern
    console.log("\n🎯 Placing tiles to create a test pattern...");
    
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
        const currentPlayerData = await contract.getPlayer(gameId, (await ethers.getSigners())[0].address);
        const currentHand = currentPlayerData[2];
        
        if (currentHand.length === 0) {
          console.log("❌ No more tiles in hand");
          break;
        }
        
        const tile = Number(currentHand[0]);
        const { x, y, name } = tilesToPlace[i];
        
        console.log(`🎯 Placing tile ${tile} at (${x},${y}) - ${name}...`);
        
        // Create TilePlacement struct array
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
        
        // Small delay between moves
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.log(`❌ Could not place tile: ${error.message}`);
        break;
      }
    }
    
    // Check final placed tiles using getPlacedTiles
    console.log("\n🔍 Verifying placed tiles...");
    const placedTiles = await contract.getPlacedTiles(gameId);
    const [xPositions, yPositions, numbers, turnNumbers] = placedTiles;
    
    console.log("📋 Placed tiles:");
    for (let i = 0; i < xPositions.length; i++) {
      console.log(`  Tile ${i + 1}: (${Number(xPositions[i])}, ${Number(yPositions[i])}) = ${Number(numbers[i])} (turn ${Number(turnNumbers[i])})`);
    }
    
    // Get final game state
    const finalGameData = await contract.getGame(gameId);
    console.log("\n📊 FINAL GAME STATE:");
    console.log("  State:", Number(finalGameData[0]) === 1 ? "In Progress" : "Other");
    console.log("  Turn number:", Number(finalGameData[4]));
    console.log("  Tiles placed:", xPositions.length);
    
    console.log(`\n🎉 SUCCESS! Single player game ${gameId} created with ${xPositions.length} tiles!`);
    console.log("🔗 Test gallery: The game should now show board preview");
    
  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error("Full error:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 