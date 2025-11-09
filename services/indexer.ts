import { ethers } from 'ethers';
import { Pool } from 'pg';

/**
 * VibeBadge Event Indexer
 * 
 * Listens to blockchain events and indexes badge minting data into PostgreSQL.
 * 
 * Features:
 * - Connects to Ethereum/Base provider
 * - Listens to BadgeMinted and Transfer events
 * - Writes tokenId, owner, tokenURI, txHash, blockNumber to Postgres
 * - Handles reconnection and backfill from specified block
 * - Graceful error handling and retry logic
 * 
 * Usage:
 * ```bash
 * # Start indexer from latest block
 * ts-node services/indexer.ts
 * 
 * # Start with backfill from specific block
 * FROM_BLOCK=12345678 ts-node services/indexer.ts
 * ```
 */

// ==================== Configuration ====================

const CONFIG = {
  // RPC endpoint
  rpcUrl: process.env.RPC_URL || 'https://mainnet.base.org',
  
  // Contract address
  contractAddress: process.env.CONTRACT_ADDRESS || '0x...',
  
  // Database connection
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'vibepass',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    max: 20, // Connection pool size
    idleTimeoutMillis: 30000,
  },
  
  // Indexer settings
  fromBlock: parseInt(process.env.FROM_BLOCK || '0'), // 0 = latest
  confirmations: parseInt(process.env.CONFIRMATIONS || '3'), // Wait N blocks
  batchSize: parseInt(process.env.BATCH_SIZE || '1000'), // For backfill
  pollInterval: parseInt(process.env.POLL_INTERVAL || '12000'), // 12 seconds
  
  // Retry settings
  maxRetries: 3,
  retryDelay: 5000, // 5 seconds
};

// ==================== Database Client ====================

class Database {
  private pool: Pool;

  constructor(config: typeof CONFIG.database) {
    this.pool = new Pool(config);
    
    this.pool.on('error', (err) => {
      console.error('Unexpected database error:', err);
    });
  }

  async query(text: string, params?: any[]) {
    const start = Date.now();
    try {
      const res = await this.pool.query(text, params);
      const duration = Date.now() - start;
      console.log('Executed query', { text: text.substring(0, 50), duration, rows: res.rowCount });
      return res;
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }

  async close() {
    await this.pool.end();
  }

  /**
   * Insert badge minting event
   */
  async insertBadge(data: {
    tokenId: number;
    owner: string;
    tokenURI: string;
    txHash: string;
    blockNumber: number;
    blockTimestamp: number;
  }) {
    const query = `
      INSERT INTO badges (token_id, owner, token_uri, tx_hash, block_number, minted_at)
      VALUES ($1, $2, $3, $4, $5, to_timestamp($6))
      ON CONFLICT (token_id) DO UPDATE SET
        owner = EXCLUDED.owner,
        token_uri = EXCLUDED.token_uri,
        tx_hash = EXCLUDED.tx_hash,
        block_number = EXCLUDED.block_number,
        minted_at = EXCLUDED.minted_at
      RETURNING id;
    `;
    
    return this.query(query, [
      data.tokenId,
      data.owner.toLowerCase(),
      data.tokenURI,
      data.txHash,
      data.blockNumber,
      data.blockTimestamp,
    ]);
  }

  /**
   * Upsert user (ensure they exist)
   */
  async upsertUser(wallet: string) {
    const query = `
      INSERT INTO users (wallet, created_at)
      VALUES ($1, NOW())
      ON CONFLICT (wallet) DO NOTHING
      RETURNING id;
    `;
    
    return this.query(query, [wallet.toLowerCase()]);
  }

  /**
   * Get last indexed block
   */
  async getLastIndexedBlock(): Promise<number> {
    const query = `
      SELECT MAX(block_number) as last_block
      FROM badges;
    `;
    
    const result = await this.query(query);
    return result.rows[0]?.last_block || 0;
  }

  /**
   * Update indexer state
   */
  async updateIndexerState(lastBlock: number) {
    const query = `
      INSERT INTO indexer_state (id, last_block, updated_at)
      VALUES (1, $1, NOW())
      ON CONFLICT (id) DO UPDATE SET
        last_block = EXCLUDED.last_block,
        updated_at = EXCLUDED.updated_at;
    `;
    
    return this.query(query, [lastBlock]);
  }
}

// ==================== Indexer ====================

class VibeBadgeIndexer {
  private provider: ethers.JsonRpcProvider;
  private contract: ethers.Contract;
  private db: Database;
  private isRunning = false;
  private lastProcessedBlock = 0;

  constructor() {
    // Initialize provider
    this.provider = new ethers.JsonRpcProvider(CONFIG.rpcUrl);
    
    // Contract ABI (only events we need)
    const abi = [
      'event BadgeMinted(address indexed to, uint256 indexed tokenId, string tokenURI)',
      'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
      'function tokenURI(uint256 tokenId) view returns (string)',
    ];
    
    this.contract = new ethers.Contract(
      CONFIG.contractAddress,
      abi,
      this.provider
    );
    
    // Initialize database
    this.db = new Database(CONFIG.database);
  }

  /**
   * Start the indexer
   */
  async start() {
    console.log('🚀 Starting VibeBadge Indexer...');
    console.log('Config:', {
      rpcUrl: CONFIG.rpcUrl,
      contractAddress: CONFIG.contractAddress,
      fromBlock: CONFIG.fromBlock,
    });

    try {
      // Test database connection
      await this.db.query('SELECT NOW()');
      console.log('✅ Database connected');

      // Test RPC connection
      const network = await this.provider.getNetwork();
      console.log('✅ Provider connected to network:', network.name, 'chainId:', network.chainId);

      // Determine starting block
      let startBlock = CONFIG.fromBlock;
      if (startBlock === 0) {
        // Use last indexed block or contract deployment block
        const lastIndexed = await this.db.getLastIndexedBlock();
        const currentBlock = await this.provider.getBlockNumber();
        
        if (lastIndexed > 0) {
          startBlock = lastIndexed + 1;
          console.log(`📝 Resuming from last indexed block: ${lastIndexed}`);
        } else {
          // Start from recent blocks (avoid scanning entire history)
          startBlock = currentBlock - 1000; // Last ~3 hours on Base
          console.log(`📝 Starting from recent block: ${startBlock}`);
        }
      }

      this.lastProcessedBlock = startBlock - 1;
      this.isRunning = true;

      // Backfill historical events
      await this.backfillEvents(startBlock);

      // Start listening for new events
      await this.listenForEvents();

    } catch (error) {
      console.error('❌ Failed to start indexer:', error);
      await this.stop();
      throw error;
    }
  }

  /**
   * Backfill historical events from a starting block
   */
  async backfillEvents(fromBlock: number) {
    console.log(`📚 Backfilling events from block ${fromBlock}...`);

    try {
      const currentBlock = await this.provider.getBlockNumber();
      const toBlock = currentBlock - CONFIG.confirmations;

      if (fromBlock > toBlock) {
        console.log('✅ No backfill needed, already up to date');
        this.lastProcessedBlock = toBlock;
        return;
      }

      let processedBlock = fromBlock;
      
      // Process in batches to avoid RPC limits
      while (processedBlock < toBlock) {
        const batchEnd = Math.min(processedBlock + CONFIG.batchSize, toBlock);
        
        console.log(`Processing blocks ${processedBlock} to ${batchEnd}...`);

        // Fetch BadgeMinted events
        const badgeMintedFilter = this.contract.filters.BadgeMinted();
        const events = await this.contract.queryFilter(
          badgeMintedFilter,
          processedBlock,
          batchEnd
        );

        console.log(`Found ${events.length} BadgeMinted events`);

        // Process events
        for (const event of events) {
          await this.processBadgeMintedEvent(event);
        }

        processedBlock = batchEnd + 1;
        this.lastProcessedBlock = batchEnd;
        
        // Update indexer state
        await this.db.updateIndexerState(batchEnd);

        // Rate limiting
        await this.sleep(1000);
      }

      console.log(`✅ Backfill complete up to block ${toBlock}`);
    } catch (error) {
      console.error('❌ Backfill error:', error);
      throw error;
    }
  }

  /**
   * Listen for new events in real-time
   */
  async listenForEvents() {
    console.log('👂 Listening for new events...');

    // Listen to BadgeMinted events
    this.contract.on('BadgeMinted', async (to, tokenId, tokenURI, event) => {
      console.log(`🎫 New badge minted: Token #${tokenId} to ${to}`);
      
      try {
        await this.processBadgeMintedEvent(event);
      } catch (error) {
        console.error('Error processing BadgeMinted event:', error);
      }
    });

    // Listen to Transfer events (for secondary transfers)
    this.contract.on('Transfer', async (from, to, tokenId, event) => {
      // Skip minting events (from = 0x0)
      if (from === ethers.ZeroAddress) return;
      
      console.log(`🔄 Badge transferred: Token #${tokenId} from ${from} to ${to}`);
      
      try {
        await this.processTransferEvent(event);
      } catch (error) {
        console.error('Error processing Transfer event:', error);
      }
    });

    // Periodic health check and reconnection
    this.startHealthCheck();
  }

  /**
   * Process BadgeMinted event
   */
  async processBadgeMintedEvent(event: any) {
    try {
      const { to, tokenId, tokenURI } = event.args;
      const block = await event.getBlock();

      // Wait for confirmations
      const currentBlock = await this.provider.getBlockNumber();
      if (currentBlock - event.blockNumber < CONFIG.confirmations) {
        console.log(`⏳ Waiting for confirmations (${currentBlock - event.blockNumber}/${CONFIG.confirmations})`);
        return;
      }

      // Upsert user
      await this.db.upsertUser(to);

      // Insert badge
      await this.db.insertBadge({
        tokenId: Number(tokenId),
        owner: to,
        tokenURI: tokenURI,
        txHash: event.transactionHash,
        blockNumber: event.blockNumber,
        blockTimestamp: block.timestamp,
      });

      console.log(`✅ Indexed badge #${tokenId} at block ${event.blockNumber}`);

      // Update last processed block
      if (event.blockNumber > this.lastProcessedBlock) {
        this.lastProcessedBlock = event.blockNumber;
        await this.db.updateIndexerState(event.blockNumber);
      }

    } catch (error) {
      console.error('Error processing BadgeMinted event:', error);
      throw error;
    }
  }

  /**
   * Process Transfer event (secondary transfers)
   */
  async processTransferEvent(event: any) {
    try {
      const { from, to, tokenId } = event.args;
      
      // Update badge owner in database
      const query = `
        UPDATE badges
        SET owner = $1, updated_at = NOW()
        WHERE token_id = $2;
      `;
      
      await this.db.query(query, [to.toLowerCase(), Number(tokenId)]);
      
      // Ensure new owner exists in users table
      await this.db.upsertUser(to);

      console.log(`✅ Updated owner for badge #${tokenId}`);

    } catch (error) {
      console.error('Error processing Transfer event:', error);
      throw error;
    }
  }

  /**
   * Periodic health check
   */
  startHealthCheck() {
    setInterval(async () => {
      try {
        const currentBlock = await this.provider.getBlockNumber();
        const lag = currentBlock - this.lastProcessedBlock - CONFIG.confirmations;
        
        console.log(`💓 Health check: Current block ${currentBlock}, last processed ${this.lastProcessedBlock}, lag ${lag} blocks`);

        // If we're falling behind, trigger backfill
        if (lag > 100) {
          console.warn(`⚠️  Falling behind by ${lag} blocks, triggering catch-up...`);
          await this.backfillEvents(this.lastProcessedBlock + 1);
        }

      } catch (error) {
        console.error('Health check error:', error);
        // Attempt reconnection
        await this.reconnect();
      }
    }, CONFIG.pollInterval);
  }

  /**
   * Reconnect to provider and database
   */
  async reconnect() {
    console.log('🔄 Attempting to reconnect...');
    
    try {
      // Recreate provider
      this.provider = new ethers.JsonRpcProvider(CONFIG.rpcUrl);
      
      // Recreate contract instance with new provider
      const abi = [
        'event BadgeMinted(address indexed to, uint256 indexed tokenId, string tokenURI)',
        'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
        'function tokenURI(uint256 tokenId) view returns (string)',
      ];
      
      this.contract = new ethers.Contract(
        CONFIG.contractAddress,
        abi,
        this.provider
      );
      
      // Test connection
      await this.provider.getBlockNumber();
      
      console.log('✅ Reconnected successfully');
    } catch (error) {
      console.error('❌ Reconnection failed:', error);
      
      // Retry after delay
      await this.sleep(CONFIG.retryDelay);
      await this.reconnect();
    }
  }

  /**
   * Stop the indexer
   */
  async stop() {
    console.log('🛑 Stopping indexer...');
    
    this.isRunning = false;
    
    // Remove all listeners
    this.contract.removeAllListeners();
    
    // Close database connection
    await this.db.close();
    
    console.log('✅ Indexer stopped');
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ==================== Main ====================

async function main() {
  const indexer = new VibeBadgeIndexer();

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n📴 Received SIGINT, shutting down gracefully...');
    await indexer.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\n📴 Received SIGTERM, shutting down gracefully...');
    await indexer.stop();
    process.exit(0);
  });

  // Start indexer
  try {
    await indexer.start();
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

export { VibeBadgeIndexer, Database };
