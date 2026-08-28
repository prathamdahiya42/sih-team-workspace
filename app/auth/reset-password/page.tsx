'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Sparkles, AlertCircle, ArrowRight, CheckCircle2, Lock } from 'lucide-react';
import { getFriendlyAuthErrorMessage } from '@/lib/auth/errors';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirmPassword) {
      setError('Please fill in both password fields');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        throw updateError;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/teams');
        router.refresh();
      }, 1500);
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
          <CardTitle className="text-xl">Set a new password</CardTitle>
          <CardDescription>
            Enter your new password below to secure your SIH workspace account
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 pt-4">
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 text-red-700 text-xs font-medium border border-red-200">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          {success ? (
            <div className="p-4 rounded-xl bg-sihgreen-50 text-sihgreen-800 border border-sihgreen-200 space-y-3">
              <div className="flex items-center gap-2 font-bold text-sihgreen-900">
                <CheckCircle2 className="h-5 w-5 text-sihgreen-600 shrink-0" />
                <span>Password Updated!</span>
              </div>
              <p className="text-xs text-sihgreen-800 leading-relaxed">
                Your password has been changed successfully. Redirecting you to your team workspace...
              </p>
            </div>
          ) : (
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <Input
                label="New Password (min 6 characters)"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <Input
                label="Confirm New Password"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                className="w-full shadow-glow-saffron font-bold text-sm"
              >
                Update Password & Sign In <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </form>
          )}

          <div className="text-center pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              Remember your password?{' '}
              <Link href="/auth/login" className="font-bold text-saffron-600 hover:text-saffron-700 underline">
                Back to Sign In
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
