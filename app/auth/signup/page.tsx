'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Sparkles, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { getFriendlyAuthErrorMessage } from '@/lib/auth/errors';

export default function SignupPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmationSent, setConfirmationSent] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const isConfigured = 
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder.supabase.co');

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
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

      const redirectUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/auth/callback?next=/teams`
        : undefined;

      const { data, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
          emailRedirectTo: redirectUrl,
        },
      });

      if (authError) {
        throw authError;
      }

      // Check for silent duplicate user (Supabase returns empty identities array when user already exists & email confirmation is on)
      if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        setError('An account with this email address already exists. Please log in with your password or request a password reset.');
        return;
      }

      // If Supabase has "Confirm email" enabled, session will be null
      if (data.user && !data.session) {
        setConfirmationSent(true);
        return;
      }

      // If user session created immediately (Confirm email is turned off)
      router.push('/teams');
      router.refresh();
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
          <CardTitle className="text-xl">Create your hackathon profile</CardTitle>
          <CardDescription>
            Join your 6–9 member team and start ideating with the AI 7th Member
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

          {confirmationSent ? (
            <div className="p-4 rounded-xl bg-sihgreen-50 text-sihgreen-800 border border-sihgreen-200 space-y-3">
              <div className="flex items-center gap-2 font-bold text-sihgreen-900">
                <CheckCircle2 className="h-5 w-5 text-sihgreen-600 shrink-0" />
                <span>Check your Gmail Inbox!</span>
              </div>
              <p className="text-xs text-sihgreen-800 leading-relaxed">
                We sent a confirmation link to <strong className="font-semibold">{email}</strong>. Please click the link in your email to activate your account, then log in.
              </p>
              <div className="pt-2 border-t border-sihgreen-200">
                <Link href="/auth/login">
                  <Button variant="primary" size="sm" className="w-full bg-sihgreen-600 hover:bg-sihgreen-700">
                    Go to Sign In <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <>
              {error && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 text-red-700 text-xs font-medium border border-red-200">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{error}</span>
                </div>
              )}

              <form onSubmit={handleSignup} className="space-y-4">
                <Input
                  label="Full Name"
                  type="text"
                  placeholder="e.g. Aarav Sharma"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />

                <Input
                  label="Email Address"
                  type="email"
                  placeholder="teammate@college.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

                <Input
                  label="Password (min 6 characters)"
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
                  Sign Up & Continue <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </form>

              <div className="text-center pt-4 border-t border-slate-100">
                <p className="text-xs text-slate-500">
                  Already have an account?{' '}
                  <Link href="/auth/login" className="font-bold text-saffron-600 hover:text-saffron-700 underline">
                    Log in
                  </Link>
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
