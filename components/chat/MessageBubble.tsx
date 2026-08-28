'use client';

import React from 'react';
import { formatTimestamp } from '@/lib/utils';
import { Bot, Mic, Sparkles, Award, MessageCircle, FileText, Search, ExternalLink, Globe } from 'lucide-react';
import { SummaryCard } from './SummaryCard';
import { MessageType } from '@/lib/types';

export interface MessageBubbleProps {
  message: {
    id: string;
    team_id: string;
    user_id?: string | null;
    content: string;
    type: MessageType;
    meta?: any;
    created_at?: string;
    sender_name?: string;
    sender_role?: string | null;
  };
  isCurrentUser: boolean;
}

export function MessageBubble({ message, isCurrentUser }: MessageBubbleProps) {
  const displayTime = formatTimestamp(message.meta?.originalTimestamp || message.created_at);

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
    // 2a. Specialized Web Research Agent Message
    if (message.meta && (message.meta.subtype === 'research' || message.meta.sources)) {
      const sources = Array.isArray(message.meta.sources) ? message.meta.sources : [];
      return (
        <div className="my-3 max-w-3xl mr-auto w-full">
          <div className="rounded-2xl rounded-tl-sm border border-blue-200 bg-gradient-to-b from-blue-50/80 to-white p-4 sm:p-5 shadow-soft">
            {/* Research Card Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-blue-100">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
                  <Search className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">Web Research Agent</span>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800">
                      {message.meta.command || '/research'}
                    </span>
                  </div>
                  {message.meta.query && (
                    <span className="text-[11px] text-slate-600 block mt-0.5">
                      Topic: <strong className="text-slate-800">"{message.meta.query}"</strong>
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {message.meta.model && (
                  <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">
                    {message.meta.model}
                  </span>
                )}
                <span className="text-[10px] text-slate-400">{displayTime}</span>
              </div>
            </div>

            {/* Markdown Content */}
            <div className="text-xs text-slate-800 leading-relaxed space-y-2 whitespace-pre-wrap break-words">
              {message.content}
            </div>

            {/* Verified Sources & Citations */}
            {sources.length > 0 && (
              <div className="mt-4 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 mb-2">
                  <ExternalLink className="h-3.5 w-3.5 text-blue-600" />
                  <span>Web Sources & References ({sources.length})</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {sources.slice(0, 6).map((src: any, idx: number) => {
                    let hostname = '';
                    try {
                      hostname = new URL(src.url).hostname.replace('www.', '');
                    } catch {
                      hostname = 'source';
                    }
                    return (
                      <a
                        key={idx}
                        href={src.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-start gap-2 p-2 rounded-xl bg-white hover:bg-blue-50/60 border border-slate-200 hover:border-blue-300 transition group text-left"
                      >
                        <span className="text-[10px] font-mono font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                          [{idx + 1}]
                        </span>
                        <div className="min-w-0 flex-1">
                          <span className="text-[11px] font-semibold text-slate-800 block truncate group-hover:text-blue-700">
                            {src.title || hostname}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono block truncate">
                            {hostname}
                          </span>
                        </div>
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    // 2b. If metadata contains structured summary decisions/questions/actions
    if (message.meta && (message.meta.decisions || message.meta.actionItems || message.meta.openQuestions)) {
      return (
        <div className="my-3 max-w-4xl mx-auto w-full">
          <SummaryCard
            content={message.content}
            decisions={message.meta.decisions}
            openQuestions={message.meta.openQuestions}
            actionItems={message.meta.actionItems}
            timestamp={displayTime}
            modelInfo={message.meta.model ? `Model: ${message.meta.model}` : undefined}
          />
        </div>
      );
    }

    // 2c. Standard Agent text message (e.g., inline answer or reply)
    return (
      <div className="flex gap-2.5 my-3 max-w-2xl mr-auto">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sihgreen-500 text-white shadow-xs">
          <Bot className="h-4 w-4" />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-slate-900">7th Member (AI)</span>
            <span className="text-[10px] text-slate-400">{displayTime}</span>
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
          <span className="text-[10px] text-slate-400 font-normal ml-2">{displayTime}</span>
        </div>
        <div className="rounded-xl border-l-4 border-dashed border-navy-500 bg-navy-50/40 p-3.5 text-xs text-slate-700 leading-relaxed shadow-2xs">
          <p className="italic whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>
    );
  }

  // 4. WhatsApp Imported Message
  if (message.type === 'imported' || message.meta?.source === 'whatsapp') {
    const rawSender = message.meta?.originalSenderName || message.sender_name || 'WhatsApp User';
    const initials = rawSender.slice(0, 2).toUpperCase();

    return (
      <div className="flex gap-2.5 my-2 max-w-xl mr-auto">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-800 font-bold text-xs border border-emerald-200 shadow-2xs select-none">
          {initials}
        </div>
        <div className="flex flex-col items-start">
          <div className="flex flex-wrap items-center gap-1.5 mb-1 px-1">
            <span className="text-[11px] font-bold text-slate-700">{rawSender}</span>
            <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.2 text-[9px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <MessageCircle className="h-2.5 w-2.5" />
              WhatsApp
            </span>
            {message.sender_role && (
              <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.2 text-[9px] font-semibold bg-navy-50 text-navy-700 border border-navy-200">
                <Award className="h-2.5 w-2.5 text-navy-500" />
                {message.sender_role}
              </span>
            )}
            <span className="text-[10px] text-slate-400">{displayTime}</span>
          </div>
          <div className="rounded-2xl rounded-tl-sm border border-emerald-100/90 bg-emerald-50/30 px-4 py-2.5 text-xs text-slate-700 leading-relaxed shadow-2xs whitespace-pre-wrap break-words max-w-md">
            {message.content}
          </div>
        </div>
      </div>
    );
  }

  // 5. Regular User Chat Message
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
        <div className="flex flex-wrap items-center gap-1.5 mb-1 px-1">
          <span className="text-[11px] font-semibold text-slate-600">{senderDisplay}</span>
          {message.sender_role && (
            <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.2 text-[9px] font-semibold bg-navy-50 text-navy-700 border border-navy-200">
              <Award className="h-2.5 w-2.5 text-navy-500" />
              {message.sender_role}
            </span>
          )}
          <span className="text-[10px] text-slate-400">{displayTime}</span>
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

