'use client';

import React, { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { MessageSquare, Sparkles, AlertCircle } from 'lucide-react';

interface ChatContainerProps {
  teamId: string;
  initialMessages: any[];
  currentUser: any;
  teamMembers: Array<{ user_id: string; profile?: { full_name?: string; email?: string } }>;
}

export function ChatContainer({
  teamId,
  initialMessages,
  currentUser,
  teamMembers,
}: ChatContainerProps) {
  const [messages, setMessages] = useState<any[]>(initialMessages || []);
  const [isSummarizing, setIsSummarizing] = useState(false);
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

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
              Start ideating and typing messages with your teammates! The AI 7th Member is listening and ready to summarize decisions anytime.
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={{
                ...msg,
                sender_name: msg.user_id ? memberNameMap[msg.user_id] : undefined,
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

        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input Bar */}
      <ChatInput
        onSendMessage={handleSendMessage}
        onTriggerSummarize={handleTriggerSummarize}
        isSummarizing={isSummarizing}
      />
    </div>
  );
}
