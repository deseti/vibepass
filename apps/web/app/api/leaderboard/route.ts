import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const limit = request.nextUrl.searchParams.get('limit') || '10';
    const limitNum = Math.min(parseInt(limit), 100); // Max 100

    const { data, error } = await supabase
      .from('user_stats')
      .select('*')
      .order('totalMints', { ascending: false })
      .limit(limitNum);

    if (error) {
      console.error('Supabase query error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch leaderboard' },
        { status: 500 }
      );
    }

    // Add rank to each entry
    const leaderboard = data.map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));

    return NextResponse.json(leaderboard);
  } catch (error) {
    console.error('Leaderboard error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
