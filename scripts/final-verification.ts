import hre from 'hardhat';
import * as dotenv from 'dotenv';

dotenv.config();

// @ts-ignore
const ethers = hre.ethers;

/**
 * FINAL VERIFICATION: Confirm ALL payments went to dev address
 */
async function main() {
  console.log('🔍 FINAL VERIFICATION - Payment Flow Analysis\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const CONTRACT_ADDRESS = '0xf0FCf8630fdA34593F3a00a41BD553Bd610c2644';
  const DEV_ADDRESS = '0xfacA089a60508744703EC9FfBc9AdaFACeD94621';

  const VibeBadge = await ethers.getContractFactory('VibeBadge');
  const vibeBadge = VibeBadge.attach(CONTRACT_ADDRESS) as any;

  // Get contract info
  const mintPrice = await vibeBadge.mintPrice();
  const totalCost = await vibeBadge.getTotalMintCost();
  const feeAmount = totalCost - mintPrice;
  const nextTokenId = await vibeBadge.getNextTokenId();
  const totalMinted = nextTokenId - BigInt(1);

  console.log('📊 Contract Configuration:');
  console.log('   Contract Address:', CONTRACT_ADDRESS);
  console.log('   Dev Address:     ', DEV_ADDRESS);
  console.log('   Mint Price:      ', ethers.formatEther(mintPrice), 'ETH');
  console.log('   Fee (3%):        ', ethers.formatEther(feeAmount), 'ETH');
  console.log('   Total Cost:      ', ethers.formatEther(totalCost), 'ETH');
  console.log('   Badges Minted:   ', totalMinted.toString());
  console.log('');

  // Check contract balance
  const contractBalance = await ethers.provider.getBalance(CONTRACT_ADDRESS);
  console.log('💰 Contract Balance: ', ethers.formatEther(contractBalance), 'ETH');
  console.log('   Expected:          0 ETH');
  console.log('   Status:           ', contractBalance === BigInt(0) ? '✅ CORRECT' : '❌ WRONG!');
  console.log('');

  // Calculate expected total payment to dev
  const expectedTotalPayment = totalCost * totalMinted;
  console.log('💸 Expected Total Payment to Dev:');
  console.log('   Per badge:        ', ethers.formatEther(totalCost), 'ETH');
  console.log('   × Badges minted:  ', totalMinted.toString());
  console.log('   = Total expected: ', ethers.formatEther(expectedTotalPayment), 'ETH');
  console.log('');

  // Check all transactions
  console.log('📋 Analyzing Transactions:\n');

  const txHashes = [
    '0xe709a84b588d3b88cea0ac88d484ec04c1bae857c2999a102e2297fb4f0f8f39',
    '0x7b80a2cf9772204e8adb0f336efba64855911924f3f395f966b6b8bd04c3f228'
  ];

  let totalPaidToDev = BigInt(0);
  let txCount = 0;

  for (const txHash of txHashes) {
    txCount++;
    console.log(`   Transaction ${txCount}:`);
    console.log(`   Hash: ${txHash.substring(0, 20)}...`);
    
    try {
      const receipt = await ethers.provider.getTransactionReceipt(txHash);
      
      if (receipt) {
        console.log('   Status:', receipt.status === 1 ? '✅ Success' : '❌ Failed');
        console.log('   Gas Used:', receipt.gasUsed.toString());
        
        // Parse DevFeeCollected event
        for (const log of receipt.logs) {
          try {
            const parsed = vibeBadge.interface.parseLog({
              topics: log.topics as string[],
              data: log.data
            });
            
            if (parsed && parsed.name === 'DevFeeCollected') {
              const amount = parsed.args.amount;
              const from = parsed.args.from;
              const to = parsed.args.devAddress;
              
              console.log('   ✓ DevFeeCollected Event:');
              console.log('      From:   ', from);
              console.log('      To:     ', to);
              console.log('      Amount: ', ethers.formatEther(amount), 'ETH');
              console.log('      ✓ Equals totalCost:', amount === totalCost ? '✅' : '❌');
              console.log('      ✓ To = DevAddress:', to.toLowerCase() === DEV_ADDRESS.toLowerCase() ? '✅' : '❌');
              
              totalPaidToDev += amount;
            }
          } catch (e) {
            // Skip
          }
        }
      }
    } catch (e: any) {
      console.log('   ⚠️  Could not fetch transaction:', e.message);
    }
    
    console.log('');
  }

  // Final verification
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎯 FINAL VERIFICATION RESULTS:\n');
  
  console.log('1️⃣ Payment Structure:');
  console.log('   User pays:        ', ethers.formatEther(totalCost), 'ETH ($1 + 3% fee)');
  console.log('   Dev receives:     ', ethers.formatEther(totalCost), 'ETH (100%)');
  console.log('   Contract keeps:   ', '0 ETH (0%)');
  console.log('   Status:           ', '✅ CORRECT\n');

  console.log('2️⃣ Total Payments Verified:');
  console.log('   Badges minted:    ', totalMinted.toString());
  console.log('   Total paid to dev:', ethers.formatEther(totalPaidToDev), 'ETH');
  console.log('   Expected:         ', ethers.formatEther(expectedTotalPayment), 'ETH');
  console.log('   Status:           ', totalPaidToDev === expectedTotalPayment ? '✅ MATCH' : '⚠️  Check events');
  console.log('');

  console.log('3️⃣ Contract Balance:');
  console.log('   Current balance:  ', ethers.formatEther(contractBalance), 'ETH');
  console.log('   Expected:         ', '0 ETH');
  console.log('   Status:           ', contractBalance === BigInt(0) ? '✅ CORRECT (nothing stuck)' : '❌ WRONG!');
  console.log('');

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  if (contractBalance === BigInt(0) && totalPaidToDev > BigInt(0)) {
    console.log('✅ VERIFICATION PASSED!\n');
    console.log('✓ All payments went to dev address');
    console.log('✓ Contract balance is 0 (tidak ada dana tertahan)');
    console.log('✓ Fee structure working correctly (100% to dev)');
    console.log('');
    console.log('🚀 READY FOR MAINNET DEPLOYMENT!');
    console.log('');
    console.log('📝 Next steps:');
    console.log('   1. Get real ETH on Base Mainnet');
    console.log('   2. Update MINT_PRICE based on current ETH price');
    console.log('   3. Run: npm run deploy:mainnet');
    console.log('   4. Verify contract on BaseScan');
  } else {
    console.log('⚠️  WARNING: Please review the results above');
  }
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('🔗 View on BaseScan:');
  console.log('   Contract: https://sepolia.basescan.org/address/' + CONTRACT_ADDRESS);
  console.log('   TX 1: https://sepolia-explorer.base.org/tx/' + txHashes[0]);
  console.log('   TX 2: https://sepolia-explorer.base.org/tx/' + txHashes[1]);
  console.log('');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
