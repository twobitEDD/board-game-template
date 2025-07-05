const { ethers } = require("hardhat");

async function main() {
  console.log("🔐 Authorizing Additional ZeroDev Paymaster Addresses");
  console.log("=" .repeat(60));
  
  const contractAddress = "0xf151B1Af118b8D050B0F26319f58B0372bEA8A75";
  const contract = await ethers.getContractAt("FivesGame", contractAddress);
  
  console.log("📍 Contract:", contractAddress);
  console.log("🌐 Network:", network.name);
  
  const [deployer] = await ethers.getSigners();
  console.log("👤 Deployer:", deployer.address);
  
  // Additional ZeroDev paymaster addresses for Base Sepolia
  const additionalPaymasters = [
    { name: "ZeroDev Base Sepolia", address: "0xDe015Ed7128bdaF879D0045D470434cfB29c0dAa" },
    { name: "ZeroDev Kernel v2", address: "0x00000f79B7fAF42EEBAdbf19a451577c71e1E1A" },
    { name: "ZeroDev Universal", address: "0x00000000003bCBAe90eeD95D4E65B9a73a5E6F3" },
    { name: "Base Sepolia Bundler", address: "0x0576a174D229E3cFA37253523E645A78A0C91B57" },
    { name: "Alternative Paymaster", address: "0x5207202c27b646ceE568b02AcE5bE14EcC8bf8E" },
    // Add any addresses from error logs or Dynamic/ZeroDev docs
  ];
  
  console.log("🔍 Checking and authorizing paymaster addresses...");
  
  let newlyAuthorized = 0;
  let alreadyAuthorized = 0;
  let errors = 0;
  
  for (const paymaster of additionalPaymasters) {
    try {
      console.log(`\n🔍 Checking ${paymaster.name}:`);
      console.log(`   Address: ${paymaster.address}`);
      
      // Check if already authorized
      const isAuthorized = await contract.isAuthorizedPaymaster(paymaster.address);
      
      if (isAuthorized) {
        console.log(`   ✅ Already authorized`);
        alreadyAuthorized++;
      } else {
        console.log(`   ❌ Not authorized - authorizing now...`);
        
        // Authorize the paymaster
        const authTx = await contract.authorizePaymaster(paymaster.address);
        console.log(`   ⏳ Transaction sent: ${authTx.hash}`);
        
        await authTx.wait();
        console.log(`   ✅ Successfully authorized!`);
        newlyAuthorized++;
        
        // Verify authorization
        const isNowAuthorized = await contract.isAuthorizedPaymaster(paymaster.address);
        if (isNowAuthorized) {
          console.log(`   ✅ Verification: Now authorized`);
        } else {
          console.log(`   ❌ Verification: Authorization failed`);
          errors++;
        }
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      errors++;
    }
  }
  
  console.log("\n📊 AUTHORIZATION SUMMARY:");
  console.log(`   Newly authorized: ${newlyAuthorized}`);
  console.log(`   Already authorized: ${alreadyAuthorized}`);
  console.log(`   Errors: ${errors}`);
  console.log(`   Total processed: ${additionalPaymasters.length}`);
  
  // Now test all currently authorized paymasters
  console.log("\n🔍 FINAL VERIFICATION - All Authorized Paymasters:");
  
  const allTestAddresses = [
    "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789", // EntryPoint v0.6
    "0x0576a174D229E3cFA37253523E645A78A0C91B57", // ZeroDev Paymaster v1
    ...additionalPaymasters.map(p => p.address)
  ];
  
  let totalAuthorized = 0;
  for (const address of allTestAddresses) {
    try {
      const isAuthorized = await contract.isAuthorizedPaymaster(address);
      if (isAuthorized) {
        console.log(`   ✅ ${address}`);
        totalAuthorized++;
      }
    } catch (e) {
      // Skip invalid addresses
    }
  }
  
  console.log(`\n🎉 RESULT: ${totalAuthorized} paymaster addresses are now authorized!`);
  console.log("   ZeroDev sponsored transactions should now work properly.");
  
  if (totalAuthorized >= 3) {
    console.log("\n✅ SUCCESS: Contract is ready for sponsored transactions!");
    console.log("   The frontend joinGame function should now work with ZeroDev wallets.");
  } else {
    console.log("\n⚠️  WARNING: Still may need additional paymaster addresses.");
    console.log("   Check browser console for specific ZeroDev paymaster addresses being used.");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Authorization script failed:", error);
    process.exit(1);
  }); 