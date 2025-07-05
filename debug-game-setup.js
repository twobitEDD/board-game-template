#!/usr/bin/env node
/**
 * Comprehensive Game Setup Debugger
 * Tests contract connectivity, game creation, and ZeroDev integration
 */

console.log('🔍 === COMPREHENSIVE GAME SETUP DEBUGGER ===\n')

// Test 1: Frontend Contract Configuration
console.log('📋 1. FRONTEND CONTRACT CONFIGURATION')
console.log('=====================================')

const contractConfig = {
  "networks": {
    "1337": {
      "name": "Hardhat Local",
      "contractAddress": null,
      "active": false
    },
    "8453": {
      "name": "Base Mainnet", 
      "contractAddress": "0x80f80B22D1839F2216F7f7814398e7039Fc17546",
      "active": true
    },
    "84532": {
      "name": "Base Sepolia",
      "contractAddress": "0xa296A27561B207d235CA61DF3C2cBa431A0ad88C", 
      "active": true
    }
  },
  "defaultNetwork": "84532"
}

Object.entries(contractConfig.networks).forEach(([chainId, config]) => {
  const status = config.active ? '✅ ACTIVE' : '❌ INACTIVE'
  const contract = config.contractAddress || 'Not deployed'
  console.log(`  ${config.name} (${chainId}): ${status}`)
  console.log(`    Contract: ${contract}`)
})

console.log(`\n  🎯 Default Network: ${contractConfig.networks[contractConfig.defaultNetwork].name}`)
console.log(`  📄 Default Contract: ${contractConfig.networks[contractConfig.defaultNetwork].contractAddress}`)

// Test 2: Browser Debug Instructions
console.log('\n🌐 2. BROWSER DEBUGGING INSTRUCTIONS')
console.log('===================================')
console.log('Open your browser console and run these commands:')
console.log('')
console.log('// Check wallet connection and addresses')
console.log('console.log("Wallet connected:", !!window.primaryWallet)')
console.log('console.log("Display address:", window.primaryWallet?.address)')
console.log('console.log("Contract address:", window.contractInteractionAddress)')
console.log('')
console.log('// Check network detection')
console.log('console.log("Current network:", window.currentNetwork)')
console.log('console.log("Network name:", window.networkName)')
console.log('console.log("Contract address:", window.contractAddress)')
console.log('')
console.log('// Test ZeroDev detection')
console.log('const connector = window.primaryWallet?.connector')
console.log('const hasAAProvider = !!(connector?.getAccountAbstractionProvider)')
console.log('console.log("Is ZeroDev wallet:", hasAAProvider)')
console.log('')
console.log('// Check if you can read from contract')
console.log('// Go to /zerodev-test page and test wallet features')

// Test 3: Debugging Steps
console.log('\n🔧 3. SYSTEMATIC DEBUGGING STEPS')
console.log('================================')
console.log('')
console.log('Step 1: Test Wallet Connection')
console.log('  - Open your game at http://localhost:3000')
console.log('  - Connect your wallet (MetaMask, etc.)')
console.log('  - Check browser console for any connection errors')
console.log('  - Verify you see your wallet address in the UI')
console.log('')
console.log('Step 2: Test ZeroDev Integration')
console.log('  - Navigate to: http://localhost:3000/zerodev-test')
console.log('  - Click "Test ZeroDev Features"') 
console.log('  - Look for "Has AA Provider: Yes ✅" (ZeroDev wallets)')
console.log('  - Regular wallets will show "No ❌" (expected)')
console.log('')
console.log('Step 3: Test Network Detection')
console.log('  - Check the network picker in the games panel')
console.log('  - Verify it shows "Base Sepolia" as default')
console.log('  - Contract should show: 0xa296A...88C')
console.log('  - If wrong network, switch in your wallet')
console.log('')
console.log('Step 4: Test Game Creation')
console.log('  - Try creating a single-player game')
console.log('  - Watch browser console for transaction logs')
console.log('  - Look for "✅ Transaction confirmed" message')
console.log('  - Check if navigation happens after confirmation')
console.log('')
console.log('Step 5: Test Game Joining')
console.log('  - After creating, check if you appear in player list')
console.log('  - Look for "Your Contract Address" vs "Display Address"')
console.log('  - Both should match for regular wallets')
console.log('  - They will differ for ZeroDev wallets')

// Test 4: Common Issues & Solutions
console.log('\n❌ 4. COMMON ISSUES & SOLUTIONS')
console.log('==============================')
console.log('')
console.log('Issue: "Not your turn" error')
console.log('  Cause: Address mismatch between display and contract addresses')
console.log('  Solution: Check "Turn Status" debug section in game')
console.log('  - Your Display Address: Should match your wallet')
console.log('  - Your Contract Address: Should match what contract sees') 
console.log('  - Is ZeroDev: Shows if smart wallet is being used')
console.log('')
console.log('Issue: Game shows as "full" but you created it')
console.log('  Cause: Frontend not recognizing you as the creator')
console.log('  Solution: Check "ZeroDev-aware" debug logs in console')
console.log('  - Look for address comparison logs')
console.log('  - Verify actualContractAddress matches game.creator')
console.log('')
console.log('Issue: Transaction confirmed but navigation fails')
console.log('  Cause: ZeroDev userOpHash vs transaction hash confusion')
console.log('  Solution: Check console for "ZeroDev user operation bundled"')
console.log('  - Should see actual transaction hash extraction')
console.log('  - Navigation should happen after "✅ Game created successfully"')
console.log('')
console.log('Issue: Cannot read contract data')
console.log('  Cause: Network mismatch or RPC issues')
console.log('  Solution: Check network configuration')
console.log('  - Ensure wallet is on Base Sepolia (Chain ID: 84532)')
console.log('  - Try manual network refresh in games panel')
console.log('  - Check RPC connectivity in browser network tab')

// Test 5: Manual Testing Commands
console.log('\n⚙️ 5. MANUAL TESTING COMMANDS')
console.log('============================')
console.log('')
console.log('Test contract connection (copy to browser console):')
console.log('```javascript')
console.log('// Test if you can read from the contract')
console.log('fetch("https://sepolia.base.org", {')
console.log('  method: "POST",')
console.log('  headers: { "Content-Type": "application/json" },')
console.log('  body: JSON.stringify({')
console.log('    jsonrpc: "2.0",')
console.log('    method: "eth_call",')
console.log('    params: [{')
console.log('      to: "0xa296A27561B207d235CA61DF3C2cBa431A0ad88C",')
console.log('      data: "0x626c44ac" // nextGameId() function selector')
console.log('    }, "latest"],')
console.log('    id: 1')
console.log('  })')
console.log('})')
console.log('.then(r => r.json())')
console.log('.then(result => {')
console.log('  const nextGameId = parseInt(result.result, 16)')
console.log('  console.log("Next game ID:", nextGameId)')
console.log('  console.log("Contract is responsive:", !!result.result)')
console.log('})')
console.log('.catch(e => console.error("Contract connection failed:", e))')
console.log('```')

// Test 6: Expected Console Output
console.log('\n✅ 6. EXPECTED CONSOLE OUTPUT (When Working)')
console.log('===========================================')
console.log('')
console.log('Game Creation Success Pattern:')
console.log('  1. "🎮 Creating blockchain game..."')
console.log('  2. "⚡ Using ZeroDev sponsored transaction..." (if ZeroDev)')
console.log('  3. "📝 ZeroDev user operation sent: 0x..."') 
console.log('  4. "⏳ Waiting for ZeroDev user operation to be bundled..."')
console.log('  5. "✅ ZeroDev user operation bundled"')
console.log('  6. "🔗 Actual transaction hash from bundle: 0x..."')
console.log('  7. "✅ Transaction confirmed"')
console.log('  8. "✅ Game created successfully!"')
console.log('  9. Navigation to /game/[ID]/play')
console.log('')
console.log('Address Mapping (ZeroDev):')
console.log('  "🔍 Address mapping:"')
console.log('  "  eoaAddress: 0x123... (your wallet)"')
console.log('  "  smartWalletAddress: 0xabc... (contract sees this)"')
console.log('  "  isZeroDev: true"')
console.log('')
console.log('Turn Detection Success:')
console.log('  "🔍 TURN DETECTION DEBUG (ZeroDev-aware):"')
console.log('  "  Current Player Address: 0xabc..."')
console.log('  "  My Contract Address: 0xabc..."')
console.log('  "  Address Match (new way): true"')
console.log('  "  Is ZeroDev?: true"')

console.log('\n🎯 === DEBUGGING COMPLETE ===')
console.log('Follow the steps above systematically to identify the issue.')
console.log('Check browser console logs at each step for detailed debugging.')
console.log('If you find specific errors, share them for targeted assistance.') 