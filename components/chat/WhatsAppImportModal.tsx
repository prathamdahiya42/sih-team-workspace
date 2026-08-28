'use client';

import React, { useState, useRef } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Users,
  Calendar,
  ArrowRight,
  MessageCircle,
  HelpCircle,
  X,
} from 'lucide-react';
import { parseWhatsAppChat, ParseResult } from '@/lib/whatsapp/parser';
import { formatDate } from '@/lib/utils';

interface WhatsAppImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamId: string;
  onImportComplete?: () => void;
  onTriggerSummarize?: () => void;
}

export function WhatsAppImportModal({
  isOpen,
  onClose,
  teamId,
  onImportComplete,
  onTriggerSummarize,
}: WhatsAppImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [preview, setPreview] = useState<ParseResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<{
    messageCount: number;
    matchedCount: number;
    unmatchedSenders: string[];
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleReset = () => {
    setFile(null);
    setFileContent('');
    setPreview(null);
    setError(null);
    setImportResult(null);
    setIsLoading(false);
  };

  const handleFileChange = async (selectedFile: File) => {
    if (!selectedFile.name.endsWith('.txt')) {
      setError('Please upload a standard WhatsApp export .txt file.');
      return;
    }

    try {
      setError(null);
      setFile(selectedFile);
      const text = await selectedFile.text();
      setFileContent(text);

      // Client-side quick parse preview
      const parsed = parseWhatsAppChat(text);
      if (parsed.messages.length === 0) {
        setError('Could not detect any valid messages in this file. Make sure this is an uncompressed WhatsApp text export.');
        setPreview(null);
      } else {
        setPreview(parsed);
      }
    } catch (err: any) {
      setError('Failed to read file: ' + err.message);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleConfirmImport = async () => {
    if (!fileContent || !file) return;

    try {
      setIsLoading(true);
      setError(null);

      const res = await fetch(`/api/teams/${teamId}/import/whatsapp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: fileContent,
          filename: file.name,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to import WhatsApp chat');
      }

      setImportResult({
        messageCount: data.messageCount,
        matchedCount: data.matchedCount,
        unmatchedSenders: data.unmatchedSenders || [],
      });

      if (onImportComplete) {
        onImportComplete();
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during import.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        handleReset();
        onClose();
      }}
      title="Import WhatsApp Group Chat"
      description="Bring your prior WhatsApp discussions into this workspace so the AI 7th Member has full context."
      maxWidth="lg"
    >
      {/* Error Alert */}
      {error && (
        <div className="mb-4 flex items-center justify-between p-3 rounded-xl bg-red-50 text-red-800 text-xs border border-red-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="font-bold px-1">✕</button>
        </div>
      )}

      {/* Step 1: Upload Zone (when no file selected or want to re-select) */}
      {!preview && !importResult && (
        <div className="space-y-4">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50/60 hover:bg-emerald-50/30 transition cursor-pointer text-center group"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 mb-3 group-hover:scale-105 transition">
              <UploadCloud className="h-6 w-6" />
            </div>
            <p className="text-sm font-bold text-slate-800">
              Click to select or drag & drop your exported WhatsApp chat
            </p>
            <p className="text-xs text-slate-500 mt-1">Accepts standard .txt chat exports (Without Media)</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
            />
          </div>

          <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200/80 text-xs text-slate-600 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <HelpCircle className="h-3.5 w-3.5 text-slate-500" />
              <span>How to export your chat from WhatsApp:</span>
            </div>
            <ol className="list-decimal list-inside space-y-0.5 text-[11px] text-slate-500 pl-1">
              <li>Open your team group chat in WhatsApp on Android or iOS.</li>
              <li>Tap Group Info / Menu (⋮) → More → <strong>Export Chat</strong>.</li>
              <li>Choose <strong>"Without Media"</strong> and upload the exported <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">.txt</code> file here.</li>
            </ol>
          </div>
        </div>
      )}

      {/* Step 2: Client-side Preview */}
      {preview && !importResult && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/70 border border-emerald-200">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block truncate max-w-[240px] sm:max-w-xs">
                  {file?.name}
                </span>
                <span className="text-[10px] text-emerald-700 font-semibold">
                  {preview.totalParsed} messages parsed successfully
                </span>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleReset} className="h-7 text-xs text-slate-500">
              Change File
            </Button>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-medium mb-1">
                <Users className="h-3.5 w-3.5" />
                <span>Detected Senders</span>
              </div>
              <span className="text-base font-extrabold text-slate-900">{preview.senders.length} People</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-medium mb-1">
                <Calendar className="h-3.5 w-3.5" />
                <span>Timeline</span>
              </div>
              <span className="text-xs font-bold text-slate-800 truncate block">
                {preview.dateRange ? `${formatDate(preview.dateRange.start)} – ${formatDate(preview.dateRange.end)}` : 'N/A'}
              </span>
            </div>
          </div>

          {/* Senders List */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 block">WhatsApp Senders in this export:</label>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
              {preview.senders.map((s) => (
                <Badge key={s} variant="outline" className="text-[10px] bg-white">
                  {s}
                </Badge>
              ))}
            </div>
            <p className="text-[10px] text-slate-400">
              We'll automatically match senders to your SIH teammates. Unmatched senders will simply appear with their WhatsApp name.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button variant="ghost" size="sm" onClick={handleReset} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleConfirmImport}
              loading={isLoading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <MessageCircle className="h-3.5 w-3.5 mr-1" />
              Confirm & Import {preview.totalParsed} Messages
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Success Screen */}
      {importResult && (
        <div className="space-y-5 text-center py-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 mx-auto border border-emerald-300">
            <CheckCircle2 className="h-7 w-7" />
          </div>

          <div>
            <h3 className="text-lg font-extrabold text-slate-900">WhatsApp Chat Imported!</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Successfully added <strong>{importResult.messageCount} messages</strong> to your team workspace feed with preserved timestamps.
            </p>
          </div>

          <div className="flex justify-center gap-4 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 min-w-[120px]">
              <span className="text-[11px] text-slate-500 block">Matched Teammates</span>
              <span className="text-sm font-bold text-sihgreen-700">{importResult.matchedCount}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 min-w-[120px]">
              <span className="text-[11px] text-slate-500 block">Unmatched Senders</span>
              <span className="text-sm font-bold text-slate-700">{importResult.unmatchedSenders.length}</span>
            </div>
          </div>

          {/* Suggested Next Action */}
          <div className="p-4 rounded-xl bg-saffron-50/70 border border-saffron-200 text-left space-y-3">
            <div className="flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-saffron-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-saffron-900 block">Catch up the AI 7th Member</span>
                <span className="text-[11px] text-saffron-700 leading-relaxed block mt-0.5">
                  Your imported messages are now in the database. Run AI Summarize to extract all decisions, open questions, and action items from your WhatsApp history!
                </span>
              </div>
            </div>

            {onTriggerSummarize && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  handleReset();
                  onClose();
                  onTriggerSummarize();
                }}
                className="w-full bg-saffron-500 hover:bg-saffron-600 text-white justify-center shadow-soft text-xs"
              >
                <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                ⚡ Run AI Summarize Now
              </Button>
            )}
          </div>

          <div className="flex justify-end pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                handleReset();
                onClose();
              }}
            >
              Done & Return to Chat
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
