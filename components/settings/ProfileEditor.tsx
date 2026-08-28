'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { User, Sun, Moon, Laptop, Bell, CheckCircle2, AlertCircle, Sparkles, Mail, Shield } from 'lucide-react';
import { UserProfile, UserPreferences, ThemeMode } from '@/lib/types';

interface ProfileEditorProps {
  initialProfile?: UserProfile | null;
  userEmail?: string | null;
}

export function ProfileEditor({ initialProfile, userEmail }: ProfileEditorProps) {
  const [fullName, setFullName] = useState(initialProfile?.full_name || '');
  const [displayName, setDisplayName] = useState(initialProfile?.preferences?.displayName || '');
  const [theme, setTheme] = useState<ThemeMode>(initialProfile?.preferences?.theme || 'system');
  const [notifications, setNotifications] = useState({
    newMessage: initialProfile?.preferences?.notifications?.newMessage ?? true,
    aiSummary: initialProfile?.preferences?.notifications?.aiSummary ?? true,
    callStarted: initialProfile?.preferences?.notifications?.callStarted ?? true,
  });

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(!initialProfile);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch latest profile if not supplied initially
  useEffect(() => {
    if (!initialProfile) {
      fetchProfile();
    }
  }, [initialProfile]);

  // Apply theme to document data-theme attribute
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
      } else if (theme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
      } else {
        document.documentElement.removeAttribute('data-theme');
      }
    }
  }, [theme]);

  const fetchProfile = async () => {
    try {
      setFetching(true);
      const res = await fetch('/api/profile');
      if (res.ok) {
        const data = await res.json();
        const p: UserProfile = data.profile;
        if (p) {
          setFullName(p.full_name || '');
          setDisplayName(p.preferences?.displayName || '');
          setTheme(p.preferences?.theme || 'system');
          setNotifications({
            newMessage: p.preferences?.notifications?.newMessage ?? true,
            aiSummary: p.preferences?.notifications?.aiSummary ?? true,
            callStarted: p.preferences?.notifications?.callStarted ?? true,
          });
        }
      }
    } catch (e) {
      console.error('Failed to load profile', e);
    } finally {
      setFetching(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setStatusMessage(null);

      const preferencesPayload: UserPreferences = {
        theme,
        notifications,
        displayName: displayName.trim() || undefined,
      };

      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName.trim(),
          preferences: preferencesPayload,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      setStatusMessage({ type: 'success', text: 'Profile & preferences saved successfully!' });
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Error updating profile' });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <Card className="w-full">
        <CardContent className="p-8 text-center text-slate-500">
          <div className="flex items-center justify-center gap-2 text-saffron-600 font-bold">
            <Sparkles className="h-4 w-4 animate-spin" />
            <span>Loading user profile...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const effectiveEmail = userEmail || initialProfile?.email || '—';
  const initials = (fullName || effectiveEmail.split('@')[0] || 'U').slice(0, 2).toUpperCase();

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-saffron-50 text-saffron-600 border border-saffron-200">
              <User className="h-4 w-4" />
            </div>
            <div>
              <CardTitle>Personal Profile & Preferences</CardTitle>
              <CardDescription>
                Customize your name, team chat display identity, theme, and notification preferences.
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="text-xs">
            Account Settings
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        {statusMessage && (
          <div
            className={`mb-6 flex items-center justify-between p-3.5 rounded-xl text-xs font-medium ${
              statusMessage.type === 'success'
                ? 'bg-sihgreen-50 text-sihgreen-800 border border-sihgreen-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 text-sihgreen-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <span>{statusMessage.text}</span>
            </div>
            <button onClick={() => setStatusMessage(null)} className="font-bold px-1 text-slate-400 hover:text-slate-700">
              ✕
            </button>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* User Info Header & Avatar Preview */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-navy-100 text-navy-800 font-extrabold text-sm border-2 border-navy-300 shadow-2xs">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900 truncate">{fullName || 'Set your name'}</span>
                {displayName && (
                  <span className="text-[11px] text-slate-500 font-medium">(@{displayName})</span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                <Mail className="h-3 w-3 text-slate-400" />
                <span className="truncate">{effectiveEmail}</span>
              </div>
            </div>
          </div>

          {/* Name & Display Name Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              placeholder="e.g. Rohan Kumar"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              helperText="Your official name displayed to teammates and mentors."
              required
            />

            <Input
              label="Chat Display Name (Optional)"
              placeholder="e.g. Rohan K."
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              helperText="Optional short name shown in chat if different from your full name."
            />
          </div>

          {/* Theme Selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 block">Appearance Theme</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'system', label: 'System', icon: Laptop, desc: 'Auto detect' },
                { id: 'light', label: 'Light', icon: Sun, desc: 'Default clean' },
                { id: 'dark', label: 'Dark', icon: Moon, desc: 'Dim display' },
              ].map((t) => {
                const isSelected = theme === t.id;
                const IconComponent = t.icon;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTheme(t.id as ThemeMode)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition ${
                      isSelected
                        ? 'border-saffron-500 bg-saffron-50/50 text-saffron-900 shadow-2xs'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <IconComponent className={`h-4 w-4 mb-1.5 ${isSelected ? 'text-saffron-600' : 'text-slate-500'}`} />
                    <span className="text-xs font-bold">{t.label}</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">{t.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notification Preferences */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-slate-500" />
              <label className="text-xs font-bold text-slate-800">Notification Preferences</label>
            </div>
            <p className="text-[11px] text-slate-500 -mt-1">
              Control in-app alerts for team activities.
            </p>

            <div className="space-y-2.5 rounded-xl bg-slate-50/70 p-4 border border-slate-200/80">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={notifications.newMessage}
                  onChange={(e) =>
                    setNotifications((prev) => ({ ...prev, newMessage: e.target.checked }))
                  }
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-saffron-600 focus:ring-saffron-500"
                />
                <div>
                  <span className="text-xs font-semibold text-slate-800 block">New Messages</span>
                  <span className="text-[11px] text-slate-500">
                    Notify when teammates post messages in your active workspaces.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={notifications.aiSummary}
                  onChange={(e) =>
                    setNotifications((prev) => ({ ...prev, aiSummary: e.target.checked }))
                  }
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-saffron-600 focus:ring-saffron-500"
                />
                <div>
                  <span className="text-xs font-semibold text-slate-800 block">AI 7th Member Summaries</span>
                  <span className="text-[11px] text-slate-500">
                    Notify when a new synthesis card (decisions & action items) is published.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={notifications.callStarted}
                  onChange={(e) =>
                    setNotifications((prev) => ({ ...prev, callStarted: e.target.checked }))
                  }
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-saffron-600 focus:ring-saffron-500"
                />
                <div>
                  <span className="text-xs font-semibold text-slate-800 block">Meeting / Call Starts</span>
                  <span className="text-[11px] text-slate-500">
                    Notify when a teammate launches a live Jitsi group call room.
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              disabled={loading || !fullName.trim()}
              loading={loading}
              variant="primary"
              size="sm"
              className="px-6"
            >
              Save Profile & Preferences
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
