-- Create user_stats table for leaderboard tracking
-- Paste this into Supabase SQL Editor and run

CREATE TABLE IF NOT EXISTS user_stats (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  address TEXT UNIQUE NOT NULL,
  totalMints BIGINT DEFAULT 0,
  totalCheckIns BIGINT DEFAULT 0,
  lastActive TIMESTAMPTZ,
  createdAt TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT address_format CHECK (address ~ '^0x[a-fA-F0-9]{40}$')
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_stats_totalMints ON user_stats(totalMints DESC);
CREATE INDEX IF NOT EXISTS idx_user_stats_address ON user_stats(address);

-- Enable RLS (Row Level Security) for public access
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

-- Allow public to read (for leaderboard)
CREATE POLICY "Enable read access for all users" ON user_stats
  FOR SELECT USING (true);

-- Allow public to insert/update their own stats
CREATE POLICY "Enable insert for all users" ON user_stats
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON user_stats
  FOR UPDATE USING (true);
