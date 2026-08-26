'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Sparkles, AlertCircle, ArrowRight, Lock, Mail } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const isConfigured = 
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder.supabase.co');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (!isConfigured) {
      setError(
        'Supabase is not configured on this deployment. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your Netlify Environment Variables, then trigger a redeploy.'
      );
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) {
        if (authError.message.toLowerCase().includes('email not confirmed')) {
          throw new Error('Email not confirmed. Please check your Gmail inbox for the confirmation link, or disable "Confirm email" in Supabase Auth settings for instant login.');
        }
        if (authError.message.toLowerCase().includes('failed to fetch') || authError.message.toLowerCase().includes('network')) {
          throw new Error('Unable to reach Supabase backend. Please check your Netlify environment variables (NEXT_PUBLIC_SUPABASE_URL).');
        }
        throw new Error(authError.message);
      }

      router.push('/teams');
      router.refresh();
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.toLowerCase().includes('fetch') || msg.toLowerCase().includes('network')) {
        setError('Unable to fetch from Supabase. Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in Netlify Site Settings > Environment Variables.');
      } else {
        setError(msg || 'Failed to sign in. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
      {/* Brand Header */}
      <Link href="/" className="flex items-center gap-2.5 mb-8 group">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-saffron-500 via-amber-400 to-sihgreen-500 p-0.5 shadow-soft transition group-hover:scale-105">
          <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-white">
            <Sparkles className="h-5 w-5 text-saffron-500" />
          </div>
        </div>
        <span className="text-xl font-extrabold text-slate-900 tracking-tight">SIH Collab</span>
      </Link>

      <Card className="w-full max-w-md shadow-card border-slate-200/80">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-xl">Sign in to your team</CardTitle>
          <CardDescription>
            Enter your email to enter your SIH workspace & collaborate with the AI 7th Member
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 pt-4">
          {!isConfigured && (
            <div className="p-3.5 rounded-xl bg-amber-50 text-amber-800 text-xs border border-amber-200 leading-relaxed">
              <div className="font-bold flex items-center gap-1.5 mb-1 text-amber-900">
                <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
                <span>Netlify Configuration Required</span>
              </div>
              Please add <code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-[11px]">NEXT_PUBLIC_SUPABASE_URL</code> and <code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-[11px]">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in Netlify (Site Settings → Environment variables), then redeploy.
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 text-red-700 text-xs font-medium border border-red-200">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="teammate@college.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full shadow-glow-saffron font-bold text-sm"
            >
              Sign In to Workspace <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </form>

          <div className="text-center pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              New hackathon team?{' '}
              <Link href="/auth/signup" className="font-bold text-saffron-600 hover:text-saffron-700 underline">
                Create an account
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
