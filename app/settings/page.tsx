'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Navbar } from '@/components/Navbar';
import { ProfileEditor } from '@/components/settings/ProfileEditor';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Sparkles, UserCheck } from 'lucide-react';
import { UserProfile } from '@/lib/types';

export default function AccountSettingsPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function loadUser() {
      try {
        setLoading(true);
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) {
          router.push('/auth/login');
          return;
        }
        setCurrentUser(user);

        // Fetch current profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        setProfile(profileData || null);
      } catch (err) {
        console.error('Failed to load user settings', err);
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, [router, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center gap-2 text-saffron-600 font-bold">
          <Sparkles className="h-5 w-5 animate-spin" />
          <span>Loading account settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col">
      <Navbar user={currentUser} />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header Navigation */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/teams')}
              className="text-slate-500 hover:text-slate-900 px-2 h-7 mb-1"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Workspaces
            </Button>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <UserCheck className="h-6 w-6 text-slate-700" />
              Account & Profile Settings
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage your personal identity, theme preferences, and notifications across all SIH teams.
            </p>
          </div>
        </div>

        {/* Profile Editor Component */}
        <ProfileEditor initialProfile={profile} userEmail={currentUser?.email} />
      </main>
    </div>
  );
}
