import hre from 'hardhat';
import * as dotenv from 'dotenv';

dotenv.config();

// @ts-ignore - ethers is available at runtime via hardhat-ethers plugin
const ethers = hre.ethers;

/**
 * Deploy script for VibeBadge contract with 3% dev fee
 * Usage: 
 *   Testnet: npx hardhat run scripts/deploy.ts --network baseSepolia
 *   Mainnet: npx hardhat run scripts/deploy.ts --network baseMainnet
 */
async function main() {
  console.log('🚀 Starting VibeBadge deployment with 3% dev fee...\n');

  // Get dev address and mint price from environment
  const DEV_ADDRESS = process.env.DEV_ADDRESS || '0xfacA089a60508744703EC9FfBc9AdaFACeD94621';
  const MINT_PRICE = process.env.MINT_PRICE || '1000000000000000'; // 0.001 ETH default

  console.log('💼 Dev Address (receives 3% fee):', DEV_ADDRESS);
  console.log('💰 Mint Price:', ethers.formatEther(MINT_PRICE), 'ETH\n');

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log('📝 Deploying contracts with account:', deployer.address);
  
  // Get account balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log('💰 Account balance:', ethers.formatEther(balance), 'ETH');
  
  if (balance === BigInt(0)) {
    console.error('\n❌ ERROR: Deployer account has 0 ETH!');
    console.log('💡 Get testnet ETH from: https://www.alchemy.com/faucets/base-sepolia');
    process.exit(1);
  }
  console.log('');

  // Get the contract factory
  console.log('📦 Getting VibeBadge contract factory...');
  const VibeBadge = await ethers.getContractFactory('VibeBadge');

  // Deploy the contract with dev address and mint price
  console.log('⏳ Deploying VibeBadge with constructor args...');
  console.log('   - Dev Address:', DEV_ADDRESS);
  console.log('   - Mint Price:', ethers.formatEther(MINT_PRICE), 'ETH');
  
  const vibeBadge = await VibeBadge.deploy(DEV_ADDRESS, MINT_PRICE) as any;
  
  // Wait for deployment to complete
  await vibeBadge.waitForDeployment();
  
  const contractAddress = await vibeBadge.getAddress();
  const deployTx = vibeBadge.deploymentTransaction();
  
  console.log('\n✅ VibeBadge deployed successfully!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📍 Contract Address:', contractAddress);
  console.log('🔗 Transaction Hash:', deployTx?.hash);
  console.log('⛽ Gas Used:', deployTx?.gasLimit.toString());
  console.log('🌐 Network:', (await ethers.provider.getNetwork()).name);
  console.log('🔢 Chain ID:', (await ethers.provider.getNetwork()).chainId.toString());
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Wait for confirmations before reading state
  console.log('⏳ Waiting for 2 block confirmations...');
  await deployTx?.wait(2);
  console.log('✅ Confirmed!\n');

  // Verify contract owner
  const owner = await vibeBadge.owner();
  console.log('👤 Contract Owner:', owner);
  console.log('✓ Owner matches deployer:', owner === deployer.address ? '✅' : '❌');

  // Verify dev address
  const devAddress = await vibeBadge.devAddress();
  console.log('💼 Dev Address:', devAddress);
  console.log('✓ Dev address is correct:', devAddress === DEV_ADDRESS ? '✅' : '❌');

  // Verify mint price
  const mintPrice = await vibeBadge.mintPrice();
  console.log('💰 Mint Price:', ethers.formatEther(mintPrice), 'ETH');

  // Get fee percentage
  const feePercentage = await vibeBadge.FEE_PERCENTAGE();
  console.log('📊 Dev Fee:', feePercentage.toString() + '%');

  // Get initial token ID
  const nextTokenId = await vibeBadge.getNextTokenId();
  console.log('🎫 Next Token ID:', nextTokenId.toString());

  const networkName = hre.network.name;
  const chainId = (await ethers.provider.getNetwork()).chainId;
  
  console.log('\n💡 To verify on BaseScan:');
  if (chainId === BigInt(84532)) {
    console.log(`   npx hardhat verify --network baseSepolia ${contractAddress} "${DEV_ADDRESS}" "${MINT_PRICE}"`);
    console.log(`   🔍 View on explorer: https://sepolia-explorer.base.org/address/${contractAddress}`);
  } else if (chainId === BigInt(8453)) {
    console.log(`   npx hardhat verify --network baseMainnet ${contractAddress} "${DEV_ADDRESS}" "${MINT_PRICE}"`);
    console.log(`   🔍 View on explorer: https://basescan.org/address/${contractAddress}`);
  }
  
  console.log('\n📝 Save this deployment info!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Contract Address:', contractAddress);
  console.log('Dev Address:', devAddress);
  console.log('Mint Price:', ethers.formatEther(mintPrice), 'ETH');
  console.log('Dev Fee:', feePercentage.toString() + '%');
  console.log('Network:', networkName);
  console.log('Chain ID:', chainId.toString());
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  return contractAddress;
}

// Execute the deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Deployment failed:');
    console.error(error);
    process.exit(1);
  });
