const { ethers } = require('hardhat')
const FivesGameABI = require('../artifacts/contracts/FivesGame.sol/FivesGame.json')

async function createMoreGames() {
  console.log('🎮 Adding more games to existing contract...')
  
  const contractAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3'
  
  try {
    const [deployer, player1, player2, player3, player4] = await ethers.getSigners()
    const contract = await ethers.getContractAt(FivesGameABI.abi, contractAddress, deployer)
    
    // Check current game count
    const currentNextGameId = await contract.nextGameId()
    console.log('📊 Current games on contract:', Number(currentNextGameId) - 1)
    
    const maxPlayers = 4
    const allowIslands = true
    const winningScore = 100
    
    // Create Game 3
    if (Number(currentNextGameId) <= 3) {
      console.log('🎯 Creating Game 3...')
      const tx3 = await contract.createGame(maxPlayers, allowIslands, winningScore, 'Alice')
      await tx3.wait()
      
      // Join with additional players
      const joinTx3_1 = await contract.connect(player1).joinGame(3, 'Bob')
      await joinTx3_1.wait()
      
      const joinTx3_2 = await contract.connect(player2).joinGame(3, 'Charlie')
      await joinTx3_2.wait()
      
      const joinTx3_3 = await contract.connect(player3).joinGame(3, 'David')
      await joinTx3_3.wait()
      
      console.log('✅ Game 3 created with 4 players')
    }
    
    // Create Game 4
    if (Number(currentNextGameId) <= 4) {
      console.log('🎯 Creating Game 4...')
      const tx4 = await contract.connect(player1).createGame(2, false, 80, 'Eve')
      await tx4.wait()
      
      const joinTx4 = await contract.connect(player2).joinGame(4, 'Frank')
      await joinTx4.wait()
      
      console.log('✅ Game 4 created with 2 players')
    }
    
    // Create Game 5
    if (Number(currentNextGameId) <= 5) {
      console.log('🎯 Creating Game 5...')
      const tx5 = await contract.connect(player2).createGame(3, true, 120, 'Grace')
      await tx5.wait()
      
      const joinTx5_1 = await contract.connect(player3).joinGame(5, 'Henry')
      await joinTx5_1.wait()
      
      const joinTx5_2 = await contract.connect(player4).joinGame(5, 'Ivy')
      await joinTx5_2.wait()
      
      console.log('✅ Game 5 created with 3 players')
    }
    
    // Final verification
    const finalNextGameId = await contract.nextGameId()
    const totalGames = Number(finalNextGameId) - 1
    
    console.log('\n🎉 SUCCESS! Contract now has', totalGames, 'games!')
    
    // Show all games
    for (let i = 1; i <= totalGames; i++) {
      const game = await contract.getGame(i)
      const states = ['Setup', 'InProgress', 'Completed', 'Cancelled']
      console.log(`🎯 Game ${i}: ${states[game.state]} | Players: ${game.playerAddresses.length}/${game.maxPlayers}`)
    }
    
    console.log('\n🌐 Gallery should now show all', totalGames, 'games!')
    console.log('📱 Visit: http://localhost:3002/gallery')
    
  } catch (error) {
    console.error('❌ Error creating games:', error.message)
  }
}

createMoreGames()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  }) 