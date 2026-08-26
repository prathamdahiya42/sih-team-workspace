'use client';

import React, { useEffect, useRef } from 'react';
import { PhoneOff, Maximize2, Minimize2, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface JitsiCallRoomProps {
  roomName: string;
  userName: string;
  onEndCall: () => void;
  onClose: () => void;
}

declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

export function JitsiCallRoom({
  roomName,
  userName,
  onEndCall,
  onClose,
}: JitsiCallRoomProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const jitsiApiRef = useRef<any>(null);

  useEffect(() => {
    // Load Jitsi Meet External API Script
    const scriptId = 'jitsi-external-api-script';
    let script = document.getElementById(scriptId) as HTMLScriptElement;

    const initJitsi = () => {
      if (!window.JitsiMeetExternalAPI || !containerRef.current) return;

      // Dispose existing instance if any
      if (jitsiApiRef.current) {
        jitsiApiRef.current.dispose();
      }

      const domain = 'meet.jit.si';
      const options = {
        roomName,
        parentNode: containerRef.current,
        width: '100%',
        height: '100%',
        userInfo: {
          displayName: userName || 'SIH Teammate',
        },
        configOverwrite: {
          startWithAudioMuted: false,
          startWithVideoMuted: false,
          prejoinPageEnabled: false,
          disableDeepLinking: true,
          toolbarButtons: [
            'camera',
            'chat',
            'desktop',
            'microphone',
            'participants-pane',
            'raisehand',
            'settings',
            'tileview',
            'toggle-camera',
          ],
        },
        interfaceConfigOverwrite: {
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          DEFAULT_BACKGROUND: '#1A1A1A',
          MOBILE_APP_PROMO: false,
        },
      };

      const api = new window.JitsiMeetExternalAPI(domain, options);
      jitsiApiRef.current = api;

      api.addEventListener('videoConferenceLeft', () => {
        onClose();
      });
    };

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://meet.jit.si/external_api.js';
      script.async = true;
      script.onload = initJitsi;
      document.body.appendChild(script);
    } else {
      initJitsi();
    }

    return () => {
      if (jitsiApiRef.current) {
        jitsiApiRef.current.dispose();
        jitsiApiRef.current = null;
      }
    };
  }, [roomName, userName, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-2 sm:p-4 backdrop-blur-xs">
      <div className="flex h-full max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
        {/* Call Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-4 py-3 text-white">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sihgreen-500/20 text-sihgreen-400 border border-sihgreen-500/30">
              <Video className="h-4 w-4" />
            </div>
            <div>
              <span className="text-sm font-bold tracking-tight">SIH Team Meeting</span>
              <span className="ml-2 text-xs text-slate-400 font-mono hidden sm:inline">({roomName})</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="danger"
              size="sm"
              onClick={onEndCall}
              className="bg-red-600 hover:bg-red-700 text-xs font-semibold px-3"
            >
              <PhoneOff className="h-3.5 w-3.5 mr-1" />
              End Call
            </Button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
              title="Minimize Meeting"
            >
              <Minimize2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Video Surface Container */}
        <div ref={containerRef} className="relative flex-1 bg-slate-950" />
      </div>
    </div>
  );
}
