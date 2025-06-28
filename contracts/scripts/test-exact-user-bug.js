const { ethers } = require("hardhat");

async function main() {
    console.log("🎯 Testing EXACT User Cross-Pattern Bug");
    console.log("======================================");

    // Get signers
    const [player1, player2] = await ethers.getSigners();
    console.log("👤 Player 1:", player1.address);
    console.log("👤 Player 2:", player2.address);

    // Deploy fresh contract for testing
    console.log("\n🚀 Deploying fresh contract...");
    const FivesGame = await ethers.getContractFactory("FivesGame");
    const game = await FivesGame.deploy();
    await game.waitForDeployment();
    const contractAddress = await game.getAddress();
    console.log("✅ Contract deployed to:", contractAddress);

    try {
        // Create test game
        console.log("\n🆕 Creating test game...");
        await game.connect(player1).createGame(2, false, 500, "Player 1");
        await game.connect(player2).joinGame(1, "Player 2");
        console.log("✅ Game created and players joined");

        // Get player hands
        const player1Data = await game.getPlayer(1, player1.address);
        const player2Data = await game.getPlayer(1, player2.address);
        const hand1 = player1Data[2].map(n => parseInt(n.toString()));
        const hand2 = player2Data[2].map(n => parseInt(n.toString()));
        
        console.log("\n🎴 Player hands:");
        console.log("  Player 1:", hand1.join(', '));
        console.log("  Player 2:", hand2.join(', '));

        // Test: Try to create the EXACT cross pattern from user's screenshot
        // This should place tiles in a cross where the center tile is shared
        console.log("\n🧪 TESTING: Exact cross pattern (single turn)");
        console.log("Attempting to place:");
        console.log("  (6,7): tile, (7,7): tile, (8,7): tile, (9,7): tile  ← Horizontal");
        console.log("  (7,6): tile, (7,7): SAME tile, (7,8): tile         ← Vertical");
        console.log("This creates a '+' shape with shared center tile");
        
        const exactCrossPattern = [
            // Horizontal sequence at y=7
            { x: 6, y: 7, number: hand1[0] },  
            { x: 7, y: 7, number: hand1[1] },  // CENTER TILE
            { x: 8, y: 7, number: hand1[2] },  
            { x: 9, y: 7, number: hand1[3] },  
            
            // Vertical sequence at x=7 (intersecting center)
            { x: 7, y: 6, number: hand1[4] },  // Above center
            // { x: 7, y: 7, number: hand1[1] },  // CENTER - same as above (INVALID!)
            { x: 7, y: 8, number: hand1[0] }   // Below center (reusing tile - also invalid)
        ];
        
        try {
            const tx = await game.connect(player1).playTurn(1, exactCrossPattern);
            await tx.wait();
            console.log("❌ EXACT CROSS PATTERN was ALLOWED - MAJOR BUG CONFIRMED!");
            
            // Show the resulting board
            console.log("\n🚨 Cross pattern created:");
            for (let y = 5; y <= 9; y++) {
                let row = `Row ${y}: `;
                for (let x = 5; x <= 10; x++) {
                    try {
                        const tile = await game.getTileAt(1, x, y);
                        if (tile[0]) {
                            row += `${tile[1]} `;
                        } else {
                            row += ". ";
                        }
                    } catch (e) {
                        row += ". ";
                    }
                }
                console.log(row);
            }
            
        } catch (error) {
            console.log("✅ Exact cross pattern was correctly REJECTED:", error.message);
        }

        // Test: Try a different approach - what if we use duplicate positions?
        console.log("\n🧪 TESTING: Duplicate position exploitation");
        
        const duplicatePositionTest = [
            { x: 7, y: 7, number: hand1[0] },  // Center
            { x: 7, y: 7, number: hand1[1] }   // SAME POSITION - should fail
        ];
        
        try {
            const tx2 = await game.connect(player1).playTurn(1, duplicatePositionTest);
            await tx2.wait();
            console.log("❌ DUPLICATE POSITION was ALLOWED - BUG CONFIRMED!");
        } catch (error) {
            console.log("✅ Duplicate position was correctly REJECTED:", error.message);
        }

        // Test: What if validation is only checking the first tile in each direction?
        console.log("\n🧪 TESTING: Single tile + extensions that create cross");
        
        await game.connect(player1).createGame(2, false, 500, "Player 1");
        await game.connect(player2).joinGame(2, "Player 2");
        
        const player1Data2 = await game.getPlayer(2, player1.address);
        const hand1_new = player1Data2[2].map(n => parseInt(n.toString()));
        
        // Strategy: Place one tile at center, then try to extend both horizontally and vertically
        const step1 = [{ x: 7, y: 7, number: hand1_new[0] }];
        
        try {
            const tx3 = await game.connect(player1).playTurn(2, step1);
            await tx3.wait();
            console.log("✅ Single center tile placed");
            
            // Now try to place tiles that form cross with existing center
            const player2Data2 = await game.getPlayer(2, player2.address);
            const hand2_new = player2Data2[2].map(n => parseInt(n.toString()));
            
            const crossExtension = [
                { x: 6, y: 7, number: hand2_new[0] },  // Left of center (horizontal)
                { x: 8, y: 7, number: hand2_new[1] },  // Right of center (horizontal)
                { x: 7, y: 6, number: hand2_new[2] },  // Above center (vertical) - CREATES CROSS!
                { x: 7, y: 8, number: hand2_new[3] }   // Below center (vertical) - CREATES CROSS!
            ];
            
            const tx4 = await game.connect(player2).playTurn(2, crossExtension);
            await tx4.wait();
            console.log("❌ CROSS EXTENSION was ALLOWED - BUG CONFIRMED!");
            
            // Show final pattern
            console.log("\n🚨 Final cross pattern:");
            for (let y = 5; y <= 9; y++) {
                let row = `Row ${y}: `;
                for (let x = 5; x <= 10; x++) {
                    try {
                        const tile = await game.getTileAt(2, x, y);
                        if (tile[0]) {
                            row += `${tile[1]} `;
                        } else {
                            row += ". ";
                        }
                    } catch (e) {
                        row += ". ";
                    }
                }
                console.log(row);
            }
            
        } catch (error) {
            console.log("✅ Cross extension was correctly REJECTED:", error.message);
        }

    } catch (error) {
        console.error("❌ Test failed:", error.message);
        console.error(error);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 