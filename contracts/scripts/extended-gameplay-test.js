const { ethers } = require("hardhat");

async function main() {
    console.log("🎮 Testing Extended Gameplay with Scoring Sequences");
    console.log("==================================================");

    // Get signers (players)
    const [player1, player2] = await ethers.getSigners();
    console.log("👤 Player 1:", player1.address);
    console.log("👤 Player 2:", player2.address);

    // Get contract
    const contractAddress = "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6";
    const FivesGame = await ethers.getContractFactory("FivesGame");
    const game = FivesGame.attach(contractAddress);

    try {
        // Use the existing test game (created during deployment)
        const gameId = 1;
        console.log("\n🎮 Using existing test game with ID:", gameId);

        // Check initial game state
        const gameState = await game.getGame(gameId);
        console.log("\n📊 Initial Game State:");
        console.log("  State:", gameState[0] === 1 ? "In Progress" : "Setup");
        console.log("  Turn Number:", gameState[4].toString());
        console.log("  Current Player Index:", gameState[3]);
        console.log("  Winning Score:", gameState[10].toString());

        // Get player hands
        const player1Data = await game.getPlayer(gameId, player1.address);
        const player2Data = await game.getPlayer(gameId, player2.address);
        
        console.log("\n🎴 Player Hands:");
        console.log("  Player 1:", player1Data[2].map(n => n.toString()).join(', '));
        console.log("  Player 2:", player2Data[2].map(n => n.toString()).join(', '));

        // Plan strategic moves for extended gameplay
        console.log("\n🎯 Planning Strategic Moves for Scoring Sequences...");
        
        // TURN 1: Player 1 places initial tiles to start at center
        // Let's place tiles that can build into scoring sequences
        console.log("\n=== TURN 1: Player 1 ===");
        
        // Find a sequence in player 1's hand that could sum to 5, 10, 15, etc.
        const hand1 = player1Data[2].map(n => parseInt(n.toString()));
        console.log("Player 1 analyzing hand:", hand1);
        
        // Strategy: Start with 2-3 tiles in a row that sum to multiple of 5
        // Example sequences that sum to 5: [2,3], [1,4], [0,5], [1,1,3], [2,2,1]
        // Example sequences that sum to 10: [4,6], [3,7], [2,8], [1,9], [5,5], [2,3,5]
        
        let placement1 = [];
        
        // Try to find two tiles that sum to 5 or 10
        for (let i = 0; i < hand1.length; i++) {
            for (let j = i + 1; j < hand1.length; j++) {
                const sum = hand1[i] + hand1[j];
                if (sum % 5 === 0 && sum > 0) {
                    placement1 = [
                        { x: 7, y: 7, number: hand1[i] },  // Center
                        { x: 8, y: 7, number: hand1[j] }   // Adjacent
                    ];
                    console.log(`🎯 Found scoring pair: ${hand1[i]} + ${hand1[j]} = ${sum} (${sum * 10} points)`);
                    break;
                }
            }
            if (placement1.length > 0) break;
        }
        
        // Fallback: just place first two tiles horizontally
        if (placement1.length === 0) {
            placement1 = [
                { x: 7, y: 7, number: hand1[0] },
                { x: 8, y: 7, number: hand1[1] }
            ];
            console.log(`📍 Fallback placement: ${hand1[0]} + ${hand1[1]} = ${hand1[0] + hand1[1]}`);
        }
        
        console.log("Placing tiles:", placement1);
        const turn1Tx = await game.connect(player1).playTurn(gameId, placement1);
        await turn1Tx.wait();
        console.log("✅ Turn 1 completed");
        
        // Check scores after turn 1
        const score1After = await game.getPlayer(gameId, player1.address);
        console.log("Player 1 score after turn 1:", score1After[1].toString());

        // TURN 2: Player 2 extends or creates new sequence
        console.log("\n=== TURN 2: Player 2 ===");
        
        const hand2 = player2Data[2].map(n => parseInt(n.toString()));
        console.log("Player 2 analyzing hand:", hand2);
        
        // Strategy: Either extend Player 1's sequence or create perpendicular sequence
        let placement2 = [];
        
        // Try to extend horizontally to make sum = multiple of 5
        const currentSum = placement1[0].number + placement1[1].number;
        console.log("Current horizontal sum:", currentSum);
        
        for (let tile of hand2) {
            const newSum = currentSum + tile;
            if (newSum % 5 === 0) {
                placement2 = [{ x: 9, y: 7, number: tile }]; // Extend right
                console.log(`🎯 Extending sequence: ${currentSum} + ${tile} = ${newSum} (${newSum * 10} points)`);
                break;
            }
        }
        
        // Fallback: create vertical sequence at (7,6) or (7,8)
        if (placement2.length === 0) {
            placement2 = [{ x: 7, y: 6, number: hand2[0] }]; // Above center
            console.log(`📍 Creating vertical sequence with ${hand2[0]}`);
        }
        
        console.log("Placing tiles:", placement2);
        const turn2Tx = await game.connect(player2).playTurn(gameId, placement2);
        await turn2Tx.wait();
        console.log("✅ Turn 2 completed");
        
        // Check scores after turn 2
        const score2After = await game.getPlayer(gameId, player2.address);
        console.log("Player 2 score after turn 2:", score2After[1].toString());

        // Continue for several more turns...
        console.log("\n🔄 Continuing extended gameplay...");
        
        for (let turnCount = 3; turnCount <= 8; turnCount++) {
            const currentGameState = await game.getGame(gameId);
            const currentPlayerIndex = currentGameState[3];
            const currentPlayer = currentPlayerIndex === 0 ? player1 : player2;
            const playerName = currentPlayerIndex === 0 ? "Player 1" : "Player 2";
            
            console.log(`\n=== TURN ${turnCount}: ${playerName} ===`);
            
            // Get current hand
            const currentPlayerData = await game.getPlayer(gameId, currentPlayer.address);
            const currentHand = currentPlayerData[2].map(n => parseInt(n.toString()));
            
            if (currentHand.length === 0) {
                console.log("⚠️ Player has no tiles, skipping turn");
                await game.connect(currentPlayer).skipTurn(gameId);
                continue;
            }
            
            console.log(`${playerName} hand:`, currentHand);
            
            // Simple strategy: place 1-2 tiles to extend existing sequences
            // For testing purposes, just place tiles adjacently to existing ones
            
            // Scan board for existing tiles to find good placement spots
            const boardState = [];
            for (let x = 0; x < 15; x++) {
                for (let y = 0; y < 15; y++) {
                    try {
                        const tile = await game.getTileAt(gameId, x, y);
                        if (tile[0]) { // exists
                            boardState.push({ x, y, number: parseInt(tile[1].toString()) });
                        }
                    } catch (e) {
                        // Position empty
                    }
                }
            }
            
            console.log("Current board:", boardState.map(t => `(${t.x},${t.y}):${t.number}`).join(' '));
            
            // Find a good placement spot
            let placement = [];
            
            // Try to place one tile adjacent to existing tiles
            for (const existingTile of boardState) {
                const adjacentSpots = [
                    { x: existingTile.x + 1, y: existingTile.y },
                    { x: existingTile.x - 1, y: existingTile.y },
                    { x: existingTile.x, y: existingTile.y + 1 },
                    { x: existingTile.x, y: existingTile.y - 1 }
                ];
                
                for (const spot of adjacentSpots) {
                    // Check if spot is empty and in bounds
                    if (spot.x >= 0 && spot.x < 15 && spot.y >= 0 && spot.y < 15) {
                        const spotEmpty = !boardState.some(t => t.x === spot.x && t.y === spot.y);
                        if (spotEmpty) {
                            // Place first tile from hand here
                            placement = [{ x: spot.x, y: spot.y, number: currentHand[0] }];
                            console.log(`Placing ${currentHand[0]} at (${spot.x}, ${spot.y})`);
                            break;
                        }
                    }
                }
                if (placement.length > 0) break;
            }
            
            if (placement.length === 0) {
                console.log("No valid placement found, skipping turn");
                await game.connect(currentPlayer).skipTurn(gameId);
            } else {
                const turnTx = await game.connect(currentPlayer).playTurn(gameId, placement);
                await turnTx.wait();
                
                // Check new score
                const updatedPlayerData = await game.getPlayer(gameId, currentPlayer.address);
                console.log(`${playerName} score after turn:`, updatedPlayerData[1].toString());
            }
        }
        
        // Final game summary
        console.log("\n📊 FINAL GAME SUMMARY");
        console.log("====================");
        const finalGameState = await game.getGame(gameId);
        const finalPlayer1Data = await game.getPlayer(gameId, player1.address);
        const finalPlayer2Data = await game.getPlayer(gameId, player2.address);
        
        console.log("Final Turn Number:", finalGameState[4].toString());
        console.log("Player 1 Final Score:", finalPlayer1Data[1].toString());
        console.log("Player 2 Final Score:", finalPlayer2Data[1].toString());
        console.log("Game State:", finalGameState[0] === 2 ? "Completed" : "In Progress");
        
        // Show final board
        console.log("\nFinal Board State:");
        for (let y = 0; y < 15; y++) {
            let row = "";
            for (let x = 0; x < 15; x++) {
                try {
                    const tile = await game.getTileAt(gameId, x, y);
                    if (tile[0]) {
                        row += tile[1].toString().padStart(2, ' ') + " ";
                    } else {
                        row += " . ";
                    }
                } catch (e) {
                    row += " . ";
                }
            }
            if (row.trim() !== ". . . . . . . . . . . . . . .") {
                console.log(`Row ${y.toString().padStart(2, ' ')}: ${row}`);
            }
        }

    } catch (error) {
        console.error("❌ Error during extended gameplay test:", error.message);
        console.error(error);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 