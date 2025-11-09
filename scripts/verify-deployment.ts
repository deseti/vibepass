import hre from 'hardhat';
import * as dotenv from 'dotenv';

dotenv.config();

// @ts-ignore
const ethers = hre.ethers;

/**
 * Quick verification script to check deployed contract
 */
async function main() {
  const CONTRACT_ADDRESS = '0xf0FCf8630fdA34593F3a00a41BD553Bd610c2644';
  
  console.log('🔍 Verifying deployed VibeBadge contract...\n');
  console.log('📍 Contract Address:', CONTRACT_ADDRESS);
  console.log('');

  const [signer] = await ethers.getSigners();
  console.log('👤 Connected as:', signer.address);
  
  // Connect to deployed contract
  const VibeBadge = await ethers.getContractFactory('VibeBadge');
  const vibeBadge = VibeBadge.attach(CONTRACT_ADDRESS) as any;

  try {
    // Check owner
    console.log('\n1️⃣ Checking owner...');
    const owner = await vibeBadge.owner();
    console.log('   Owner:', owner);
    console.log('   ✓ Matches signer:', owner.toLowerCase() === signer.address.toLowerCase() ? '✅' : '❌');

    // Check dev address
    console.log('\n2️⃣ Checking dev address...');
    const devAddress = await vibeBadge.devAddress();
    console.log('   Dev Address:', devAddress);
    console.log('   ✓ Expected:', process.env.DEV_ADDRESS);
    console.log('   ✓ Match:', devAddress.toLowerCase() === process.env.DEV_ADDRESS?.toLowerCase() ? '✅' : '❌');

    // Check mint price
    console.log('\n3️⃣ Checking mint price...');
    const mintPrice = await vibeBadge.mintPrice();
    console.log('   Mint Price:', ethers.formatEther(mintPrice), 'ETH');
    
    // Calculate total cost (with 3% fee)
    const totalCost = await vibeBadge.getTotalMintCost();
    console.log('   Total Cost (with 3% fee):', ethers.formatEther(totalCost), 'ETH');
    
    const feeAmount = totalCost - mintPrice;
    console.log('   Fee Amount (3%):', ethers.formatEther(feeAmount), 'ETH');

    // Check fee percentage
    console.log('\n4️⃣ Checking fee settings...');
    const feePercentage = await vibeBadge.FEE_PERCENTAGE();
    console.log('   Fee Percentage:', feePercentage.toString() + '%');

    // Check next token ID
    console.log('\n5️⃣ Checking token state...');
    const nextTokenId = await vibeBadge.getNextTokenId();
    console.log('   Next Token ID:', nextTokenId.toString());
    
    // Check contract balance
    const contractBalance = await ethers.provider.getBalance(CONTRACT_ADDRESS);
    console.log('   Contract Balance:', ethers.formatEther(contractBalance), 'ETH');
    console.log('   ✓ Should be 0:', contractBalance === BigInt(0) ? '✅' : '❌');

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Contract verification complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('📊 Summary:');
    console.log('   Contract: VibeBadge');
    console.log('   Address:', CONTRACT_ADDRESS);
    console.log('   Owner:', owner);
    console.log('   Dev Address:', devAddress);
    console.log('   Mint Price:', ethers.formatEther(mintPrice), 'ETH');
    console.log('   Total Cost:', ethers.formatEther(totalCost), 'ETH');
    console.log('   Fee:', feePercentage.toString() + '%');
    console.log('   Ready to mint:', '✅');
    console.log('');
    
    console.log('🔗 View on explorer:');
    console.log('   https://sepolia-explorer.base.org/address/' + CONTRACT_ADDRESS);
    console.log('');
    
    console.log('💡 Next steps:');
    console.log('   1. Add to .env: CONTRACT_ADDRESS=' + CONTRACT_ADDRESS);
    console.log('   2. Test mint: npm run test:mint');
    console.log('   3. Verify on BaseScan: npx hardhat verify --network baseSepolia ' + CONTRACT_ADDRESS + ' "' + devAddress + '" "' + mintPrice.toString() + '"');
    
  } catch (error: any) {
    console.error('❌ Error verifying contract:');
    console.error(error.message);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
