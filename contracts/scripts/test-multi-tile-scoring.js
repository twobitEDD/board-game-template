const hre = require("hardhat");

async function main() {
  console.log("🎯 MULTI-TILE SCORING TEST");
  console.log("=" .repeat(50));
  
  const [deployer] = await hre.ethers.getSigners();
  const FivesGame = await hre.ethers.getContractFactory("FivesGame");
  
  // Deploy new contract
  console.log("🏗️ Deploying contract...");
  const contract = await FivesGame.deploy();
  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();
  console.log(`✅ Contract deployed: ${contractAddress}`);
  
  // Create game
  console.log("\n🎮 Creating single player game...");
  const createTx = await contract.createGame(
    1, // maxPlayers
    false, // allowIslands
    1000, // winningScore
    "Test Player", // playerName
    deployer.address // playerAddress
  );
  await createTx.wait();
  
  // Start game to deal tiles
  console.log("🚀 Starting game to deal tiles...");
  const startTx = await contract.startGame(1);
  await startTx.wait();
  
  // Get player hand
  const playerData = await contract.getPlayer(1, deployer.address);
  const hand = playerData[2].map(n => Number(n));
  console.log(`🃏 Player hand: [${hand.join(', ')}]`);
  
  // Test 1: Place multiple tiles in one turn that sum to multiple of 5
  console.log("\n📍 TEST 1: Place multiple tiles in one turn (sum = 10)");
  
  // Find two tiles that sum to 10
  let tile1 = null, tile2 = null;
  for (let i = 0; i < hand.length; i++) {
    for (let j = i + 1; j < hand.length; j++) {
      if (hand[i] + hand[j] === 10) {
        tile1 = hand[i];
        tile2 = hand[j];
        break;
      }
    }
    if (tile1 !== null) break;
  }
  
  // If no pair sums to 10, try 5
  if (tile1 === null) {
    for (let i = 0; i < hand.length; i++) {
      for (let j = i + 1; j < hand.length; j++) {
        if (hand[i] + hand[j] === 5) {
          tile1 = hand[i];
          tile2 = hand[j];
          break;
        }
      }
      if (tile1 !== null) break;
    }
  }
  
  // If still no pair, try 15
  if (tile1 === null) {
    for (let i = 0; i < hand.length; i++) {
      for (let j = i + 1; j < hand.length; j++) {
        if (hand[i] + hand[j] === 15) {
          tile1 = hand[i];
          tile2 = hand[j];
          break;
        }
      }
      if (tile1 !== null) break;
    }
  }
  
  if (tile1 !== null && tile2 !== null) {
    const sum = tile1 + tile2;
    console.log(`  Placing tiles ${tile1} and ${tile2} (sum = ${sum}, expected score = ${sum * 10})...`);
    
    try {
      const tx1 = await contract.playTurn(1, [
        { number: tile1, x: 7, y: 7 },  // Center
        { number: tile2, x: 8, y: 7 }   // Adjacent
      ]);
      await tx1.wait();
      console.log(`  ✅ SUCCESS: Multi-tile placement accepted!`);
      
      // Check score
      const updatedPlayerData = await contract.getPlayer(1, deployer.address);
      const score = Number(updatedPlayerData[1]);
      console.log(`  🎯 Player score: ${score} points (expected: ${sum * 10})`);
      
      if (score === sum * 10) {
        console.log(`  ✅ SCORING CORRECT!`);
      } else {
        console.log(`  ❌ SCORING INCORRECT!`);
      }
      
    } catch (error) {
      console.log(`  ❌ FAILED: ${error.message}`);
    }
  } else {
    console.log(`  ⚠️ No tiles in hand sum to 5, 10, or 15`);
    console.log(`  💡 Available sums:`);
    for (let i = 0; i < hand.length; i++) {
      for (let j = i + 1; j < hand.length; j++) {
        console.log(`    ${hand[i]} + ${hand[j]} = ${hand[i] + hand[j]}`);
      }
    }
  }
  
  // Test 2: Place three tiles that sum to multiple of 5
  console.log("\n📍 TEST 2: Place three tiles in one turn");
  
  const updatedPlayerData2 = await contract.getPlayer(1, deployer.address);
  const updatedHand = updatedPlayerData2[2].map(n => Number(n));
  console.log(`  Current hand: [${updatedHand.join(', ')}]`);
  
  // Find three tiles that sum to multiple of 5
  let tile3 = null, tile4 = null, tile5 = null;
  for (let i = 0; i < updatedHand.length; i++) {
    for (let j = i + 1; j < updatedHand.length; j++) {
      for (let k = j + 1; k < updatedHand.length; k++) {
        const sum3 = updatedHand[i] + updatedHand[j] + updatedHand[k];
        if (sum3 % 5 === 0) {
          tile3 = updatedHand[i];
          tile4 = updatedHand[j];
          tile5 = updatedHand[k];
          break;
        }
      }
      if (tile3 !== null) break;
    }
    if (tile3 !== null) break;
  }
  
  if (tile3 !== null && tile4 !== null && tile5 !== null) {
    const sum3 = tile3 + tile4 + tile5;
    console.log(`  Placing tiles ${tile3}, ${tile4}, ${tile5} (sum = ${sum3}, expected score = ${sum3 * 10})...`);
    
    try {
      const tx2 = await contract.playTurn(1, [
        { number: tile3, x: 7, y: 8 },  // Below center
        { number: tile4, x: 7, y: 9 },  // Below that
        { number: tile5, x: 7, y: 10 }  // Below that
      ]);
      await tx2.wait();
      console.log(`  ✅ SUCCESS: 3-tile placement accepted!`);
      
      // Check score
      const finalPlayerData = await contract.getPlayer(1, deployer.address);
      const previousScore = Number(updatedPlayerData2[1]);
      const newScore = Number(finalPlayerData[1]);
      const scoreGained = newScore - previousScore;
      console.log(`  🎯 Score gained: ${scoreGained} points (expected: ${sum3 * 10})`);
      
      if (scoreGained === sum3 * 10) {
        console.log(`  ✅ SCORING CORRECT!`);
      } else {
        console.log(`  ❌ SCORING INCORRECT!`);
      }
      
    } catch (error) {
      console.log(`  ❌ FAILED: ${error.message}`);
    }
  } else {
    console.log(`  ⚠️ No 3-tile combination sums to multiple of 5`);
  }
  
  // Test 3: Try invalid sequence
  console.log("\n📍 TEST 3: Try invalid sequence (should be rejected)");
  
  const finalPlayerData = await contract.getPlayer(1, deployer.address);
  const finalHand = finalPlayerData[2].map(n => Number(n));
  console.log(`  Current hand: [${finalHand.join(', ')}]`);
  
  if (finalHand.length >= 2) {
    // Find two tiles that DON'T sum to multiple of 5
    let invalidTile1 = null, invalidTile2 = null;
    for (let i = 0; i < finalHand.length; i++) {
      for (let j = i + 1; j < finalHand.length; j++) {
        if ((finalHand[i] + finalHand[j]) % 5 !== 0) {
          invalidTile1 = finalHand[i];
          invalidTile2 = finalHand[j];
          break;
        }
      }
      if (invalidTile1 !== null) break;
    }
    
    if (invalidTile1 !== null && invalidTile2 !== null) {
      const invalidSum = invalidTile1 + invalidTile2;
      console.log(`  Trying invalid sequence: ${invalidTile1} + ${invalidTile2} = ${invalidSum} (NOT multiple of 5)...`);
      
      try {
        const tx3 = await contract.playTurn(1, [
          { number: invalidTile1, x: 6, y: 7 },  // Left of center
          { number: invalidTile2, x: 5, y: 7 }   // Left of that
        ]);
        await tx3.wait();
        console.log(`  ❌ UNEXPECTED: Invalid sequence was accepted! This is a bug.`);
      } catch (error) {
        console.log(`  ✅ SUCCESS: Invalid sequence correctly rejected!`);
        console.log(`  📋 Reason: ${error.message}`);
      }
    } else {
      console.log(`  ⚠️ All remaining tile pairs sum to multiples of 5`);
    }
  }
  
  console.log("\n🎉 MULTI-TILE SCORING TEST COMPLETE!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Test failed:", error);
    process.exit(1);
  }); 