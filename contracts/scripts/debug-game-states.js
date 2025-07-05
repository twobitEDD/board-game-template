const hre = require("hardhat");

async function main() {
  console.log("🔍 Debugging Game States...\n");
  
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const [player1, player2] = await hre.ethers.getSigners();
  const FivesGame = await hre.ethers.getContractFactory("FivesGame");
  
  try {
    const game = FivesGame.attach(contractAddress).connect(player1);
    
    for (let gameId = 1; gameId <= 4; gameId++) {
      console.log(`\n🎯 Game ${gameId} Debug:`);
      
      const gameInfo = await game.getGame(gameId);
      console.log(`  Raw state value: ${gameInfo.state}`);
      console.log(`  State comparison: ${gameInfo.state} !== 1 = ${gameInfo.state !== 1}`);
      console.log(`  State == 1: ${gameInfo.state == 1}`);
      console.log(`  State === 1: ${gameInfo.state === 1}`);
      
      const stateNames = ['Setup', 'InProgress', 'Completed', 'Cancelled'];
      console.log(`  State name: ${stateNames[gameInfo.state]}`);
      
      console.log(`  Turn number: ${gameInfo.turnNumber}`);
      console.log(`  Current player index: ${gameInfo.currentPlayerIndex}`);
      console.log(`  Max players: ${gameInfo.maxPlayers}`);
      console.log(`  Actual players: ${gameInfo.playerAddresses.length}`);
      
      // Check if the current player is valid
      if (gameInfo.currentPlayerIndex < gameInfo.playerAddresses.length) {
        const currentPlayerAddr = gameInfo.playerAddresses[gameInfo.currentPlayerIndex];
        console.log(`  Current player address: ${currentPlayerAddr}`);
        
        const playerInfo = await game.getPlayer(gameId, currentPlayerAddr);
        console.log(`  Current player name: ${playerInfo.name}`);
        console.log(`  Current player hand: [${playerInfo.hand.join(', ')}]`);
        
        const validTiles = playerInfo.hand.filter(tile => tile == 0 || tile == 5);
        console.log(`  Valid tiles: ${validTiles.length} → [${validTiles.join(', ')}]`);
      } else {
        console.log(`  ❌ Invalid current player index!`);
      }
    }
    
    // Test a simple tile placement on Game 2 which we know has a valid tile
    console.log(`\n🧪 Testing simple placement on Game 2...`);
    
    const game2Info = await game.getGame(2);
    if (game2Info.state == 1) { // Use loose equality
      console.log("  Game 2 is in progress");
      
      const currentPlayerIndex = game2Info.currentPlayerIndex;
      const currentPlayerAddr = game2Info.playerAddresses[currentPlayerIndex];
      console.log(`  Current player index: ${currentPlayerIndex}, Address: ${currentPlayerAddr}`);
      
      // Connect as the appropriate player
      const players = [player1, player2];
      const currentPlayer = players[currentPlayerIndex];
      const gameContract = FivesGame.attach(contractAddress).connect(currentPlayer);
      
      const playerInfo = await gameContract.getPlayer(2, currentPlayerAddr);
      console.log(`  Player: ${playerInfo.name}, Hand: [${playerInfo.hand.join(', ')}]`);
      
      const validTiles = playerInfo.hand.filter(tile => tile == 0 || tile == 5);
      if (validTiles.length > 0) {
        const tile = validTiles[0];
        console.log(`  Attempting to place tile ${tile}...`);
        
        // Check if center is still available
        try {
          const centerTile = await gameContract.getTileAt(2, 7, 7);
          if (centerTile.exists) {
            console.log(`  Center (7,7) already has tile ${centerTile.number}, trying adjacent...`);
            // Try adjacent position
            const position = { x: 6, y: 7 };
            console.log(`  Trying position (${position.x},${position.y})...`);
            
            const placements = [{ number: tile, x: position.x, y: position.y }];
            const placeTx = await gameContract.playTurn(2, placements);
            await placeTx.wait();
            console.log(`  ✅ Success! Placed tile ${tile} at (${position.x},${position.y})`);
          } else {
            console.log(`  Center (7,7) is free, placing there...`);
            const placements = [{ number: tile, x: 7, y: 7 }];
            const placeTx = await gameContract.playTurn(2, placements);
            await placeTx.wait();
            console.log(`  ✅ Success! Placed tile ${tile} at (7,7)`);
          }
        } catch (error) {
          console.log(`  ❌ Placement failed: ${error.message}`);
        }
      } else {
        console.log(`  No valid tiles to place`);
      }
    } else {
      console.log(`  Game 2 is not in progress (state: ${game2Info.state})`);
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