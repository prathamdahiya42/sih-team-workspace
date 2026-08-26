'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Navbar } from '@/components/Navbar';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Modal } from '@/components/ui/modal';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Users, Plus, ArrowRight, LogIn, Shield, Hash, MessageSquare } from 'lucide-react';

export default function TeamsPage() {
  const [user, setUser] = useState<any>(null);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);

  // Form states
  const [teamName, setTeamName] = useState('');
  const [projectBrief, setProjectBrief] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const router = useRouter();
  const supabase = createClient();

  const loadUserData = async () => {
    try {
      setLoading(true);
      const { data: { user: currentUser } } = await supabase.auth.getUser();

      if (!currentUser) {
        router.push('/auth/login');
        return;
      }

      setUser(currentUser);

      // Fetch user's teams
      const { data: userMemberships, error } = await supabase
        .from('team_members')
        .select(`
          role,
          teams:team_id (
            id,
            name,
            invite_code,
            project_brief,
            created_at
          )
        `)
        .eq('user_id', currentUser.id);

      if (userMemberships) {
        const extractedTeams = userMemberships
          .map((m: any) => ({
            ...m.teams,
            user_role: m.role,
          }))
          .filter(Boolean);
        setTeams(extractedTeams);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserData();
  }, []);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) return;

    try {
      setActionLoading(true);
      setErrorMsg(null);

      const res = await fetch('/api/teams/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: teamName.trim(), projectBrief: projectBrief.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create team');

      setIsCreateOpen(false);
      router.push(`/teams/${data.team.id}`);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleJoinTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;

    try {
      setActionLoading(true);
      setErrorMsg(null);

      const res = await fetch('/api/teams/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteCode: inviteCode.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to join team');

      setIsJoinOpen(false);
      router.push(`/teams/${data.team.id}`);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center gap-2 text-saffron-600 font-bold">
          <Sparkles className="h-5 w-5 animate-spin" />
          <span>Loading your SIH workspaces...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col">
      <Navbar user={user} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Hub Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8 border-b border-slate-200">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              SIH Team Workspaces
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Select an active team workspace to open your real-time chat, calls, and AI 7th Member.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => setIsJoinOpen(true)} className="bg-white">
              <LogIn className="h-4 w-4 mr-1.5" />
              Join via Code
            </Button>
            <Button variant="primary" size="sm" onClick={() => setIsCreateOpen(true)} className="shadow-glow-saffron">
              <Plus className="h-4 w-4 mr-1.5" />
              Create Team
            </Button>
          </div>
        </div>

        {/* Teams Grid */}
        <div className="mt-8">
          {teams.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center max-w-xl mx-auto my-12">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-saffron-50 text-saffron-600 mx-auto mb-4 border border-saffron-200">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">No teams joined yet</h3>
              <p className="text-xs text-slate-500 mt-1.5 max-w-sm mx-auto leading-relaxed">
                Create a new 6–9 member hackathon team or paste an invite code from your team lead to get started.
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <Button variant="primary" size="sm" onClick={() => setIsCreateOpen(true)}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Create Team
                </Button>
                <Button variant="outline" size="sm" onClick={() => setIsJoinOpen(true)}>
                  Join with Code
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teams.map((team) => (
                <Card key={team.id} className="hover:border-saffron-300 hover:shadow-card transition flex flex-col justify-between">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base font-bold truncate">{team.name}</CardTitle>
                      <Badge variant={team.user_role === 'owner' ? 'saffron' : 'outline'} className="text-[10px]">
                        {team.user_role === 'owner' ? 'Lead' : 'Member'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500 text-xs font-mono pt-1">
                      <Hash className="h-3 w-3 text-slate-400" />
                      <span>Code: {team.invite_code}</span>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    {team.project_brief ? (
                      <p className="text-xs text-slate-600 line-clamp-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 italic">
                        "{team.project_brief}"
                      </p>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No SIH problem brief configured yet.</p>
                    )}

                    <div className="pt-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => router.push(`/teams/${team.id}`)}
                        className="w-full justify-between group"
                      >
                        <span className="flex items-center gap-1.5">
                          <MessageSquare className="h-3.5 w-3.5" />
                          Open Workspace
                        </span>
                        <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Create Team Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => { setIsCreateOpen(false); setErrorMsg(null); }}
        title="Create SIH Hackathon Team"
        description="Enforces 6–9 member capacity and gives you a unique invite code."
      >
        {errorMsg && (
          <div className="p-3 mb-4 rounded-xl bg-red-50 text-red-700 text-xs border border-red-200">
            {errorMsg}
          </div>
        )}
        <form onSubmit={handleCreateTeam} className="space-y-4">
          <Input
            label="Team Name"
            placeholder="e.g. SIH Alpha Coders"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            required
          />
          <Textarea
            label="SIH Problem Statement / Theme (Optional)"
            placeholder="e.g. Problem #1420: AI Disaster Relief Resource Routing..."
            value={projectBrief}
            onChange={(e) => setProjectBrief(e.target.value)}
            helperText="The AI 7th Member uses this context to ground all summaries."
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" loading={actionLoading}>
              Create & Open Workspace
            </Button>
          </div>
        </form>
      </Modal>

      {/* Join Team Modal */}
      <Modal
        isOpen={isJoinOpen}
        onClose={() => { setIsJoinOpen(false); setErrorMsg(null); }}
        title="Join Team via Invite Code"
        description="Enter the 8-character code provided by your team lead (e.g. SIH-X7K9)."
      >
        {errorMsg && (
          <div className="p-3 mb-4 rounded-xl bg-red-50 text-red-700 text-xs border border-red-200">
            {errorMsg}
          </div>
        )}
        <form onSubmit={handleJoinTeam} className="space-y-4">
          <Input
            label="Team Invite Code"
            placeholder="SIH-XXXX"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
            required
            className="font-mono uppercase tracking-wider"
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsJoinOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" loading={actionLoading}>
              Join Team Workspace
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
