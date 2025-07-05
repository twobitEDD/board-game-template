# Centralized Contract Configuration System

## Overview

This system provides a **single source of truth** for all contract addresses across different blockchain networks. No more hardcoded addresses scattered throughout the codebase!

## Files

- `contract-config.json` - Central configuration file storing all contract addresses by chain ID
- `scripts/contract-config.js` - Utility functions for managing the configuration
- `scripts/manage-config.js` - CLI tool for configuration management
- `scripts/sync-frontend-config.js` - Syncs backend config to frontend
- `scripts/deploy-with-config.js` - Enhanced deployment with automatic config updates
- `app/src/config/contractConfig.ts` - Frontend configuration (auto-synced)

## Quick Start

### 1. Deploy a new contract (automatically updates config)
```bash
cd contracts
node scripts/deploy-with-config.js
```

### 2. View current configuration
```bash
node scripts/manage-config.js show
```

### 3. Manually set a contract address
```bash
node scripts/manage-config.js set 1337 0x123...abc 0xdeployer...123
```

### 4. Sync configuration to frontend
```bash
node scripts/sync-frontend-config.js
```

## CLI Commands

### Configuration Management
```bash
# Show full configuration
node scripts/manage-config.js show

# Get contract address for specific chain
node scripts/manage-config.js get 1337

# Set contract address for chain
node scripts/manage-config.js set 1337 0x123...abc [deployerAddress]

# Verify contract exists on chain
node scripts/manage-config.js verify 1337

# List all active networks
node scripts/manage-config.js active

# Get/set default network
node scripts/manage-config.js default
node scripts/manage-config.js default 8453
```

## Configuration Structure

```json
{
  "networks": {
    "1337": {
      "name": "Hardhat Local",
      "rpcUrl": "http://127.0.0.1:8545",
      "contractAddress": "0x5FbDB2315678afecb367f032d93F642f64180aa3",
      "deployedAt": "2025-06-30T19:54:00.000Z",
      "deployerAddress": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      "blockNumber": 1,
      "gasUsed": "3232650",
      "verified": true,
      "active": true
    }
  },
  "defaultNetwork": "1337",
  "lastUpdated": "2025-06-30T19:54:00.000Z",
  "version": "1.0.0"
}
```

## Using in Code

### Backend (Node.js)
```javascript
const { getContractAddress, getNetworkConfig } = require('./scripts/contract-config');

// Get contract address for Hardhat
const address = getContractAddress(1337);

// Get full network config
const config = getNetworkConfig(1337);
console.log(config.name, config.rpcUrl);
```

### Frontend (React/TypeScript)
```typescript
import { getContractAddress, isNetworkSupported } from '../config/contractConfig';

// Check if network is supported
if (isNetworkSupported(chainId)) {
  const address = getContractAddress(chainId);
  // Use the address...
}
```

## Workflow

### Adding a New Network
1. Deploy contract to the network
2. Update config: `node scripts/manage-config.js set <chainId> <address>`
3. Sync to frontend: `node scripts/sync-frontend-config.js`
4. Add chain config to `CHAIN_CONFIGS` in `useBlockchainGame.ts` if needed

### Updating an Existing Contract
1. Deploy new contract
2. Use `deploy-with-config.js` for automatic updates, or
3. Manually update: `node scripts/manage-config.js set <chainId> <newAddress>`
4. Sync to frontend: `node scripts/sync-frontend-config.js`

## Benefits

✅ **Single Source of Truth** - All contract addresses in one place
✅ **Automatic Sync** - Frontend automatically synced from backend
✅ **CLI Management** - Easy commands for configuration changes
✅ **Deployment Integration** - New deployments automatically update config
✅ **Network Validation** - Verify contracts exist before using
✅ **Version Tracking** - Track deployment info and timestamps

## Supported Networks

- **Hardhat Local** (Chain ID: 1337) - For development
- **Base Mainnet** (Chain ID: 8453) - Production
- **Base Sepolia** (Chain ID: 84532) - Testnet (inactive)

## Migration from Old System

The old hardcoded `NETWORK_CONFIGS` has been replaced with this centralized system. The frontend now uses:

```typescript
// OLD (hardcoded)
const config = NETWORK_CONFIGS[chainId]

// NEW (centralized)
import { getContractAddress, getNetworkConfig } from '../config/contractConfig'
const address = getContractAddress(chainId)
const config = getNetworkConfig(chainId)
```

## Troubleshooting

### Contract not found
```bash
# Verify contract exists
node scripts/manage-config.js verify 1337

# Check if network is active
node scripts/manage-config.js show
```

### Frontend out of sync
```bash
# Re-sync frontend
node scripts/sync-frontend-config.js
```

### Config corruption
```bash
# View current config
node scripts/manage-config.js show

# Manually fix if needed by editing contract-config.json
```

## Example: Complete Deployment Workflow

```bash
# 1. Start Hardhat node
npx hardhat node

# 2. Deploy with automatic config update
node scripts/deploy-with-config.js

# 3. Verify everything is working
node scripts/manage-config.js show

# 4. Start frontend (config already synced)
cd ../app
npm start

# 5. Visit gallery at http://localhost:3000/gallery
```

This system eliminates the "contract address sync issues" you were experiencing! 🎉 