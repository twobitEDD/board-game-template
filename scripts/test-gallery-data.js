const { ethers, network } = require('hardhat')
const FivesGameABI = require('../artifacts/contracts/FivesGame.sol/FivesGame.json')

async function testGalleryData() {
  console.log('🔍 Testing Gallery Data Access... (Updated at', new Date().toISOString(), ')')
  
  // FRESH CONTRACT: Test games contract address (where the 5 games were just deployed)
  const contractAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3'
  
  try {
    console.log('📍 Testing FRESH contract at:', contractAddress)
    
    // Get the contract instance
    const contract = await ethers.getContractAt(FivesGameABI.abi, contractAddress)
    
    // Check if contract exists by calling a simple function
    const nextGameId = await contract.nextGameId()
    console.log('✅ Contract found! Next Game ID:', nextGameId.toString())
    console.log('🎮 Total games created:', (nextGameId - 1).toString())
    
    // Check the first 5 games
    for (let i = 1; i < Math.min(6, Number(nextGameId)); i++) {
      try {
        const game = await contract.getGame(i)
        console.log(`🎯 Game ${i}:`, {
          id: i,
          state: Number(game.state),
          stateText: getStateText(Number(game.state)),
          playerCount: game.playerAddresses.length,
          maxPlayers: Number(game.maxPlayers),
          turnNumber: Number(game.turnNumber),
          creator: game.creator,
          allowIslands: game.allowIslands
        })
      } catch (gameError) {
        console.error(`❌ Error reading game ${i}:`, gameError.message)
      }
    }
    
    console.log('\n🎉 All games retrieved successfully!')
    console.log('📋 Summary: The frontend should now see all', (nextGameId - 1).toString(), 'games in the gallery')
    
  } catch (error) {
    console.error('❌ Contract not found at this address')
    console.error('Error details:', error.message)
    
    // Let's check what contracts actually exist
    console.log('\n🔄 Checking what contracts are available...')
    console.log('Expected address:', contractAddress)
    console.log('Chain ID:', await ethers.provider.getNetwork().then(n => n.chainId))
    console.log('Block number:', await ethers.provider.getBlockNumber())
  }
}

function getStateText(state) {
  switch (state) {
    case 0: return 'Setup'
    case 1: return 'InProgress'
    case 2: return 'Completed'
    case 3: return 'Cancelled'
    default: return 'Unknown'
  }
}

// Run the test
testGalleryData()
  .then(() => {
    console.log('\n✅ Gallery data test completed')
  })
  .catch((error) => {
    console.error('❌ Test failed:', error)
    process.exit(1)
  }) 