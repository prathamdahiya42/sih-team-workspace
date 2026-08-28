import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { decryptKey } from '@/lib/crypto';
import { getAIProvider } from '@/lib/ai/provider';
import { AIProviderType } from '@/lib/ai/types';
import { executeWebSearch } from '@/lib/ai/search';
import { executeResearch } from '@/lib/ai/research';
import { parseSlashCommand } from '@/lib/ai/extensions';

export async function POST(req: Request) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { teamId, command, query } = body;

    if (!teamId || !query?.trim()) {
      return NextResponse.json(
        { error: 'teamId and query are required' },
        { status: 400 }
      );
    }

    // 1. Verify team membership
    const { data: member, error: memberError } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', teamId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (memberError || !member) {
      return NextResponse.json(
        { error: 'Forbidden: You are not a member of this team' },
        { status: 403 }
      );
    }

    // 2. Fetch active API Key & Provider for this team
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
          error: 'No active AI Provider API key configured for your team. Please add your free Groq, Gemini, or OpenRouter key in Settings.',
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

    // 4. Save user query message to real-time chat feed
    const formattedUserMessage = `${command || '/research'} ${query.trim()}`;
    const { data: userMessage } = await supabase
      .from('messages')
      .insert({
        team_id: teamId,
        user_id: user.id,
        content: formattedUserMessage,
        type: 'text',
      })
      .select()
      .single();

    // 5. Parse command to determine if web search is needed
    const parsedCmd = parseSlashCommand(formattedUserMessage);
    const requiresSearch = parsedCmd.extension?.requiresSearch ?? true;

    // 6. Execute live web search
    let searchResults: Array<{ title: string; url: string; snippet: string }> = [];
    if (requiresSearch) {
      try {
        const searchResponse = await executeWebSearch(query.trim());
        searchResults = searchResponse.results;
      } catch (searchErr) {
        console.warn('Web search notice:', searchErr);
      }
    }

    // 7. Initialize AI Provider & Synthesize Research
    const aiProvider = getAIProvider(providerType, rawApiKey);

    const researchResult = await executeResearch({
      aiProvider,
      modelId,
      command: command || '/research',
      query: query.trim(),
      searchResults,
      projectBrief: team?.project_brief,
    });

    // 8. Post AI Agent Response Message into chat
    const { data: agentMessage, error: agentMsgError } = await supabase
      .from('messages')
      .insert({
        team_id: teamId,
        user_id: null,
        content: researchResult.content,
        type: 'agent',
        meta: {
          subtype: 'research',
          command: command || '/research',
          query: query.trim(),
          sources: researchResult.sources,
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
      userMessage,
      agentMessage,
      sources: researchResult.sources,
    });
  } catch (err: any) {
    console.error('Chat Extension Error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to execute extension command' },
      { status: 500 }
    );
  }
}
