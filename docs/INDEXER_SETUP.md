# VibeBadge Indexer Setup Guide

Complete guide for setting up and running the blockchain event indexer.

## 📋 Prerequisites

1. **PostgreSQL 14+** installed and running
2. **Node.js 18+** with npm
3. **Deployed VibeBadge contract** on Base network
4. **RPC endpoint** (Alchemy, Infura, or self-hosted)

## 🚀 Quick Start

### 1. Install Dependencies

```bash
# Root dependencies (if not already installed)
npm install

# Required packages for indexer
npm install pg ethers dotenv
npm install -D @types/pg
```

### 2. Setup PostgreSQL Database

```bash
# Create database
createdb vibepass

# Or using psql
psql -U postgres
CREATE DATABASE vibepass;
\q

# Run migration
psql -U postgres -d vibepass -f db/migrations/001_init.sql
```

**Verify tables created:**
```bash
psql -U postgres -d vibepass -c "\dt"
```

You should see:
- users
- badges
- badge_transfers
- events
- user_stats
- indexer_state

### 3. Configure Environment

```bash
cd services
cp .env.example .env

# Edit .env with your settings
nano .env
```

**Required variables:**
```env
RPC_URL=https://mainnet.base.org  # or your RPC endpoint
CONTRACT_ADDRESS=0x...             # your deployed contract
DB_HOST=localhost
DB_PORT=5432
DB_NAME=vibepass
DB_USER=postgres
DB_PASSWORD=your-password
```

### 4. Run the Indexer

```bash
# From root directory
ts-node services/indexer.ts

# Or with specific FROM_BLOCK
FROM_BLOCK=12345678 ts-node services/indexer.ts
```

**Expected output:**
```
🚀 Starting VibeBadge Indexer...
Config: { rpcUrl: 'https://mainnet.base.org', contractAddress: '0x...', fromBlock: 0 }
✅ Database connected
✅ Provider connected to network: base chainId: 8453
📝 Resuming from last indexed block: 15000000
📚 Backfilling events from block 15000000...
Processing blocks 15000000 to 15001000...
Found 25 BadgeMinted events
✅ Indexed badge #1 at block 15000123
✅ Indexed badge #2 at block 15000456
...
✅ Backfill complete up to block 15050000
👂 Listening for new events...
```

## 🔧 Advanced Configuration

### Using PM2 (Production)

```bash
# Install PM2
npm install -g pm2

# Create ecosystem file
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'vibepass-indexer',
    script: 'services/indexer.ts',
    interpreter: 'ts-node',
    env: {
      NODE_ENV: 'production',
      FROM_BLOCK: '0',
    },
    error_file: './logs/indexer-error.log',
    out_file: './logs/indexer-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    restart_delay: 5000,
    max_restarts: 10,
  }]
};
EOF

# Start indexer
pm2 start ecosystem.config.js

# Monitor
pm2 logs vibepass-indexer
pm2 monit

# Stop
pm2 stop vibepass-indexer
```

### Using Docker

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm install
RUN npm install -g ts-node

# Copy source
COPY services/ ./services/
COPY contracts/ ./contracts/

# Run indexer
CMD ["ts-node", "services/indexer.ts"]
```

```bash
# Build
docker build -t vibepass-indexer .

# Run
docker run -d \
  --name vibepass-indexer \
  --env-file services/.env \
  vibepass-indexer

# Logs
docker logs -f vibepass-indexer
```

### Using Docker Compose (with PostgreSQL)

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: vibepass
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./db/migrations:/docker-entrypoint-initdb.d
    ports:
      - "5432:5432"

  indexer:
    build: .
    depends_on:
      - postgres
    environment:
      RPC_URL: ${RPC_URL}
      CONTRACT_ADDRESS: ${CONTRACT_ADDRESS}
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: vibepass
      DB_USER: postgres
      DB_PASSWORD: postgres
    restart: unless-stopped

volumes:
  postgres_data:
```

```bash
# Start everything
docker-compose up -d

# View logs
docker-compose logs -f indexer

# Stop
docker-compose down
```

## 📊 Monitoring

### Check Indexer Status

```sql
-- Last indexed block
SELECT * FROM indexer_state;

-- Recent badges indexed
SELECT token_id, owner, block_number, minted_at
FROM badges
ORDER BY block_number DESC
LIMIT 10;

-- Indexer lag (blocks behind)
SELECT
    (SELECT last_block FROM indexer_state) as indexed_block,
    -- Replace with actual current block from Base
    15500000 as current_block,
    15500000 - (SELECT last_block FROM indexer_state) as blocks_behind;
```

### Health Check Endpoint

Add to your API:

```typescript
// apps/web/pages/api/indexer/health.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { Pool } from 'pg';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    const result = await pool.query('SELECT * FROM indexer_state');
    const state = result.rows[0];

    res.status(200).json({
      healthy: true,
      lastBlock: state.last_block,
      updatedAt: state.updated_at,
    });
  } catch (error) {
    res.status(500).json({
      healthy: false,
      error: 'Database connection failed',
    });
  } finally {
    await pool.end();
  }
}
```

## 🐛 Troubleshooting

### Indexer won't start

```bash
# Check database connection
psql -U postgres -d vibepass -c "SELECT 1;"

# Check RPC connection
curl -X POST $RPC_URL \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# Check contract address
cast code $CONTRACT_ADDRESS --rpc-url $RPC_URL
```

### Indexer is behind

```sql
-- Check lag
SELECT
    last_block,
    NOW() - updated_at as time_since_update
FROM indexer_state;
```

If behind by >1000 blocks:
1. Increase `BATCH_SIZE` to 5000
2. Reduce `CONFIRMATIONS` to 1 (testnet only)
3. Use faster RPC endpoint

### Missing events

```bash
# Reindex from specific block
FROM_BLOCK=15000000 ts-node services/indexer.ts
```

### Database errors

```sql
-- Check table exists
\dt

-- Check indexes
\di

-- Verify foreign keys
SELECT * FROM users LIMIT 1;
SELECT * FROM badges LIMIT 1;
```

## 📈 Performance Optimization

### Database Indexes

Already created in migration, but verify:

```sql
-- Check index usage
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
```

### Connection Pooling

Adjust pool size in `indexer.ts`:

```typescript
database: {
  max: 20, // Increase for high-volume
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
}
```

### Batch Processing

For initial sync, increase batch size:

```bash
BATCH_SIZE=10000 FROM_BLOCK=15000000 ts-node services/indexer.ts
```

## 🔐 Security

### Database User Permissions

```sql
-- Create read-only user for analytics
CREATE USER analytics_readonly WITH PASSWORD 'secure-password';
GRANT CONNECT ON DATABASE vibepass TO analytics_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO analytics_readonly;

-- Create app user with limited permissions
CREATE USER vibepass_indexer WITH PASSWORD 'secure-password';
GRANT CONNECT ON DATABASE vibepass TO vibepass_indexer;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO vibepass_indexer;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO vibepass_indexer;
```

### RPC Rate Limiting

Use rate limiting to avoid bans:

```typescript
// Add to indexer.ts
import Bottleneck from 'bottleneck';

const limiter = new Bottleneck({
  maxConcurrent: 1,
  minTime: 100, // 100ms between requests
});

// Wrap RPC calls
const events = await limiter.schedule(() =>
  contract.queryFilter(filter, fromBlock, toBlock)
);
```

## 📚 Additional Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Ethers.js Docs](https://docs.ethers.org/)
- [Base Network RPC](https://docs.base.org/tools/node-providers/)
- [PM2 Process Manager](https://pm2.keymetrics.io/)

---

**Need Help?**
- Check logs: `pm2 logs vibepass-indexer`
- Query database: `psql -U postgres -d vibepass`
- Test RPC: `curl -X POST $RPC_URL ...`
