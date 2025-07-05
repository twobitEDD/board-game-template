const hre = require("hardhat");

async function main() {
  console.log("🔍 Debugging Player Hands...\n");
  
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const [player1] = await hre.ethers.getSigners();
  const FivesGame = await hre.ethers.getContractFactory("FivesGame");
  
  try {
    const game = FivesGame.attach(contractAddress).connect(player1);
    
    // Check Game 2 - Player Two has [2, 1, 8, 5, 0]
    console.log("🎯 Game 2 - Player Two hand analysis:");
    const game2Info = await game.getGame(2);
    const player2Addr = game2Info.playerAddresses[1]; // Player Two
    const player2Info = await game.getPlayer(2, player2Addr);
    
    console.log("  Raw hand:", player2Info.hand);
    console.log("  Hand length:", player2Info.hand.length);
    
    for (let i = 0; i < player2Info.hand.length; i++) {
      const tile = player2Info.hand[i];
      console.log(`  Tile ${i}: ${tile} (type: ${typeof tile})`);
      console.log(`    toString(): ${tile.toString()}`);
      console.log(`    == 0: ${tile == 0}`);
      console.log(`    === 0: ${tile === 0}`);
      console.log(`    == 5: ${tile == 5}`);
      console.log(`    === 5: ${tile === 5}`);
      console.log(`    toNumber(): ${tile.toNumber ? tile.toNumber() : 'no toNumber method'}`);
    }
    
    // Test filtering with different approaches
    const validTilesStrict = player2Info.hand.filter(tile => tile === 0 || tile === 5);
    const validTilesLoose = player2Info.hand.filter(tile => tile == 0 || tile == 5);
    const validTilesNumber = player2Info.hand.filter(tile => {
      const num = tile.toNumber ? tile.toNumber() : parseInt(tile.toString());
      return num === 0 || num === 5;
    });
    
    console.log("\n  Filtering results:");
    console.log(`    Strict (===): [${validTilesStrict.join(', ')}] (${validTilesStrict.length} tiles)`);
    console.log(`    Loose (==): [${validTilesLoose.join(', ')}] (${validTilesLoose.length} tiles)`);
    console.log(`    Number conversion: [${validTilesNumber.join(', ')}] (${validTilesNumber.length} tiles)`);
    
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