// Contract configuration - sync with contracts/contract-config.json
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
// Last synced: 2025-01-04T21:16:00.000Z - Fixed startGame sponsored transaction support
export const CONTRACT_CONFIG: ContractConfig = {
  "networks": {
    "1337": {
      "name": "Hardhat Local",
      "rpcUrl": "http://127.0.0.1:8545",
      "contractAddress": "0x5FbDB2315678afecb367f032d93F642f64180aa3",
      "deployedAt": "2025-07-02T20:03:36.771Z",
      "deployerAddress": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      "blockNumber": 1,
      "gasUsed": "30000000",
      "verified": false,
      "active": true
    },
    "8453": {
      "name": "Base Mainnet",
      "rpcUrl": "https://base-rpc.publicnode.com",
      "contractAddress": "0x80f80B22D1839F2216F7f7814398e7039Fc17546",
      "deployedAt": "2024-12-20T15:30:00.000Z",
      "deployerAddress": "0x61E9bf667455F0F1dA60C3e66E6Bb586B159a6e1",
      "blockNumber": 25123456,
      "gasUsed": "3591735",
      "verified": true,
      "active": true
    },
    "84532": {
      "name": "Base Sepolia",
      "rpcUrl": "https://sepolia.base.org",
      "contractAddress": "0xf151B1Af118b8D050B0F26319f58B0372bEA8A75",
      "deployedAt": "2025-01-04T21:16:00.000Z",
      "deployerAddress": "0x61E9bf667455F0F1dA60C3e66E6Bb586B159a6e1",
      "blockNumber": null,
      "gasUsed": "955906",
      "verified": true,
      "active": true
    }
  },
  "defaultNetwork": "84532",
  "lastUpdated": "2025-01-04T21:16:00.000Z",
  "version": "1.0.0"
};

/**
 * Get contract address for a specific chain ID
 */
export function getContractAddress(chainId: number | string): string | null {
  const network = CONTRACT_CONFIG.networks[chainId.toString()];
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
export function getNetworkConfig(chainId: number | string): NetworkConfig | null {
  const network = CONTRACT_CONFIG.networks[chainId.toString()];
  if (!network) {
    console.warn(`⚠️ No configuration found for chain ID: ${chainId}`);
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
}

export default CONTRACT_CONFIG