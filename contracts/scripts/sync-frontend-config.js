#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const contractConfig = require('./contract-config');

const BACKEND_CONFIG_FILE = path.join(__dirname, '../contract-config.json');
const FRONTEND_CONFIG_FILE = path.join(__dirname, '../../app/src/config/contractConfig.ts');

function generateFrontendConfig(backendConfig) {
  const configJson = JSON.stringify(backendConfig, null, 2);
  
  return `// Contract configuration - sync with contracts/contract-config.json
export interface NetworkConfig {
  name: string;
  rpcUrl: string;
  contractAddress: string | null;
  deployedAt: string | null;
  deployerAddress: string | null;
  blockNumber: number | null;
  gasUsed: string | null;
  verified: boolean;
  active: boolean;
}

export interface ContractConfig {
  networks: Record<string, NetworkConfig>;
  defaultNetwork: string;
  lastUpdated: string;
  version: string;
}

// IMPORTANT: Keep this synchronized with contracts/contract-config.json
// You can update this by running: node scripts/sync-frontend-config.js
// Last synced: ${new Date().toISOString()}
export const CONTRACT_CONFIG: ContractConfig = ${configJson};

/**
 * Get contract address for a specific chain ID
 */
export function getContractAddress(chainId: number | string): string | null {
  const network = CONTRACT_CONFIG.networks[chainId.toString()];
  if (!network) {
    console.warn(\`⚠️ No configuration found for chain ID: \${chainId}\`);
    return null;
  }
  
  if (!network.active) {
    console.warn(\`⚠️ Network \${network.name} (\${chainId}) is not active\`);
    return null;
  }
  
  return network.contractAddress;
}

/**
 * Get network configuration for a specific chain ID
 */
export function getNetworkConfig(chainId: number | string): NetworkConfig | null {
  const network = CONTRACT_CONFIG.networks[chainId.toString()];
  if (!network) {
    console.warn(\`⚠️ No configuration found for chain ID: \${chainId}\`);
    return null;
  }
  
  return network;
}

/**
 * List all active networks
 */
export function listActiveNetworks(): Array<{
  chainId: number;
  name: string;
  contractAddress: string;
  deployedAt: string | null;
}> {
  return Object.entries(CONTRACT_CONFIG.networks)
    .filter(([_, network]) => network.active && network.contractAddress)
    .map(([chainId, network]) => ({
      chainId: parseInt(chainId),
      name: network.name,
      contractAddress: network.contractAddress!,
      deployedAt: network.deployedAt
    }));
}

/**
 * Get the default network chain ID
 */
export function getDefaultChainId(): string {
  return CONTRACT_CONFIG.defaultNetwork;
}

/**
 * Get all RPC URLs for a network (with fallbacks)
 */
export function getRpcUrls(chainId: number | string): string[] {
  const network = getNetworkConfig(chainId);
  if (!network) return [];
  
  // For now, return single RPC URL, but this can be expanded to include fallbacks
  return [network.rpcUrl];
}

/**
 * Check if a network is supported
 */
export function isNetworkSupported(chainId: number | string): boolean {
  const network = getNetworkConfig(chainId);
  return network !== null && network.active && network.contractAddress !== null;
}

/**
 * Get configuration summary for debugging
 */
export function getConfigSummary(): {
  totalNetworks: number;
  activeNetworks: number;
  defaultNetwork: string;
  lastUpdated: string;
} {
  const totalNetworks = Object.keys(CONTRACT_CONFIG.networks).length;
  const activeNetworks = Object.values(CONTRACT_CONFIG.networks)
    .filter(network => network.active && network.contractAddress).length;
  
  return {
    totalNetworks,
    activeNetworks,
    defaultNetwork: CONTRACT_CONFIG.defaultNetwork,
    lastUpdated: CONTRACT_CONFIG.lastUpdated
  };
}`;
}

async function main() {
  console.log('🔄 Syncing contract configuration from backend to frontend...');
  
  try {
    // Load backend config
    const backendConfig = contractConfig.loadConfig();
    if (!backendConfig) {
      console.error('❌ Failed to load backend configuration');
      process.exit(1);
    }
    
    console.log('✅ Loaded backend configuration');
    console.log(`📊 Networks: ${Object.keys(backendConfig.networks).length}`);
    console.log(`🌐 Default: Chain ID ${backendConfig.defaultNetwork}`);
    console.log(`🕒 Updated: ${backendConfig.lastUpdated}`);
    
    // Generate frontend config
    const frontendConfigContent = generateFrontendConfig(backendConfig);
    
    // Write to frontend file
    fs.writeFileSync(FRONTEND_CONFIG_FILE, frontendConfigContent);
    console.log('✅ Updated frontend configuration');
    console.log(`📄 File: ${FRONTEND_CONFIG_FILE}`);
    
    // Show active networks
    const activeNetworks = contractConfig.listActiveNetworks();
    if (activeNetworks.length > 0) {
      console.log('\n🌐 Active networks synced:');
      activeNetworks.forEach(network => {
        console.log(`  🟢 ${network.name} (${network.chainId}): ${network.contractAddress}`);
      });
    }
    
    console.log('\n🎉 Sync completed successfully!');
    console.log('💡 You can now use the centralized config in your frontend code.');
    
  } catch (error) {
    console.error('❌ Sync failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { generateFrontendConfig, main }; 