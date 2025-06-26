const { ethers } = require("hardhat");

async function main() {
    // Get the contract
    const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
    const FivesGame = await ethers.getContractFactory("FivesGame");
    const game = FivesGame.attach(contractAddress);
    
    const gameId = 2;
    
    console.log("🎮 Checking Game", gameId);
    console.log("=" .repeat(50));
    
    // Get game info
    const gameInfo = await game.getGame(gameId);
    console.log("📊 Game State:", Number(gameInfo[0])); // 0=Setup, 1=InProgress, 2=Completed
    console.log("👥 Players:", gameInfo[7].length);
    console.log("🎯 Current Player Index:", Number(gameInfo[3]));
    console.log("🔄 Turn Number:", Number(gameInfo[4]));
    
    // Check tiles around position (7,7) and (8,7)
    console.log("\n🗺️  Board State Around (7,7):");
    console.log("=" .repeat(30));
    
    const positions = [
        [6, 7], [7, 6], [7, 7], [7, 8], [8, 7], [8, 8]
    ];
    
    for (const [x, y] of positions) {
        try {
            const tile = await game.getTileAt(gameId, x, y);
            if (tile[0]) { // exists
                const tileNumber = Number(tile[1]);
                console.log(`📍 (${x}, ${y}): Contract tile #${tileNumber} (display: ${(tileNumber - 1) % 10})`);
            } else {
                console.log(`⬜ (${x}, ${y}): Empty`);
            }
        } catch (error) {
            console.log(`❌ (${x}, ${y}): Error -`, error.message);
        }
    }
    
    // Test the math rules for tile #5 at position (8,7)
    console.log("\n🧮 Math Rules Check:");
    console.log("=" .repeat(30));
    console.log("Trying to place contract tile #5 at (8,7)");
    
    // Check adjacent positions
    const adjacent = [
        [7, 7], [9, 7], [8, 6], [8, 8] // left, right, up, down
    ];
    
    for (const [adjX, adjY] of adjacent) {
        try {
            const adjTile = await game.getTileAt(gameId, adjX, adjY);
            if (adjTile[0]) { // exists
                const adjNumber = Number(adjTile[1]);
                const sum = 5 + adjNumber;
                const diff = Math.abs(5 - adjNumber);
                
                console.log(`📍 Adjacent at (${adjX}, ${adjY}): Contract tile #${adjNumber}`);
                console.log(`   Sum: 5 + ${adjNumber} = ${sum} ${sum === 5 ? '✅' : '❌'}`);
                console.log(`   Diff: |5 - ${adjNumber}| = ${diff} ${diff === 5 ? '✅' : '❌'}`);
                
                if (sum === 5 || diff === 5) {
                    console.log(`   🎯 VALID PLACEMENT!`);
                } else {
                    console.log(`   ❌ INVALID - doesn't satisfy rules`);
                }
            }
        } catch (error) {
            console.log(`❌ Error checking (${adjX}, ${adjY}):`, error.message);
        }
    }
    
    // Check what tiles WOULD work adjacent to the existing tile
    console.log("\n💡 What tiles WOULD work adjacent to tile #1 at (7,7)?");
    console.log("=" .repeat(50));
    const existingTile = 1;
    
    // Sum rule: tile + 1 = 5 → tile = 4
    const sumTile = 5 - existingTile;
    console.log(`Sum rule: Need contract tile #${sumTile} (display: ${(sumTile - 1) % 10})`);
    
    // Difference rule: |tile - 1| = 5 → tile = 6 or tile = -4 (only 6 is valid)
    const diffTile1 = existingTile + 5;
    const diffTile2 = existingTile - 5;
    console.log(`Diff rule: Need contract tile #${diffTile1} (display: ${(diffTile1 - 1) % 10}) or #${diffTile2} ${diffTile2 < 1 ? '(invalid)' : ''}`);
    
    // Check player hands
    console.log("\n🃏 Player Hands:");
    console.log("=" .repeat(30));
    
    for (let i = 0; i < gameInfo[7].length; i++) {
        const playerAddr = gameInfo[7][i];
        try {
            const playerInfo = await game.getPlayer(gameId, playerAddr);
            const hand = playerInfo[2].map(n => Number(n));
            console.log(`👤 Player ${i + 1} (${playerAddr.slice(0,6)}...${playerAddr.slice(-4)}):`);
            console.log(`   Hand: [${hand.join(', ')}]`);
            console.log(`   Score: ${Number(playerInfo[1])}`);
            
            // Check if they have valid tiles
            const hasSum = hand.includes(sumTile);
            const hasDiff = hand.includes(diffTile1);
            console.log(`   Valid tiles: ${hasSum ? `#${sumTile} ✅` : ''} ${hasDiff ? `#${diffTile1} ✅` : ''} ${!hasSum && !hasDiff ? 'None ❌' : ''}`);
        } catch (error) {
            console.log(`❌ Error getting player ${i + 1}:`, error.message);
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 