'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { AIProviderType, OpenRouterModel } from '@/lib/ai/types';
import { Key, ShieldCheck, CheckCircle2, AlertCircle, RefreshCw, Cpu } from 'lucide-react';

interface StoredKey {
  provider: AIProviderType;
  model_id: string;
  is_active: boolean;
  has_key: boolean;
  updated_at?: string;
}

interface ApiKeyManagerProps {
  teamId: string;
}

const PROVIDER_INFO: Record<AIProviderType, {
  name: string;
  portalUrl: string;
  defaultModel: string;
  models: { id: string; label: string; desc: string }[];
  description: string;
}> = {
  groq: {
    name: 'Groq (Recommended)',
    portalUrl: 'https://console.groq.com',
    defaultModel: 'llama-3.3-70b-versatile',
    models: [
      { id: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B Versatile', desc: 'Highest quality, best for /summarize' },
      { id: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B Instant', desc: 'Ultra-fast, highest daily request limit' },
    ],
    description: 'Fastest inference, generous free tier without credit card.',
  },
  gemini: {
    name: 'Google Gemini',
    portalUrl: 'https://aistudio.google.com',
    defaultModel: 'gemini-2.5-flash',
    models: [
      { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', desc: 'High capability free tier' },
      { id: 'gemini-2.0-flash-lite', label: 'Gemini 2.0 Flash Lite', desc: 'High request throughput' },
    ],
    description: 'Free via Google AI Studio, great reasoning context.',
  },
  openrouter: {
    name: 'OpenRouter (Gateway)',
    portalUrl: 'https://openrouter.ai',
    defaultModel: 'meta-llama/llama-3.3-70b-instruct:free',
    models: [
      { id: 'meta-llama/llama-3.3-70b-instruct:free', label: 'Llama 3.3 70B (Free)', desc: 'Free gateway model' },
    ],
    description: 'Gateway to community free models. Live model list loaded below.',
  },
};

export function ApiKeyManager({ teamId }: ApiKeyManagerProps) {
  const [selectedProvider, setSelectedProvider] = useState<AIProviderType>('groq');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [selectedModel, setSelectedModel] = useState('llama-3.3-70b-versatile');
  const [storedKeys, setStoredKeys] = useState<StoredKey[]>([]);
  const [openRouterFreeModels, setOpenRouterFreeModels] = useState<OpenRouterModel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Fetch configured keys for this team
  const loadKeys = async () => {
    try {
      const res = await fetch(`/api/settings/keys?teamId=${teamId}`);
      if (res.ok) {
        const data = await res.json();
        setStoredKeys(data.keys || []);
      }
    } catch (e) {
      console.error('Failed to load keys', e);
    }
  };

  // Fetch live OpenRouter free models
  const loadOpenRouterModels = async () => {
    try {
      const res = await fetch('/api/settings/models/openrouter');
      if (res.ok) {
        const data = await res.json();
        setOpenRouterFreeModels(data.models || []);
      }
    } catch (e) {
      console.error('Failed to fetch OpenRouter free models', e);
    }
  };

  useEffect(() => {
    loadKeys();
  }, [teamId]);

  useEffect(() => {
    if (selectedProvider === 'openrouter' && openRouterFreeModels.length === 0) {
      loadOpenRouterModels();
    }
    const defaultMod = PROVIDER_INFO[selectedProvider].defaultModel;
    setSelectedModel(defaultMod);
  }, [selectedProvider]);

  // Handle Save API Key
  const handleSaveKey = async () => {
    if (!apiKeyInput.trim()) return;
    try {
      setIsLoading(true);
      setToast(null);

      const res = await fetch('/api/settings/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId,
          provider: selectedProvider,
          modelId: selectedModel,
          apiKey: apiKeyInput.trim(),
          isActive: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save key');

      setToast({ type: 'success', message: `${PROVIDER_INFO[selectedProvider].name} key verified & saved securely!` });
      setApiKeyInput('');
      loadKeys();
    } catch (err: any) {
      setToast({ type: 'error', message: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  // Switch Active Provider
  const handleSetActive = async (provider: AIProviderType, modelId: string) => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/settings/keys/active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId, provider, modelId }),
      });
      if (!res.ok) throw new Error('Failed to update active provider');
      await loadKeys();
      setToast({ type: 'success', message: `Active AI provider switched to ${PROVIDER_INFO[provider].name}` });
    } catch (err: any) {
      setToast({ type: 'error', message: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-saffron-50 text-saffron-600 border border-saffron-200">
              <Key className="h-4 w-4" />
            </div>
            <div>
              <CardTitle>AI Provider & Free API Keys</CardTitle>
              <CardDescription>
                Supply your team's free API key. This key is shared with your whole team — anyone can use the AI once it's added here.
              </CardDescription>
            </div>
          </div>
          <Badge variant="green" className="text-[11px]">
            <ShieldCheck className="h-3 w-3 mr-1 inline" />
            Encrypted at Rest
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Shared Team Notice Banner */}
        <div className="p-3.5 rounded-xl bg-navy-50/70 border border-navy-200/80 text-xs text-navy-800 flex items-start gap-2.5">
          <ShieldCheck className="h-4 w-4 text-navy-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold block text-navy-950">Shared Workspace Key</span>
            <span>
              This key is shared with your entire 6–9 member team. Once any teammate pastes a free key here, all members can immediately use the AI 7th Member for summaries and ideation.
            </span>
          </div>
        </div>
        {toast && (
          <div
            className={`flex items-center justify-between p-3 rounded-xl text-xs font-medium ${
              toast.type === 'success'
                ? 'bg-sihgreen-50 text-sihgreen-800 border border-sihgreen-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {toast.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              <span>{toast.message}</span>
            </div>
            <button onClick={() => setToast(null)} className="font-bold px-1">✕</button>
          </div>
        )}

        {/* Stored Keys Overview & Active Switcher */}
        {storedKeys.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Configured Providers</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {storedKeys.map((k) => (
                <div
                  key={k.provider}
                  className={`p-3 rounded-xl border transition flex flex-col justify-between gap-2 ${
                    k.is_active
                      ? 'border-sihgreen-300 bg-sihgreen-50/50 shadow-2xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1">
                    <div>
                      <span className="text-xs font-bold text-slate-900 block capitalize">{k.provider}</span>
                      <span className="text-[10px] text-slate-500 font-mono block truncate max-w-[140px]">{k.model_id}</span>
                    </div>
                    {k.is_active && (
                      <Badge variant="green" className="text-[10px] py-0">Active</Badge>
                    )}
                  </div>

                  {!k.is_active && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSetActive(k.provider, k.model_id)}
                      className="text-[11px] h-7 w-full mt-1"
                    >
                      Set Active
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Provider Tabs */}
        <div className="space-y-4 pt-2">
          <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
            {(['groq', 'gemini', 'openrouter'] as AIProviderType[]).map((p) => {
              const info = PROVIDER_INFO[p];
              const isCurrent = selectedProvider === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setSelectedProvider(p)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    isCurrent
                      ? 'bg-saffron-500 text-white shadow-soft'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Cpu className="h-3.5 w-3.5" />
                  {info.name}
                </button>
              );
            })}
          </div>

          {/* Provider Details & Input */}
          <div className="rounded-xl bg-slate-50 p-4 border border-slate-200/80 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h5 className="text-xs font-bold text-slate-800">{PROVIDER_INFO[selectedProvider].name}</h5>
                <p className="text-[11px] text-slate-500">{PROVIDER_INFO[selectedProvider].description}</p>
              </div>
              <a
                href={PROVIDER_INFO[selectedProvider].portalUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-navy-800 font-semibold hover:underline inline-flex items-center gap-1 shrink-0"
              >
                Get Free Key ↗
              </a>
            </div>

            {/* Model Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">Select Free Model</label>
              {selectedProvider === 'openrouter' && openRouterFreeModels.length > 0 ? (
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full h-10 px-3 text-xs bg-white border border-slate-200 rounded-xl focus:border-saffron-500 focus:outline-none"
                >
                  {openRouterFreeModels.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name || m.id} (:free)
                    </option>
                  ))}
                </select>
              ) : (
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full h-10 px-3 text-xs bg-white border border-slate-200 rounded-xl focus:border-saffron-500 focus:outline-none"
                >
                  {PROVIDER_INFO[selectedProvider].models.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label} ({m.desc})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Key Input */}
            <div className="space-y-1.5">
              <Input
                label="API Key"
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder={`Paste your ${selectedProvider} API key (e.g. gsk_... or AIza...)`}
                helperText="Keys are verified and encrypted at rest before storing."
              />
            </div>

            <Button
              onClick={handleSaveKey}
              disabled={!apiKeyInput.trim() || isLoading}
              loading={isLoading}
              variant="primary"
              size="sm"
              className="w-full sm:w-auto"
            >
              Verify & Save Key
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
