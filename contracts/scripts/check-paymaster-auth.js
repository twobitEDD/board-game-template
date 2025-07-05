const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Checking paymaster authorization on new contract...");
  console.log("=" .repeat(60));
  
  const contractAddress = "0xf151B1Af118b8D050B0F26319f58B0372bEA8A75";
  const contract = await ethers.getContractAt("FivesGame", contractAddress);
  
  console.log("📍 Contract:", contractAddress);
  console.log("🌐 Network:", network.name);
  
  // Common ZeroDev paymaster addresses to check
  const commonPaymasters = [
    { name: "EntryPoint v0.6", address: "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789" },
    { name: "ZeroDev Paymaster v1", address: "0x0576a174D229E3cFA37253523E645A78A0C91B57" },
    { name: "Base Sepolia Common", address: "0x00000000001c84a22dd7c20dbee51e0b9e07e5b5" },
    { name: "Base Sepolia Alt", address: "0xDFF7FA1077Bce740a6a212965Af4B6F4F62E5394" },
    { name: "Alternative", address: "0x000000000007736e2F043801e74C913A1C9F4F7" },
  ];
  
  console.log("🔍 Testing paymaster authorizations:");
  
  let authorizedCount = 0;
  for (const paymaster of commonPaymasters) {
    try {
      const isAuthorized = await contract.isAuthorizedPaymaster(paymaster.address);
      console.log(`  ${paymaster.name}:`);
      console.log(`    ${paymaster.address}: ${isAuthorized ? "✅ Authorized" : "❌ Not authorized"}`);
      if (isAuthorized) authorizedCount++;
    } catch (error) {
      console.log(`  ${paymaster.name}:`);
      console.log(`    ${paymaster.address}: ❌ Error checking - ${error.message}`);
    }
  }
  
  console.log("\n📊 Summary:");
  console.log(`  Authorized paymasters: ${authorizedCount}/${commonPaymasters.length}`);
  
  if (authorizedCount === 0) {
    console.log("⚠️  WARNING: No paymasters are authorized!");
    console.log("   This means sponsored transactions won't work.");
    console.log("   Need to authorize ZeroDev paymaster addresses.");
  } else {
    console.log(`✅ ${authorizedCount} paymaster(s) authorized - sponsored transactions should work`);
  }
  
  // Also test a game join to see if it works
  console.log("\n🧪 Testing game join scenario...");
  try {
    // Get next game ID
    const nextGameId = await contract.nextGameId();
    console.log(`📊 Next game ID would be: ${nextGameId}`);
    
    // Check if there are any existing setup games to join
    if (nextGameId > 1) {
      for (let gameId = 1; gameId < nextGameId; gameId++) {
        try {
          const gameData = await contract.getGame(gameId);
          if (Number(gameData[0]) === 0 && gameData[7].length < Number(gameData[2])) {
            console.log(`🎮 Found joinable game ${gameId}:`);
            console.log(`   State: Setup`);
            console.log(`   Players: ${gameData[7].length}/${Number(gameData[2])}`);
            console.log(`   Has space: Yes`);
          }
        } catch (e) {
          // Game might not exist, skip
        }
      }
    }
  } catch (error) {
    console.log(`❌ Error checking games: ${error.message}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 