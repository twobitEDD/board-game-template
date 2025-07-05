const fs = require('fs');
const path = require('path');

const CONFIG_FILE = path.join(__dirname, '../contract-config.json');

/**
 * Load contract configuration
 */
function loadConfig() {
  try {
    const configData = fs.readFileSync(CONFIG_FILE, 'utf8');
    return JSON.parse(configData);
  } catch (error) {
    console.error('❌ Failed to load contract config:', error.message);
    return null;
  }
}

/**
 * Save contract configuration
 */
function saveConfig(config) {
  try {
    config.lastUpdated = new Date().toISOString();
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Failed to save contract config:', error.message);
    return false;
  }
}

/**
 * Get contract address for a specific chain ID
 */
function getContractAddress(chainId) {
  const config = loadConfig();
  if (!config) return null;
  
  const network = config.networks[chainId.toString()];
  if (!network) {
    console.warn(`⚠️ No configuration found for chain ID: ${chainId}`);
    return null;
  }
  
  if (!network.active) {
    console.warn(`⚠️ Network ${network.name} (${chainId}) is not active`);
    return null;
  }
  
  return network.contractAddress;
}

/**
 * Get network configuration for a specific chain ID
 */
function getNetworkConfig(chainId) {
  const config = loadConfig();
  if (!config) return null;
  
  const network = config.networks[chainId.toString()];
  if (!network) {
    console.warn(`⚠️ No configuration found for chain ID: ${chainId}`);
    return null;
  }
  
  return network;
}

/**
 * Update contract address for a specific chain ID
 */
function updateContractAddress(chainId, contractAddress, deploymentInfo = {}) {
  const config = loadConfig();
  if (!config) return false;
  
  const chainIdStr = chainId.toString();
  
  // Initialize network if it doesn't exist
  if (!config.networks[chainIdStr]) {
    config.networks[chainIdStr] = {
      name: `Chain ${chainId}`,
      rpcUrl: '',
      contractAddress: null,
      deployedAt: null,
      deployerAddress: null,
      blockNumber: null,
      gasUsed: null,
      verified: false,
      active: false
    };
  }
  
  // Update contract info
  config.networks[chainIdStr].contractAddress = contractAddress;
  config.networks[chainIdStr].deployedAt = deploymentInfo.deployedAt || new Date().toISOString();
  config.networks[chainIdStr].deployerAddress = deploymentInfo.deployerAddress || null;
  config.networks[chainIdStr].blockNumber = deploymentInfo.blockNumber || null;
  config.networks[chainIdStr].gasUsed = deploymentInfo.gasUsed || null;
  config.networks[chainIdStr].active = true;
  config.networks[chainIdStr].verified = deploymentInfo.verified || false;
  
  return saveConfig(config);
}

/**
 * List all active networks
 */
function listActiveNetworks() {
  const config = loadConfig();
  if (!config) return [];
  
  return Object.entries(config.networks)
    .filter(([_, network]) => network.active && network.contractAddress)
    .map(([chainId, network]) => ({
      chainId: parseInt(chainId),
      name: network.name,
      contractAddress: network.contractAddress,
      deployedAt: network.deployedAt
    }));
}

/**
 * Get the default network chain ID
 */
function getDefaultChainId() {
  const config = loadConfig();
  return config ? config.defaultNetwork : '1337';
}

/**
 * Set the default network
 */
function setDefaultNetwork(chainId) {
  const config = loadConfig();
  if (!config) return false;
  
  config.defaultNetwork = chainId.toString();
  return saveConfig(config);
}

/**
 * Verify that a contract exists at the given address
 */
async function verifyContract(chainId, contractAddress) {
  const network = getNetworkConfig(chainId);
  if (!network) return false;
  
  try {
    const response = await fetch(network.rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getCode',
        params: [contractAddress, 'latest'],
        id: 1
      })
    });
    
    const result = await response.json();
    
    if (result.error) {
      console.error(`❌ RPC error for chain ${chainId}:`, result.error.message);
      return false;
    }
    
    // Contract exists if it has code (not just '0x')
    const hasCode = result.result && result.result !== '0x' && result.result.length > 2;
    
    if (hasCode) {
      console.log(`✅ Contract verified at ${contractAddress} on ${network.name}`);
    } else {
      console.warn(`⚠️ No contract code found at ${contractAddress} on ${network.name}`);
    }
    
    return hasCode;
  } catch (error) {
    console.error(`❌ Failed to verify contract on chain ${chainId}:`, error.message);
    return false;
  }
}

/**
 * Display current configuration summary
 */
function displayConfig() {
  const config = loadConfig();
  if (!config) {
    console.log('❌ No configuration available');
    return;
  }
  
  console.log('\n📋 CONTRACT CONFIGURATION SUMMARY');
  console.log('=====================================');
  console.log(`🕒 Last Updated: ${config.lastUpdated}`);
  console.log(`🌐 Default Network: ${config.defaultNetwork}`);
  console.log(`📦 Version: ${config.version}`);
  
  console.log('\n🔗 NETWORKS:');
  Object.entries(config.networks).forEach(([chainId, network]) => {
    const status = network.active ? '🟢' : '🔴';
    const verified = network.verified ? '✅' : '⚠️';
    console.log(`  ${status} ${network.name} (Chain ID: ${chainId})`);
    if (network.contractAddress) {
      console.log(`     📄 Contract: ${network.contractAddress} ${verified}`);
      console.log(`     🌐 RPC: ${network.rpcUrl}`);
      if (network.deployedAt) {
        console.log(`     📅 Deployed: ${network.deployedAt}`);
      }
    } else {
      console.log(`     ❌ No contract deployed`);
    }
    console.log('');
  });
}

module.exports = {
  loadConfig,
  saveConfig,
  getContractAddress,
  getNetworkConfig,
  updateContractAddress,
  listActiveNetworks,
  getDefaultChainId,
  setDefaultNetwork,
  verifyContract,
  displayConfig
}; 