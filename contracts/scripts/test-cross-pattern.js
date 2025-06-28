const { ethers } = require("hardhat");

async function main() {
    console.log("🎯 Testing Cross-Pattern Validation");
    console.log("===================================");

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

        // Get player hands first
        const player1Data = await game.getPlayer(1, player1.address);
        const player2Data = await game.getPlayer(1, player2.address);
        console.log("\n🎴 Player hands:");
        console.log("  Player 1:", player1Data[2].map(n => n.toString()).join(', '));
        console.log("  Player 2:", player2Data[2].map(n => n.toString()).join(', '));

        // Test 1: Valid horizontal placement (should work)
        console.log("\n🧪 TEST 1: Valid horizontal placement");
        const hand1 = player1Data[2].map(n => parseInt(n.toString()));
        const validHorizontal = [
            { x: 7, y: 7, number: hand1[0] },  // Center
            { x: 8, y: 7, number: hand1[1] }   // Right of center
        ];
        
        try {
            const tx1 = await game.connect(player1).playTurn(1, validHorizontal);
            await tx1.wait();
            console.log("✅ Valid horizontal placement succeeded");
        } catch (error) {
            console.log("❌ Valid horizontal placement failed:", error.message);
        }

        // Check current board state
        console.log("\n📋 Current board state:");
        for (let x = 6; x <= 9; x++) {
            for (let y = 6; y <= 9; y++) {
                try {
                    const tile = await game.getTileAt(1, x, y);
                    if (tile[0]) {
                        console.log(`  (${x}, ${y}): ${tile[1]}`);
                    }
                } catch (e) {
                    // Position empty
                }
            }
        }

                 // Test 2: INVALID cross-pattern (should fail) 
         console.log("\n🧪 TEST 2: INVALID cross-pattern placement");
         const hand2 = player2Data[2].map(n => parseInt(n.toString()));
         const invalidCross = [
             { x: 7, y: 6, number: hand2[0] },  // Above the existing tile
             { x: 7, y: 8, number: hand2[1] },  // Below the existing tile  
             { x: 9, y: 7, number: hand2[2] }   // Right of existing tile
         ];
        // This creates a cross: vertical tiles at x=7, horizontal tile at y=7
        
        try {
            const tx2 = await game.connect(player2).playTurn(1, invalidCross);
            await tx2.wait();
            console.log("❌ INVALID cross pattern was ALLOWED - THIS IS THE BUG!");
            
            // Show the resulting board
            console.log("\n🚨 Resulting board (should not exist):");
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
            console.log("✅ INVALID cross pattern was correctly REJECTED:", error.message);
        }

        // Test 3: Try the exact pattern from user's screenshot
        console.log("\n🧪 TEST 3: User's exact cross pattern");
        
        // Reset game by creating a new one
        await game.connect(player1).createGame(2, false, 500, "Player 1");
        await game.connect(player2).joinGame(2, "Player 2");
        
                 // Get fresh hands for game 2
         const player1Data2 = await game.getPlayer(2, player1.address);
         const player2Data2 = await game.getPlayer(2, player2.address);
         const hand1_game2 = player1Data2[2].map(n => parseInt(n.toString()));
         const hand2_game2 = player2Data2[2].map(n => parseInt(n.toString()));
         
         console.log("  Player 1 hand (game 2):", hand1_game2.join(', '));
         console.log("  Player 2 hand (game 2):", hand2_game2.join(', '));
         
         // First turn: horizontal row using actual tiles
         const userTurn1 = [
             { x: 6, y: 6, number: hand1_game2[0] },
             { x: 7, y: 6, number: hand1_game2[1] }, 
             { x: 8, y: 6, number: hand1_game2[2] },
             { x: 9, y: 6, number: hand1_game2[3] }
         ];
        
        try {
            const tx3 = await game.connect(player1).playTurn(2, userTurn1);
            await tx3.wait();
            console.log("✅ User's turn 1 (horizontal) succeeded");
        } catch (error) {
            console.log("❌ User's turn 1 failed:", error.message);
        }
        
                 // Second turn: Try to create vertical column intersecting
         const userTurn2 = [
             { x: 6, y: 7, number: hand2_game2[0] },  // Below the first tile
             { x: 6, y: 8, number: hand2_game2[1] },  // Below that
             { x: 6, y: 9, number: hand2_game2[2] }   // Below that
         ];
        
        try {
            const tx4 = await game.connect(player2).playTurn(2, userTurn2);
            await tx4.wait();
            console.log("❌ User's turn 2 (creating cross) was ALLOWED - THIS CONFIRMS THE BUG!");
            
            // Show final board
            console.log("\n🚨 Final board showing cross pattern:");
            for (let y = 5; y <= 10; y++) {
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
            console.log("✅ User's turn 2 was correctly REJECTED:", error.message);
        }

        // Test 4: Single turn cross pattern (this should definitely fail)
        console.log("\n🧪 TEST 4: Single turn cross pattern");
        
                 await game.connect(player1).createGame(2, false, 500, "Player 1");
         await game.connect(player2).joinGame(3, "Player 2");
         
         // Get hands for game 3
         const player1Data3 = await game.getPlayer(3, player1.address);
         const hand1_game3 = player1Data3[2].map(n => parseInt(n.toString()));
         console.log("  Player 1 hand (game 3):", hand1_game3.join(', '));
         
         const singleTurnCross = [
             { x: 7, y: 7, number: hand1_game3[0] },  // Center
             { x: 8, y: 7, number: hand1_game3[1] },  // Right (horizontal)
             { x: 7, y: 8, number: hand1_game3[2] }   // Down (vertical) - creates cross!
         ];
        
        try {
            const tx5 = await game.connect(player1).playTurn(3, singleTurnCross);
            await tx5.wait();
            console.log("❌ SINGLE TURN CROSS was ALLOWED - MAJOR BUG CONFIRMED!");
        } catch (error) {
            console.log("✅ Single turn cross was correctly REJECTED:", error.message);
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