#!/usr/bin/env node

const contractConfig = require('./contract-config');

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0];

async function main() {
  switch (command) {
    case 'show':
    case 'list':
    case 'display':
      contractConfig.displayConfig();
      break;
      
    case 'get':
      if (args.length < 2) {
        console.log('❌ Usage: node manage-config.js get <chainId>');
        break;
      }
      const chainId = args[1];
      const address = contractConfig.getContractAddress(chainId);
      if (address) {
        console.log(`📄 Contract address for chain ${chainId}: ${address}`);
      } else {
        console.log(`❌ No contract found for chain ${chainId}`);
      }
      break;
      
    case 'set':
    case 'update':
      if (args.length < 3) {
        console.log('❌ Usage: node manage-config.js set <chainId> <contractAddress> [deployerAddress]');
        break;
      }
      const setChainId = args[1];
      const setAddress = args[2];
      const deployerAddress = args[3] || null;
      
      const deploymentInfo = {
        deployerAddress,
        deployedAt: new Date().toISOString(),
        verified: false
      };
      
      const success = contractConfig.updateContractAddress(setChainId, setAddress, deploymentInfo);
      if (success) {
        console.log(`✅ Updated contract address for chain ${setChainId}: ${setAddress}`);
      } else {
        console.log(`❌ Failed to update contract address`);
      }
      break;
      
    case 'verify':
      if (args.length < 2) {
        console.log('❌ Usage: node manage-config.js verify <chainId> [contractAddress]');
        break;
      }
      const verifyChainId = args[1];
      let verifyAddress = args[2];
      
      if (!verifyAddress) {
        verifyAddress = contractConfig.getContractAddress(verifyChainId);
      }
      
      if (!verifyAddress) {
        console.log(`❌ No contract address found for chain ${verifyChainId}`);
        break;
      }
      
      console.log(`🔍 Verifying contract at ${verifyAddress} on chain ${verifyChainId}...`);
      const isValid = await contractConfig.verifyContract(verifyChainId, verifyAddress);
      
      if (isValid) {
        console.log(`✅ Contract verification successful`);
      } else {
        console.log(`❌ Contract verification failed`);
      }
      break;
      
    case 'active':
    case 'networks':
      const activeNetworks = contractConfig.listActiveNetworks();
      console.log('\n🌐 ACTIVE NETWORKS:');
      console.log('==================');
      if (activeNetworks.length === 0) {
        console.log('❌ No active networks found');
      } else {
        activeNetworks.forEach(network => {
          console.log(`🟢 ${network.name} (Chain ID: ${network.chainId})`);
          console.log(`   📄 Contract: ${network.contractAddress}`);
          console.log(`   📅 Deployed: ${network.deployedAt}`);
          console.log('');
        });
      }
      break;
      
    case 'default':
      if (args.length < 2) {
        const defaultChainId = contractConfig.getDefaultChainId();
        console.log(`🌐 Default network: Chain ID ${defaultChainId}`);
      } else {
        const newDefaultChainId = args[1];
        const success = contractConfig.setDefaultNetwork(newDefaultChainId);
        if (success) {
          console.log(`✅ Set default network to Chain ID ${newDefaultChainId}`);
        } else {
          console.log(`❌ Failed to set default network`);
        }
      }
      break;
      
    case 'help':
    case '--help':
    case '-h':
    default:
      console.log(`
📋 CONTRACT CONFIGURATION MANAGER
================================

USAGE:
  node manage-config.js <command> [options]

COMMANDS:
  show                              Display current configuration
  get <chainId>                     Get contract address for chain ID
  set <chainId> <address> [deployer] Update contract address for chain ID
  verify <chainId> [address]        Verify contract exists on chain
  active                            List all active networks
  default [chainId]                 Get/set default network
  help                              Show this help message

EXAMPLES:
  node manage-config.js show                           # Show full config
  node manage-config.js get 1337                       # Get Hardhat contract address
  node manage-config.js set 1337 0x123... 0xabc...     # Set Hardhat contract
  node manage-config.js verify 1337                    # Verify Hardhat contract
  node manage-config.js active                         # List active networks
  node manage-config.js default 8453                   # Set Base as default
      `);
      break;
  }
}

// Run the CLI
main().catch(error => {
  console.error('❌ CLI Error:', error.message);
  process.exit(1);
}); 