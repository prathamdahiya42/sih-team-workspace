import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Users, MessageSquare, Video, Shield, Key, ArrowRight, Bot, CheckCircle2, ListTodo, HelpCircle } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Top Navbar */}
      <header className="border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-saffron-500 via-amber-400 to-sihgreen-500 p-0.5 shadow-sm">
              <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-white">
                <Sparkles className="h-4 w-4 text-saffron-500" />
              </div>
            </div>
            <span className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              SIH Collab
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sihgreen-50 text-sihgreen-700 border border-sihgreen-200">
                AI 7th Member
              </span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/auth/login">
              <Button variant="ghost" size="sm">Log In</Button>
            </Link>
            <Link href="/auth/signup">
              <Button variant="primary" size="sm" className="shadow-glow-saffron">
                Start Your Team <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-16 sm:pb-28 bg-gradient-to-b from-slate-50/80 via-white to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-saffron-50 border border-saffron-200/80 text-saffron-800 text-xs font-semibold mb-6 shadow-2xs">
            <Sparkles className="h-3.5 w-3.5 text-saffron-600" />
            Built for Smart India Hackathon (SIH) 6–9 Member Teams
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-950 tracking-tight max-w-4xl mx-auto leading-[1.15]">
            Meet Your Team's AI{' '}
            <span className="bg-gradient-to-r from-saffron-500 via-amber-500 to-sihgreen-600 bg-clip-text text-transparent">
              7th Member
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Stop losing critical hackathon ideation across scattered WhatsApp messages and long Google Meet calls. Collaborate in real-time with an AI teammate that actively synthesizes decisions, open questions, and action items.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
            <Link href="/auth/signup">
              <Button size="lg" variant="primary" className="shadow-glow-saffron text-sm px-6">
                Create or Join Team (6–9 Members)
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button size="lg" variant="outline" className="text-sm px-6">
                Sign In to Workspace
              </Button>
            </Link>
          </div>

          {/* Interactive Feature Demo Mockup */}
          <div className="mt-14 max-w-4xl mx-auto rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-6 shadow-card text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-red-400" />
                <span className="h-3 w-3 rounded-full bg-amber-400" />
                <span className="h-3 w-3 rounded-full bg-sihgreen-500" />
                <span className="text-xs font-bold text-slate-700 ml-2">SIH Team Alpha (Problem #1420)</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="green" className="text-[10px]">🟢 Live Call Ready</Badge>
                <Badge variant="saffron" className="text-[10px]">Groq Llama-3.3 70B Active</Badge>
              </div>
            </div>

            {/* Chat Simulation */}
            <div className="space-y-3">
              <div className="flex items-start gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-700">AK</div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-600">Aarav (Frontend Lead)</span>
                  <div className="p-2.5 rounded-xl bg-slate-100 text-xs text-slate-800 mt-0.5">
                    Should we build the offline sync using IndexedDB or SQLite WASM for the rural mobile UI?
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-navy-100 text-[10px] font-bold text-navy-800">PS</div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-600">Pooja (Backend)</span>
                  <div className="p-2.5 rounded-xl bg-slate-100 text-xs text-slate-800 mt-0.5">
                    Let's go with IndexedDB + Service Workers so it works without native app store packaging for the judges. I'll scaffold the API endpoints by 11 PM.
                  </div>
                </div>
              </div>

              {/* AI 7th Member Summary Card */}
              <div className="rounded-xl border-2 border-sihgreen-200 bg-gradient-to-b from-sihgreen-50/60 to-white p-4 mt-2">
                <div className="flex items-center justify-between border-b border-sihgreen-100 pb-2 mb-2.5">
                  <div className="flex items-center gap-1.5">
                    <Bot className="h-4 w-4 text-sihgreen-600" />
                    <span className="text-xs font-bold text-slate-900">7th Member (AI Summary)</span>
                    <Badge variant="green" className="text-[9px] py-0">Decision Extracted</Badge>
                  </div>
                  <span className="text-[10px] text-slate-400">Just now</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-2 bg-white rounded-lg border border-sihgreen-200">
                    <span className="font-bold text-sihgreen-700 block mb-1 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Key Decision:
                    </span>
                    <p className="text-slate-700 text-[11px]">Selected IndexedDB + Service Workers for frictionless browser-based offline demo.</p>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-200">
                    <span className="font-bold text-slate-800 block mb-1 flex items-center gap-1">
                      <ListTodo className="h-3 w-3 text-saffron-500" /> Action Item:
                    </span>
                    <p className="text-slate-700 text-[11px]">Pooja to scaffold backend API endpoints (Target: 11 PM).</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Pillars */}
      <section className="py-16 bg-slate-50 border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Designed specifically for the 36-hour SIH sprint
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-2">
              Everything hackathon teams need to stay aligned without friction.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Pillar 1 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-saffron-50 text-saffron-600 mb-4 border border-saffron-200">
                <Users className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Enforced 6–9 Member Capacity</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Smart India Hackathon teams have strict 6-student team limits. Unique invite codes make onboarding instant with zero friction.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sihgreen-50 text-sihgreen-600 mb-4 border border-sihgreen-200">
                <Video className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Zero-Setup In-App Calls</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Start video meetings directly inside your team workspace using free Jitsi Meet integration. Live banners alert online teammates instantly.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy-50 text-navy-800 mb-4 border border-navy-200">
                <Key className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">BYO Free AI Keys & Vault</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Plug in your free Groq, Google Gemini, or OpenRouter keys. Keys are encrypted at rest with Supabase Vault / AES-256 and never logged.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-8 bg-white text-center text-xs text-slate-400">
        <p>© 2026 SIH Team Collab Platform • Built for Smart India Hackathon</p>
      </footer>
    </div>
  );
}
