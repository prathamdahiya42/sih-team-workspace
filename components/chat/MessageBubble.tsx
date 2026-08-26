'use client';

import React from 'react';
import { formatTimestamp } from '@/lib/utils';
import { Bot, Mic, Sparkles } from 'lucide-react';
import { SummaryCard } from './SummaryCard';

export interface MessageBubbleProps {
  message: {
    id: string;
    team_id: string;
    user_id?: string | null;
    content: string;
    type: 'text' | 'agent' | 'transcript' | 'system';
    meta?: any;
    created_at?: string;
    sender_name?: string;
  };
  isCurrentUser: boolean;
}

export function MessageBubble({ message, isCurrentUser }: MessageBubbleProps) {
  const time = formatTimestamp(message.created_at);

  // 1. System Notification Message
  if (message.type === 'system') {
    return (
      <div className="flex justify-center my-2">
        <div className="rounded-full bg-slate-100 px-3.5 py-1 text-[11px] font-medium text-slate-500 border border-slate-200/60 shadow-2xs">
          {message.content}
        </div>
      </div>
    );
  }

  // 2. AI Agent Message (7th Member)
  if (message.type === 'agent') {
    // If metadata contains structured summary decisions/questions/actions
    if (message.meta && (message.meta.decisions || message.meta.actionItems || message.meta.openQuestions)) {
      return (
        <div className="my-3 max-w-4xl mx-auto w-full">
          <SummaryCard
            content={message.content}
            decisions={message.meta.decisions}
            openQuestions={message.meta.openQuestions}
            actionItems={message.meta.actionItems}
            timestamp={time}
            modelInfo={message.meta.model ? `Model: ${message.meta.model}` : undefined}
          />
        </div>
      );
    }

    // Standard Agent text message (e.g., inline answer or reply)
    return (
      <div className="flex gap-2.5 my-3 max-w-2xl mr-auto">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sihgreen-500 text-white shadow-xs">
          <Bot className="h-4 w-4" />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-slate-900">7th Member (AI)</span>
            <span className="text-[10px] text-slate-400">{time}</span>
          </div>
          <div className="rounded-2xl rounded-tl-sm border border-sihgreen-200 bg-sihgreen-50/60 px-4 py-3 text-xs text-slate-800 shadow-2xs leading-relaxed whitespace-pre-wrap">
            {message.content}
          </div>
        </div>
      </div>
    );
  }

  // 3. Transcript / Call Recap Message
  if (message.type === 'transcript') {
    return (
      <div className="my-3 max-w-2xl mr-auto">
        <div className="flex items-center gap-1.5 text-xs font-bold text-navy-800 mb-1">
          <Mic className="h-3.5 w-3.5 text-navy-600" />
          <span>Call Recap & Voice Transcript</span>
          <span className="text-[10px] text-slate-400 font-normal ml-2">{time}</span>
        </div>
        <div className="rounded-xl border-l-4 border-dashed border-navy-500 bg-navy-50/40 p-3.5 text-xs text-slate-700 leading-relaxed shadow-2xs">
          <p className="italic whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>
    );
  }

  // 4. Regular User Chat Message
  const senderDisplay = message.sender_name || (isCurrentUser ? 'You' : 'Teammate');
  const initials = senderDisplay.slice(0, 2).toUpperCase();

  return (
    <div className={`flex gap-2.5 my-2.5 max-w-xl ${isCurrentUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}>
      {/* Avatar */}
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold shadow-xs select-none ${
          isCurrentUser
            ? 'bg-saffron-500 text-white'
            : 'bg-slate-200 text-slate-700'
        }`}
      >
        {initials}
      </div>

      {/* Bubble Content */}
      <div className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'}`}>
        <div className="flex items-center gap-1.5 mb-1 px-1">
          <span className="text-[11px] font-semibold text-slate-600">{senderDisplay}</span>
          <span className="text-[10px] text-slate-400">{time}</span>
        </div>
        <div
          className={`rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-2xs whitespace-pre-wrap break-words max-w-md ${
            isCurrentUser
              ? 'bg-saffron-500 text-white rounded-tr-sm'
              : 'bg-white border border-slate-200/80 text-slate-800 rounded-tl-sm'
          }`}
        >
          {message.content}
        </div>
      </div>
    </div>
  );
}
