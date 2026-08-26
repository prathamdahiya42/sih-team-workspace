import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { teamId } = await req.json();
    if (!teamId) {
      return NextResponse.json({ error: 'teamId is required' }, { status: 400 });
    }

    // Generate high-entropy crypto-random room name
    const randomSuffix = crypto.randomUUID().replace(/-/g, '').slice(0, 16);
    const roomName = `sih-${teamId.slice(0, 8)}-${randomSuffix}`;

    // Create call record
    const { data: call, error: callError } = await supabase
      .from('calls')
      .insert({
        team_id: teamId,
        room_name: roomName,
        started_by: user.id,
      })
      .select()
      .single();

    if (callError) {
      return NextResponse.json({ error: callError.message }, { status: 500 });
    }

    // Post system message into chat
    const callerName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'A teammate';
    await supabase.from('messages').insert({
      team_id: teamId,
      user_id: null,
      content: `📞 ${callerName} started a live team meeting.`,
      type: 'system',
      meta: { call_id: call.id, room_name: roomName },
    });

    return NextResponse.json({ callId: call.id, roomName });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
