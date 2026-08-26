import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { encryptKey } from '@/lib/crypto';
import { getAIProvider } from '@/lib/ai/provider';
import { AIProviderType } from '@/lib/ai/types';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const teamId = searchParams.get('teamId');

    if (!teamId) {
      return NextResponse.json({ error: 'teamId is required' }, { status: 400 });
    }

    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data: keys, error } = await admin
      .from('team_api_keys')
      .select('provider, model_id, is_active, updated_at')
      .eq('team_id', teamId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      keys: (keys || []).map((k) => ({
        ...k,
        has_key: true,
      })),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { teamId, provider, modelId, apiKey, isActive = true } = await req.json();

    if (!teamId || !provider || !apiKey) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // 1. Verify user is member of this team
    const { data: member } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', teamId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!member) {
      return NextResponse.json({ error: 'Forbidden: You are not a member of this team' }, { status: 403 });
    }

    // 2. Validate API Key against provider
    const aiProvider = getAIProvider(provider as AIProviderType, apiKey.trim());
    const validation = await aiProvider.testApiKey(apiKey.trim(), modelId);

    if (!validation.valid) {
      return NextResponse.json({ error: validation.error || 'Invalid API Key' }, { status: 400 });
    }

    // 3. Encrypt Key securely
    const encryptedKey = encryptKey(apiKey.trim());

    const admin = createAdminClient();

    // If making active, deactivate others
    if (isActive) {
      await admin
        .from('team_api_keys')
        .update({ is_active: false })
        .eq('team_id', teamId);
    }

    // 4. Store in team_api_keys
    const { error: saveError } = await admin
      .from('team_api_keys')
      .upsert(
        {
          team_id: teamId,
          provider,
          model_id: modelId,
          encrypted_key: encryptedKey,
          is_active: isActive,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'team_id,provider' }
      );

    if (saveError) {
      return NextResponse.json({ error: saveError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'API key saved and verified securely' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
