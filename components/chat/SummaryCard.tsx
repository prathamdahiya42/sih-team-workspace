'use client';

import React from 'react';
import { Bot, CheckCircle2, HelpCircle, ListTodo, Sparkles, UserCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ActionItem } from '@/lib/ai/types';

interface SummaryCardProps {
  content?: string;
  decisions?: string[];
  openQuestions?: string[];
  actionItems?: ActionItem[];
  timestamp?: string;
  modelInfo?: string;
}

export function SummaryCard({
  content,
  decisions = [],
  openQuestions = [],
  actionItems = [],
  timestamp,
  modelInfo,
}: SummaryCardProps) {
  return (
    <div className="rounded-2xl border-2 border-sihgreen-200 bg-gradient-to-b from-sihgreen-50/70 via-white to-sihgreen-50/30 p-5 shadow-soft transition-all">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sihgreen-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sihgreen-500 text-white shadow-xs">
            <Bot className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-slate-900">7th Member (AI)</span>
              <Badge variant="green" className="text-[10px] py-0 px-1.5">
                <Sparkles className="h-2.5 w-2.5 mr-1 inline" />
                SIH Decision Log
              </Badge>
            </div>
            {modelInfo && <p className="text-[10px] text-slate-500">{modelInfo}</p>}
          </div>
        </div>
        {timestamp && <span className="text-[11px] text-slate-400 font-medium">{timestamp}</span>}
      </div>

      {/* Overview */}
      {content && (
        <div className="mt-3.5 text-xs text-slate-700 leading-relaxed bg-white/80 p-3 rounded-xl border border-sihgreen-100">
          {content}
        </div>
      )}

      {/* Main Grid: Decisions & Open Questions */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* Decisions */}
        <div className="rounded-xl border border-sihgreen-200/80 bg-white p-3.5 shadow-2xs">
          <div className="flex items-center gap-1.5 text-xs font-bold text-sihgreen-700 mb-2.5">
            <CheckCircle2 className="h-4 w-4 text-sihgreen-600" />
            Key Decisions Made ({decisions.length})
          </div>
          {decisions.length > 0 ? (
            <ul className="space-y-1.5">
              {decisions.map((decision, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-sihgreen-500 mt-1.5 shrink-0" />
                  <span>{decision}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-400 italic">No explicit decisions finalized in this segment.</p>
          )}
        </div>

        {/* Open Questions */}
        <div className="rounded-xl border border-amber-200/80 bg-white p-3.5 shadow-2xs">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 mb-2.5">
            <HelpCircle className="h-4 w-4 text-amber-600" />
            Unresolved Questions ({openQuestions.length})
          </div>
          {openQuestions.length > 0 ? (
            <ul className="space-y-1.5">
              {openQuestions.map((question, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                  <span>{question}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-400 italic">All questions appear addressed or deferred.</p>
          )}
        </div>
      </div>

      {/* Action Items with Assignees */}
      <div className="mt-3.5 rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-2.5">
          <ListTodo className="h-4 w-4 text-saffron-500" />
          Action Items & Assignments ({actionItems.length})
        </div>
        {actionItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {actionItems.map((item, idx) => (
              <div
                key={idx}
                className="flex items-start justify-between gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs"
              >
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    readOnly
                    checked={item.done}
                    className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 text-sihgreen-600 focus:ring-sihgreen-400"
                  />
                  <span className={item.done ? 'line-through text-slate-400' : 'text-slate-700 font-medium'}>
                    {item.text}
                  </span>
                </div>
                {item.assignee && (
                  <span className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-saffron-50 text-saffron-800 text-[10px] font-semibold border border-saffron-200">
                    <UserCheck className="h-2.5 w-2.5" />
                    {item.assignee}
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic">No specific action items generated.</p>
        )}
      </div>
    </div>
  );
}
