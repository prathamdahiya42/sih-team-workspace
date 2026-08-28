'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Search,
  Globe,
  Cpu,
  Bot,
  Layers,
  ChevronUp,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CHAT_EXTENSIONS, ChatExtension, parseSlashCommand } from '@/lib/ai/extensions';

interface ChatInputProps {
  onSendMessage: (content: string) => Promise<void>;
  onTriggerSummarize: () => Promise<void>;
  onTriggerExtension?: (command: string, query: string) => Promise<void>;
  onOpenImport?: () => void;
  isSummarizing?: boolean;
  isResearching?: boolean;
  disabled?: boolean;
}

export function ChatInput({
  onSendMessage,
  onTriggerSummarize,
  onTriggerExtension,
  onOpenImport,
  isSummarizing = false,
  isResearching = false,
  disabled = false,
}: ChatInputProps) {
  const [content, setContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isExtensionMenuOpen, setIsExtensionMenuOpen] = useState(false);
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Check if user is actively typing a slash command at the start
  const isTypingCommand = content.startsWith('/') && !content.includes(' ');
  const commandQuery = content.toLowerCase();

  const matchingExtensions = CHAT_EXTENSIONS.filter((ext) =>
    ext.command.toLowerCase().startsWith(commandQuery) || ext.id.toLowerCase().startsWith(commandQuery.slice(1))
  );

  const showAutocomplete = isTypingCommand && matchingExtensions.length > 0;

  // Handle clicking outside to close extension menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsExtensionMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectExtension = (ext: ChatExtension) => {
    if (ext.command === '/summarize') {
      setContent('');
      setIsExtensionMenuOpen(false);
      onTriggerSummarize();
      return;
    }

    setContent(`${ext.command} `);
    setIsExtensionMenuOpen(false);
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.setSelectionRange(ext.command.length + 1, ext.command.length + 1);
    }, 50);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || isSending || disabled || isSummarizing || isResearching) return;

    // 1. Check for /summarize
    if (trimmed.toLowerCase() === '/summarize') {
      setContent('');
      await onTriggerSummarize();
      return;
    }

    // 2. Check for slash commands (/research, /web-search, /tech-stack, /ask, etc.)
    const parsed = parseSlashCommand(trimmed);
    if (parsed.isCommand && parsed.query && onTriggerExtension) {
      setContent('');
      try {
        setIsSending(true);
        await onTriggerExtension(parsed.command || '/research', parsed.query);
      } finally {
        setIsSending(false);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
      return;
    }

    // 3. Regular text message
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
    // Autocomplete keyboard navigation
    if (showAutocomplete) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedCommandIndex((prev) => (prev + 1) % matchingExtensions.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedCommandIndex((prev) => (prev - 1 + matchingExtensions.length) % matchingExtensions.length);
        return;
      }
      if (e.key === 'Tab' || (e.key === 'Enter' && !e.shiftKey && matchingExtensions[selectedCommandIndex])) {
        e.preventDefault();
        handleSelectExtension(matchingExtensions[selectedCommandIndex]);
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const getExtensionIcon = (icon: string) => {
    switch (icon) {
      case 'Search':
        return <Search className="h-3.5 w-3.5 text-blue-500" />;
      case 'Globe':
        return <Globe className="h-3.5 w-3.5 text-emerald-500" />;
      case 'Cpu':
        return <Cpu className="h-3.5 w-3.5 text-purple-500" />;
      case 'Bot':
        return <Bot className="h-3.5 w-3.5 text-saffron-500" />;
      default:
        return <Sparkles className="h-3.5 w-3.5 text-sihgreen-600" />;
    }
  };

  const isBusy = isSending || isSummarizing || isResearching;

  return (
    <div className="relative border-t border-slate-200/80 bg-white p-3 sm:p-4">
      {/* Autocomplete Popup when user types '/' */}
      {showAutocomplete && (
        <div className="absolute bottom-full left-4 right-4 mb-2 max-w-lg rounded-2xl bg-white p-2 shadow-2xl border border-slate-200/90 z-50 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between px-2.5 py-1 text-[11px] font-bold text-slate-400 border-b border-slate-100 mb-1">
            <span>COMMAND EXTENSIONS</span>
            <span>Tab / Enter to select</span>
          </div>
          <div className="space-y-1 max-h-56 overflow-y-auto">
            {matchingExtensions.map((ext, idx) => (
              <button
                key={ext.id}
                type="button"
                onClick={() => handleSelectExtension(ext)}
                className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition ${
                  idx === selectedCommandIndex
                    ? 'bg-saffron-50 text-saffron-950 border border-saffron-200'
                    : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                    {getExtensionIcon(ext.icon)}
                  </div>
                  <div className="truncate">
                    <span className="font-mono text-xs font-bold text-slate-900 mr-2">{ext.command}</span>
                    <span className="text-[11px] text-slate-500 font-normal truncate">{ext.description}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Top Helper / Command Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2 px-1">
        <div className="flex flex-wrap items-center gap-2" ref={menuRef}>
          {/* Quick Summarize Button */}
          <button
            type="button"
            onClick={onTriggerSummarize}
            disabled={isBusy || disabled}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-sihgreen-50 text-sihgreen-700 hover:bg-sihgreen-100 border border-sihgreen-200 transition active:scale-95 disabled:opacity-50"
          >
            <Sparkles className="h-3.5 w-3.5 text-sihgreen-600 animate-pulse" />
            <span>{isSummarizing ? 'Synthesizing...' : '⚡ Summarize'}</span>
          </button>

          {/* Extensions Menu Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsExtensionMenuOpen((prev) => !prev)}
              disabled={isBusy || disabled}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition active:scale-95 disabled:opacity-50"
            >
              <Layers className="h-3.5 w-3.5 text-blue-600" />
              <span>🧩 Extensions</span>
              <ChevronUp className={`h-3 w-3 transition-transform ${isExtensionMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Extensions Dropdown Menu */}
            {isExtensionMenuOpen && (
              <div className="absolute bottom-full left-0 mb-2 w-72 rounded-2xl bg-white p-2 shadow-2xl border border-slate-200 z-50 animate-in fade-in slide-in-from-bottom-2">
                <div className="px-2 py-1 text-[11px] font-bold text-slate-400 border-b border-slate-100 mb-1">
                  CHAT EXTENSIONS & WEB SEARCH
                </div>
                <div className="space-y-1">
                  {CHAT_EXTENSIONS.map((ext) => (
                    <button
                      key={ext.id}
                      type="button"
                      onClick={() => handleSelectExtension(ext)}
                      className="w-full flex items-start gap-2.5 p-2 rounded-xl text-left hover:bg-slate-50 transition"
                    >
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 mt-0.5">
                        {getExtensionIcon(ext.icon)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-bold text-slate-900">{ext.command}</span>
                          <span className="text-[10px] text-slate-400 font-medium">{ext.name}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-tight mt-0.5">{ext.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* WhatsApp Import Button */}
          {onOpenImport && (
            <button
              type="button"
              onClick={onOpenImport}
              disabled={isBusy || disabled}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition active:scale-95 disabled:opacity-50"
            >
              <span>📥 Import WhatsApp</span>
            </button>
          )}
        </div>

        <span className="text-[10px] text-slate-400 hidden sm:inline">
          Type <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-600">/research</code> or press <kbd className="font-mono bg-slate-100 px-1 rounded">Enter</kbd>
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
            disabled={disabled || isBusy}
            placeholder="Type a message or /research <query> to search the web with your active AI key..."
            className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-saffron-500 focus:outline-none focus:ring-2 focus:ring-saffron-100 disabled:opacity-50 transition max-h-32 min-h-[42px]"
          />
        </div>

        <Button
          type="submit"
          disabled={!content.trim() || isBusy || disabled}
          loading={isSending || isResearching}
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

