'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Navbar } from '@/components/Navbar';
import { ChatContainer } from '@/components/chat/ChatContainer';
import { LiveCallBanner } from '@/components/calls/LiveCallBanner';
import { JitsiCallRoom } from '@/components/calls/JitsiCallRoom';
import { Sparkles, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function TeamWorkspacePage() {
  const params = useParams();
  const teamId = params?.teamId as string;
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [team, setTeam] = useState<any>(null);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [initialMessages, setInitialMessages] = useState<any[]>([]);

  // Call state
  const [activeCallRoom, setActiveCallRoom] = useState<string | null>(null);
  const [activeCallId, setActiveCallId] = useState<string | null>(null);

  const loadWorkspaceData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }
      setCurrentUser(user);

      // 2. Fetch Team Details
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .select('*')
        .eq('id', teamId)
        .single();

      if (teamError || !teamData) {
        throw new Error('Team workspace not found or you do not have permission to view it.');
      }
      setTeam(teamData);

      // 3. Fetch Team Members & Profiles
      const { data: membersData, error: membersError } = await supabase
        .from('team_members')
        .select(`
          user_id,
          role,
          joined_at,
          profile:user_id (
            full_name,
            email,
            avatar_url
          )
        `)
        .eq('team_id', teamId);

      if (membersError) {
        console.error('Error fetching members:', membersError);
      }
      setTeamMembers(membersData || []);

      // Check if current user is a member
      const isMember = (membersData || []).some((m) => m.user_id === user.id);
      if (!isMember) {
        throw new Error('You are not a member of this team. Please join using an invite code.');
      }

      // 4. Fetch Initial Messages (last 60)
      const { data: msgsData, error: msgsError } = await supabase
        .from('messages')
        .select('*')
        .eq('team_id', teamId)
        .order('created_at', { ascending: true })
        .limit(60);

      if (msgsError) {
        console.error('Error fetching messages:', msgsError);
      }
      setInitialMessages(msgsData || []);

    } catch (err: any) {
      setError(err.message || 'Failed to load workspace');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (teamId) {
      loadWorkspaceData();
    }
  }, [teamId]);

  // Start a new in-app Jitsi call
  const handleStartCall = async () => {
    try {
      const res = await fetch('/api/calls/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to start call');

      setActiveCallId(data.callId);
      setActiveCallRoom(data.roomName);
    } catch (err: any) {
      alert('Error starting call: ' + err.message);
    }
  };

  // Join existing call from banner
  const handleJoinCall = (roomName: string, callId: string) => {
    setActiveCallId(callId);
    setActiveCallRoom(roomName);
  };

  // End live call
  const handleEndCall = async () => {
    if (!activeCallId) {
      setActiveCallRoom(null);
      return;
    }

    try {
      await fetch('/api/calls/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callId: activeCallId, teamId }),
      });
    } catch (e) {
      console.error('Error ending call:', e);
    } finally {
      setActiveCallRoom(null);
      setActiveCallId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center gap-2 text-saffron-600 font-bold">
          <Sparkles className="h-5 w-5 animate-spin" />
          <span>Opening {team?.name || 'team'} workspace...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-6 rounded-2xl border border-red-200 shadow-card text-center space-y-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600 mx-auto">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Access Restricted</h2>
          <p className="text-xs text-slate-500">{error}</p>
          <Button variant="primary" size="sm" onClick={() => router.push('/teams')}>
            Back to Team Workspaces
          </Button>
        </div>
      </div>
    );
  }

  const userDisplayName = currentUser?.user_metadata?.full_name || currentUser?.email?.split('@')[0] || 'SIH Member';

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col">
      <Navbar
        user={currentUser}
        team={team}
        onStartCall={handleStartCall}
        isCallActive={!!activeCallRoom}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-2 sm:px-6 lg:px-8 py-3 sm:py-4 flex flex-col">
        {/* Live Call Banner if another teammate started a meeting */}
        <LiveCallBanner
          teamId={teamId}
          onJoinCall={handleJoinCall}
          activeCallId={activeCallId}
        />

        {/* Real-time Group Chat & AI 7th Member Container */}
        <ChatContainer
          teamId={teamId}
          initialMessages={initialMessages}
          currentUser={currentUser}
          teamMembers={teamMembers}
        />
      </main>

      {/* Embedded In-App Jitsi Meeting Frame */}
      {activeCallRoom && (
        <JitsiCallRoom
          roomName={activeCallRoom}
          userName={userDisplayName}
          onEndCall={handleEndCall}
          onClose={() => setActiveCallRoom(null)}
        />
      )}
    </div>
  );
}
