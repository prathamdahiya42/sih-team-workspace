'use client';

import React, { useEffect, useState, useRef, useTransition } from 'react';
import { createClient } from '@/lib/supabase/client';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { WhatsAppImportModal } from './WhatsAppImportModal';
import { MessageSquare, Sparkles, AlertCircle } from 'lucide-react';
import { TeamMember, ChatMessageItem } from '@/lib/types';

interface ChatContainerProps {
  teamId: string;
  initialMessages: any[];
  currentUser: any;
  teamMembers: TeamMember[];
}

export function ChatContainer({
  teamId,
  initialMessages,
  currentUser,
  teamMembers,
}: ChatContainerProps) {
  const [messages, setMessages] = useState<any[]>(initialMessages || []);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isResearching, setIsResearching] = useState(false);
  const [researchStatus, setResearchStatus] = useState<string | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // Helper map for member names
  const memberNameMap = React.useMemo(() => {
    const map: Record<string, string> = {};
    teamMembers.forEach((m) => {
      map[m.user_id] = m.profile?.full_name || m.profile?.email?.split('@')[0] || 'Teammate';
    });
    return map;
  }, [teamMembers]);

  // Helper map for member custom roles
  const memberRoleMap = React.useMemo(() => {
    const map: Record<string, string | null> = {};
    teamMembers.forEach((m) => {
      map[m.user_id] = m.custom_role || null;
    });
    return map;
  }, [teamMembers]);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch / refresh messages
  const reloadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('team_id', teamId)
        .order('created_at', { ascending: true })
        .limit(100);

      if (!error && data) {
        setMessages(data);
      }
    } catch (e) {
      console.error('Error reloading messages:', e);
    }
  };

  // Realtime subscription for messages
  useEffect(() => {
    const channel = supabase
      .channel(`team-chat-${teamId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `team_id=eq.${teamId}`,
        },
        (payload) => {
          const newMsg = payload.new;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [teamId, supabase]);

  // Send regular text message
  const handleSendMessage = async (content: string) => {
    try {
      const { error } = await supabase.from('messages').insert({
        team_id: teamId,
        user_id: currentUser?.id,
        content,
        type: 'text',
      });

      if (error) {
        console.error('Error sending message:', error);
        setErrorToast('Failed to send message: ' + error.message);
      }
    } catch (err: any) {
      setErrorToast(err.message || 'Failed to send message');
    }
  };

  // Trigger 7th Member Summarize
  const handleTriggerSummarize = async () => {
    try {
      setIsSummarizing(true);
      setErrorToast(null);

      const res = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate summary');
      }

      // If the route returns the newly created message and it hasn't landed via realtime yet:
      if (data.message) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === data.message.id)) return prev;
          return [...prev, data.message];
        });
      }
    } catch (err: any) {
      setErrorToast(err.message || 'Summarization error. Ensure an API key is configured in settings.');
    } finally {
      setIsSummarizing(false);
    }
  };

  // Trigger Chat Extension / Web Research Command
  const handleTriggerExtension = async (command: string, query: string) => {
    try {
      setIsResearching(true);
      setResearchStatus(`Researching the web & synthesizing "${query}"...`);
      setErrorToast(null);

      const res = await fetch('/api/chat/extension', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId, command, query }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to execute extension command');
      }

      // Ensure both user command message and AI agent response show immediately if not arrived via realtime
      if (data.userMessage || data.agentMessage) {
        setMessages((prev) => {
          let updated = [...prev];
          if (data.userMessage && !updated.some((m) => m.id === data.userMessage.id)) {
            updated.push(data.userMessage);
          }
          if (data.agentMessage && !updated.some((m) => m.id === data.agentMessage.id)) {
            updated.push(data.agentMessage);
          }
          return updated;
        });
      }
    } catch (err: any) {
      setErrorToast(err.message || 'Extension error. Make sure your active AI key is configured in settings.');
    } finally {
      setIsResearching(false);
      setResearchStatus(null);
    }
  };

  return (
    <div className="flex h-[calc(100vh-8.5rem)] flex-col rounded-2xl border border-slate-200/80 bg-slate-50/50 shadow-soft overflow-hidden">
      {/* Error Toast */}
      {errorToast && (
        <div className="flex items-center justify-between gap-2 bg-red-50 border-b border-red-200 px-4 py-2 text-xs text-red-700 font-medium">
          <div className="flex items-center gap-1.5">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
            <span>{errorToast}</span>
          </div>
          <button
            onClick={() => setErrorToast(null)}
            className="text-red-500 hover:text-red-800 font-bold px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-saffron-50 text-saffron-600 mb-3 border border-saffron-200">
              <MessageSquare className="h-6 w-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">Team Chat Workspace</h4>
            <p className="text-xs text-slate-500 max-w-sm mt-1">
              Start ideating and typing messages with your teammates! Try typing <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-700">/research &lt;topic&gt;</code> to search the web with your working AI key.
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={{
                ...msg,
                sender_name: msg.user_id ? memberNameMap[msg.user_id] : (msg.meta?.originalSenderName || undefined),
                sender_role: msg.user_id ? memberRoleMap[msg.user_id] : null,
              }}
              isCurrentUser={msg.user_id === currentUser?.id}
            />
          ))
        )}

        {isSummarizing && (
          <div className="flex justify-center my-4">
            <div className="flex items-center gap-2 rounded-xl bg-sihgreen-50 px-4 py-2 text-xs font-semibold text-sihgreen-700 border border-sihgreen-200 animate-pulse">
              <Sparkles className="h-4 w-4 text-sihgreen-600 animate-spin" />
              <span>7th Member is synthesizing decisions & action items...</span>
            </div>
          </div>
        )}

        {isResearching && (
          <div className="flex justify-center my-4">
            <div className="flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-700 border border-blue-200 animate-pulse shadow-sm">
              <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-ping" />
              <span>{researchStatus || '7th Member is searching the web & synthesizing findings...'}</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input Bar */}
      <ChatInput
        onSendMessage={handleSendMessage}
        onTriggerSummarize={handleTriggerSummarize}
        onTriggerExtension={handleTriggerExtension}
        onOpenImport={() => setIsImportModalOpen(true)}
        isSummarizing={isSummarizing}
        isResearching={isResearching}
      />

      {/* WhatsApp Import Modal */}
      <WhatsAppImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        teamId={teamId}
        onImportComplete={reloadMessages}
        onTriggerSummarize={handleTriggerSummarize}
      />
    </div>
  );
}

