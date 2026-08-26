'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Sparkles, CheckCircle2 } from 'lucide-react';

interface ProjectBriefEditorProps {
  teamId: string;
  initialBrief?: string | null;
}

export function ProjectBriefEditor({ teamId, initialBrief = '' }: ProjectBriefEditorProps) {
  const [brief, setBrief] = useState(initialBrief || '');
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setSavedSuccess(false);

      const res = await fetch('/api/settings/brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId, projectBrief: brief }),
      });

      if (!res.ok) throw new Error('Failed to update project brief');
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-navy-50 text-navy-800 border border-navy-200">
            <FileText className="h-4 w-4" />
          </div>
          <div>
            <CardTitle>SIH Problem Statement & Project Brief</CardTitle>
            <CardDescription>
              The AI 7th Member uses this context to ground all discussions, decisions, and action items in your actual hackathon problem.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <Textarea
          rows={4}
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          placeholder="e.g. Problem Statement #1420: AI-powered decentralized disaster relief resource routing for rural India..."
          helperText="Paste your SIH problem title, background details, constraints, and target users."
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Sparkles className="h-3.5 w-3.5 text-saffron-500" />
            <span>Passed as top-level system context to all AI models</span>
          </div>

          <div className="flex items-center gap-2">
            {savedSuccess && (
              <span className="flex items-center gap-1 text-xs text-sihgreen-600 font-semibold">
                <CheckCircle2 className="h-3.5 w-3.5" /> Saved!
              </span>
            )}
            <Button
              onClick={handleSave}
              disabled={isSaving}
              loading={isSaving}
              variant="primary"
              size="sm"
            >
              Save Project Brief
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
