import hre from 'hardhat';
import * as dotenv from 'dotenv';

dotenv.config();

// @ts-ignore
const ethers = hre.ethers;

async function main() {
  const CONTRACT_ADDRESS = '0xf0FCf8630fdA34593F3a00a41BD553Bd610c2644';
  
  console.log('🔍 Checking VibeBadge contract state...\n');

  const [signer] = await ethers.getSigners();
  
  const VibeBadge = await ethers.getContractFactory('VibeBadge');
  const vibeBadge = VibeBadge.attach(CONTRACT_ADDRESS) as any;

  console.log('📊 Contract Info:');
  console.log('   Address:', CONTRACT_ADDRESS);
  
  const nextTokenId = await vibeBadge.getNextTokenId();
  console.log('   Next Token ID:', nextTokenId.toString());
  
  const totalMinted = nextTokenId - BigInt(1);
  console.log('   Total Minted:', totalMinted.toString());
  
  const contractBalance = await ethers.provider.getBalance(CONTRACT_ADDRESS);
  console.log('   Contract Balance:', ethers.formatEther(contractBalance), 'ETH');
  
  const devAddress = await vibeBadge.devAddress();
  console.log('   Dev Address:', devAddress);
  
  const mintPrice = await vibeBadge.mintPrice();
  console.log('   Mint Price:', ethers.formatEther(mintPrice), 'ETH');
  
  const totalCost = await vibeBadge.getTotalMintCost();
  console.log('   Total Cost (with fee):', ethers.formatEther(totalCost), 'ETH');
  
  console.log('\n🎫 Checking Tokens:');
  
  // Check if token ID 1 exists (since we start from 1)
  try {
    const owner1 = await vibeBadge.ownerOf(1);
    console.log('   Token ID 1 owner:', owner1);
    
    const uri1 = await vibeBadge.tokenURI(1);
    console.log('   Token ID 1 URI:', uri1);
  } catch (e: any) {
    console.log('   Token ID 1: Not minted yet');
  }
  
  // Check transaction
  console.log('\n🔗 Recent Transaction:');
  console.log('   TX: 0xe709a84b588d3b88cea0ac88d484ec04c1bae857c2999a102e2297fb4f0f8f39');
  console.log('   View: https://sepolia-explorer.base.org/tx/0xe709a84b588d3b88cea0ac88d484ec04c1bae857c2999a102e2297fb4f0f8f39');
  
  // Get transaction receipt to see events
  const tx = await ethers.provider.getTransaction('0xe709a84b588d3b88cea0ac88d484ec04c1bae857c2999a102e2297fb4f0f8f39');
  if (tx) {
    const receipt = await ethers.provider.getTransactionReceipt(tx.hash);
    
    if (receipt) {
      console.log('\n📋 Transaction Logs:');
      console.log('   Status:', receipt.status === 1 ? '✅ Success' : '❌ Failed');
      console.log('   Gas Used:', receipt.gasUsed.toString());
      console.log('   Logs Count:', receipt.logs.length);
      
      for (const log of receipt.logs) {
        try {
          const parsed = vibeBadge.interface.parseLog({
            topics: log.topics as string[],
            data: log.data
          });
          
          if (parsed) {
            console.log('\n   Event:', parsed.name);
            console.log('   Args:', parsed.args);
          }
        } catch (e) {
          // Skip
        }
      }
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
