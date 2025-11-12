import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    const supabase = createSupabaseClient();
    const address = params.address.toLowerCase();

    // Validate address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return NextResponse.json(
        { error: 'Invalid Ethereum address' },
        { status: 400 }
      );
    }

    // Get all users sorted by mints to calculate rank
    const { data: allUsers, error: queryError } = await supabase
      .from('user_stats')
      .select('address, totalMints')
      .order('totalMints', { ascending: false });

    if (queryError) {
      console.error('Supabase query error:', queryError);
      return NextResponse.json(
        { error: 'Failed to fetch user rank' },
        { status: 500 }
      );
    }

    // Find user rank
    const userRank = allUsers.findIndex((u) => u.address === address) + 1;

    // Get user stats
    const { data: userStats, error: userError } = await supabase
      .from('user_stats')
      .select('*')
      .eq('address', address)
      .single();

    if (userError && userError.code !== 'PGRST116') {
      // PGRST116 = no rows found
      console.error('Supabase user error:', userError);
      return NextResponse.json(
        { error: 'Failed to fetch user stats' },
        { status: 500 }
      );
    }

    if (!userStats) {
      // User not found in database
      return NextResponse.json(
        {
          address,
          rank: allUsers.length + 1,
          totalMints: 0,
          totalCheckIns: 0,
          lastActive: null,
          createdAt: null,
        },
        { status: 200 }
      );
    }

    return NextResponse.json({
      ...userStats,
      rank: userRank,
      totalUsers: allUsers.length,
    });
  } catch (error) {
    console.error('User rank error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
