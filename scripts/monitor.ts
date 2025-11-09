import hre from 'hardhat';
import * as dotenv from 'dotenv';

dotenv.config();

// @ts-ignore
const ethers = hre.ethers;

/**
 * Real-time monitoring script for VibeBadge mints
 * Listens to events and notifies about new mints and fee collections
 */

const NETWORKS = {
  baseSepolia: {
    name: 'Base Sepolia',
    rpc: 'https://sepolia.base.org',
    contract: '0xf0FCf8630fdA34593F3a00a41BD553Bd610c2644',
    explorer: 'https://sepolia.basescan.org'
  },
  baseMainnet: {
    name: 'Base Mainnet',
    rpc: 'https://mainnet.base.org',
    contract: '0xaCF8105456d400b128Ca6fC739A20c7178d50767',
    explorer: 'https://basescan.org'
  }
};

interface MintEvent {
  to: string;
  tokenId: string;
  tokenURI: string;
  transactionHash: string;
  blockNumber: number;
  timestamp: number;
}

interface FeeEvent {
  from: string;
  devAddress: string;
  amount: string;
  transactionHash: string;
  blockNumber: number;
}

class VibeBadgeMonitor {
  private provider: any;
  private contract: any;
  private network: any;
  private totalMints = 0;
  private totalFeesCollected = BigInt(0);
  private lastCheckedBlock = 0;
  private isRunning = true;

  constructor(networkKey: keyof typeof NETWORKS) {
    this.network = NETWORKS[networkKey];
    this.provider = new ethers.JsonRpcProvider(this.network.rpc);
    
    const VibeBadge_ABI = [
      "event BadgeMinted(address indexed to, uint256 indexed tokenId, string tokenURI)",
      "event DevFeeCollected(address indexed from, address indexed devAddress, uint256 amount)",
      "function getNextTokenId() public view returns (uint256)",
      "function mintPrice() public view returns (uint256)",
      "function getTotalMintCost() public view returns (uint256)"
    ];

    this.contract = new ethers.Contract(
      this.network.contract,
      VibeBadge_ABI,
      this.provider
    );
  }

  async start() {
    console.log('🔍 VibeBadge Monitor Started');
    console.log('━'.repeat(60));
    console.log('Network:', this.network.name);
    console.log('Contract:', this.network.contract);
    console.log('Explorer:', this.network.explorer);
    console.log('━'.repeat(60));
    console.log('');

    // Get initial state
    const nextTokenId = await this.contract.getNextTokenId();
    const mintPrice = await this.contract.mintPrice();
    const totalCost = await this.contract.getTotalMintCost();
    const currentBlock = await this.provider.getBlockNumber();

    this.lastCheckedBlock = currentBlock;

    console.log('📊 Current State:');
    console.log('   Next Token ID:', nextTokenId.toString());
    console.log('   Mint Price:', ethers.formatEther(mintPrice), 'ETH');
    console.log('   Total Cost:', ethers.formatEther(totalCost), 'ETH');
    console.log('   Current Block:', currentBlock);
    console.log('');
    console.log('👀 Polling for new events every 5 seconds...');
    console.log('━'.repeat(60));
    console.log('');

    // Poll for events instead of using filters
    this.pollEvents();
  }

  private async pollEvents() {
    while (this.isRunning) {
      try {
        const currentBlock = await this.provider.getBlockNumber();
        
        if (currentBlock > this.lastCheckedBlock) {
          // Query events from last checked block to current
          const mintFilter = this.contract.filters.BadgeMinted();
          const feeFilter = this.contract.filters.DevFeeCollected();

          const [mintEvents, feeEvents] = await Promise.all([
            this.contract.queryFilter(mintFilter, this.lastCheckedBlock + 1, currentBlock),
            this.contract.queryFilter(feeFilter, this.lastCheckedBlock + 1, currentBlock)
          ]);

          // Process mint events
          for (const event of mintEvents) {
            await this.onMintEvent(event);
          }

          // Process fee events
          for (const event of feeEvents) {
            await this.onFeeEvent(event);
          }

          this.lastCheckedBlock = currentBlock;
        }
      } catch (error: any) {
        console.error('⚠️  Error polling events:', error.message);
      }

      // Wait 5 seconds before next poll
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }

  private async onMintEvent(event: any) {
    this.totalMints++;
    
    const block = await event.getBlock();
    const args = event.args;
    
    const mintEvent: MintEvent = {
      to: args.to,
      tokenId: args.tokenId.toString(),
      tokenURI: args.tokenURI,
      transactionHash: event.transactionHash,
      blockNumber: event.blockNumber,
      timestamp: block.timestamp
    };
    const date = new Date(event.timestamp * 1000).toLocaleString();
    
    console.log('🎉 NEW BADGE MINTED!');
    console.log('━'.repeat(60));
    console.log('📅 Time:', date);
    console.log('🎫 Token ID:', event.tokenId);
    console.log('👤 Owner:', event.to);
    console.log('🔗 Token URI:', event.tokenURI);
    console.log('📦 Block:', event.blockNumber);
    console.log('🔗 TX:', `${this.network.explorer}/tx/${event.transactionHash}`);
    console.log('━'.repeat(60));
    console.log('📊 Total Mints:', this.totalMints);
    console.log('');

    // Send notification (optional - implement webhook/Discord/Telegram)
    this.sendNotification({
      type: 'mint',
      title: 'New Badge Minted!',
      message: `Token ID ${mintEvent.tokenId} minted to ${mintEvent.to}`,
      url: `${this.network.explorer}/tx/${mintEvent.transactionHash}`
    });
  }

  private async onFeeEvent(event: any) {
    const args = event.args;
    
    this.totalFeesCollected += args.amount;

    const feeEvent: FeeEvent = {
      from: args.from,
      devAddress: args.devAddress,
      amount: ethers.formatEther(args.amount),
      transactionHash: event.transactionHash,
      blockNumber: event.blockNumber
    };

    console.log('💰 FEE COLLECTED');
    console.log('━'.repeat(60));
    console.log('👤 From:', event.from);
    console.log('💼 To:', event.devAddress);
    console.log('💵 Amount:', event.amount, 'ETH');
    console.log('📦 Block:', event.blockNumber);
    console.log('🔗 TX:', `${this.network.explorer}/tx/${event.transactionHash}`);
    console.log('━'.repeat(60));
    console.log('💰 Total Fees Collected:', ethers.formatEther(this.totalFeesCollected), 'ETH');
    console.log('');
  }

  stop() {
    this.isRunning = false;
  }

  private async sendNotification(data: any) {
    // TODO: Implement notification system
    // Options:
    // 1. Discord Webhook
    // 2. Telegram Bot
    // 3. Email
    // 4. Push notification
    // 5. Database logging

    // Example Discord webhook:
    /*
    const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK_URL;
    if (DISCORD_WEBHOOK) {
      await fetch(DISCORD_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          embeds: [{
            title: data.title,
            description: data.message,
            url: data.url,
            color: data.type === 'mint' ? 0x00ff00 : 0xffd700,
            timestamp: new Date().toISOString()
          }]
        })
      });
    }
    */
  }

  async getStats() {
    const nextTokenId = await this.contract.getNextTokenId();
    const totalMinted = nextTokenId - BigInt(1);

    return {
      totalMinted: totalMinted.toString(),
      totalMints: this.totalMints,
      totalFeesCollected: ethers.formatEther(this.totalFeesCollected)
    };
  }
}

async function main() {
  const network = process.env.MONITOR_NETWORK === 'testnet' ? 'baseSepolia' : 'baseMainnet';

  console.clear();
  console.log('');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                                                            ║');
  console.log('║              VibeBadge Real-Time Monitor                   ║');
  console.log('║                                                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');

  const monitor = new VibeBadgeMonitor(network);
  await monitor.start();

  // Keep process alive
  process.on('SIGINT', async () => {
    console.log('\n\n🛑 Stopping monitor...');
    monitor.stop();
    
    const stats = await monitor.getStats();
    console.log('\n📊 Final Stats:');
    console.log('   Total Minted:', stats.totalMinted, 'badges');
    console.log('   Monitored Mints:', stats.totalMints);
    console.log('   Total Fees:', stats.totalFeesCollected, 'ETH');
    console.log('');
    process.exit(0);
  });
}

main().catch((error) => {
  console.error('❌ Monitor error:', error);
  process.exit(1);
});
