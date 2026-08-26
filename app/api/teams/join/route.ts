import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { inviteCode } = await req.json();
    if (!inviteCode || typeof inviteCode !== 'string') {
      return NextResponse.json({ error: 'Invite code is required' }, { status: 400 });
    }

    const cleanCode = inviteCode.trim().toUpperCase();

    // 1. Find team by invite code
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('id, name, invite_code')
      .eq('invite_code', cleanCode)
      .single();

    if (teamError || !team) {
      return NextResponse.json({ error: 'Invalid invite code. Team not found.' }, { status: 404 });
    }

    // 2. Check if user is already a member
    const { data: existingMember } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('team_id', team.id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingMember) {
      return NextResponse.json({ team, message: 'Already a member of this team' });
    }

    // 3. Check current member count (Capacity Cap = 9)
    const { count, error: countError } = await supabase
      .from('team_members')
      .select('*', { count: 'exact', head: true })
      .eq('team_id', team.id);

    if (countError) {
      return NextResponse.json({ error: countError.message }, { status: 500 });
    }

    if (count && count >= 9) {
      return NextResponse.json(
        { error: 'This team has already reached the maximum SIH cap of 9 members.' },
        { status: 400 }
      );
    }

    // 4. Add user to team
    const { error: joinError } = await supabase
      .from('team_members')
      .insert({
        team_id: team.id,
        user_id: user.id,
        role: 'member',
      });

    if (joinError) {
      return NextResponse.json({ error: joinError.message }, { status: 500 });
    }

    // 5. Post system message
    const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'A new teammate';
    await supabase.from('messages').insert({
      team_id: team.id,
      user_id: null,
      content: `${displayName} joined the team workspace.`,
      type: 'system',
    });

    return NextResponse.json({ team });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
