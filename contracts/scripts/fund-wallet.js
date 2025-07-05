const { ethers } = require("hardhat");

async function main() {
  // Get the first pre-funded account (has 10000 ETH)
  const [funder] = await ethers.getSigners();
  
  // The wallet address to fund (your Dynamic wallet)
  const walletToFund = process.argv[2] || "0xd767441056a5F92bC878D7038094627096170DA3";
  
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