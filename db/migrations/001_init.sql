-- ==================== VibeBadge Database Schema ====================
-- Migration: 001_init.sql
-- Description: Initial database schema for VibePass platform
-- Author: VibeBadge Team
-- Date: 2025-11-08
-- =====================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ======================= USERS TABLE =======================

-- Stores wallet addresses and associated user data
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    wallet VARCHAR(42) NOT NULL UNIQUE, -- Ethereum address (checksummed or lowercase)
    farcaster_handle VARCHAR(255), -- Optional Farcaster username
    farcaster_fid BIGINT, -- Farcaster ID
    ens_name VARCHAR(255), -- ENS domain name
    email VARCHAR(255), -- Optional email
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    CONSTRAINT wallet_valid CHECK (wallet ~ '^0x[a-fA-F0-9]{40}$')
);

-- Indexes for users table
CREATE INDEX idx_users_wallet ON users(wallet);
CREATE INDEX idx_users_farcaster_handle ON users(farcaster_handle);
CREATE INDEX idx_users_farcaster_fid ON users(farcaster_fid);
CREATE INDEX idx_users_created_at ON users(created_at DESC);

-- ======================= BADGES TABLE =======================

-- Stores all minted badges (NFTs)
CREATE TABLE IF NOT EXISTS badges (
    id SERIAL PRIMARY KEY,
    token_id INTEGER NOT NULL UNIQUE, -- NFT token ID (from contract)
    owner VARCHAR(42) NOT NULL, -- Current owner address
    token_uri TEXT NOT NULL, -- IPFS URI or metadata URL
    tx_hash VARCHAR(66) NOT NULL, -- Minting transaction hash
    block_number BIGINT NOT NULL, -- Block number when minted
    minted_at TIMESTAMP WITH TIME ZONE NOT NULL, -- Block timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Metadata (denormalized for faster queries)
    metadata_name VARCHAR(255), -- Badge name from metadata
    metadata_description TEXT, -- Badge description
    metadata_image TEXT, -- IPFS image URL
    
    -- Attributes from metadata
    event_name VARCHAR(255), -- Event name
    event_date DATE, -- Event date
    rarity VARCHAR(50), -- Common, Rare, Epic, Legendary
    
    -- Constraints
    CONSTRAINT token_id_positive CHECK (token_id >= 0),
    CONSTRAINT owner_valid CHECK (owner ~ '^0x[a-fA-F0-9]{40}$'),
    CONSTRAINT tx_hash_valid CHECK (tx_hash ~ '^0x[a-fA-F0-9]{64}$'),
    
    -- Foreign key to users
    CONSTRAINT fk_owner FOREIGN KEY (owner) REFERENCES users(wallet) ON DELETE CASCADE
);

-- Indexes for badges table
CREATE INDEX idx_badges_token_id ON badges(token_id);
CREATE INDEX idx_badges_owner ON badges(owner);
CREATE INDEX idx_badges_tx_hash ON badges(tx_hash);
CREATE INDEX idx_badges_block_number ON badges(block_number DESC);
CREATE INDEX idx_badges_minted_at ON badges(minted_at DESC);
CREATE INDEX idx_badges_event_name ON badges(event_name);
CREATE INDEX idx_badges_rarity ON badges(rarity);
CREATE INDEX idx_badges_event_date ON badges(event_date DESC);

-- Composite indexes for common queries
CREATE INDEX idx_badges_owner_minted ON badges(owner, minted_at DESC);
CREATE INDEX idx_badges_event_date ON badges(event_name, event_date DESC);

-- ======================= BADGE TRANSFERS TABLE =======================

-- Tracks all badge transfers (for history and analytics)
CREATE TABLE IF NOT EXISTS badge_transfers (
    id SERIAL PRIMARY KEY,
    token_id INTEGER NOT NULL,
    from_address VARCHAR(42) NOT NULL, -- 0x0 for minting
    to_address VARCHAR(42) NOT NULL,
    tx_hash VARCHAR(66) NOT NULL,
    block_number BIGINT NOT NULL,
    transferred_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign key
    CONSTRAINT fk_token_id FOREIGN KEY (token_id) REFERENCES badges(token_id) ON DELETE CASCADE
);

-- Indexes for transfers
CREATE INDEX idx_transfers_token_id ON badge_transfers(token_id);
CREATE INDEX idx_transfers_from ON badge_transfers(from_address);
CREATE INDEX idx_transfers_to ON badge_transfers(to_address);
CREATE INDEX idx_transfers_tx_hash ON badge_transfers(tx_hash);
CREATE INDEX idx_transfers_timestamp ON badge_transfers(transferred_at DESC);

-- ======================= EVENTS TABLE =======================

-- Stores event information (event hosts, metadata)
CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,
    event_id UUID DEFAULT uuid_generate_v4() UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    location VARCHAR(255),
    event_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    host_wallet VARCHAR(42), -- Event host/organizer
    badge_template_uri TEXT, -- Default badge metadata template
    max_attendees INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign key
    CONSTRAINT fk_host FOREIGN KEY (host_wallet) REFERENCES users(wallet) ON DELETE SET NULL
);

-- Indexes for events
CREATE INDEX idx_events_name ON events(name);
CREATE INDEX idx_events_date ON events(event_date DESC);
CREATE INDEX idx_events_host ON events(host_wallet);
CREATE INDEX idx_events_active ON events(is_active);

-- ======================= USER STATS TABLE =======================

-- Aggregated user statistics (denormalized for performance)
CREATE TABLE IF NOT EXISTS user_stats (
    wallet VARCHAR(42) PRIMARY KEY,
    total_badges INTEGER DEFAULT 0,
    rare_badges INTEGER DEFAULT 0,
    epic_badges INTEGER DEFAULT 0,
    legendary_badges INTEGER DEFAULT 0,
    vibe_score INTEGER DEFAULT 0,
    global_rank INTEGER,
    last_badge_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign key
    CONSTRAINT fk_wallet FOREIGN KEY (wallet) REFERENCES users(wallet) ON DELETE CASCADE
);

-- Indexes for user stats
CREATE INDEX idx_user_stats_vibe_score ON user_stats(vibe_score DESC);
CREATE INDEX idx_user_stats_total_badges ON user_stats(total_badges DESC);
CREATE INDEX idx_user_stats_rank ON user_stats(global_rank);

-- ======================= INDEXER STATE TABLE =======================

-- Tracks indexer progress for resumption after restarts
CREATE TABLE IF NOT EXISTS indexer_state (
    id INTEGER PRIMARY KEY DEFAULT 1,
    last_block BIGINT NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure only one row exists
    CONSTRAINT single_row CHECK (id = 1)
);

-- Initialize with default row
INSERT INTO indexer_state (id, last_block) VALUES (1, 0) ON CONFLICT (id) DO NOTHING;

-- ======================= ANALYTICS VIEWS =======================

-- View: Daily badge minting statistics
CREATE OR REPLACE VIEW daily_badge_stats AS
SELECT
    DATE(minted_at) as date,
    COUNT(*) as badges_minted,
    COUNT(DISTINCT owner) as unique_minters,
    COUNT(DISTINCT event_name) as unique_events
FROM badges
GROUP BY DATE(minted_at)
ORDER BY date DESC;

-- View: Badge rarity distribution
CREATE OR REPLACE VIEW rarity_distribution AS
SELECT
    rarity,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM badges
WHERE rarity IS NOT NULL
GROUP BY rarity
ORDER BY count DESC;

-- View: Top collectors
CREATE OR REPLACE VIEW top_collectors AS
SELECT
    u.wallet,
    u.farcaster_handle,
    us.total_badges,
    us.vibe_score,
    us.global_rank,
    us.last_badge_at
FROM users u
JOIN user_stats us ON u.wallet = us.wallet
ORDER BY us.vibe_score DESC, us.total_badges DESC
LIMIT 100;

-- View: Event leaderboard (most badges issued)
CREATE OR REPLACE VIEW event_leaderboard AS
SELECT
    event_name,
    COUNT(*) as total_badges,
    COUNT(DISTINCT owner) as unique_attendees,
    MIN(minted_at) as first_badge_at,
    MAX(minted_at) as last_badge_at
FROM badges
WHERE event_name IS NOT NULL
GROUP BY event_name
ORDER BY total_badges DESC;

-- ======================= TRIGGERS =======================

-- Trigger: Update user_stats when badge is minted or transferred
CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Recalculate stats for the owner
    INSERT INTO user_stats (wallet, total_badges, rare_badges, epic_badges, legendary_badges, vibe_score, last_badge_at, updated_at)
    SELECT
        NEW.owner,
        COUNT(*) as total_badges,
        COUNT(*) FILTER (WHERE rarity = 'Rare') as rare_badges,
        COUNT(*) FILTER (WHERE rarity = 'Epic') as epic_badges,
        COUNT(*) FILTER (WHERE rarity = 'Legendary') as legendary_badges,
        -- VibeScore calculation: 10 per badge + rarity bonuses + milestones
        (COUNT(*) * 10) +
        (COUNT(*) FILTER (WHERE rarity = 'Rare') * 15) +
        (COUNT(*) FILTER (WHERE rarity = 'Epic') * 30) +
        (COUNT(*) FILTER (WHERE rarity = 'Legendary') * 50) +
        CASE WHEN COUNT(*) >= 50 THEN 500 WHEN COUNT(*) >= 25 THEN 250 WHEN COUNT(*) >= 10 THEN 100 ELSE 0 END as vibe_score,
        MAX(minted_at) as last_badge_at,
        NOW() as updated_at
    FROM badges
    WHERE owner = NEW.owner
    ON CONFLICT (wallet) DO UPDATE SET
        total_badges = EXCLUDED.total_badges,
        rare_badges = EXCLUDED.rare_badges,
        epic_badges = EXCLUDED.epic_badges,
        legendary_badges = EXCLUDED.legendary_badges,
        vibe_score = EXCLUDED.vibe_score,
        last_badge_at = EXCLUDED.last_badge_at,
        updated_at = EXCLUDED.updated_at;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_stats
AFTER INSERT OR UPDATE ON badges
FOR EACH ROW
EXECUTE FUNCTION update_user_stats();

-- Trigger: Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_badges_updated_at BEFORE UPDATE ON badges
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ======================= SAMPLE DATA (for testing) =======================

-- Insert sample users
INSERT INTO users (wallet, farcaster_handle) VALUES
    ('0x742d35cc6634c0532925a3b844bc454e4438f44e', 'alice'),
    ('0x1234567890123456789012345678901234567890', 'bob'),
    ('0xabcdefabcdefabcdefabcdefabcdefabcdefabcd', 'carol')
ON CONFLICT (wallet) DO NOTHING;

-- ======================= USEFUL FUNCTIONS =======================

-- Function: Calculate global ranks
CREATE OR REPLACE FUNCTION update_global_ranks()
RETURNS void AS $$
BEGIN
    WITH ranked_users AS (
        SELECT
            wallet,
            ROW_NUMBER() OVER (ORDER BY vibe_score DESC, total_badges DESC) as rank
        FROM user_stats
    )
    UPDATE user_stats us
    SET global_rank = ru.rank
    FROM ranked_users ru
    WHERE us.wallet = ru.wallet;
END;
$$ LANGUAGE plpgsql;

-- Function: Get user badges with metadata
CREATE OR REPLACE FUNCTION get_user_badges(user_wallet VARCHAR(42))
RETURNS TABLE (
    token_id INTEGER,
    token_uri TEXT,
    metadata_name VARCHAR(255),
    metadata_image TEXT,
    event_name VARCHAR(255),
    rarity VARCHAR(50),
    minted_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        b.token_id,
        b.token_uri,
        b.metadata_name,
        b.metadata_image,
        b.event_name,
        b.rarity,
        b.minted_at
    FROM badges b
    WHERE b.owner = LOWER(user_wallet)
    ORDER BY b.minted_at DESC;
END;
$$ LANGUAGE plpgsql;

-- ======================= COMMENTS =======================

COMMENT ON TABLE users IS 'Stores wallet addresses and user profile information';
COMMENT ON TABLE badges IS 'Stores all minted NFT badges with metadata';
COMMENT ON TABLE badge_transfers IS 'Historical record of all badge transfers';
COMMENT ON TABLE events IS 'Event information and organizer details';
COMMENT ON TABLE user_stats IS 'Aggregated user statistics for leaderboards';
COMMENT ON TABLE indexer_state IS 'Tracks blockchain indexer progress';

COMMENT ON COLUMN badges.token_id IS 'Unique token ID from the smart contract';
COMMENT ON COLUMN badges.owner IS 'Current owner wallet address (lowercase)';
COMMENT ON COLUMN badges.token_uri IS 'IPFS URI pointing to metadata JSON';
COMMENT ON COLUMN users.farcaster_handle IS 'Optional Farcaster username for social features';

-- ======================= GRANTS (adjust as needed) =======================

-- Grant permissions to application user
-- CREATE USER vibepass_app WITH PASSWORD 'your-secure-password';
-- GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO vibepass_app;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO vibepass_app;

-- ======================= END =======================

-- Run this migration:
-- psql -U postgres -d vibepass -f db/migrations/001_init.sql
