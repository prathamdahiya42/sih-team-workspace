import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { callId, teamId } = await req.json();
    if (!callId) {
      return NextResponse.json({ error: 'callId is required' }, { status: 400 });
    }

    // Update ended_at
    const { error } = await supabase
      .from('calls')
      .update({ ended_at: new Date().toISOString() })
      .eq('id', callId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (teamId) {
      await supabase.from('messages').insert({
        team_id: teamId,
        user_id: null,
        content: `Live team call ended. Use "⚡ Summarize" to capture any discussion points!`,
        type: 'system',
      });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
