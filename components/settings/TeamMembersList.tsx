'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Copy, Check, Shield, UserPlus } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface Member {
  user_id: string;
  role: 'owner' | 'member';
  joined_at?: string;
  profile?: {
    full_name?: string;
    email?: string;
    avatar_url?: string;
  };
}

interface TeamMembersListProps {
  team: {
    id: string;
    name: string;
    invite_code: string;
  };
  members: Member[];
  currentUserId?: string;
}

export function TeamMembersList({ team, members, currentUserId }: TeamMembersListProps) {
  const [copiedCode, setCopiedCode] = useState(false);
  const memberCount = members.length;
  const maxCap = 9;
  const isFull = memberCount >= maxCap;

  const handleCopyInviteCode = () => {
    navigator.clipboard.writeText(team.invite_code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sihgreen-50 text-sihgreen-600 border border-sihgreen-200">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <CardTitle>Team Roster & SIH Capacity</CardTitle>
              <CardDescription>
                SIH teams are capped at 6–9 members. Teammates can join using your unique team code.
              </CardDescription>
            </div>
          </div>

          <Badge variant={isFull ? 'danger' : 'green'} className="text-xs px-3 py-1">
            {memberCount} / {maxCap} Members {isFull ? '(Max Cap Reached)' : '(Slots Open)'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Invite Code Box */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl bg-saffron-50/60 border border-saffron-200">
          <div>
            <span className="text-xs font-bold text-saffron-900 block">Team Invite Code</span>
            <span className="text-[11px] text-saffron-700">Share this code with your teammates to let them join:</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-base font-bold bg-white px-3 py-1 rounded-lg border border-saffron-300 text-saffron-900 tracking-wider">
              {team.invite_code}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyInviteCode}
              className="bg-white border-saffron-300 text-saffron-800 hover:bg-saffron-100"
            >
              {copiedCode ? <Check className="h-3.5 w-3.5 text-sihgreen-600 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
              {copiedCode ? 'Copied' : 'Copy Code'}
            </Button>
          </div>
        </div>

        {/* Member Capacity Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-semibold text-slate-700">
            <span>SIH Team Size Target: 6 to 9 Members</span>
            <span>{Math.round((memberCount / maxCap) * 100)}%</span>
          </div>
          <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 rounded-full ${
                memberCount >= 6 ? 'bg-sihgreen-500' : 'bg-saffron-500'
              }`}
              style={{ width: `${(memberCount / maxCap) * 100}%` }}
            />
          </div>
        </div>

        {/* Member List */}
        <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden">
          {members.map((member) => {
            const name = member.profile?.full_name || member.profile?.email?.split('@')[0] || 'Teammate';
            const email = member.profile?.email || '—';
            const isSelf = member.user_id === currentUserId;

            return (
              <div key={member.user_id} className="flex items-center justify-between p-3.5 bg-white hover:bg-slate-50 transition">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-navy-50 text-navy-800 font-bold text-xs border border-navy-200">
                    {name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">{name}</span>
                      {isSelf && <span className="text-[10px] text-slate-400 font-semibold">(You)</span>}
                    </div>
                    <span className="text-[11px] text-slate-400">{email}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant={member.role === 'owner' ? 'saffron' : 'outline'} className="text-[10px]">
                    {member.role === 'owner' ? 'Team Lead' : 'Member'}
                  </Badge>
                  {member.joined_at && (
                    <span className="text-[10px] text-slate-400 hidden sm:inline">
                      Joined {formatDate(member.joined_at)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
