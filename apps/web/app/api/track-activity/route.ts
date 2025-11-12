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

    const addressLower = address.toLowerCase();

    // Check if user exists
    const { data: existingUsers, error: checkError } = await supabase
      .from('user_stats')
      .select('*')
      .eq('address', addressLower);

    if (checkError) {
      console.error('Supabase check error:', checkError);
      return NextResponse.json(
        { error: 'Failed to check user', details: checkError },
        { status: 500 }
      );
    }

    if (existingUsers && existingUsers.length > 0) {
      // Update existing user
      const user = existingUsers[0];
      let updateData: any = {
        lastActive: new Date().toISOString(),
      };

      if (actionType === 'mint') {
        updateData.totalMints = user.totalMints + 1;
      } else if (actionType === 'checkin') {
        updateData.totalCheckIns = user.totalCheckIns + 1;
      }

      console.log('Updating user:', addressLower, updateData);

      const { data: updateResult, error: updateError } = await supabase
        .from('user_stats')
        .update(updateData)
        .eq('address', addressLower)
        .select();

      if (updateError) {
        console.error('Supabase update error:', updateError);
        return NextResponse.json(
          { error: 'Failed to update user stats', details: updateError },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, data: updateResult?.[0] });
    } else {
      // Create new user
      let initialData = {
        address: addressLower,
        totalMints: actionType === 'mint' ? 1 : 0,
        totalCheckIns: actionType === 'checkin' ? 1 : 0,
        lastActive: new Date().toISOString(),
      };

      console.log('Creating new user:', initialData);

      const { data: insertResult, error: insertError } = await supabase
        .from('user_stats')
        .insert([initialData])
        .select();

      if (insertError) {
        console.error('Supabase insert error:', insertError);
        return NextResponse.json(
          { error: 'Failed to create user stats', details: insertError },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, data: insertResult?.[0] });
    }
  } catch (error) {
    console.error('Track activity error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
