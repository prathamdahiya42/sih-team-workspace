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

    const { name, projectBrief } = await req.json();
    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Team name is required' }, { status: 400 });
    }

    // Generate unique random invite code (e.g. SIH-9A4B)
    const codeSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
    const inviteCode = `SIH-${codeSuffix}`;

    // Insert Team
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .insert({
        name: name.trim(),
        invite_code: inviteCode,
        project_brief: projectBrief?.trim() || null,
        created_by: user.id,
      })
      .select()
      .single();

    if (teamError) {
      return NextResponse.json({ error: teamError.message }, { status: 500 });
    }

    // Add creator as Team Owner
    const { error: memberError } = await supabase
      .from('team_members')
      .insert({
        team_id: team.id,
        user_id: user.id,
        role: 'owner',
      });

    if (memberError) {
      return NextResponse.json({ error: memberError.message }, { status: 500 });
    }

    // Insert Initial System Greeting Message
    await supabase.from('messages').insert({
      team_id: team.id,
      user_id: null,
      content: `Welcome to ${team.name}! Your AI 7th Member is ready. Configure your free API key in Settings, start chatting, or click "Summarize" anytime.`,
      type: 'system',
    });

    return NextResponse.json({ team });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
