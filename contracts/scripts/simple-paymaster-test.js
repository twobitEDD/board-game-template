const { ethers } = require('hardhat');

async function simplePaymasterTest() {
  console.log('🧪 Simple Paymaster Authorization Test\n');
  
  // Get accounts
  const [deployer, user1, paymaster] = await ethers.getSigners();
  
  console.log('👥 Accounts:');
  console.log(`  Deployer: ${deployer.address}`);
  console.log(`  User: ${user1.address}`);
  console.log(`  Test Paymaster: ${paymaster.address}\n`);
  
  // Deploy fresh contract
  const FivesGame = await ethers.getContractFactory('FivesGame');
  const contract = await FivesGame.deploy();
  await contract.waitForDeployment();
  
  const contractAddress = await contract.getAddress();
  console.log(`📍 Fresh Contract: ${contractAddress}\n`);
  
  console.log('🔍 Test 1: Check Initial State');
  const entryPointAuth = await contract.isAuthorizedPaymaster('0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789');
  console.log(`  EntryPoint authorized: ${entryPointAuth}`);
  
  const ownerAddress = await contract.owner();
  console.log(`  Contract owner: ${ownerAddress}\n`);
  
  console.log('🔍 Test 2: Authorize Test Paymaster');
  const authTx = await contract.connect(deployer).authorizePaymaster(paymaster.address);
  await authTx.wait();
  
  const isAuth = await contract.isAuthorizedPaymaster(paymaster.address);
  console.log(`  Test paymaster authorized: ${isAuth}\n`);
  
  console.log('🔍 Test 3: Direct User Call');
  try {
    const createTx = await contract.connect(user1).createGame(
      2,              // maxPlayers
      false,          // allowIslands
      1000,           // winningScore
      "Direct User",  // playerName
      user1.address   // playerAddress (same as caller)
    );
    const receipt = await createTx.wait();
    
    // Find the GameCreated event
    const gameCreatedEvent = receipt.logs.find(log => {
      try {
        const parsed = contract.interface.parseLog(log);
        return parsed.name === 'GameCreated';
      } catch (e) {
        return false;
      }
    });
    
    if (gameCreatedEvent) {
      const parsed = contract.interface.parseLog(gameCreatedEvent);
      console.log(`  ✅ Direct call successful! Game ID: ${parsed.args[0]}\n`);
    } else {
      console.log(`  ✅ Direct call successful! (No event found)\n`);
    }
  } catch (error) {
    console.log(`  ❌ Direct call failed: ${error.message}\n`);
  }
  
  console.log('🔍 Test 4: Authorized Paymaster Call');
  try {
    const createTx = await contract.connect(paymaster).createGame(
      2,              // maxPlayers
      false,          // allowIslands
      1000,           // winningScore
      "Via Paymaster", // playerName
      user1.address   // playerAddress (different from caller)
    );
    const receipt = await createTx.wait();
    
    const gameCreatedEvent = receipt.logs.find(log => {
      try {
        const parsed = contract.interface.parseLog(log);
        return parsed.name === 'GameCreated';
      } catch (e) {
        return false;
      }
    });
    
    if (gameCreatedEvent) {
      const parsed = contract.interface.parseLog(gameCreatedEvent);
      console.log(`  ✅ Paymaster call successful! Game ID: ${parsed.args[0]}\n`);
    } else {
      console.log(`  ✅ Paymaster call successful! (No event found)\n`);
    }
  } catch (error) {
    console.log(`  ❌ Paymaster call failed: ${error.message}\n`);
  }
  
  console.log('🔍 Test 5: Unauthorized Call (should fail)');
  try {
    await contract.connect(user1).createGame(
      2,              // maxPlayers
      false,          // allowIslands
      1000,           // winningScore
      "Unauthorized", // playerName
      paymaster.address // playerAddress (different from caller, and caller not authorized)
    );
    console.log(`  ❌ SECURITY ISSUE: Unauthorized call succeeded!\n`);
  } catch (error) {
    console.log(`  ✅ Unauthorized call correctly failed: ${error.message}\n`);
  }
  
  console.log('🔍 Test 6: Game Summary');
  try {
    const nextGameId = await contract.nextGameId();
    console.log(`  Total games: ${nextGameId - 1}`);
    
    for (let i = 1; i < nextGameId; i++) {
      const game = await contract.getGame(i);
      console.log(`  Game ${i}: creator=${game[1].slice(0,8)}..., players=${game[7].length}`);
    }
  } catch (error) {
    console.log(`  ❌ Failed to get games: ${error.message}`);
  }
  
  console.log('\n🎉 Paymaster Test Complete!');
}

simplePaymasterTest()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }); 