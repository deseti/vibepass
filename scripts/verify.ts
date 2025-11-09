import { run } from 'hardhat';

/**
 * Verification script for deployed contracts
 * Usage: npx hardhat run scripts/verify.ts --network <network>
 * 
 * Example:
 * CONTRACT_ADDRESS=0x123... npx hardhat run scripts/verify.ts --network sepolia
 */

interface VerifyParams {
  address: string;
  constructorArguments?: any[];
}

async function main() {
  // Get contract address from command line argument or environment variable
  const contractAddress = process.env.CONTRACT_ADDRESS || process.argv[2];

  if (!contractAddress) {
    console.error('❌ Error: Contract address is required!');
    console.log('\nUsage:');
    console.log('  npx hardhat run scripts/verify.ts --network <network> <contract-address>');
    console.log('  OR');
    console.log('  CONTRACT_ADDRESS=0x123... npx hardhat run scripts/verify.ts --network <network>');
    process.exit(1);
  }

  console.log('🔍 Starting contract verification...\n');
  console.log('📍 Contract Address:', contractAddress);
  console.log('⏳ Verifying on block explorer...\n');

  try {
    // Verify the contract
    // VibeBadge has no constructor arguments
    await run('verify:verify', {
      address: contractAddress,
      constructorArguments: [],
    } as VerifyParams);

    console.log('\n✅ Contract verified successfully!');
    console.log('🔗 View on block explorer using the address above');
  } catch (error: any) {
    if (error.message.includes('Already Verified')) {
      console.log('\n✓ Contract is already verified!');
    } else if (error.message.includes('does not have bytecode')) {
      console.error('\n❌ Error: No contract found at the specified address');
      console.log('   Make sure the contract is deployed and the address is correct');
    } else if (error.message.includes('Etherscan API key')) {
      console.error('\n❌ Error: Etherscan API key not configured');
      console.log('   Add ETHERSCAN_API_KEY to your .env file or hardhat.config.js');
    } else {
      console.error('\n❌ Verification failed:');
      console.error(error.message);
      
      console.log('\n💡 Tips:');
      console.log('   - Make sure the contract is deployed');
      console.log('   - Wait a few minutes after deployment before verifying');
      console.log('   - Check that you\'re using the correct network');
      console.log('   - Verify constructor arguments match the deployment');
    }
    
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Script failed:');
    console.error(error);
    process.exit(1);
  });
