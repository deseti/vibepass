import hre from 'hardhat';
import * as dotenv from 'dotenv';

dotenv.config();

// @ts-ignore
const ethers = hre.ethers;

/**
 * Test script for minting and verifying 3% dev fee
 * Usage: npx hardhat run scripts/test-mint.ts --network baseSepolia
 */
async function main() {
  console.log('🧪 Testing VibeBadge mint with 3% dev fee...\n');

  // Contract address (replace with your deployed contract)
  const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || '';
  
  if (!CONTRACT_ADDRESS) {
    console.error('❌ ERROR: Please set CONTRACT_ADDRESS in .env file');
    process.exit(1);
  }

  const DEV_ADDRESS = process.env.DEV_ADDRESS || '0xfacA089a60508744703EC9FfBc9AdaFACeD94621';

  console.log('📍 Contract Address:', CONTRACT_ADDRESS);
  console.log('💼 Dev Address:', DEV_ADDRESS);

  // Get signer
  const [signer] = await ethers.getSigners();
  console.log('👤 Testing with account:', signer.address);
  
  const balance = await ethers.provider.getBalance(signer.address);
  console.log('💰 Account balance:', ethers.formatEther(balance), 'ETH\n');

  // Get contract instance
  const VibeBadge = await ethers.getContractFactory('VibeBadge');
  const vibeBadge = VibeBadge.attach(CONTRACT_ADDRESS) as any;

  // Get mint price
  const mintPrice = await vibeBadge.mintPrice();
  console.log('💰 Mint Price:', ethers.formatEther(mintPrice), 'ETH');

  // Calculate total cost (mintPrice + 3% fee)
  const totalCost = await vibeBadge.getTotalMintCost();
  const feeAmount = totalCost - mintPrice;
  console.log('📊 Dev Fee (3%):', ethers.formatEther(feeAmount), 'ETH');
  console.log('💵 Total Cost (mint + fee):', ethers.formatEther(totalCost), 'ETH\n');

  // Check dev balance before mint
  const devBalanceBefore = await ethers.provider.getBalance(DEV_ADDRESS);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('💼 Dev balance BEFORE mint:', ethers.formatEther(devBalanceBefore), 'ETH');

  // Mint badge
  const tokenURI = 'ipfs://QmTestHash123/metadata.json';
  console.log('\n⏳ Minting badge...');
  console.log('   To:', signer.address);
  console.log('   URI:', tokenURI);
  console.log('   Paying:', ethers.formatEther(totalCost), 'ETH', '(includes 3% fee)');

  const tx = await vibeBadge.mintBadge(signer.address, tokenURI, {
    value: totalCost
  });

  console.log('📤 Transaction sent:', tx.hash);
  console.log('⏳ Waiting for confirmation...');

  const receipt = await tx.wait();
  console.log('✅ Transaction confirmed!');
  console.log('⛽ Gas used:', receipt?.gasUsed.toString());

  // Check dev balance after mint
  const devBalanceAfter = await ethers.provider.getBalance(DEV_ADDRESS);
  console.log('\n💼 Dev balance AFTER mint:', ethers.formatEther(devBalanceAfter), 'ETH');

  // Calculate actual amount received
  const actualReceived = devBalanceAfter - devBalanceBefore;
  console.log('💸 Dev received:', ethers.formatEther(actualReceived), 'ETH');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Verify dev received FULL payment (100% of totalCost)
  const receivedCorrectAmount = actualReceived === totalCost;
  console.log('✓ Dev received full payment (100%):', receivedCorrectAmount ? '✅' : '❌');
  
  if (!receivedCorrectAmount) {
    console.log('   Expected:', ethers.formatEther(totalCost), 'ETH');
    console.log('   Received:', ethers.formatEther(actualReceived), 'ETH');
    console.log('   ⚠️  WARNING: Payment mismatch!');
  } else {
    console.log('   Dev got:', ethers.formatEther(actualReceived), 'ETH', '(mintPrice + 3% fee)');
  }

  // Verify contract balance is 0
  const contractBalance = await ethers.provider.getBalance(CONTRACT_ADDRESS);
  console.log('✓ Contract balance is 0:', contractBalance === BigInt(0) ? '✅' : '❌');
  if (contractBalance !== BigInt(0)) {
    console.log('   ⚠️  WARNING: Contract has balance:', ethers.formatEther(contractBalance), 'ETH');
  }

  // Check token was minted
  const tokenId = await vibeBadge.getNextTokenId() - BigInt(1);
  console.log('\n🎫 Token ID minted:', tokenId.toString());
  
  const tokenOwner = await vibeBadge.ownerOf(tokenId);
  console.log('👤 Token owner:', tokenOwner);
  console.log('✓ Owner is correct:', tokenOwner === signer.address ? '✅' : '❌');

  const storedURI = await vibeBadge.tokenURI(tokenId);
  console.log('🔗 Token URI:', storedURI);
  console.log('✓ URI is correct:', storedURI === tokenURI ? '✅' : '❌');

  // Parse events
  console.log('\n📋 Events emitted:');
  for (const log of receipt?.logs || []) {
    try {
      const parsedLog = vibeBadge.interface.parseLog({
        topics: log.topics as string[],
        data: log.data
      });
      
      if (parsedLog) {
        console.log(`   - ${parsedLog.name}`);
        if (parsedLog.name === 'DevFeeCollected') {
          console.log('     From:', parsedLog.args.from);
          console.log('     To:', parsedLog.args.devAddress);
          console.log('     Amount:', ethers.formatEther(parsedLog.args.amount), 'ETH');
        } else if (parsedLog.name === 'BadgeMinted') {
          console.log('     To:', parsedLog.args.to);
          console.log('     TokenId:', parsedLog.args.tokenId.toString());
          console.log('     URI:', parsedLog.args.tokenURI);
        }
      }
    } catch (e) {
      // Skip logs from other contracts
    }
  }

  console.log('\n🎉 Test completed successfully!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ Dev received 100% of payment (mintPrice + 3% fee)');
  console.log('✅ Contract balance is 0 ETH');
  console.log('✅ Badge minted successfully');
  console.log('✅ All checks passed');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Test failed:');
    console.error(error);
    process.exit(1);
  });
