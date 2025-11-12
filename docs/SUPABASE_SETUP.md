# Setup Supabase Leaderboard

Ikuti langkah-langkah ini untuk setup database untuk leaderboard tracking:

## 1. Go to Supabase Dashboard
- Open: https://supabase.com/dashboard
- Select project: "vibepass" or create one
- Go to SQL Editor

## 2. Create Table
Copy-paste SQL berikut ke SQL Editor dan klik "Run":

```sql
CREATE TABLE IF NOT EXISTS user_stats (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  address TEXT UNIQUE NOT NULL,
  totalMints BIGINT DEFAULT 0,
  totalCheckIns BIGINT DEFAULT 0,
  lastActive TIMESTAMPTZ,
  createdAt TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT address_format CHECK (address ~ '^0x[a-fA-F0-9]{40}$')
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_user_stats_totalMints ON user_stats(totalMints DESC);
CREATE INDEX IF NOT EXISTS idx_user_stats_address ON user_stats(address);

-- Enable RLS (Row Level Security)
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

-- Allow public read access (for leaderboard)
CREATE POLICY "Enable read access for all users" ON user_stats
  FOR SELECT USING (true);

-- Allow public insert/update
CREATE POLICY "Enable insert for all users" ON user_stats
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON user_stats
  FOR UPDATE USING (true);
```

## 3. Verify Setup
- Go to "Authentication" → "Policies" tab
- Verify 3 policies are created
- Go to "Browser" tab and click "user_stats" table
- Table should be empty initially (will populate as users mint/checkin)

## 4. API Endpoints Available

Once table is created, these endpoints are live:

### Track Activity (called automatically on mint/checkin)
```
POST /api/track-activity
Body: { address: "0x...", actionType: "mint" | "checkin" }
```

### Get Leaderboard
```
GET /api/leaderboard?limit=10
Response: Array of top users sorted by totalMints
```

### Get User Rank
```
GET /api/user-rank/[address]
Response: { address, rank, totalMints, totalCheckIns, totalUsers, ... }
```

## 5. Testing
- Go to https://app.vibepas.xyz/stats
- Connect wallet
- Mint a badge or check-in
- After transaction succeeds, user should appear in leaderboard
- Stats page will show real-time rankings

## Environment Variables
Already added to `.env.local`:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY

## Troubleshooting

### "Failed to fetch leaderboard"
- Check if user_stats table exists in Supabase
- Verify RLS policies are enabled
- Check browser console for API errors

### "Invalid Ethereum address"
- Make sure address format is: 0x + 40 hex characters
- All addresses are converted to lowercase

### No data appears
- Wait 10+ seconds after mint/checkin (polling interval is 10 seconds)
- Check if transaction was successful on BaseScan
- Check `/api/track-activity` response in network tab

---

Setup complete! Your leaderboard is now live 🎉
