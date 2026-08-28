import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { parseWhatsAppChat } from '@/lib/whatsapp/parser';
import { matchWhatsAppSenders, TeamRosterMember } from '@/lib/whatsapp/matchSenders';

export async function POST(
  req: Request,
  { params }: { params: { teamId: string } }
) {
  try {
    const { teamId } = params;
    if (!teamId) {
      return NextResponse.json({ error: 'teamId is required' }, { status: 400 });
    }

    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Verify membership
    const { data: member, error: memberError } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', teamId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (memberError || !member) {
      return NextResponse.json({ error: 'Forbidden: You are not a member of this team' }, { status: 403 });
    }

    // 2. Extract payload
    let rawContent = '';
    let filename = 'WhatsApp Chat.txt';

    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      if (!file) {
        return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
      }
      filename = file.name || filename;
      rawContent = await file.text();
    } else {
      const json = await req.json();
      rawContent = json.content || '';
      filename = json.filename || filename;
    }

    if (!rawContent || !rawContent.trim()) {
      return NextResponse.json({ error: 'File content is empty' }, { status: 400 });
    }

    // 3. Parse WhatsApp chat
    const parseResult = parseWhatsAppChat(rawContent);

    if (parseResult.messages.length === 0) {
      return NextResponse.json(
        { error: 'No valid WhatsApp messages found. Please ensure this is a standard WhatsApp chat export .txt file.' },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // 4. Fetch team roster for sender matching
    const { data: teamMembers } = await admin
      .from('team_members')
      .select('user_id')
      .eq('team_id', teamId);

    const userIds = (teamMembers || []).map((m) => m.user_id);
    let roster: TeamRosterMember[] = [];

    if (userIds.length > 0) {
      const { data: profiles } = await admin
        .from('profiles')
        .select('id, full_name, email, preferences')
        .in('id', userIds);

      roster = (profiles || []).map((p) => ({
        id: p.id,
        full_name: p.full_name,
        email: p.email,
        display_name: p.preferences?.displayName,
      }));
    }

    // 5. Match senders
    const matchResult = matchWhatsAppSenders(parseResult.senders, roster);

    // 6. Prepare messages for bulk insert
    const messagesToInsert = parseResult.messages.map((msg) => {
      const matchedUserId = matchResult.mapping[msg.senderName] || null;
      return {
        team_id: teamId,
        user_id: matchedUserId,
        content: msg.content,
        type: 'imported',
        meta: {
          source: 'whatsapp',
          originalSenderName: msg.senderName,
          matchedUserId: matchedUserId,
          originalTimestamp: msg.timestamp,
        },
        created_at: msg.timestamp,
      };
    });

    // Chunked insert with automatic fallback for older DB check constraints
    const CHUNK_SIZE = 150;
    for (let i = 0; i < messagesToInsert.length; i += CHUNK_SIZE) {
      const chunk = messagesToInsert.slice(i, i + CHUNK_SIZE);
      let { error: insertError } = await admin.from('messages').insert(chunk);

      // Self-heal: If database has old constraint without 'imported', fallback to type: 'text' with meta.source = 'whatsapp'
      if (insertError && insertError.message.includes('messages_type_check')) {
        console.warn('messages_type_check constraint triggered. Falling back to type: "text" with meta.source="whatsapp"');
        const fallbackChunk = chunk.map((m) => ({
          ...m,
          type: 'text',
        }));
        const { error: fallbackError } = await admin.from('messages').insert(fallbackChunk);
        if (fallbackError) {
          console.error('Error inserting fallback message batch:', fallbackError);
          return NextResponse.json(
            { error: 'Failed to insert imported messages: ' + fallbackError.message },
            { status: 500 }
          );
        }
      } else if (insertError) {
        console.error('Error inserting message batch:', insertError);
        return NextResponse.json(
          { error: 'Failed to insert imported messages: ' + insertError.message },
          { status: 500 }
        );
      }
    }

    // 7. Insert chat_imports record (gracefully handle if table not yet created)
    try {
      await admin.from('chat_imports').insert({
        team_id: teamId,
        uploaded_by: user.id,
        filename,
        message_count: parseResult.messages.length,
        matched_count: matchResult.matchedCount,
        unmatched_senders: matchResult.unmatchedSenders,
      });
    } catch (importLogErr) {
      console.warn('Notice: chat_imports logging skipped (table may be pending migration):', importLogErr);
    }

    // 8. Fetch uploader's name and post system announcement in chat
    const { data: uploaderProfile } = await admin
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .maybeSingle();

    const uploaderName = uploaderProfile?.full_name || 'A teammate';
    const unmatchedText =
      matchResult.unmatchedSenders.length > 0
        ? ` (${matchResult.unmatchedSenders.length} unmatched sender${matchResult.unmatchedSenders.length > 1 ? 's' : ''})`
        : '';

    await admin.from('messages').insert({
      team_id: teamId,
      user_id: null,
      content: `📥 ${uploaderName} imported ${parseResult.messages.length} messages from WhatsApp (${filename})${unmatchedText}.`,
      type: 'system',
      meta: {
        subtype: 'whatsapp_import',
        filename,
        messageCount: parseResult.messages.length,
        matchedCount: matchResult.matchedCount,
      },
    });

    return NextResponse.json({
      success: true,
      messageCount: parseResult.messages.length,
      matchedCount: matchResult.matchedCount,
      unmatchedSenders: matchResult.unmatchedSenders,
    });
  } catch (err: any) {
    console.error('WhatsApp Import Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
