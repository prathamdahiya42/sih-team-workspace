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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
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
        throw new Error(authError.message);
      }

      router.push('/teams');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to sign in. Please check your credentials.');
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
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 text-red-700 text-xs font-medium border border-red-200">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
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
