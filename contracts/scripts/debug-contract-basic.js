const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Debugging contract issues...\n");
  
  // Test both contracts
  const contracts = [
    { name: "Original", address: "0x80f80B22D1839F2216F7f7814398e7039Fc17546" },
    { name: "Single-Player", address: "0xa296A27561B207d235CA61DF3C2cBa431A0ad88C" }
  ];
  
  const accounts = await ethers.getSigners();
  const player = accounts[0];
  console.log("👤 Player:", player.address);
  
  const balance = await ethers.provider.getBalance(player.address);
  console.log("💰 Balance:", ethers.formatEther(balance), "ETH\n");
  
  for (const contractInfo of contracts) {
    console.log(`🔍 Testing ${contractInfo.name} Contract: ${contractInfo.address}`);
    console.log("=" .repeat(60));
    
    try {
      // Test 1: Check if contract exists
      const code = await ethers.provider.getCode(contractInfo.address);
      if (code === "0x") {
        console.log("❌ Contract not deployed at this address!");
        continue;
      } else {
        console.log(`✅ Contract code exists (${code.length} bytes)`);
      }
      
      // Test 2: Get contract instance
      const contract = await ethers.getContractAt("FivesGame", contractInfo.address);
      console.log("✅ Contract instance created");
      
      // Test 3: Test basic constants (should always work)
      try {
        const handSize = await contract.HAND_SIZE();
        console.log("✅ HAND_SIZE:", Number(handSize));
      } catch (error) {
        console.log("❌ HAND_SIZE failed:", error.message);
      }
      
      try {
        const winningScore = await contract.WINNING_SCORE();
        console.log("✅ WINNING_SCORE:", Number(winningScore));
      } catch (error) {
        console.log("❌ WINNING_SCORE failed:", error.message);
      }
      
      // Test 4: Test nextGameId
      try {
        const nextGameId = await contract.nextGameId();
        console.log("✅ nextGameId:", Number(nextGameId));
      } catch (error) {
        console.log("❌ nextGameId failed:", error.message);
      }
      
      // Test 5: Test tile distribution
      try {
        const tileCount = await contract.TILE_DISTRIBUTION(0);
        console.log("✅ TILE_DISTRIBUTION[0]:", Number(tileCount));
      } catch (error) {
        console.log("❌ TILE_DISTRIBUTION failed:", error.message);
      }
      
      // Test 6: Check if player has any games
      try {
        const playerGames = await contract.getPlayerGames(player.address);
        console.log("✅ Player games:", playerGames.length);
      } catch (error) {
        console.log("❌ getPlayerGames failed:", error.message);
      }
      
      // Test 7: Try to estimate gas for createGame
      try {
        const gasEstimate = await contract.createGame.estimateGas(
          1, // maxPlayers
          true, // allowIslands
          100, // winningScore
          "Test" // playerName
        );
        console.log("✅ createGame gas estimate:", Number(gasEstimate));
        
        // Test 8: Try with different gas estimation
        const gasEstimate2 = await contract.createGame.estimateGas(
          2, // maxPlayers
          true, // allowIslands
          100, // winningScore
          "Test" // playerName
        );
        console.log("✅ createGame (2 players) gas estimate:", Number(gasEstimate2));
        
      } catch (gasError) {
        console.log("❌ createGame gas estimation failed:", gasError.message);
        
        // If gas estimation fails, the function will revert
        console.log("🔍 This suggests the createGame function will revert");
        
        // Let's try to understand why by checking basic requirements
        console.log("\n🔍 Checking createGame requirements:");
        console.log("- maxPlayers (1): valid range 1-4");
        console.log("- allowIslands (true): boolean");
        console.log("- winningScore (100): should be >= 50");
        console.log("- playerName ('Test'): non-empty string");
        console.log("- All parameters seem valid...");
      }
      
      // Test 9: If this is the single player contract, test 1-player game
      if (contractInfo.name === "Single-Player") {
        try {
          const gasEstimate1Player = await contract.createGame.estimateGas(
            1, // maxPlayers = 1
            true, // allowIslands
            100, // winningScore
            "Solo" // playerName
          );
          console.log("✅ createGame (1 player) gas estimate:", Number(gasEstimate1Player));
        } catch (error) {
          console.log("❌ createGame (1 player) gas estimation failed:", error.message);
        }
      }
      
    } catch (error) {
      console.log("❌ Contract instance creation failed:", error.message);
    }
    
    console.log("\n");
  }
  
  // Test 10: Network information
  console.log("🌐 Network Information:");
  console.log("=" .repeat(40));
  try {
    const network = await ethers.provider.getNetwork();
    console.log("Chain ID:", Number(network.chainId));
    console.log("Network name:", network.name);
    
    const block = await ethers.provider.getBlock("latest");
    console.log("Latest block:", block.number);
    console.log("Block timestamp:", new Date(block.timestamp * 1000).toISOString());
    
    const feeData = await ethers.provider.getFeeData();
    console.log("Gas price:", ethers.formatUnits(feeData.gasPrice, "gwei"), "gwei");
    
  } catch (networkError) {
    console.log("❌ Network info failed:", networkError.message);
  }
  
  // Test 11: Try a simple contract call to see if it's a general issue
  console.log("\n🧪 Testing simple contract interaction:");
  try {
    // Try calling a simple view function that should always work
    const balance = await ethers.provider.getBalance(player.address);
    console.log("✅ getBalance works:", ethers.formatEther(balance));
    
    // Try calling eth_call manually
    const callResult = await ethers.provider.call({
      to: contracts[0].address,
      data: "0x" // Empty data - should return contract code
    });
    console.log("✅ Manual eth_call works:", callResult.length > 2 ? "Yes" : "No");
    
  } catch (callError) {
    console.log("❌ Simple contract call failed:", callError.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("💥 Script failed:", error);
    process.exit(1);
  }); 