'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { PhoneCall, Video, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LiveCallBannerProps {
  teamId: string;
  onJoinCall: (roomName: string, callId: string) => void;
  activeCallId?: string | null;
}

export function LiveCallBanner({ teamId, onJoinCall, activeCallId }: LiveCallBannerProps) {
  const [liveCall, setLiveCall] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    // Fetch current active call
    const fetchActiveCall = async () => {
      const { data, error } = await supabase
        .from('calls')
        .select('*')
        .eq('team_id', teamId)
        .is('ended_at', null)
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data && !error) {
        setLiveCall(data);
      } else {
        setLiveCall(null);
      }
    };

    fetchActiveCall();

    // Subscribe to realtime updates on calls
    const channel = supabase
      .channel(`team-calls-${teamId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'calls',
          filter: `team_id=eq.${teamId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            if (!payload.new.ended_at) {
              setLiveCall(payload.new);
            }
          } else if (payload.eventType === 'UPDATE') {
            if (payload.new.ended_at) {
              setLiveCall((prev: any) => (prev?.id === payload.new.id ? null : prev));
            } else {
              setLiveCall(payload.new);
            }
          } else if (payload.eventType === 'DELETE') {
            setLiveCall(null);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [teamId, supabase]);

  if (!liveCall || liveCall.id === activeCallId) return null;

  return (
    <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-sihgreen-500 via-emerald-600 to-teal-600 px-4 py-2.5 text-white shadow-soft transition-all animate-in fade-in slide-in-from-top-2 mb-3">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 backdrop-blur-xs text-white animate-pulse">
          <Video className="h-4 w-4" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-green-300 animate-ping" />
            <p className="text-xs font-bold tracking-tight">Team Call in Progress</p>
          </div>
          <p className="text-[11px] text-white/80">Teammates are currently collaborating live</p>
        </div>
      </div>

      <Button
        variant="secondary"
        size="sm"
        onClick={() => onJoinCall(liveCall.room_name, liveCall.id)}
        className="bg-white text-sihgreen-700 hover:bg-white/90 font-bold shadow-xs text-xs"
      >
        <PhoneCall className="h-3.5 w-3.5 mr-1" />
        Join Meeting
      </Button>
    </div>
  );
}
