const { ethers } = require("hardhat");

async function main() {
    console.log("🚀 Deploying FivesGame contract...");
    
    // Deploy the contract
    const FivesGame = await ethers.getContractFactory("FivesGame");
    const fivesGame = await FivesGame.deploy();
    
    await fivesGame.waitForDeployment();
    
    const contractAddress = await fivesGame.getAddress();
    console.log("✅ FivesGame deployed to:", contractAddress);
    
    // Create a test game to verify deployment
    console.log("\n🎮 Creating test game...");
    
    const [deployer, player2] = await ethers.getSigners();
    
    // Create game with new parameters
    const createTx = await fivesGame.createGame(
        2,           // maxPlayers
        false,       // allowIslands
        100,         // winningScore
        "Player 1"   // playerName
    );
    
    const createReceipt = await createTx.wait();
    const gameCreatedEvent = createReceipt.logs.find(log => {
        try {
            return fivesGame.interface.parseLog(log).name === 'GameCreated';
        } catch {
            return false;
        }
    });
    
    if (gameCreatedEvent) {
        const parsedEvent = fivesGame.interface.parseLog(gameCreatedEvent);
        const gameId = parsedEvent.args.gameId;
        console.log("✅ Test game created with ID:", gameId.toString());
        
        // Player 2 joins
        console.log("👥 Player 2 joining...");
        const joinTx = await fivesGame.connect(player2).joinGame(gameId, "Player 2");
        await joinTx.wait();
        console.log("✅ Player 2 joined - game should auto-start");
        
        // Check game state
        const gameInfo = await fivesGame.getGame(gameId);
        console.log("📊 Game state:", gameInfo[0] === 1n ? "In Progress" : "Setup");
        console.log("👥 Players:", gameInfo[7].length);
        
        // Check player hands
        for (let i = 0; i < gameInfo[7].length; i++) {
            const playerAddr = gameInfo[7][i];
            const playerInfo = await fivesGame.getPlayer(gameId, playerAddr);
            console.log(`🃏 Player ${i + 1} hand size:`, playerInfo[2].length);
            console.log(`   First few tiles:`, playerInfo[2].slice(0, 10).map(n => Number(n)));
        }
        
        console.log("\n🎯 Contract ready for use!");
        console.log("📝 Contract address:", contractAddress);
        console.log("🎮 Test game ID:", gameId.toString());
        
    } else {
        console.log("❌ Could not find GameCreated event");
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    }); 