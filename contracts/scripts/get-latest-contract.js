const fs = require('fs');
const path = require('path');

function getLatestContractAddress(chainId = '1337') {
  const deploymentsDir = path.join(__dirname, '../deployments');
  
  try {
    // Get all deployment files for the specified chain
    const files = fs.readdirSync(deploymentsDir)
      .filter(file => file.includes(`-${chainId}-`) && file.endsWith('.json'))
      .sort((a, b) => {
        // Sort by timestamp (latest first)
        const timestampA = parseInt(a.split('-')[2].replace('.json', ''));
        const timestampB = parseInt(b.split('-')[2].replace('.json', ''));
        return timestampB - timestampA;
      });
    
    if (files.length === 0) {
      throw new Error(`No deployment files found for chain ID ${chainId}`);
    }
    
    // Read the latest deployment file
    const latestFile = files[0];
    const deploymentData = JSON.parse(fs.readFileSync(path.join(deploymentsDir, latestFile), 'utf8'));
    
    console.log(`📍 Latest deployment: ${latestFile}`);
    console.log(`🏠 Contract address: ${deploymentData.contractAddress}`);
    console.log(`🌐 Network: ${deploymentData.networkName} (Chain ID: ${deploymentData.chainId})`);
    console.log(`⏰ Deployed: ${deploymentData.timestamp}`);
    
    return deploymentData.contractAddress;
  } catch (error) {
    console.error('❌ Error reading deployment files:', error.message);
    process.exit(1);
  }
}

// If called directly
if (require.main === module) {
  const chainId = process.argv[2] || '1337';
  getLatestContractAddress(chainId);
}

module.exports = { getLatestContractAddress }; 