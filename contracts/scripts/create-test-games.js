const { ethers } = require("hardhat");

async function createTestGames() {
  console.log('🎮 Creating Multiple Test Games (Including Game 4)\n');
  
  // Get accounts
  const [deployer, user1, user2, user3, paymaster] = await ethers.getSigners();
  
  console.log('👥 Test Accounts:');
  console.log(`  Deployer: ${deployer.address}`);
  console.log(`  User1: ${user1.address}`);
  console.log(`  User2: ${user2.address}`);
  console.log(`  User3: ${user3.address}`);
  console.log(`  Paymaster: ${paymaster.address}\n`);
  
  // Use the existing deployed contract
  const contractAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
  const FivesGame = await ethers.getContractFactory('FivesGame');
  const contract = FivesGame.attach(contractAddress);
  
  console.log(`📍 Using Contract: ${contractAddress}\n`);
  
  // Check current game count
  const initialNextGameId = await contract.nextGameId();
  console.log(`🔍 Current nextGameId: ${initialNextGameId} (existing games: ${initialNextGameId - 1})\n`);
  
  // Create Games 2, 3, 4, 5 to match your scenario
  const gamesToCreate = [
    { creator: user1, name: "Game Two", maxPlayers: 1, usePaymaster: false },
    { creator: user2, name: "Game Three", maxPlayers: 1, usePaymaster: true },
    { creator: user1, name: "Game Four", maxPlayers: 1, usePaymaster: true }, // This is your problematic Game 4!
    { creator: user3, name: "Game Five", maxPlayers: 2, usePaymaster: false }
  ];
  
  for (let i = 0; i < gamesToCreate.length; i++) {
    const gameInfo = gamesToCreate[i];
    const expectedGameId = Number(initialNextGameId) + i;
    
    console.log(`🎮 Creating Game ${expectedGameId}: ${gameInfo.name}`);
    console.log(`  Creator: ${gameInfo.creator.address}`);
    console.log(`  Max Players: ${gameInfo.maxPlayers}`);
    console.log(`  Via Paymaster: ${gameInfo.usePaymaster}`);
    
    try {
      let createTx;
      if (gameInfo.usePaymaster) {
        // Create via paymaster
        createTx = await contract.connect(paymaster).createGame(
          gameInfo.maxPlayers,
          false,
          1000,
          gameInfo.name,
          gameInfo.creator.address
        );
      } else {
        // Direct creation
        createTx = await contract.connect(gameInfo.creator).createGame(
          gameInfo.maxPlayers,
          false,
          1000,
          gameInfo.name,
          gameInfo.creator.address
        );
      }
      
      const receipt = await createTx.wait();
      
      // Extract game ID from event
      const gameCreatedEvent = receipt.logs.find(log => {
        try {
          const parsed = contract.interface.parseLog(log);
          return parsed.name === 'GameCreated';
        } catch (e) {
          return false;
        }
      });
      
      const actualGameId = gameCreatedEvent ? contract.interface.parseLog(gameCreatedEvent).args[0] : expectedGameId;
      console.log(`  ✅ Game ${actualGameId} created successfully!\n`);
      
    } catch (error) {
      console.log(`  ❌ Failed to create game: ${error.message}\n`);
    }
  }
  
  // Verify all games exist and can be retrieved
  console.log('🔍 Verifying All Games Can Be Retrieved:\n');
  
  const finalNextGameId = await contract.nextGameId();
  console.log(`📊 Final nextGameId: ${finalNextGameId} (total games: ${finalNextGameId - 1})\n`);
  
  for (let gameId = 1; gameId < finalNextGameId; gameId++) {
    try {
      console.log(`🔍 Testing Game ${gameId}:`);
      
      const gameData = await contract.getGame(gameId);
      console.log(`  ✅ Game ${gameId} exists:`);
      console.log(`    State: ${gameData[0]} (0=Setup, 1=InProgress, 2=Completed)`);
      console.log(`    Creator: ${gameData[1].slice(0,8)}...`);
      console.log(`    Max Players: ${gameData[2]}`);
      console.log(`    Current Players: ${gameData[7].length}`);
      console.log(`    Turn: ${gameData[4]}`);
      console.log(`    Scores: [${gameData[8].join(', ')}]`);
      
      // Test player data retrieval for creator
      const creatorAddress = gameData[1];
      const playerData = await contract.getPlayer(gameId, creatorAddress);
      console.log(`    Creator Hand: ${playerData[2].length} tiles`);
      console.log(`    Creator Score: ${playerData[1]}`);
      
      // Test placed tiles (this was part of the frontend issue)
      const placedTiles = await contract.getPlacedTiles(gameId);
      console.log(`    Tiles on Board: ${placedTiles[2].length}`);
      
      console.log('');
      
    } catch (error) {
      console.log(`  ❌ Game ${gameId} error: ${error.message}\n`);
    }
  }
  
  // Test the getAllGames equivalent functionality that frontend uses
  console.log('🔍 Testing Frontend-Style Data Retrieval:\n');
  console.log('  Simulating frontend getAllGames() function...\n');
  
  const allGames = [];
  const totalGames = Number(finalNextGameId) - 1;
  
  for (let i = 1; i <= totalGames; i++) {
    try {
      const gameData = await contract.getGame(i);
      
      // Transform to frontend format (matching BlockchainGame interface)
      const transformedGame = {
        id: i,
        state: Number(gameData[0]),
        creator: gameData[1],
        maxPlayers: Number(gameData[2]),
        currentPlayerIndex: Number(gameData[3]),
        turnNumber: Number(gameData[4]),
        playerAddresses: gameData[7],
        playerScores: gameData[8].map(score => Number(score)),
        createdAt: Number(gameData[5]),
        allowIslands: gameData[6],
        tilesRemaining: Number(gameData[9])
      };
      
      allGames.push(transformedGame);
      console.log(`  ✅ Game ${i} added to frontend array`);
      
    } catch (error) {
      console.log(`  ❌ Game ${i} failed to retrieve: ${error.message}`);
    }
  }
  
  console.log(`\n📊 Frontend getAllGames() Result:`);
  console.log(`  Total games found: ${allGames.length}`);
  console.log(`  Game IDs: [${allGames.map(g => g.id).join(', ')}]`);
  
  // Specifically test Game 4 (your problematic game)
  const game4 = allGames.find(g => g.id === 4);
  if (game4) {
    console.log(`\n🎯 Game 4 Specifically:`);
    console.log(`  ✅ Game 4 found!`);
    console.log(`  State: ${game4.state}`);
    console.log(`  Creator: ${game4.creator}`);
    console.log(`  Players: ${game4.playerAddresses.length}/${game4.maxPlayers}`);
    console.log(`  Turn: ${game4.turnNumber}`);
  } else {
    console.log(`\n❌ Game 4 NOT FOUND in frontend data!`);
  }
  
  console.log('\n🎉 Multi-Game Test Complete!');
  return { contractAddress, totalGames: allGames.length, games: allGames };
}

createTestGames()
  .then((result) => {
    console.log(`\n🏆 SUCCESS! Created ${result.totalGames} games on contract ${result.contractAddress}`);
    console.log(`🎯 Game 4 status: ${result.games.find(g => g.id === 4) ? 'FOUND' : 'NOT FOUND'}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Multi-game test failed:', error);
    process.exit(1);
  }); 