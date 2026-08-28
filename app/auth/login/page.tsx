'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Sparkles, AlertCircle, ArrowRight, Lock, Mail, CheckCircle2, KeyRound } from 'lucide-react';
import { getFriendlyAuthErrorMessage } from '@/lib/auth/errors';

type AuthMode = 'password' | 'magic_link' | 'forgot_password';

function LoginForm() {
  const [mode, setMode] = useState<AuthMode>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailSentNotice, setEmailSentNotice] = useState<string | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const isConfigured = 
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder.supabase.co');

  // Check URL query parameters for callback messages or errors
  useEffect(() => {
    const urlError = searchParams.get('error') || searchParams.get('error_description');
    const urlMsg = searchParams.get('message');

    if (urlError) {
      setError(getFriendlyAuthErrorMessage(urlError));
    } else if (urlMsg) {
      setEmailSentNotice(urlMsg);
    }
  }, [searchParams]);

  // 1. Password Sign In
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
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
      setEmailSentNotice(null);

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) {
        throw authError;
      }

      router.push('/teams');
      router.refresh();
    } catch (err: any) {
      setError(getFriendlyAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // 2. Magic Link Sign In (Custom SMTP / Resend)
  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setEmailSentNotice(null);

      const redirectUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/auth/callback?next=/teams`
        : undefined;

      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: redirectUrl,
        },
      });

      if (otpError) {
        throw otpError;
      }

      setEmailSentNotice(`Magic sign-in link sent to ${email.trim()}! Check your inbox to sign in instantly.`);
    } catch (err: any) {
      setError(getFriendlyAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // 3. Forgot / Reset Password Request (Custom SMTP / Resend)
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setEmailSentNotice(null);

      const redirectUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/auth/callback?next=/auth/reset-password`
        : undefined;

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: redirectUrl,
      });

      if (resetError) {
        throw resetError;
      }

      setEmailSentNotice(`Password reset link sent to ${email.trim()}! Please check your email to set a new password.`);
    } catch (err: any) {
      setError(getFriendlyAuthErrorMessage(err));
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
          <CardTitle className="text-xl">
            {mode === 'password' && 'Sign in to your team'}
            {mode === 'magic_link' && 'Sign in with Magic Link'}
            {mode === 'forgot_password' && 'Reset your password'}
          </CardTitle>
          <CardDescription>
            {mode === 'password' && 'Enter your credentials to access your SIH workspace & AI 7th Member'}
            {mode === 'magic_link' && 'We’ll email you a passwordless sign-in link via Resend'}
            {mode === 'forgot_password' && 'Enter your account email and we’ll send a secure password reset link'}
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

          {emailSentNotice && (
            <div className="p-3.5 rounded-xl bg-sihgreen-50 text-sihgreen-800 text-xs border border-sihgreen-200 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-sihgreen-900">
                <CheckCircle2 className="h-4 w-4 text-sihgreen-600 shrink-0" />
                <span>Email Dispatched!</span>
              </div>
              <p className="leading-relaxed">{emailSentNotice}</p>
            </div>
          )}

          {/* Mode 1: Password Form */}
          {mode === 'password' && (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <Input
                label="Email Address"
                type="email"
                placeholder="teammate@college.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot_password');
                      setError(null);
                      setEmailSentNotice(null);
                    }}
                    className="text-[11px] text-saffron-600 hover:text-saffron-700 font-semibold underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                className="w-full shadow-glow-saffron font-bold text-sm"
              >
                Sign In to Workspace <ArrowRight className="h-4 w-4 ml-1" />
              </Button>

              <div className="pt-1 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setMode('magic_link');
                    setError(null);
                    setEmailSentNotice(null);
                  }}
                  className="text-xs text-slate-600 hover:text-slate-900 font-medium inline-flex items-center gap-1.5"
                >
                  <Mail className="h-3.5 w-3.5 text-slate-400" />
                  <span>Sign in with Magic Link instead</span>
                </button>
              </div>
            </form>
          )}

          {/* Mode 2: Magic Link Form */}
          {mode === 'magic_link' && (
            <form onSubmit={handleMagicLink} className="space-y-4">
              <Input
                label="Email Address"
                type="email"
                placeholder="teammate@college.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                className="w-full shadow-glow-saffron font-bold text-sm"
              >
                Send Magic Link <Mail className="h-4 w-4 ml-1" />
              </Button>

              <div className="pt-1 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setMode('password');
                    setError(null);
                    setEmailSentNotice(null);
                  }}
                  className="text-xs text-slate-600 hover:text-slate-900 font-medium inline-flex items-center gap-1.5"
                >
                  <Lock className="h-3.5 w-3.5 text-slate-400" />
                  <span>Back to Password Sign In</span>
                </button>
              </div>
            </form>
          )}

          {/* Mode 3: Forgot Password Form */}
          {mode === 'forgot_password' && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <Input
                label="Account Email Address"
                type="email"
                placeholder="teammate@college.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                className="w-full shadow-glow-saffron font-bold text-sm"
              >
                Send Password Reset Link <KeyRound className="h-4 w-4 ml-1" />
              </Button>

              <div className="pt-1 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setMode('password');
                    setError(null);
                    setEmailSentNotice(null);
                  }}
                  className="text-xs text-slate-600 hover:text-slate-900 font-medium inline-flex items-center gap-1.5"
                >
                  <Lock className="h-3.5 w-3.5 text-slate-400" />
                  <span>Back to Password Sign In</span>
                </button>
              </div>
            </form>
          )}

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

export default function LoginPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
            <Sparkles className="h-4 w-4 text-saffron-500 animate-spin" />
            <span>Loading authentication...</span>
          </div>
        </div>
      }
    >
      <LoginForm />
    </React.Suspense>
  );
}
