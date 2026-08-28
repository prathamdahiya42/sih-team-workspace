'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Navbar } from '@/components/Navbar';
import { ApiKeyManager } from '@/components/settings/ApiKeyManager';
import { ProjectBriefEditor } from '@/components/settings/ProjectBriefEditor';
import { TeamMembersList } from '@/components/settings/TeamMembersList';
import { Button } from '@/components/ui/button';
import { Sparkles, ArrowLeft, Settings, ShieldCheck } from 'lucide-react';

export default function TeamSettingsPage() {
  const params = useParams();
  const teamId = params?.teamId as string;
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [team, setTeam] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);

  const loadSettingsData = async () => {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }
      setCurrentUser(user);

      // Fetch team
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .select('*')
        .eq('id', teamId)
        .single();

      if (teamError || !teamData) {
        throw new Error('Team not found');
      }
      setTeam(teamData);

      // Fetch members (direct table query without fragile nested schema cache joins)
      const { data: membersData, error: membersError } = await supabase
        .from('team_members')
        .select('team_id, user_id, role, custom_role, joined_at')
        .eq('team_id', teamId);

      if (membersError) {
        console.error('Error fetching members:', membersError);
      }

      const currentMembers = membersData || [];
      const userIds = currentMembers.map((m) => m.user_id).filter(Boolean);
      let profilesMap: Record<string, any> = {};

      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name, email, avatar_url')
          .in('id', userIds);

        (profilesData || []).forEach((p) => {
          profilesMap[p.id] = p;
        });
      }

      const enrichedMembers = currentMembers.map((m) => ({
        ...m,
        profile: profilesMap[m.user_id] || {
          full_name: m.user_id === user.id 
            ? (user.user_metadata?.full_name || user.email?.split('@')[0] || 'You')
            : 'Teammate',
          email: m.user_id === user.id ? user.email : undefined,
          avatar_url: null,
        },
      }));

      setMembers(enrichedMembers);
    } catch (e) {
      console.error('Error loading settings', e);
      router.push('/teams');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (teamId) {
      loadSettingsData();
    }
  }, [teamId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center gap-2 text-saffron-600 font-bold">
          <Sparkles className="h-5 w-5 animate-spin" />
          <span>Loading team settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col">
      <Navbar user={currentUser} team={team} />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Breadcrumb Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/teams/${teamId}`)}
                className="text-slate-500 hover:text-slate-900 px-2 h-7"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Workspace
              </Button>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Settings className="h-6 w-6 text-slate-700" />
              {team?.name} — Settings & AI Keys
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage your free-tier AI keys, SIH problem statement, and 6–9 member roster.
            </p>
          </div>
        </div>

        {/* 1. Multi-Provider AI Keys & Free Tier Manager */}
        <ApiKeyManager teamId={teamId} />

        {/* 2. SIH Problem Statement / Project Brief */}
        <ProjectBriefEditor teamId={teamId} initialBrief={team?.project_brief} />

        {/* 3. Team Roster & Capacity Cap */}
        <TeamMembersList team={team} members={members} currentUserId={currentUser?.id} />
      </main>
    </div>
  );
}
