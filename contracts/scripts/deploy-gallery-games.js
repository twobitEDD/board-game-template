const { ethers } = require("hardhat");

async function main() {
  console.log("🎮 Creating Gallery Games with Visible Tiles (Atomic Deployment)");
  
  // Deploy fresh contract
  console.log("🚀 Deploying FivesGame contract...");
  const FivesGame = await ethers.getContractFactory("FivesGame");
  const contract = await FivesGame.deploy();
  await contract.waitForDeployment();
  
  const contractAddress = await contract.getAddress();
  console.log("✅ Contract deployed:", contractAddress);
  
  // Get signers
  const [deployer, p1, p2, p3] = await ethers.getSigners();
  
  // Helper function to get player hand
  async function getPlayerHand(gameId, playerAddr) {
    const player = await contract.getPlayer(gameId, playerAddr);
    return player[2]; // hand is index 2
  }
  
  // Game 1: Cross Pattern using actual tiles
  console.log("\n🎯 Game 1: Cross Pattern (using actual tiles)");
  await contract.createGame(2, true, 1000, "Cross Pattern");
  await contract.connect(p1).joinGame(1, "Cross Player");
  
  // Place tiles using what players actually have
  try {
    let hand1 = await getPlayerHand(1, deployer.address);
    console.log("Deployer hand:", hand1.map(n => Number(n)));
    if (hand1.length > 0) {
      await contract.playTurn(1, [{number: Number(hand1[0]), x: 7, y: 7}]); // center
    }
    
    let hand2 = await getPlayerHand(1, p1.address);
    console.log("P1 hand:", hand2.map(n => Number(n)));
    if (hand2.length >= 2) {
      await contract.connect(p1).playTurn(1, [
        {number: Number(hand2[0]), x: 6, y: 7}, 
        {number: Number(hand2[1]), x: 8, y: 7}
      ]);
    }
    
    hand1 = await getPlayerHand(1, deployer.address);
    if (hand1.length >= 2) {
      await contract.playTurn(1, [
        {number: Number(hand1[0]), x: 7, y: 6}, 
        {number: Number(hand1[1]), x: 7, y: 8}
      ]);
    }
    
    hand2 = await getPlayerHand(1, p1.address);
    if (hand2.length >= 2) {
      await contract.connect(p1).playTurn(1, [
        {number: Number(hand2[0]), x: 5, y: 7}, 
        {number: Number(hand2[1]), x: 9, y: 7}
      ]);
    }
    
    hand1 = await getPlayerHand(1, deployer.address);
    if (hand1.length >= 2) {
      await contract.playTurn(1, [
        {number: Number(hand1[0]), x: 7, y: 5}, 
        {number: Number(hand1[1]), x: 7, y: 9}
      ]);
    }
    
    const tiles1 = await contract.getPlacedTiles(1);
    console.log(`✅ Cross pattern: ${tiles1[0].length} tiles`);
  } catch (error) {
    console.log("⚠️ Cross pattern partial:", error.message.split(' ')[0]);
  }
  
  // Game 2: L-Shape using actual tiles
  console.log("\n🎯 Game 2: L-Shape Pattern");
  await contract.createGame(3, true, 1200, "L-Shape");
  await contract.connect(p1).joinGame(2, "L Player 1");
  await contract.connect(p2).joinGame(2, "L Player 2");
  
  try {
    let hand = await getPlayerHand(2, deployer.address);
    if (hand.length >= 3) {
      await contract.playTurn(2, [
        {number: Number(hand[0]), x: 7, y: 7}, 
        {number: Number(hand[1]), x: 8, y: 7}, 
        {number: Number(hand[2]), x: 9, y: 7}
      ]);
    }
    
    hand = await getPlayerHand(2, p1.address);
    if (hand.length >= 2) {
      await contract.connect(p1).playTurn(2, [
        {number: Number(hand[0]), x: 7, y: 8}, 
        {number: Number(hand[1]), x: 7, y: 9}
      ]);
    }
    
    hand = await getPlayerHand(2, p2.address);
    if (hand.length >= 2) {
      await contract.connect(p2).playTurn(2, [
        {number: Number(hand[0]), x: 10, y: 7}, 
        {number: Number(hand[1]), x: 11, y: 7}
      ]);
    }
    
    hand = await getPlayerHand(2, deployer.address);
    if (hand.length >= 2) {
      await contract.playTurn(2, [
        {number: Number(hand[0]), x: 7, y: 10}, 
        {number: Number(hand[1]), x: 7, y: 11}
      ]);
    }
    
    const tiles2 = await contract.getPlacedTiles(2);
    console.log(`✅ L-shape: ${tiles2[0].length} tiles`);
  } catch (error) {
    console.log("⚠️ L-shape partial:", error.message.split(' ')[0]);
  }
  
  // Game 3: Diamond Pattern
  console.log("\n🎯 Game 3: Diamond Pattern");
  await contract.createGame(2, true, 800, "Diamond");
  await contract.connect(p1).joinGame(3, "Diamond Player");
  
  try {
    let hand = await getPlayerHand(3, deployer.address);
    if (hand.length >= 1) {
      await contract.playTurn(3, [{number: Number(hand[0]), x: 7, y: 7}]); // center
    }
    
    hand = await getPlayerHand(3, p1.address);
    if (hand.length >= 2) {
      await contract.connect(p1).playTurn(3, [
        {number: Number(hand[0]), x: 6, y: 7}, 
        {number: Number(hand[1]), x: 8, y: 7}
      ]);
    }
    
    hand = await getPlayerHand(3, deployer.address);
    if (hand.length >= 2) {
      await contract.playTurn(3, [
        {number: Number(hand[0]), x: 7, y: 6}, 
        {number: Number(hand[1]), x: 7, y: 8}
      ]);
    }
    
    hand = await getPlayerHand(3, p1.address);
    if (hand.length >= 2) {
      await contract.connect(p1).playTurn(3, [
        {number: Number(hand[0]), x: 6, y: 6}, 
        {number: Number(hand[1]), x: 8, y: 8}
      ]);
    }
    
    const tiles3 = await contract.getPlacedTiles(3);
    console.log(`✅ Diamond: ${tiles3[0].length} tiles`);
  } catch (error) {
    console.log("⚠️ Diamond partial:", error.message.split(' ')[0]);
  }
  
  // Game 4: Setup game (no tiles)
  console.log("\n🎯 Game 4: Setup Game");
  await contract.createGame(4, false, 1500, "Setup Game");
  await contract.connect(p1).joinGame(4, "Setup Player");
  // Leave in setup state
  
  const tiles4 = await contract.getPlacedTiles(4);
  console.log(`✅ Setup game: ${tiles4[0].length} tiles (empty for contrast)`);
  
  // Game 5: Dense grid
  console.log("\n🎯 Game 5: Dense Grid");
  await contract.createGame(2, true, 2000, "Dense Grid");
  await contract.connect(p1).joinGame(5, "Grid Player");
  
  try {
    // Place multiple turns to create dense pattern
    for (let turn = 0; turn < 6; turn++) {
      const isP1Turn = turn % 2 === 1;
      const player = isP1Turn ? p1 : deployer;
      const hand = await getPlayerHand(5, player.address);
      
      if (hand.length >= 2) {
        const x = 6 + (turn % 3);
        const y = 6 + Math.floor(turn / 3);
        
        const contractPlayer = isP1Turn ? contract.connect(p1) : contract;
        await contractPlayer.playTurn(5, [
          {number: Number(hand[0]), x: x, y: y}, 
          {number: Number(hand[1]), x: x + 1, y: y}
        ]);
      }
    }
    
    const tiles5 = await contract.getPlacedTiles(5);
    console.log(`✅ Dense grid: ${tiles5[0].length} tiles`);
  } catch (error) {
    console.log("⚠️ Dense grid partial:", error.message.split(' ')[0]);
  }
  
  // Get final counts
  const finalTiles = [];
  for (let i = 1; i <= 5; i++) {
    const tiles = await contract.getPlacedTiles(i);
    finalTiles.push(tiles[0].length);
  }
  
  // Summary
  console.log(`\n📊 GALLERY GAMES SUMMARY:`);
  console.log(`=========================`);
  console.log(`Contract: ${contractAddress}`);
  console.log(`Game 1 (Cross): ${finalTiles[0]} tiles`);
  console.log(`Game 2 (L-Shape): ${finalTiles[1]} tiles`);
  console.log(`Game 3 (Diamond): ${finalTiles[2]} tiles`);
  console.log(`Game 4 (Setup): ${finalTiles[3]} tiles`);
  console.log(`Game 5 (Dense): ${finalTiles[4]} tiles`);
  console.log(`\n🎉 Gallery should now show rich board previews!`);
  console.log(`🔗 Test: http://localhost:3001/gallery`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 