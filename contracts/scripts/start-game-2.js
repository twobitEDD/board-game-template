const { ethers } = require("hardhat");
const hre = require("hardhat");

async function main() {
  console.log("🎮 Starting Game 2 on Base Sepolia...");
  
  // Get the deployed contract address from config
  const contractAddress = "0xc0f6F4Fcddd6327081E1F3e05D83752926aDd72F"; // Base Sepolia address
  const gameId = 2;
  
  console.log("📍 Contract:", contractAddress);
  console.log("🌐 Network:", hre.network.name);
  
  try {
    // Get contract instance and signer
    const [signer] = await ethers.getSigners();
    const contract = await ethers.getContractAt("FivesGame", contractAddress, signer);
    
    console.log("👤 Signer:", signer.address);
    
    // Check current game state
    const gameData = await contract.getGame(gameId);
    const [state, creator, maxPlayers, currentPlayer, turnNumber, createdAt, allowIslands, playerAddresses, playerScores, tilesRemaining] = gameData;
    
    console.log("📊 Current Game State:", {
      state: Number(state) === 0 ? "Setup" : Number(state) === 1 ? "In Progress" : Number(state) === 2 ? "Completed" : "Canceled",
      creator: creator,
      maxPlayers: Number(maxPlayers),
      playersJoined: playerAddresses.length,
      currentSigner: signer.address
    });
    
    // Check if the signer is the creator
    if (signer.address.toLowerCase() !== creator.toLowerCase()) {
      console.log("❌ You are not the creator of this game");
      console.log("   Creator:", creator);
      console.log("   You:", signer.address);
      return;
    }
    
    // Check if game is in setup state
    if (Number(state) !== 0) {
      console.log("❌ Game is not in Setup state (current state:", Number(state), ")");
      return;
    }
    
    // Start the game
    console.log("🚀 Starting game...");
    const tx = await contract.startGame(gameId);
    
    console.log("⏳ Transaction sent:", tx.hash);
    console.log("⏳ Waiting for confirmation...");
    
    const receipt = await tx.wait();
    console.log("✅ Game started successfully!");
    console.log("📋 Gas used:", receipt.gasUsed.toString());
    
    // Check new game state
    const newGameData = await contract.getGame(gameId);
    const [newState] = newGameData;
    
    console.log("🎉 New game state:", Number(newState) === 0 ? "Setup" : Number(newState) === 1 ? "In Progress" : Number(newState) === 2 ? "Completed" : "Canceled");
    
  } catch (error) {
    console.error("❌ Error:", error.message);
    
    // Check if it's a revert reason
    if (error.reason) {
      console.error("❌ Revert reason:", error.reason);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 