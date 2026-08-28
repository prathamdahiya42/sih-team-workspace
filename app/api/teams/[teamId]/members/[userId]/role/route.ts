import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function PATCH(
  req: Request,
  { params }: { params: { teamId: string; userId: string } }
) {
  try {
    const { teamId, userId } = params;
    if (!teamId || !userId) {
      return NextResponse.json({ error: 'teamId and userId are required' }, { status: 400 });
    }

    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { custom_role } = body;

    const admin = createAdminClient();

    // 1. Authorization: Verify requester is owner of the team
    const { data: requesterMember, error: reqError } = await admin
      .from('team_members')
      .select('role')
      .eq('team_id', teamId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (reqError || !requesterMember) {
      return NextResponse.json({ error: 'Forbidden: You are not a member of this team' }, { status: 403 });
    }

    if (requesterMember.role !== 'owner') {
      return NextResponse.json(
        { error: 'Forbidden: Only the Team Lead/Owner can assign member roles' },
        { status: 403 }
      );
    }

    // 2. Verify target user is a member of the team
    const { data: targetMember, error: targetError } = await admin
      .from('team_members')
      .select('*')
      .eq('team_id', teamId)
      .eq('user_id', userId)
      .maybeSingle();

    if (targetError || !targetMember) {
      return NextResponse.json({ error: 'Target user is not a member of this team' }, { status: 404 });
    }

    // 3. Update custom_role
    const sanitizedRole = typeof custom_role === 'string' && custom_role.trim() ? custom_role.trim() : null;

    const { data: updatedMember, error: updateError } = await admin
      .from('team_members')
      .update({ custom_role: sanitizedRole })
      .eq('team_id', teamId)
      .eq('user_id', userId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      custom_role: updatedMember.custom_role,
      member: updatedMember,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
