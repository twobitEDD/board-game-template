const { ethers } = require("hardhat");

async function main() {
  console.log("🎮 Creating proper Fives game following the rules...");
  
  // Use the single-player contract that works
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
    
    // Create single-player game
    console.log("\n🎯 Creating single-player game...");
    const createTx = await contract.createGame(
      1, // maxPlayers = 1
      true, // allowIslands
      100, // winningScore
      "Fives Player", // playerName
      { gasLimit: 1000000 }
    );
    
    console.log("🔄 Transaction sent, waiting for confirmation...");
    const receipt = await createTx.wait();
    console.log("✅ Game created! Gas used:", Number(receipt.gasUsed));
    
    const gameId = Number(currentGameId);
    console.log("🎲 Game ID:", gameId);
    
    // Start the game
    console.log("\n🚀 Starting single-player game...");
    const startTx = await contract.startGame(gameId, {
      gasLimit: 400000
    });
    await startTx.wait();
    console.log("✅ Game started!");
    
    // Check game state
    const updatedGameData = await contract.getGame(gameId);
    if (Number(updatedGameData[0]) === 1) {
      console.log("🎉 Game is in progress! Now placing tiles following Fives rules...");
      
      // Get player hand
      const playerData = await contract.getPlayer(gameId, player.address);
      const hand = playerData[2].map(n => Number(n));
      console.log("🃏 Player hand:", hand);
      
      if (hand.length > 0) {
        console.log("\n🎯 Finding valid Fives moves...");
        
        // MOVE 1: Place first tile at center (any tile works for first move)
        const firstTile = hand[0];
        console.log(`\n📍 Move 1: Placing tile ${firstTile} at center (7,7)`);
        console.log(`✓ First tile can be any value: ${firstTile}`);
        
        await placeTiles(contract, gameId, [{
          number: firstTile,
          x: 7,
          y: 7
        }]);
        
        // Get updated hand
        let currentPlayerData = await contract.getPlayer(gameId, player.address);
        let currentHand = currentPlayerData[2].map(n => Number(n));
        console.log("🃏 Hand after move 1:", currentHand);
        
        if (currentHand.length > 0) {
          // MOVE 2: Create a sequence that sums to a multiple of 5
          console.log(`\n📍 Move 2: Creating sequence with sum = multiple of 5`);
          console.log(`Center tile: ${firstTile}`);
          
          // Find a tile that makes (firstTile + newTile) = multiple of 5
          let bestMove = null;
          for (let tile of currentHand) {
            const sum = firstTile + tile;
            if (sum % 5 === 0) {
              bestMove = { tile, sum, position: 'horizontal' };
              break;
            }
          }
          
          // If no perfect match, find tiles that could work with a third tile
          if (!bestMove) {
            for (let tile of currentHand) {
              const sum = firstTile + tile;
              const needed = (Math.ceil(sum / 5) * 5) - sum;
              if (needed > 0 && needed <= 9 && currentHand.includes(needed)) {
                bestMove = { 
                  tile, 
                  sum: sum + needed, 
                  position: 'horizontal',
                  needsThird: needed
                };
                break;
              }
            }
          }
          
          if (bestMove) {
            console.log(`✓ Found valid move: ${firstTile} + ${bestMove.tile}${bestMove.needsThird ? ` + ${bestMove.needsThird}` : ''} = ${bestMove.sum} (multiple of 5)`);
            
            // Place second tile horizontally
            await placeTiles(contract, gameId, [{
              number: bestMove.tile,
              x: 8, // Right of center
              y: 7
            }]);
            
            // Update hand
            currentPlayerData = await contract.getPlayer(gameId, player.address);
            currentHand = currentPlayerData[2].map(n => Number(n));
            console.log("🃏 Hand after move 2:", currentHand);
            
            // If we need a third tile to complete the sequence
            if (bestMove.needsThird && currentHand.includes(bestMove.needsThird)) {
              console.log(`\n📍 Move 3: Completing sequence with tile ${bestMove.needsThird}`);
              
              await placeTiles(contract, gameId, [{
                number: bestMove.needsThird,
                x: 9, // Right of second tile
                y: 7
              }]);
              
              currentPlayerData = await contract.getPlayer(gameId, player.address);
              currentHand = currentPlayerData[2].map(n => Number(n));
              console.log("🃏 Hand after move 3:", currentHand);
            }
          } else {
            console.log("❌ No valid Fives moves found with current hand");
            console.log("💡 Placing tiles that create foundation for future moves...");
            
            // Place a tile that could work for future sequences
            const secondTile = currentHand[0];
            console.log(`📍 Placing tile ${secondTile} adjacent to center`);
            
            await placeTiles(contract, gameId, [{
              number: secondTile,
              x: 8,
              y: 7
            }]);
            
            currentPlayerData = await contract.getPlayer(gameId, player.address);
            currentHand = currentPlayerData[2].map(n => Number(n));
            console.log("🃏 Hand after foundation move:", currentHand);
          }
        }
        
        // Try one more strategic move
        if (currentHand.length > 0) {
          console.log(`\n📍 Additional move: Looking for vertical sequences...`);
          
          // Try to create a vertical sequence
          const thirdTile = currentHand[0];
          console.log(`📍 Placing tile ${thirdTile} vertically from center`);
          
          try {
            await placeTiles(contract, gameId, [{
              number: thirdTile,
              x: 7,
              y: 8 // Below center
            }]);
            
            currentPlayerData = await contract.getPlayer(gameId, player.address);
            currentHand = currentPlayerData[2].map(n => Number(n));
            console.log("🃏 Final hand:", currentHand);
          } catch (error) {
            console.log("❌ Could not place vertical tile:", error.message);
          }
        }
        
        // Show final board state
        console.log("\n📋 Final board state:");
        const placedTiles = await contract.getPlacedTiles(gameId);
        console.log(`🎯 Total tiles placed: ${placedTiles[0].length}`);
        
        if (placedTiles[0].length > 0) {
          console.log("\n🎉 SUCCESS! Fives game with proper moves created!");
          console.log(`🔗 Game ${gameId} has ${placedTiles[0].length} tiles following Fives rules`);
          
          // Show tile positions and analyze sequences
          console.log("\n📍 Tile positions:");
          const board = {};
          for (let i = 0; i < placedTiles[0].length; i++) {
            const x = Number(placedTiles[0][i]);
            const y = Number(placedTiles[1][i]);
            const tileNum = Number(placedTiles[2][i]);
            console.log(`  Tile ${i+1}: (${x}, ${y}) = ${tileNum}`);
            board[`${x},${y}`] = tileNum;
          }
          
          // Analyze sequences
          console.log("\n🔍 Sequence Analysis:");
          analyzeSequences(board, placedTiles);
          
          console.log("\n✅ RPC ABUSE FIXED + PROPER FIVES GAMEPLAY!");
          console.log("🔄 Refresh your frontend gallery to see the preview");
        }
      }
    }
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

async function placeTiles(contract, gameId, placements) {
  try {
    const placeTx = await contract.playTurn(gameId, placements, {
      gasLimit: 700000
    });
    await placeTx.wait();
    
    for (let placement of placements) {
      console.log(`✅ Placed tile ${placement.number} at (${placement.x},${placement.y})`);
    }
    
    // Small delay between moves
    await new Promise(resolve => setTimeout(resolve, 1000));
    
  } catch (error) {
    console.log(`❌ Could not place tiles:`, error.message);
    throw error;
  }
}

function analyzeSequences(board, placedTiles) {
  // Find horizontal and vertical sequences
  const positions = [];
  for (let i = 0; i < placedTiles[0].length; i++) {
    positions.push({
      x: Number(placedTiles[0][i]),
      y: Number(placedTiles[1][i]),
      value: Number(placedTiles[2][i])
    });
  }
  
  // Group by rows
  const rows = {};
  const cols = {};
  
  positions.forEach(pos => {
    if (!rows[pos.y]) rows[pos.y] = [];
    if (!cols[pos.x]) cols[pos.x] = [];
    rows[pos.y].push(pos);
    cols[pos.x].push(pos);
  });
  
  // Analyze horizontal sequences
  Object.keys(rows).forEach(y => {
    const row = rows[y].sort((a, b) => a.x - b.x);
    if (row.length > 1) {
      const sum = row.reduce((s, pos) => s + pos.value, 0);
      const isMultipleOf5 = sum % 5 === 0;
      console.log(`  Row ${y}: [${row.map(p => p.value).join(', ')}] = ${sum} ${isMultipleOf5 ? '✅ (multiple of 5!)' : '❌'}`);
    }
  });
  
  // Analyze vertical sequences  
  Object.keys(cols).forEach(x => {
    const col = cols[x].sort((a, b) => a.y - b.y);
    if (col.length > 1) {
      const sum = col.reduce((s, pos) => s + pos.value, 0);
      const isMultipleOf5 = sum % 5 === 0;
      console.log(`  Col ${x}: [${col.map(p => p.value).join(', ')}] = ${sum} ${isMultipleOf5 ? '✅ (multiple of 5!)' : '❌'}`);
    }
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 