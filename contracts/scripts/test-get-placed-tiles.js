const hre = require("hardhat");

async function main() {
  console.log('📡 Testing getPlacedTiles function...\n');
  
  const contractAddress = "0x922D6956C99E12DFeB3224DEA977D0939758A1Fe";
  const [player1] = await hre.ethers.getSigners();
  const FivesGame = await hre.ethers.getContractFactory("FivesGame");
  const game = FivesGame.attach(contractAddress);
  
  try {
    // Test Game 2 which should have 1 tile
    console.log('🎯 Testing Game 2 (should have 1 tile at 7,7):');
    const result2 = await game.getPlacedTiles(2);
    console.log('  Raw result:', result2);
    console.log('  Array lengths:', {
      xPositions: result2[0].length,
      yPositions: result2[1].length,
      numbers: result2[2].length,
      turnNumbers: result2[3].length
    });
    
    if (result2[0].length > 0) {
      console.log('  Tiles found:');
      for (let i = 0; i < result2[0].length; i++) {
        console.log(`    Tile ${i}: (${result2[0][i]}, ${result2[1][i]}) = ${result2[2][i]} (turn ${result2[3][i]})`);
      }
    } else {
      console.log('  ❌ No tiles found!');
    }
    
    console.log('\n🎯 Testing Game 3 (should have 2 tiles):');
    const result3 = await game.getPlacedTiles(3);
    console.log('  Array lengths:', {
      xPositions: result3[0].length,
      yPositions: result3[1].length,
      numbers: result3[2].length,
      turnNumbers: result3[3].length
    });
    
    if (result3[0].length > 0) {
      console.log('  Tiles found:');
      for (let i = 0; i < result3[0].length; i++) {
        console.log(`    Tile ${i}: (${result3[0][i]}, ${result3[1][i]}) = ${result3[2][i]} (turn ${result3[3][i]})`);
      }
    } else {
      console.log('  ❌ No tiles found!');
    }
    
    // Also test individual tile lookup for verification
    console.log('\n🔍 Verification using getTileAt:');
    const tile2_7_7 = await game.getTileAt(2, 7, 7);
    console.log(`  Game 2 at (7,7): exists=${tile2_7_7[0]}, number=${tile2_7_7[1]}, turn=${tile2_7_7[2]}`);
    
    const tile3_7_7 = await game.getTileAt(3, 7, 7);
    console.log(`  Game 3 at (7,7): exists=${tile3_7_7[0]}, number=${tile3_7_7[1]}, turn=${tile3_7_7[2]}`);
    
    const tile3_7_8 = await game.getTileAt(3, 7, 8);
    console.log(`  Game 3 at (7,8): exists=${tile3_7_8[0]}, number=${tile3_7_8[1]}, turn=${tile3_7_8[2]}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Full error:', error);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 