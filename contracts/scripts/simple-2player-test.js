const { ethers } = require("hardhat");

async function main() {
  console.log("🎮 Creating minimal 2-player game with high gas...");
  
  // Use the working contract
  const contractAddress = "0x80f80B22D1839F2216F7f7814398e7039Fc17546";
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
  
  if (balance < ethers.parseEther("0.0001")) {
    console.log("❌ Insufficient balance for transaction");
    return;
  }
  
  try {
    const currentGameId = await contract.nextGameId();
    console.log("📊 Next game ID:", Number(currentGameId));
    
    // Create game with very high gas limit and minimal parameters
    console.log("\n🎯 Creating 2-player game...");
    const createTx = await contract.createGame(
      2, // maxPlayers
      true, // allowIslands
      100, // winningScore (minimum)
      "Test", // short name
      { 
        gasLimit: 1000000, // Very high gas limit
        gasPrice: ethers.parseUnits("2", "gwei") // Higher gas price
      }
    );
    
    console.log("🔄 Transaction sent, waiting for confirmation...");
    const receipt = await createTx.wait();
    console.log("✅ Game created! Gas used:", Number(receipt.gasUsed));
    
    const gameId = Number(currentGameId);
    console.log("🎲 Game ID:", gameId);
    
    // Check game state
    const gameData = await contract.getGame(gameId);
    console.log("📊 Game created successfully:", {
      state: Number(gameData[0]) === 0 ? "Setup" : "Other",
      players: gameData[7].length,
      maxPlayers: Number(gameData[2])
    });
    
    console.log("\n🎉 SUCCESS! 2-player game created.");
    console.log("💡 Now need a second player to join to start the game.");
    
  } catch (error) {
    console.error("❌ Error:", error.message);
    
    // Check if it's a gas estimation error
    if (error.message.includes("cannot estimate gas")) {
      console.log("💡 This is a gas estimation error - the transaction would likely fail");
    } else if (error.message.includes("insufficient funds")) {
      console.log("💡 Need more ETH for this transaction");
    } else {
      console.log("💡 Unknown error - may be a contract validation issue");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 