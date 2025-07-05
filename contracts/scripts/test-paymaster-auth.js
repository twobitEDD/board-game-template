const { ethers } = require('hardhat');

async function testPaymasterAuthorization() {
  console.log('🧪 Testing Paymaster Authorization...\n');
  
  // Get accounts
  const [deployer, user1, user2, unauthorizedPaymaster, authorizedPaymaster] = await ethers.getSigners();
  
  console.log('👥 Test Accounts:');
  console.log(`  Deployer: ${deployer.address}`);
  console.log(`  User1: ${user1.address}`);  
  console.log(`  User2: ${user2.address}`);
  console.log(`  Unauthorized Paymaster: ${unauthorizedPaymaster.address}`);
  console.log(`  Authorized Paymaster: ${authorizedPaymaster.address}\n`);
  
  // Get the deployed contract
  const contractAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3'; // From recent deployment
  const FivesGame = await ethers.getContractFactory('FivesGame');
  const contract = FivesGame.attach(contractAddress);
  
  console.log(`📍 Using contract at: ${contractAddress}\n`);
  
  // Test 1: Check initial authorized paymasters
  console.log('🔍 Test 1: Check Initial Authorized Paymasters');
  const entryPointAuthorized = await contract.isAuthorizedPaymaster('0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789');
  const zerodivAuthorized = await contract.isAuthorizedPaymaster('0x0576a174D229E3cFA37253523E645A78A0C91B57');
  console.log(`  EntryPoint v0.6 authorized: ${entryPointAuthorized}`);
  console.log(`  ZeroDev Paymaster v1 authorized: ${zerodivAuthorized}\n`);
  
  // Test 2: Authorize our test paymaster
  console.log('🔍 Test 2: Authorize Test Paymaster');
  try {
    const authTx = await contract.connect(deployer).authorizePaymaster(authorizedPaymaster.address);
    await authTx.wait();
    console.log(`  ✅ Authorized paymaster: ${authorizedPaymaster.address}`);
    
    const isAuthorized = await contract.isAuthorizedPaymaster(authorizedPaymaster.address);
    console.log(`  ✅ Verification: ${isAuthorized}\n`);
  } catch (error) {
    console.log(`  ❌ Failed to authorize paymaster: ${error.message}\n`);
  }
  
  // Test 3: Direct user call (should work)
  console.log('🔍 Test 3: Direct User Call (user calls for themselves)');
  try {
    const createTx = await contract.connect(user1).createGame(
      2,           // maxPlayers
      false,       // allowIslands  
      1000,        // winningScore
      "User1",     // playerName
      user1.address // playerAddress (same as caller)
    );
    const receipt = await createTx.wait();
    const gameId = receipt.logs[0].args[0];
    console.log(`  ✅ Direct call successful! Game ID: ${gameId}\n`);
  } catch (error) {
    console.log(`  ❌ Direct call failed: ${error.message}\n`);
  }
  
  // Test 4: Authorized paymaster call (should work)
  console.log('🔍 Test 4: Authorized Paymaster Call');
  try {
    const createTx = await contract.connect(authorizedPaymaster).createGame(
      2,           // maxPlayers
      false,       // allowIslands
      1000,        // winningScore  
      "User2",     // playerName
      user2.address // playerAddress (different from caller)
    );
    const receipt = await createTx.wait();
    const gameId = receipt.logs[0].args[0];
    console.log(`  ✅ Authorized paymaster call successful! Game ID: ${gameId}\n`);
  } catch (error) {
    console.log(`  ❌ Authorized paymaster call failed: ${error.message}\n`);
  }
  
  // Test 5: Unauthorized paymaster call (should fail)
  console.log('🔍 Test 5: Unauthorized Paymaster Call (should fail)');
  try {
    const createTx = await contract.connect(unauthorizedPaymaster).createGame(
      2,           // maxPlayers
      false,       // allowIslands
      1000,        // winningScore
      "User2",     // playerName  
      user2.address // playerAddress (different from caller)
    );
    await createTx.wait();
    console.log(`  ❌ SECURITY ISSUE: Unauthorized call succeeded when it should have failed!\n`);
  } catch (error) {
    console.log(`  ✅ Unauthorized call correctly failed: ${error.message}\n`);
  }
  
  // Test 6: Test joinGame with same logic
  console.log('🔍 Test 6: Test joinGame Authorization');
  
  // First create a game as user1
  const createTx = await contract.connect(user1).createGame(2, false, 1000, "Host", user1.address);
  const receipt = await createTx.wait();
  const gameId = receipt.logs[0].args[0];
  console.log(`  Created test game ${gameId} for join testing`);
  
  // Try unauthorized join (should fail)
  try {
    await contract.connect(unauthorizedPaymaster).joinGame(gameId, "Unauthorized", user2.address);
    console.log(`  ❌ SECURITY ISSUE: Unauthorized join succeeded!`);
  } catch (error) {
    console.log(`  ✅ Unauthorized join correctly failed: ${error.message}`);
  }
  
  // Try authorized join (should work)
  try {
    const joinTx = await contract.connect(authorizedPaymaster).joinGame(gameId, "Authorized", user2.address);
    await joinTx.wait();
    console.log(`  ✅ Authorized join succeeded!`);
  } catch (error) {
    console.log(`  ❌ Authorized join failed: ${error.message}`);
  }
  
  // Test 7: Test non-owner trying to authorize paymaster (should fail)
  console.log('\n🔍 Test 7: Non-owner Authorization Attempt (should fail)');
  try {
    await contract.connect(user1).authorizePaymaster(user2.address);
    console.log(`  ❌ SECURITY ISSUE: Non-owner authorization succeeded!`);
  } catch (error) {
    console.log(`  ✅ Non-owner authorization correctly failed: ${error.message}`);
  }
  
  // Test 8: Summary of all games
  console.log('\n🔍 Test 8: Game Summary');
  try {
    const nextGameId = await contract.nextGameId();
    console.log(`  Total games created: ${nextGameId - 1}`);
    
    for (let i = 1; i < nextGameId; i++) {
      try {
        const game = await contract.getGame(i);
        console.log(`  Game ${i}: state=${game[0]}, creator=${game[1].slice(0,8)}..., players=${game[7].length}`);
      } catch (e) {
        console.log(`  Game ${i}: Error reading game data`);
      }
    }
  } catch (error) {
    console.log(`  ❌ Failed to get game summary: ${error.message}`);
  }
  
  console.log('\n🎉 Paymaster Authorization Testing Complete!');
}

// Run the test
testPaymasterAuthorization()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }); 