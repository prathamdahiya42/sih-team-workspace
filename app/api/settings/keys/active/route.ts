import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: Request) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { teamId, provider, modelId } = await req.json();

    const admin = createAdminClient();

    // Deactivate all for this team
    await admin
      .from('team_api_keys')
      .update({ is_active: false })
      .eq('team_id', teamId);

    // Activate selected provider
    const { error } = await admin
      .from('team_api_keys')
      .update({ is_active: true, ...(modelId ? { model_id: modelId } : {}) })
      .eq('team_id', teamId)
      .eq('provider', provider);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
