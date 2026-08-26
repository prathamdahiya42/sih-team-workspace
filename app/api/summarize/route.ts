import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { decryptKey } from '@/lib/crypto';
import { getAIProvider, buildSystemPrompt, formatTranscript } from '@/lib/ai/provider';
import { AIProviderType } from '@/lib/ai/types';

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

    // 1. Verify membership
    const { data: member } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', teamId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!member) {
      return NextResponse.json({ error: 'Forbidden: Not a member of this team' }, { status: 403 });
    }

    // 2. Fetch active API Key & Provider
    const admin = createAdminClient();
    const { data: activeKeyRecord, error: keyError } = await admin
      .from('team_api_keys')
      .select('*')
      .eq('team_id', teamId)
      .eq('is_active', true)
      .maybeSingle();

    if (keyError || !activeKeyRecord || !activeKeyRecord.encrypted_key) {
      return NextResponse.json(
        {
          error: 'No active AI Provider API key configured. Please add your free Groq, Gemini, or OpenRouter key in Settings.',
        },
        { status: 400 }
      );
    }

    const rawApiKey = decryptKey(activeKeyRecord.encrypted_key);
    const providerType = activeKeyRecord.provider as AIProviderType;
    const modelId = activeKeyRecord.model_id;

    // 3. Fetch Team Details (including SIH project_brief)
    const { data: team } = await supabase
      .from('teams')
      .select('name, project_brief')
      .eq('id', teamId)
      .single();

    // 4. Fetch Previous Summary (for compressed incremental context)
    const { data: lastSummary } = await supabase
      .from('summaries')
      .select('*')
      .eq('team_id', teamId)
      .order('generated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // 5. Fetch Only Unsummarized Messages (since last message_range_end)
    let messagesQuery = supabase
      .from('messages')
      .select('id, user_id, content, type, created_at')
      .eq('team_id', teamId)
      .neq('type', 'system')
      .neq('type', 'agent') // Don't re-summarize AI summaries themselves
      .order('created_at', { ascending: true });

    if (lastSummary && lastSummary.message_range_end) {
      // Get the timestamp of the last summarized message
      const { data: lastMsg } = await supabase
        .from('messages')
        .select('created_at')
        .eq('id', lastSummary.message_range_end)
        .maybeSingle();

      if (lastMsg) {
        messagesQuery = messagesQuery.gt('created_at', lastMsg.created_at);
      }
    } else {
      // First summary: get last 50 messages
      messagesQuery = messagesQuery.limit(50);
    }

    const { data: unsummarizedMessages, error: msgError } = await messagesQuery;

    if (msgError) {
      return NextResponse.json({ error: msgError.message }, { status: 500 });
    }

    if (!unsummarizedMessages || unsummarizedMessages.length === 0) {
      return NextResponse.json(
        {
          error: 'No new messages to summarize. Chat a bit with your team first!',
        },
        { status: 400 }
      );
    }

    // 6. Fetch sender profiles to populate names in transcript
    const userIds = Array.from(new Set(unsummarizedMessages.map((m) => m.user_id).filter(Boolean)));
    let userMap: Record<string, string> = {};

    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);

      (profiles || []).forEach((p) => {
        userMap[p.id] = p.full_name || p.email?.split('@')[0] || 'Teammate';
      });
    }

    const formattedTranscript = formatTranscript(
      unsummarizedMessages.map((m) => ({
        sender: m.user_id ? userMap[m.user_id] : 'System/Recap',
        content: m.content,
        type: m.type,
        created_at: m.created_at,
      }))
    );

    // 7. Initialize AI Provider & Generate Summary
    const aiProvider = getAIProvider(providerType, rawApiKey);
    const systemPrompt = buildSystemPrompt(team?.project_brief);

    const summaryResult = await aiProvider.generateSummary({
      systemPrompt,
      transcriptText: formattedTranscript,
      previousSummary: lastSummary
        ? {
            decisions: lastSummary.decisions || [],
            openQuestions: lastSummary.open_questions || [],
            actionItems: lastSummary.action_items || [],
          }
        : null,
      modelId,
    });

    const rangeStart = unsummarizedMessages[0].id;
    const rangeEnd = unsummarizedMessages[unsummarizedMessages.length - 1].id;

    // 8. Save Summary in `summaries` Table
    const { data: savedSummary, error: sumInsertError } = await supabase
      .from('summaries')
      .insert({
        team_id: teamId,
        content: summaryResult.content || 'SIH Discussion Summary',
        decisions: summaryResult.decisions || [],
        open_questions: summaryResult.openQuestions || [],
        action_items: summaryResult.actionItems || [],
        message_range_start: rangeStart,
        message_range_end: rangeEnd,
      })
      .select()
      .single();

    if (sumInsertError) {
      console.error('Failed to save summary row:', sumInsertError);
    }

    // 9. Post Agent Message in `messages` Table (Broadcasting live to all teammates)
    const { data: agentMessage, error: agentMsgError } = await supabase
      .from('messages')
      .insert({
        team_id: teamId,
        user_id: null,
        content: summaryResult.content || 'Here is the summary of recent discussions:',
        type: 'agent',
        meta: {
          decisions: summaryResult.decisions,
          openQuestions: summaryResult.openQuestions,
          actionItems: summaryResult.actionItems,
          model: modelId,
          provider: providerType,
        },
      })
      .select()
      .single();

    if (agentMsgError) {
      return NextResponse.json({ error: agentMsgError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: agentMessage,
      summary: savedSummary,
    });
  } catch (err: any) {
    console.error('Summarize error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to generate summary' },
      { status: 500 }
    );
  }
}
