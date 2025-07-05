const fs = require('fs');
const path = require('path');

function extractABI() {
  console.log("🔧 EXTRACTING FIVES GAME ABI FOR ZERODEV");
  console.log("=" .repeat(50));
  
  // Path to the compiled contract
  const contractPath = path.join(__dirname, '../artifacts/contracts/FivesGame.sol/FivesGame.json');
  
  try {
    // Read the compiled contract
    const contractData = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
    
    // Extract just the ABI
    const abi = contractData.abi;
    
    console.log("✅ ABI extracted successfully!");
    console.log(`📊 Total functions/events: ${abi.length}`);
    
    // Pretty print the ABI
    console.log("\n🔍 ABI FOR ZERODEV:");
    console.log("=" .repeat(50));
    console.log(JSON.stringify(abi, null, 2));
    
    // Also save to a file for easy copy/paste
    const outputPath = path.join(__dirname, '../fives-game-abi.json');
    fs.writeFileSync(outputPath, JSON.stringify(abi, null, 2));
    
    console.log(`\n💾 ABI saved to: ${outputPath}`);
    console.log("\n📋 COPY THE JSON ABOVE OR USE THE SAVED FILE FOR ZERODEV INTEGRATION");
    
  } catch (error) {
    console.error("❌ Error extracting ABI:", error.message);
  }
}

extractABI(); 