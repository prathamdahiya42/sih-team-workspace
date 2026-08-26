'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Sparkles, Users, LogOut, PhoneCall, Settings, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface NavbarProps {
  user?: any;
  team?: {
    id: string;
    name: string;
    invite_code: string;
  } | null;
  onStartCall?: () => void;
  isCallActive?: boolean;
}

export function Navbar({ user, team, onStartCall, isCallActive }: NavbarProps) {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand & Logo */}
        <div className="flex items-center gap-4">
          <Link href={team ? `/teams/${team.id}` : '/teams'} className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-saffron-500 via-amber-400 to-sihgreen-500 p-0.5 shadow-sm transition group-hover:scale-105">
              <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-white">
                <Sparkles className="h-4 w-4 text-saffron-500" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold text-slate-900 leading-none tracking-tight flex items-center gap-1.5">
                SIH Collab
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sihgreen-50 text-sihgreen-700 border border-sihgreen-200">
                  AI 7th Member
                </span>
              </span>
              <span className="text-[11px] text-slate-400 font-medium">Smart India Hackathon Workspace</span>
            </div>
          </Link>

          {/* Active Team Pill */}
          {team && (
            <div className="hidden md:flex items-center gap-2 pl-4 border-l border-slate-200">
              <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                {team.name}
              </span>
              <Badge variant="saffron" className="font-mono text-[11px]">
                Code: {team.invite_code}
              </Badge>
            </div>
          )}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2.5">
          {team && onStartCall && (
            <Button
              variant={isCallActive ? 'secondary' : 'primary'}
              size="sm"
              onClick={onStartCall}
              className={isCallActive ? 'border border-sihgreen-300 text-sihgreen-700 bg-sihgreen-50' : 'bg-saffron-500 hover:bg-saffron-600'}
            >
              <PhoneCall className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{isCallActive ? 'Open Meeting' : 'Start Call'}</span>
            </Button>
          )}

          {team && (
            <Link href={`/teams/${team.id}/settings`}>
              <Button variant="ghost" size="icon" title="Team Settings & API Keys">
                <Settings className="h-4 w-4 text-slate-600" />
              </Button>
            </Link>
          )}

          {user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-navy-50 text-navy-800 font-semibold text-xs border border-navy-200">
                {user.email?.slice(0, 2).toUpperCase() || 'U'}
              </div>
              <Button variant="ghost" size="icon" onClick={handleLogout} title="Sign Out">
                <LogOut className="h-4 w-4 text-slate-500" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/auth/login">
                <Button variant="ghost" size="sm">Log in</Button>
              </Link>
              <Link href="/auth/signup">
                <Button variant="primary" size="sm">Get Started</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
