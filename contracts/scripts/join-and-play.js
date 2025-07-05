const { ethers } = require("hardhat");

async function main() {
  console.log("🎮 Using second wallet to join game on Base Sepolia...");
  
  // Get the deployed contract
  const contractAddress = "0x80f80B22D1839F2216F7f7814398e7039Fc17546";
  
  // Get the original deployer account
  const accounts = await ethers.getSigners();
  const player1 = accounts[0]; // Original deployer 
  
  // Generate a second wallet programmatically
  const player2Wallet = ethers.Wallet.createRandom();
  const player2 = player2Wallet.connect(ethers.provider);
  
  console.log("👤 Player 1 (original):", player1.address);
  console.log("👤 Player 2 (generated):", player2.address);
  console.log("🔑 Player 2 private key:", player2Wallet.privateKey);
  console.log("📍 Contract:", contractAddress);
  console.log("🌐 Network:", network.name);
  
  // Connect to contract with both wallets
  const contract = await ethers.getContractAt("FivesGame", contractAddress);
  const contractAsPlayer2 = contract.connect(player2);
  
  const gameId = 1; // Join game 1
  
  try {
    // Check player 2's balance on Base Sepolia
    const balance = await ethers.provider.getBalance(player2.address);
    console.log(`💰 Player 2 balance: ${ethers.formatEther(balance)} ETH`);
    
    if (balance === 0n) {
      console.log("❌ Player 2 has no ETH on Base Sepolia!");
      console.log(`📋 Send testnet ETH to: ${player2.address}`);
      console.log(`🔑 Import this private key to MetaMask: ${player2Wallet.privateKey}`);
      console.log("\n💡 STEPS:");
      console.log("1. Copy the private key above");
      console.log("2. Import it into MetaMask (Settings > Import Account)");
      console.log("3. Switch to Base Sepolia network");
      console.log("4. Get testnet ETH from a Base Sepolia faucet");
      console.log("5. Run this script again");
      return;
    }
    
    // Check game state before joining
    console.log(`\n🔍 Checking game ${gameId} before joining...`);
    const gameBefore = await contract.getGame(gameId);
    console.log("Players before:", gameBefore[7].length);
    console.log("Game state:", Number(gameBefore[0]) === 0 ? "Setup" : "Other");
    console.log("Existing players:", gameBefore[7]);
    
    // Check if player 2 is already in the game
    if (gameBefore[7].includes(player2.address)) {
      console.log("✅ Player 2 is already in the game!");
    } else {
      // Join the game as player 2
      console.log(`\n🚪 Player 2 joining game ${gameId}...`);
      const joinTx = await contractAsPlayer2.joinGame(gameId, "Player 2", {
        gasLimit: 300000
      });
      await joinTx.wait();
      console.log("✅ Player 2 successfully joined game!");
    }
    
    // Check game state after joining
    console.log(`\n🔍 Checking game ${gameId} after joining...`);
    const gameAfter = await contract.getGame(gameId);
    console.log("Players after:", gameAfter[7].length);
    console.log("Game state:", Number(gameAfter[0]) === 0 ? "Setup" : Number(gameAfter[0]) === 1 ? "In Progress" : "Other");
    console.log("Current player index:", Number(gameAfter[3]));
    console.log("All players:", gameAfter[7]);
    
    // If game is now in progress, place some tiles
    if (Number(gameAfter[0]) === 1) {
      console.log("\n🎯 Game is now in progress! Placing tiles...");
      
      // Determine which player should go first
      const currentPlayerIndex = Number(gameAfter[3]);
      const currentPlayerAddress = gameAfter[7][currentPlayerIndex];
      console.log(`Current turn: Player ${currentPlayerIndex} (${currentPlayerAddress})`);
      
      // Use the correct player's contract connection
      const currentContract = currentPlayerAddress === player1.address ? contract : contractAsPlayer2;
      const currentPlayer = currentPlayerAddress === player1.address ? player1 : player2;
      
      console.log(`🎮 Using ${currentPlayer.address} to make the first move`);
      
      // Get current player's hand
      const hand = await currentContract.getPlayerHand(gameId);
      console.log("Current player hand:", hand.map(n => Number(n)));
      
      if (hand.length === 0) {
        console.log("❌ No tiles in current player's hand");
        return;
      }
      
      // Place first tile at center (7,7)
      const tile1 = Number(hand[0]);
      console.log(`\n🎯 ${currentPlayer.address} placing tile ${tile1} at center (7,7)...`);
      const placeTx1 = await currentContract.playTile(gameId, tile1, 7, 7, {
        gasLimit: 400000
      });
      await placeTx1.wait();
      console.log(`✅ Placed tile ${tile1} at (7,7)`);
      
      // Check game state after first tile
      const gameAfterTile1 = await contract.getGame(gameId);
      const newCurrentPlayerIndex = Number(gameAfterTile1[3]);
      const newCurrentPlayerAddress = gameAfterTile1[7][newCurrentPlayerIndex];
      console.log(`Turn switched to: Player ${newCurrentPlayerIndex} (${newCurrentPlayerAddress})`);
      
      // Use the new current player's contract connection
      const newCurrentContract = newCurrentPlayerAddress === player1.address ? contract : contractAsPlayer2;
      const newCurrentPlayer = newCurrentPlayerAddress === player1.address ? player1 : player2;
      
      // Get new current player's hand
      const hand2 = await newCurrentContract.getPlayerHand(gameId);
      console.log("New current player hand:", hand2.map(n => Number(n)));
      
      if (hand2.length > 0) {
        // Place second tile adjacent to first
        const tile2 = Number(hand2[0]);
        console.log(`\n🎯 ${newCurrentPlayer.address} placing tile ${tile2} at (8,7)...`);
        try {
          const placeTx2 = await newCurrentContract.playTile(gameId, tile2, 8, 7, {
            gasLimit: 400000
          });
          await placeTx2.wait();
          console.log(`✅ Placed tile ${tile2} at (8,7)`);
        } catch (error) {
          console.log(`❌ Could not place tile ${tile2} at (8,7):`, error.message);
          // Try a different position
          console.log(`🎯 Trying tile ${tile2} at (7,8)...`);
          const placeTx2b = await newCurrentContract.playTile(gameId, tile2, 7, 8, {
            gasLimit: 400000
          });
          await placeTx2b.wait();
          console.log(`✅ Placed tile ${tile2} at (7,8)`);
        }
      }
      
      // Get third turn
      const gameAfterTile2 = await contract.getGame(gameId);
      const thirdCurrentPlayerIndex = Number(gameAfterTile2[3]);
      const thirdCurrentPlayerAddress = gameAfterTile2[7][thirdCurrentPlayerIndex];
      console.log(`Turn switched to: Player ${thirdCurrentPlayerIndex} (${thirdCurrentPlayerAddress})`);
      
      const thirdCurrentContract = thirdCurrentPlayerAddress === player1.address ? contract : contractAsPlayer2;
      const thirdCurrentPlayer = thirdCurrentPlayerAddress === player1.address ? player1 : player2;
      
      const hand3 = await thirdCurrentContract.getPlayerHand(gameId);
      if (hand3.length > 0) {
        const tile3 = Number(hand3[0]);
        console.log(`\n🎯 ${thirdCurrentPlayer.address} placing tile ${tile3} at (6,7)...`);
        try {
          const placeTx3 = await thirdCurrentContract.playTile(gameId, tile3, 6, 7, {
            gasLimit: 400000
          });
          await placeTx3.wait();
          console.log(`✅ Placed tile ${tile3} at (6,7)`);
        } catch (error) {
          console.log(`❌ Could not place tile ${tile3} at (6,7):`, error.message);
          // Try different position
          console.log(`🎯 Trying tile ${tile3} at (8,8)...`);
          try {
            const placeTx3b = await thirdCurrentContract.playTile(gameId, tile3, 8, 8, {
              gasLimit: 400000
            });
            await placeTx3b.wait();
            console.log(`✅ Placed tile ${tile3} at (8,8)`);
          } catch (error2) {
            console.log(`❌ Could not place tile ${tile3} anywhere:`, error2.message);
          }
        }
      }
      
      // Check final placed tiles
      console.log("\n🔍 Checking final board state...");
      const placedTiles = await contract.getPlacedTiles(gameId);
      const [xPositions, yPositions, numbers, turnNumbers] = placedTiles;
      
      console.log(`📋 Total tiles placed: ${xPositions.length}`);
      for (let i = 0; i < xPositions.length; i++) {
        console.log(`  Tile ${i + 1}: (${Number(xPositions[i])}, ${Number(yPositions[i])}) = ${Number(numbers[i])} (turn ${Number(turnNumbers[i])})`);
      }
      
      console.log(`\n🎉 SUCCESS! Game ${gameId} now has ${xPositions.length} tiles placed!`);
      console.log("🔗 Gallery should now show board preview with tiles");
      
    } else {
      console.log("❌ Game did not start after joining. Current state:", Number(gameAfter[0]));
    }
    
  } catch (error) {
    console.error("❌ Error:", error.message);
    if (error.message.includes("insufficient funds")) {
      console.log("\n💡 SOLUTION: Player 2 needs Base Sepolia testnet ETH!");
      console.log(`📋 Send to: ${player2.address}`);
      console.log(`🔑 Private key: ${player2Wallet.privateKey}`);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 