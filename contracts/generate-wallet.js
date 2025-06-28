const { ethers } = require("hardhat");

async function generateWallet() {
  console.log("🔐 Generating a fresh deployment wallet...\n");
  
  // Generate a random wallet
  const wallet = ethers.Wallet.createRandom();
  
  console.log("📋 WALLET DETAILS:");
  console.log("==================");
  console.log("Address:", wallet.address);
  console.log("Private Key:", wallet.privateKey);
  console.log("Mnemonic:", wallet.mnemonic.phrase);
  console.log("\n⚠️  SECURITY WARNING:");
  console.log("- Keep your private key and mnemonic SAFE and PRIVATE");
  console.log("- Never commit them to version control");
  console.log("- Only use this wallet for deployment, not for storing large amounts");
  console.log("\n💰 Next steps:");
  console.log("1. Add the private key to your .env file");
  console.log("2. Send some ETH to this address:", wallet.address);
  console.log("3. Use this wallet for deployment");
}

generateWallet()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 