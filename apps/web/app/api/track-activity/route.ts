import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseClient();
    const { address, actionType } = await request.json();

    if (!address || !actionType) {
      return NextResponse.json(
        { error: 'Missing address or actionType' },
        { status: 400 }
      );
    }

    // Validate Ethereum address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return NextResponse.json(
        { error: 'Invalid Ethereum address' },
        { status: 400 }
      );
    }

    // Check if user exists
    const { data: existingUser } = await supabase
      .from('user_stats')
      .select('*')
      .eq('address', address.toLowerCase())
      .single();

    if (existingUser) {
      // Update existing user
      let updateData: any = {
        lastActive: new Date().toISOString(),
      };

      if (actionType === 'mint') {
        updateData.totalMints = existingUser.totalMints + 1;
      } else if (actionType === 'checkin') {
        updateData.totalCheckIns = existingUser.totalCheckIns + 1;
      }

      const { data, error } = await supabase
        .from('user_stats')
        .update(updateData)
        .eq('address', address.toLowerCase())
        .select()
        .single();

      if (error) {
        console.error('Supabase update error:', error);
        return NextResponse.json(
          { error: 'Failed to update user stats' },
          { status: 500 }
        );
      }

      return NextResponse.json(data);
    } else {
      // Create new user
      let initialData = {
        address: address.toLowerCase(),
        totalMints: actionType === 'mint' ? 1 : 0,
        totalCheckIns: actionType === 'checkin' ? 1 : 0,
        lastActive: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('user_stats')
        .insert([initialData])
        .select()
        .single();

      if (error) {
        console.error('Supabase insert error:', error);
        return NextResponse.json(
          { error: 'Failed to create user stats' },
          { status: 500 }
        );
      }

      return NextResponse.json(data);
    }
  } catch (error) {
    console.error('Track activity error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
