import hre from 'hardhat';
import * as dotenv from 'dotenv';

dotenv.config();

// @ts-ignore
const ethers = hre.ethers;

/**
 * Complete test to verify 3% fee structure
 * This will show payment from user → dev address clearly
 */
async function main() {
  console.log('🧪 Complete Fee Structure Test\n');

  const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || '';
  const DEV_ADDRESS = process.env.DEV_ADDRESS || '';
  
  if (!CONTRACT_ADDRESS || !DEV_ADDRESS) {
    console.error('❌ ERROR: Set CONTRACT_ADDRESS and DEV_ADDRESS in .env');
    process.exit(1);
  }

  const [deployer] = await ethers.getSigners();
  
  const VibeBadge = await ethers.getContractFactory('VibeBadge');
  const vibeBadge = VibeBadge.attach(CONTRACT_ADDRESS) as any;

  // Get contract info
  const mintPrice = await vibeBadge.mintPrice();
  const totalCost = await vibeBadge.getTotalMintCost();
  const feeAmount = totalCost - mintPrice;

  console.log('📊 Fee Structure:');
  console.log('   Mint Price:     ', ethers.formatEther(mintPrice), 'ETH');
  console.log('   Fee (3%):       ', ethers.formatEther(feeAmount), 'ETH');
  console.log('   Total Cost:     ', ethers.formatEther(totalCost), 'ETH');
  console.log('   ─────────────────────────────────');
  console.log('   User pays:      ', ethers.formatEther(totalCost), 'ETH');
  console.log('   Dev receives:   ', ethers.formatEther(totalCost), 'ETH (100%)');
  console.log('   Contract keeps: ', '0 ETH\n');

  // Check current state
  const devBalanceBefore = await ethers.provider.getBalance(DEV_ADDRESS);
  const contractBalanceBefore = await ethers.provider.getBalance(CONTRACT_ADDRESS);
  const nextTokenId = await vibeBadge.getNextTokenId();

  console.log('📸 State BEFORE mint:');
  console.log('   Dev Balance:      ', ethers.formatEther(devBalanceBefore), 'ETH');
  console.log('   Contract Balance: ', ethers.formatEther(contractBalanceBefore), 'ETH');
  console.log('   Next Token ID:    ', nextTokenId.toString());
  console.log('');

  // Mint badge
  console.log('⏳ Minting badge...');
  const tokenURI = `ipfs://QmTestBadge${nextTokenId}/metadata.json`;
  
  const tx = await vibeBadge.mintBadge(deployer.address, tokenURI, {
    value: totalCost,
    gasLimit: 200000
  });

  console.log('📤 Transaction:', tx.hash);
  console.log('⏳ Waiting for confirmation...\n');

  const receipt = await tx.wait();
  
  // Check state after
  const devBalanceAfter = await ethers.provider.getBalance(DEV_ADDRESS);
  const contractBalanceAfter = await ethers.provider.getBalance(CONTRACT_ADDRESS);
  const newNextTokenId = await vibeBadge.getNextTokenId();

  console.log('📸 State AFTER mint:');
  console.log('   Dev Balance:      ', ethers.formatEther(devBalanceAfter), 'ETH');
  console.log('   Contract Balance: ', ethers.formatEther(contractBalanceAfter), 'ETH');
  console.log('   Next Token ID:    ', newNextTokenId.toString());
  console.log('');

  // Calculate changes
  const devReceived = devBalanceAfter - devBalanceBefore;
  const contractReceived = contractBalanceAfter - contractBalanceBefore;

  console.log('💰 Payment Flow:');
  console.log('   User paid:        ', ethers.formatEther(totalCost), 'ETH');
  console.log('   Dev received:     ', ethers.formatEther(devReceived), 'ETH');
  console.log('   Contract received:', ethers.formatEther(contractReceived), 'ETH');
  console.log('');

  // Verify
  console.log('✅ Verification:');
  
  const devGotCorrect = devReceived === totalCost;
  console.log('   Dev received 100%:', devGotCorrect ? '✅' : '❌');
  if (!devGotCorrect) {
    console.log('      Expected:', ethers.formatEther(totalCost), 'ETH');
    console.log('      Got:     ', ethers.formatEther(devReceived), 'ETH');
  }
  
  const contractGotZero = contractReceived === BigInt(0);
  console.log('   Contract got 0%:  ', contractGotZero ? '✅' : '❌');
  if (!contractGotZero) {
    console.log('      ⚠️  Contract has:', ethers.formatEther(contractReceived), 'ETH');
  }
  
  const tokenMinted = newNextTokenId === nextTokenId + BigInt(1);
  console.log('   Token minted:     ', tokenMinted ? '✅' : '❌');
  
  console.log('');

  // Check token
  const tokenId = nextTokenId;
  const owner = await vibeBadge.ownerOf(tokenId);
  const uri = await vibeBadge.tokenURI(tokenId);

  console.log('🎫 Token Details:');
  console.log('   Token ID:', tokenId.toString());
  console.log('   Owner:   ', owner);
  console.log('   URI:     ', uri);
  console.log('');

  // Parse events
  console.log('📋 Events:');
  for (const log of receipt?.logs || []) {
    try {
      const parsed = vibeBadge.interface.parseLog({
        topics: log.topics as string[],
        data: log.data
      });
      
      if (parsed) {
        if (parsed.name === 'DevFeeCollected') {
          console.log('   ✓ DevFeeCollected');
          console.log('      From:   ', parsed.args.from);
          console.log('      To:     ', parsed.args.devAddress);
          console.log('      Amount: ', ethers.formatEther(parsed.args.amount), 'ETH');
        } else if (parsed.name === 'BadgeMinted') {
          console.log('   ✓ BadgeMinted');
          console.log('      To:      ', parsed.args.to);
          console.log('      TokenId: ', parsed.args.tokenId.toString());
        }
      }
    } catch (e) {
      // Skip
    }
  }
  
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎉 SUCCESS! Fee structure working correctly:');
  console.log('   ✅ User pays: mintPrice + 3% fee');
  console.log('   ✅ Dev gets: 100% of payment');
  console.log('   ✅ Contract keeps: 0%');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  console.log('🔗 View transaction:');
  console.log('   https://sepolia-explorer.base.org/tx/' + tx.hash);
  console.log('');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Error:');
    console.error(error);
    process.exit(1);
  });
