const { ethers } = require("hardhat");

async function main() {
  // Get the first pre-funded account (has 10000 ETH)
  const [funder] = await ethers.getSigners();
  
  // The wallet address to fund (your Dynamic wallet)
  const walletToFund = "0x332446246586B1057aCDdCAF263A39966FAeDa02";
  
  console.log("🏦 Funding wallet with test ETH...");
  console.log("From:", funder.address);
  console.log("To:", walletToFund);
  
  // Send 100 ETH (plenty for testing)
  const tx = await funder.sendTransaction({
    to: walletToFund,
    value: ethers.parseEther("100") // 100 ETH
  });
  
  await tx.wait();
  
  // Check the balance
  const balance = await ethers.provider.getBalance(walletToFund);
  
  console.log("✅ Transfer completed!");
  console.log("📊 New balance:", ethers.formatEther(balance), "ETH");
  console.log("🎮 You can now create blockchain games!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 