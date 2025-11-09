# VibePass Analytics & Dashboards

Complete analytics documentation for tracking VibePass metrics and building dashboards.

## 📊 Overview

This document provides SQL queries and metrics for monitoring the VibePass platform. Use these queries with dashboard tools like:
- **Metabase** - Open-source BI tool
- **Grafana** - With PostgreSQL data source
- **Superset** - Apache Superset for visualizations
- **Custom dashboards** - Using the provided SQL queries

## 🎯 Key Metrics

### 1. Badges Minted Per Day

Track daily minting activity to understand platform growth and usage patterns.

```sql
-- Daily badge minting with 7-day moving average
SELECT
    DATE(minted_at) as date,
    COUNT(*) as badges_minted,
    COUNT(DISTINCT owner) as unique_minters,
    AVG(COUNT(*)) OVER (
        ORDER BY DATE(minted_at)
        ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
    ) as moving_avg_7d
FROM badges
WHERE minted_at >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY DATE(minted_at)
ORDER BY date DESC;
```

**Visualization**: Line chart with badges_minted and moving_avg_7d

**Use Cases**:
- Track platform adoption
- Identify spikes (viral events)
- Monitor growth trends

---

### 2. Active Wallets

Track daily, weekly, and monthly active users.

```sql
-- Daily Active Wallets (DAW)
SELECT
    DATE(minted_at) as date,
    COUNT(DISTINCT owner) as daily_active_wallets
FROM badges
WHERE minted_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(minted_at)
ORDER BY date DESC;

-- Weekly Active Wallets (WAW)
SELECT
    DATE_TRUNC('week', minted_at) as week,
    COUNT(DISTINCT owner) as weekly_active_wallets
FROM badges
WHERE minted_at >= CURRENT_DATE - INTERVAL '180 days'
GROUP BY DATE_TRUNC('week', minted_at)
ORDER BY week DESC;

-- Monthly Active Wallets (MAW)
SELECT
    DATE_TRUNC('month', minted_at) as month,
    COUNT(DISTINCT owner) as monthly_active_wallets
FROM badges
WHERE minted_at >= CURRENT_DATE - INTERVAL '365 days'
GROUP BY DATE_TRUNC('month', minted_at)
ORDER BY month DESC;
```

**Visualization**: Line chart showing DAW, WAW, MAW trends

---

### 3. VibeScore Distribution

Understand how scores are distributed across users.

```sql
-- VibeScore distribution by ranges
SELECT
    CASE
        WHEN vibe_score < 100 THEN '0-99'
        WHEN vibe_score < 500 THEN '100-499'
        WHEN vibe_score < 1000 THEN '500-999'
        WHEN vibe_score < 2500 THEN '1000-2499'
        WHEN vibe_score < 5000 THEN '2500-4999'
        ELSE '5000+'
    END as score_range,
    COUNT(*) as user_count,
    ROUND(AVG(total_badges), 2) as avg_badges,
    ROUND(AVG(vibe_score), 2) as avg_score
FROM user_stats
GROUP BY score_range
ORDER BY MIN(vibe_score);

-- Top 10 VibeScores
SELECT
    u.wallet,
    u.farcaster_handle,
    us.vibe_score,
    us.total_badges,
    us.rare_badges,
    us.epic_badges,
    us.legendary_badges,
    us.global_rank
FROM user_stats us
JOIN users u ON us.wallet = u.wallet
ORDER BY us.vibe_score DESC
LIMIT 10;

-- Percentile analysis
SELECT
    PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY vibe_score) as p25,
    PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY vibe_score) as median,
    PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY vibe_score) as p75,
    PERCENTILE_CONT(0.90) WITHIN GROUP (ORDER BY vibe_score) as p90,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY vibe_score) as p95,
    MAX(vibe_score) as max_score
FROM user_stats;
```

**Visualization**: 
- Histogram for distribution
- Table for top users
- Box plot for percentiles

---

### 4. Top Event Hosts

Identify the most active event organizers.

```sql
-- Top hosts by badges issued
SELECT
    e.host_wallet,
    u.farcaster_handle,
    COUNT(b.id) as total_badges_issued,
    COUNT(DISTINCT b.owner) as unique_attendees,
    COUNT(DISTINCT e.id) as total_events,
    MIN(e.event_date) as first_event,
    MAX(e.event_date) as latest_event
FROM events e
LEFT JOIN badges b ON b.event_name = e.name
LEFT JOIN users u ON e.host_wallet = u.wallet
WHERE e.is_active = TRUE
GROUP BY e.host_wallet, u.farcaster_handle
ORDER BY total_badges_issued DESC
LIMIT 20;

-- Most popular events
SELECT
    event_name,
    COUNT(*) as attendees,
    COUNT(*) FILTER (WHERE rarity = 'Rare') as rare_count,
    COUNT(*) FILTER (WHERE rarity = 'Epic') as epic_count,
    COUNT(*) FILTER (WHERE rarity = 'Legendary') as legendary_count,
    MIN(minted_at) as first_mint,
    MAX(minted_at) as last_mint,
    DATE_PART('day', MAX(minted_at) - MIN(minted_at)) as event_duration_days
FROM badges
WHERE event_name IS NOT NULL
GROUP BY event_name
ORDER BY attendees DESC
LIMIT 20;
```

**Visualization**: 
- Bar chart for top hosts
- Table for event details

---

### 5. Rarity Analysis

Track badge rarity distribution and value.

```sql
-- Overall rarity distribution
SELECT
    rarity,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage,
    ROUND(AVG(CASE WHEN rarity = 'Rare' THEN 15
                   WHEN rarity = 'Epic' THEN 30
                   WHEN rarity = 'Legendary' THEN 50
                   ELSE 0 END), 2) as avg_bonus_points
FROM badges
WHERE rarity IS NOT NULL
GROUP BY rarity
ORDER BY 
    CASE rarity
        WHEN 'Common' THEN 1
        WHEN 'Rare' THEN 2
        WHEN 'Epic' THEN 3
        WHEN 'Legendary' THEN 4
    END;

-- Rarity trends over time
SELECT
    DATE_TRUNC('month', minted_at) as month,
    rarity,
    COUNT(*) as count
FROM badges
WHERE rarity IS NOT NULL
  AND minted_at >= CURRENT_DATE - INTERVAL '365 days'
GROUP BY DATE_TRUNC('month', minted_at), rarity
ORDER BY month DESC, rarity;
```

**Visualization**: 
- Pie chart for distribution
- Stacked area chart for trends

---

### 6. User Retention

Track user engagement over time.

```sql
-- Cohort retention analysis
WITH user_cohorts AS (
    SELECT
        wallet,
        DATE_TRUNC('month', MIN(created_at)) as cohort_month
    FROM users
    GROUP BY wallet
),
activity AS (
    SELECT
        b.owner as wallet,
        DATE_TRUNC('month', b.minted_at) as activity_month
    FROM badges b
)
SELECT
    uc.cohort_month,
    COUNT(DISTINCT uc.wallet) as cohort_size,
    COUNT(DISTINCT CASE WHEN a.activity_month = uc.cohort_month THEN a.wallet END) as month_0,
    COUNT(DISTINCT CASE WHEN a.activity_month = uc.cohort_month + INTERVAL '1 month' THEN a.wallet END) as month_1,
    COUNT(DISTINCT CASE WHEN a.activity_month = uc.cohort_month + INTERVAL '2 months' THEN a.wallet END) as month_2,
    COUNT(DISTINCT CASE WHEN a.activity_month = uc.cohort_month + INTERVAL '3 months' THEN a.wallet END) as month_3
FROM user_cohorts uc
LEFT JOIN activity a ON uc.wallet = a.wallet
WHERE uc.cohort_month >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY uc.cohort_month
ORDER BY uc.cohort_month DESC;

-- Churn analysis (users who haven't minted in 90 days)
SELECT
    COUNT(*) as total_users,
    COUNT(*) FILTER (WHERE last_badge_at >= CURRENT_DATE - INTERVAL '30 days') as active_last_30d,
    COUNT(*) FILTER (WHERE last_badge_at >= CURRENT_DATE - INTERVAL '90 days') as active_last_90d,
    COUNT(*) FILTER (WHERE last_badge_at < CURRENT_DATE - INTERVAL '90 days') as churned_users
FROM user_stats;
```

**Visualization**: 
- Cohort retention table
- Line chart for retention rates

---

### 7. Network Effects

Analyze social connections and virality.

```sql
-- Badge sharing rate (users who minted multiple badges)
SELECT
    total_badges as badges_per_user,
    COUNT(*) as user_count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM user_stats
GROUP BY total_badges
ORDER BY total_badges;

-- Event cross-attendance (users who attended multiple events)
WITH user_event_counts AS (
    SELECT
        owner,
        COUNT(DISTINCT event_name) as events_attended
    FROM badges
    WHERE event_name IS NOT NULL
    GROUP BY owner
)
SELECT
    events_attended,
    COUNT(*) as user_count,
    ROUND(AVG(events_attended), 2) as avg_events
FROM user_event_counts
GROUP BY events_attended
ORDER BY events_attended DESC;

-- Viral coefficient (new users brought in by existing users)
-- Requires referral tracking - placeholder query
SELECT
    DATE_TRUNC('week', created_at) as week,
    COUNT(*) as new_users
FROM users
GROUP BY week
ORDER BY week DESC;
```

**Visualization**: Distribution charts

---

### 8. Platform Health Metrics

Overall platform health and performance.

```sql
-- Platform overview (last 30 days)
SELECT
    (SELECT COUNT(*) FROM users WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as new_users,
    (SELECT COUNT(*) FROM badges WHERE minted_at >= CURRENT_DATE - INTERVAL '30 days') as badges_minted,
    (SELECT COUNT(DISTINCT owner) FROM badges WHERE minted_at >= CURRENT_DATE - INTERVAL '30 days') as active_wallets,
    (SELECT COUNT(*) FROM events WHERE event_date >= CURRENT_DATE - INTERVAL '30 days') as events_created,
    (SELECT AVG(vibe_score) FROM user_stats) as avg_vibe_score,
    (SELECT COUNT(*) FROM users) as total_users,
    (SELECT COUNT(*) FROM badges) as total_badges;

-- Growth rate (MoM)
WITH monthly_metrics AS (
    SELECT
        DATE_TRUNC('month', minted_at) as month,
        COUNT(*) as badges_minted,
        COUNT(DISTINCT owner) as active_users
    FROM badges
    GROUP BY DATE_TRUNC('month', minted_at)
)
SELECT
    month,
    badges_minted,
    active_users,
    LAG(badges_minted, 1) OVER (ORDER BY month) as prev_month_badges,
    ROUND((badges_minted - LAG(badges_minted, 1) OVER (ORDER BY month)) * 100.0 / 
          NULLIF(LAG(badges_minted, 1) OVER (ORDER BY month), 0), 2) as badges_growth_pct,
    ROUND((active_users - LAG(active_users, 1) OVER (ORDER BY month)) * 100.0 / 
          NULLIF(LAG(active_users, 1) OVER (ORDER BY month), 0), 2) as users_growth_pct
FROM monthly_metrics
ORDER BY month DESC;
```

**Visualization**: KPI cards and trend lines

---

### 9. Gas & Transaction Analysis

Monitor blockchain transaction costs.

```sql
-- Transaction volume by day
SELECT
    DATE(minted_at) as date,
    COUNT(*) as total_transactions,
    COUNT(DISTINCT tx_hash) as unique_transactions
FROM badges
WHERE minted_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(minted_at)
ORDER BY date DESC;

-- Block time analysis
SELECT
    DATE(minted_at) as date,
    MAX(block_number) - MIN(block_number) as blocks_mined,
    COUNT(*) as badges_minted,
    ROUND(COUNT(*) * 1.0 / NULLIF(MAX(block_number) - MIN(block_number), 0), 4) as badges_per_block
FROM badges
WHERE minted_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(minted_at)
ORDER BY date DESC;
```

**Visualization**: Line charts

---

### 10. Leaderboards

Real-time leaderboard queries.

```sql
-- Global leaderboard (by VibeScore)
SELECT
    ROW_NUMBER() OVER (ORDER BY us.vibe_score DESC, us.total_badges DESC) as rank,
    u.wallet,
    u.farcaster_handle,
    us.vibe_score,
    us.total_badges,
    us.rare_badges,
    us.epic_badges,
    us.legendary_badges,
    us.last_badge_at
FROM user_stats us
JOIN users u ON us.wallet = u.wallet
ORDER BY us.vibe_score DESC, us.total_badges DESC
LIMIT 100;

-- Event-specific leaderboard
SELECT
    ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC) as rank,
    owner,
    u.farcaster_handle,
    COUNT(*) as badges_from_event,
    STRING_AGG(DISTINCT rarity, ', ') as rarities
FROM badges b
LEFT JOIN users u ON b.owner = u.wallet
WHERE event_name = 'ETHGlobal 2024'  -- Replace with actual event name
GROUP BY owner, u.farcaster_handle
ORDER BY badges_from_event DESC
LIMIT 50;

-- Most valuable collectors (by rarity weighted score)
SELECT
    ROW_NUMBER() OVER (ORDER BY 
        (legendary_badges * 50 + epic_badges * 30 + rare_badges * 15) DESC
    ) as rank,
    u.wallet,
    u.farcaster_handle,
    us.legendary_badges,
    us.epic_badges,
    us.rare_badges,
    (us.legendary_badges * 50 + us.epic_badges * 30 + us.rare_badges * 15) as rarity_score
FROM user_stats us
JOIN users u ON us.wallet = u.wallet
WHERE us.total_badges > 0
ORDER BY rarity_score DESC
LIMIT 50;
```

**Visualization**: Leaderboard tables

---

## 📈 Dashboard Templates

### Executive Dashboard (KPIs)

```sql
-- Single query for all top-level metrics
SELECT
    'Total Users' as metric, COUNT(*)::TEXT as value FROM users
UNION ALL
SELECT 'Total Badges', COUNT(*)::TEXT FROM badges
UNION ALL
SELECT 'Active Users (30d)', COUNT(DISTINCT owner)::TEXT 
    FROM badges WHERE minted_at >= CURRENT_DATE - INTERVAL '30 days'
UNION ALL
SELECT 'Avg VibeScore', ROUND(AVG(vibe_score))::TEXT FROM user_stats
UNION ALL
SELECT 'Total Events', COUNT(*)::TEXT FROM events
UNION ALL
SELECT 'Badges Today', COUNT(*)::TEXT 
    FROM badges WHERE DATE(minted_at) = CURRENT_DATE;
```

### Growth Dashboard

```sql
-- Week-over-week growth
WITH weekly_stats AS (
    SELECT
        DATE_TRUNC('week', minted_at) as week,
        COUNT(*) as badges,
        COUNT(DISTINCT owner) as users
    FROM badges
    WHERE minted_at >= CURRENT_DATE - INTERVAL '90 days'
    GROUP BY week
)
SELECT
    week,
    badges,
    users,
    badges - LAG(badges) OVER (ORDER BY week) as badges_wow,
    users - LAG(users) OVER (ORDER BY week) as users_wow,
    ROUND((badges - LAG(badges) OVER (ORDER BY week)) * 100.0 / 
          NULLIF(LAG(badges) OVER (ORDER BY week), 0), 2) as badges_wow_pct
FROM weekly_stats
ORDER BY week DESC;
```

---

## 🔧 Utility Queries

### Clear test data

```sql
-- WARNING: Only run in development!
DELETE FROM badge_transfers WHERE token_id < 1000;
DELETE FROM badges WHERE token_id < 1000;
-- Note: user_stats will auto-update via triggers
```

### Recalculate all stats

```sql
-- Recalculate user_stats for all users
TRUNCATE user_stats;

INSERT INTO user_stats (wallet, total_badges, rare_badges, epic_badges, legendary_badges, vibe_score, last_badge_at)
SELECT
    owner,
    COUNT(*) as total_badges,
    COUNT(*) FILTER (WHERE rarity = 'Rare') as rare_badges,
    COUNT(*) FILTER (WHERE rarity = 'Epic') as epic_badges,
    COUNT(*) FILTER (WHERE rarity = 'Legendary') as legendary_badges,
    (COUNT(*) * 10) +
    (COUNT(*) FILTER (WHERE rarity = 'Rare') * 15) +
    (COUNT(*) FILTER (WHERE rarity = 'Epic') * 30) +
    (COUNT(*) FILTER (WHERE rarity = 'Legendary') * 50) +
    CASE WHEN COUNT(*) >= 50 THEN 500 WHEN COUNT(*) >= 25 THEN 250 WHEN COUNT(*) >= 10 THEN 100 ELSE 0 END as vibe_score,
    MAX(minted_at) as last_badge_at
FROM badges
GROUP BY owner;

-- Update ranks
SELECT update_global_ranks();
```

---

## 🎨 Visualization Recommendations

| Metric | Chart Type | Refresh Rate |
|--------|-----------|--------------|
| Badges Per Day | Line chart | Real-time |
| Active Wallets | Line chart | Hourly |
| VibeScore Distribution | Histogram | Daily |
| Top Hosts | Bar chart | Daily |
| Rarity Distribution | Pie chart | Real-time |
| Leaderboard | Table | Real-time |
| Retention Cohorts | Heatmap | Weekly |
| Growth Rates | Line chart | Daily |

---

## 🚀 Next Steps

1. **Set up Metabase/Grafana** - Connect to Postgres
2. **Create dashboards** - Use queries above
3. **Set up alerts** - Monitor anomalies
4. **Export to CSV** - For offline analysis
5. **API endpoints** - Expose metrics via REST API

---

## 📚 Additional Resources

- [PostgreSQL Aggregate Functions](https://www.postgresql.org/docs/current/functions-aggregate.html)
- [Window Functions](https://www.postgresql.org/docs/current/tutorial-window.html)
- [Metabase Setup Guide](https://www.metabase.com/docs/latest/)
- [Grafana PostgreSQL](https://grafana.com/docs/grafana/latest/datasources/postgres/)

---

**Last Updated**: 2025-11-08  
**Database Schema**: 001_init.sql  
**Indexer**: services/indexer.ts
