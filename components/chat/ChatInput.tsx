'use client';

import React, { useState, useRef } from 'react';
import { Send, Sparkles, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ChatInputProps {
  onSendMessage: (content: string) => Promise<void>;
  onTriggerSummarize: () => Promise<void>;
  isSummarizing?: boolean;
  disabled?: boolean;
}

export function ChatInput({
  onSendMessage,
  onTriggerSummarize,
  isSummarizing = false,
  disabled = false,
}: ChatInputProps) {
  const [content, setContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || isSending || disabled) return;

    // Check if user entered /summarize command
    if (trimmed.toLowerCase() === '/summarize') {
      setContent('');
      await onTriggerSummarize();
      return;
    }

    try {
      setIsSending(true);
      setContent('');
      await onSendMessage(trimmed);
    } finally {
      setIsSending(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="relative border-t border-slate-200/80 bg-white p-3 sm:p-4">
      {/* Top Helper / Command Toolbar */}
      <div className="flex items-center justify-between gap-2 mb-2 px-1">
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
            Type <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-600 font-mono text-[10px]">/summarize</code> or click
          </span>
          <button
            type="button"
            onClick={onTriggerSummarize}
            disabled={isSummarizing || disabled}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-sihgreen-50 text-sihgreen-700 hover:bg-sihgreen-100 border border-sihgreen-200 transition active:scale-95 disabled:opacity-50"
          >
            <Sparkles className="h-3.5 w-3.5 text-sihgreen-600 animate-pulse" />
            <span>{isSummarizing ? 'AI Summarizing...' : '⚡ Summarize Discussion'}</span>
          </button>
        </div>
        <span className="text-[10px] text-slate-400 hidden sm:inline">
          Press <kbd className="font-mono bg-slate-100 px-1 rounded">Enter</kbd> to send
        </span>
      </div>

      {/* Input Box */}
      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        <div className="relative flex-1">
          <textarea
            ref={inputRef}
            rows={1}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled || isSending}
            placeholder="Type a message, discuss ideas, or type /summarize..."
            className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-saffron-500 focus:outline-none focus:ring-2 focus:ring-saffron-100 disabled:opacity-50 transition max-h-32 min-h-[42px]"
          />
        </div>

        <Button
          type="submit"
          disabled={!content.trim() || isSending || disabled}
          variant="primary"
          size="icon"
          className="h-[42px] w-[42px] rounded-xl shrink-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
