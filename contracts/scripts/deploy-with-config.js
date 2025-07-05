#!/usr/bin/env node

const { ethers } = require("hardhat");
const contractConfig = require('./contract-config');

async function main() {
  console.log("🚀 Deploying FivesGame contract with automatic config update...");
  
  try {
    // Get deployer info
    const [deployer] = await ethers.getSigners();
    const deployerAddress = deployer.address;
    const balance = await deployer.provider.getBalance(deployerAddress);
    
    console.log("📝 Deploying with account:", deployerAddress);
    console.log("💰 Account balance:", ethers.formatEther(balance), "ETH");
    
    // Get network info
    const network = await ethers.provider.getNetwork();
    const chainId = Number(network.chainId);
    console.log("🌐 Network:", network.name, "| Chain ID:", chainId);
    
    // Deploy the contract
    console.log("\n🏗️ Deploying FivesGame contract...");
    const FivesGame = await ethers.getContractFactory("FivesGame");
    const fivesGame = await FivesGame.deploy();
    
    console.log("⏳ Waiting for deployment...");
    await fivesGame.waitForDeployment();
    
    const contractAddress = await fivesGame.getAddress();
    const deployTx = fivesGame.deploymentTransaction();
    
    console.log("✅ FivesGame deployed successfully!");
    console.log("📍 Contract address:", contractAddress);
    console.log("📊 Transaction hash:", deployTx?.hash);
    
    // Wait for a few confirmations
    if (deployTx) {
      console.log("⏳ Waiting for transaction confirmation...");
      const receipt = await deployTx.wait();
      console.log("✅ Transaction confirmed in block:", receipt.blockNumber);
      console.log("⛽ Gas used:", receipt.gasUsed.toString());
    }
    
    // Test contract functions
    console.log("\n🧪 Testing contract...");
    const handSize = await fivesGame.HAND_SIZE();
    const winningScore = await fivesGame.WINNING_SCORE();
    console.log("🃏 Hand size:", handSize.toString());
    console.log("🏆 Default winning score:", winningScore.toString());
    
    // Update centralized configuration
    console.log("\n🔄 Updating centralized configuration...");
    const deploymentInfo = {
      deployedAt: new Date().toISOString(),
      deployerAddress: deployerAddress,
      blockNumber: deployTx ? deployTx.blockNumber : null,
      gasUsed: deployTx ? deployTx.gasLimit.toString() : null,
      verified: false
    };
    
    const configUpdated = contractConfig.updateContractAddress(chainId, contractAddress, deploymentInfo);
    
    if (configUpdated) {
      console.log("✅ Centralized configuration updated!");
      console.log("📄 Contract address saved for Chain ID:", chainId);
      
      // Sync to frontend
      console.log("🔄 Syncing to frontend...");
      try {
        const syncScript = require('./sync-frontend-config');
        await syncScript.main();
        console.log("✅ Frontend configuration synced!");
      } catch (syncError) {
        console.warn("⚠️ Frontend sync failed:", syncError.message);
        console.log("💡 You can sync manually with: node scripts/sync-frontend-config.js");
      }
    } else {
      console.warn("⚠️ Failed to update centralized configuration");
    }
    
    // Create a test game if on local network
    if (chainId === 1337) {
      console.log("\n🎮 Creating test game on local network...");
      try {
        const createTx = await fivesGame.createGame(
          2,           // maxPlayers
          false,       // allowIslands
          10000,       // winningScore
          "Test Creator" // playerName
        );
        
        const createReceipt = await createTx.wait();
        console.log("✅ Test game created successfully!");
        
        // Parse game ID from events
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
          console.log("🎯 Test game ID:", gameId.toString());
        }
      } catch (gameError) {
        console.warn("⚠️ Failed to create test game:", gameError.message);
      }
    }
    
    // Display final summary
    console.log("\n🎉 DEPLOYMENT COMPLETE!");
    console.log("=====================================");
    console.log("📍 Contract Address:", contractAddress);
    console.log("🌐 Network:", network.name, `(Chain ID: ${chainId})`);
    console.log("👤 Deployer:", deployerAddress);
    console.log("🔧 Configuration: Updated automatically");
    console.log("🖥️ Frontend: Synced automatically");
    
    // Show next steps
    console.log("\n💡 NEXT STEPS:");
    console.log("1. Start your frontend: cd app && npm start");
    console.log("2. Visit the gallery: http://localhost:3000/gallery");
    console.log("3. Connect wallet to Chain ID:", chainId);
    console.log("4. Join games from the gallery!");
    
    // Show useful commands
    console.log("\n🛠️ USEFUL COMMANDS:");
    console.log("- View config: node scripts/manage-config.js show");
    console.log("- Verify contract: node scripts/manage-config.js verify", chainId);
    console.log("- Sync frontend: node scripts/sync-frontend-config.js");
    
    if (chainId === 1337) {
      console.log("- Create more games: node scripts/simple-deploy.js");
    }
    
  } catch (error) {
    console.error("❌ Deployment failed:", error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { main }; 