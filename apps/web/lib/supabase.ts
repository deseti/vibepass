import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type UserStats = {
  id: string;
  address: string;
  totalMints: number;
  totalCheckIns: number;
  lastActive: string | null;
  createdAt: string;
};

export type LeaderboardEntry = UserStats & {
  rank: number;
};
