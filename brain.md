# 🧠 Brain Context: SIH AI Team Collaboration Platform ("7th Member")

> **Purpose of this file:** Share this file with Claude, ChatGPT, or any other AI model to instantly give it 100% full context of the codebase, architecture, database schema, design decisions, and future roadmap.

---

## 📌 1. Project Overview & Vision

* **Project Name:** SIH Collab — Smart India Hackathon Collaboration Platform with AI "7th Member"
* **Objective:** A real-time collaboration hub tailored specifically for Smart India Hackathon (SIH) teams (enforcing strict 6–9 member capacity).
* **The Core Innovation ("AI 7th Member"):** 
  SIH teams consist of 6 students. The platform introduces a **virtual AI 7th Member** who listens to real-time chat & meetings, understands the team's official SIH problem statement, and autonomously synthesizes:
  - 🎯 **Decisions Made**
  - ❓ **Open Questions & Ambiguities**
  - ✅ **Action Items with Teammate Assignments**
  - 📞 **Instant Live Meeting Summaries** (via embedded Jitsi Meet)

---

## 🛠️ 2. Tech Stack & Key Libraries

| Layer | Technology | Purpose |
|---|---|---|
| **Framework** | **Next.js 14.2 (App Router)** | Full-stack React framework with SSR and Server Components |
| **Language** | **TypeScript 5.7** | Strict type safety |
| **Styling** | **Tailwind CSS 3.4** | Indian Tricolor / Modern Clean Theme (Saffron `#FF671F`, SIH Green `#046A38`, Navy `#06038D`) |
| **Icons** | **Lucide React** | Feather-light UI iconography |
| **Database & Auth** | **Supabase (PostgreSQL + RLS + Realtime)** | User auth, real-time message streaming, calls, and summaries |
| **Video Calls** | **Jitsi Meet API (`meet.jit.si`)** | Free, zero-setup, in-app encrypted group video calls |
| **AI Integration** | **Multi-Provider BYOK (Bring Your Own Key)** | Free-tier LLMs: **Groq**, **Google Gemini**, **OpenRouter** |
| **Key Security** | **Node `crypto` (AES-256-GCM)** | Team API keys encrypted at rest |
| **Deployment** | **Netlify (`@netlify/plugin-nextjs`)** | Production hosting & edge serverless functions |

---

## 🗄️ 3. Database Schema & Architecture (Supabase SQL)

### Tables Overview:
1. `profiles`: User details synced from `auth.users` (`id`, `full_name`, `email`, `avatar_url`, `preferences: jsonb`).
2. `teams`: Hackathon teams (`id`, `name`, `invite_code`, `project_brief`, `created_by`, `created_at`).
3. `team_members`: Junction table (`team_id`, `user_id`, `role: 'owner' | 'member'`, `custom_role: text`, `joined_at`).
   - *Database Trigger:* `check_team_member_cap()` strictly prevents inserting > 9 members per team.
4. `messages`: Real-time chat feed (`id`, `team_id`, `user_id`, `content`, `type: 'text' | 'agent' | 'transcript' | 'system' | 'imported'`, `meta: jsonb`, `created_at`).
5. `summaries`: Compressed context history (`id`, `team_id`, `content`, `decisions`, `open_questions`, `action_items`, `message_range_start`, `message_range_end`, `generated_at`).
6. `calls`: Meeting logs (`id`, `team_id`, `room_name`, `started_by`, `started_at`, `ended_at`, `recap_message_id`).
7. `team_api_keys`: Encrypted team LLM keys (`team_id`, `provider`, `model_id`, `encrypted_key`, `is_active`, `updated_at`).
8. `chat_imports`: Historical chat import tracking (`id`, `team_id`, `uploaded_by`, `filename`, `message_count`, `matched_count`, `unmatched_senders`, `created_at`).

### Important Row-Level Security (RLS) & Server Pattern:
- **Client Queries:** Direct queries in frontend use standard authenticated client (`createClient()` from `@/lib/supabase/client`).
- **Server API Routes:** Use `createAdminClient()` from `@/lib/supabase/admin` for operations that cross RLS boundaries (e.g., non-members looking up a team by invite code in `/api/teams/join` or creating a team).
- **Decoupled Profile Fetching:** Frontend queries `team_members` and `profiles` in two separate clean steps (`.in('id', userIds)`) rather than fragile nested schema-cache joins (`profile:user_id`).

---

## 📁 4. Project Directory Structure

```
d:/CODING REALTED/Most important/MY SIH DASHBOARD/
├── app/
│   ├── api/
│   │   ├── calls/
│   │   │   ├── start/route.ts       # Starts Jitsi call & posts system alert in chat
│   │   │   └── end/route.ts         # Ends call session & logs ended timestamp
│   │   ├── chat/
│   │   │   └── extension/route.ts   # Executes /research, /web-search, /tech-stack with active LLM & web search
│   │   ├── profile/route.ts         # GET & PATCH user profile & preferences
│   │   ├── settings/
│   │   │   ├── brief/route.ts       # Updates team's SIH Problem Brief
│   │   │   ├── keys/
│   │   │   │   ├── route.ts         # GET configured keys (masked) / POST validate & encrypt key
│   │   │   │   └── active/route.ts  # Switches active LLM provider/model
│   │   │   └── models/
│   │   │       └── openrouter/route.ts # Live fetch of free OpenRouter models
│   │   ├── summarize/route.ts       # Core AI 7th Member endpoint (incremental context synthesis)
│   │   └── teams/
│   │       ├── create/route.ts      # Creates team with SIH-XXXX code & sets owner
│   │       ├── join/route.ts        # Validates code, enforces 9-cap, adds member
│   │       └── [teamId]/
│   │           ├── import/whatsapp/route.ts # Parses & inserts WhatsApp chat history
│   │           └── members/[userId]/role/route.ts # Owner assigns custom member role
│   ├── auth/
│   │   ├── callback/route.ts        # Supabase OAuth, Magic Link & Password Reset exchange
│   │   ├── login/page.tsx           # Sign-in UI (Password, Magic Link & Password Reset modes)
│   │   ├── reset-password/page.tsx  # Password reset update page
│   │   └── signup/page.tsx          # Sign-up UI with Resend SMTP confirmation detection
│   ├── settings/
│   │   └── page.tsx                 # Account-level Profile & Preferences Settings page
│   ├── teams/
│   │   ├── page.tsx                 # Team Hub (List teams, Create modal, Join modal)
│   │   └── [teamId]/
│   │       ├── page.tsx             # Team Workspace (Chat + Live Banner + Jitsi Modal)
│   │       └── settings/page.tsx    # Team Settings (Keys, SIH Brief, Roster)
│   ├── globals.css                  # Tailwind styles + custom color variables
│   ├── layout.tsx                   # Root layout
│   └── page.tsx                     # Landing page
├── components/
│   ├── calls/
│   │   ├── JitsiCallRoom.tsx        # Embedded 8x8 Jitsi Meet iframe with full UI controls
│   │   └── LiveCallBanner.tsx       # Real-time banner notifying teammates of an active meeting
│   ├── chat/
│   │   ├── ChatContainer.tsx        # Real-time chat feed with Supabase postgres_changes
│   │   ├── ChatInput.tsx            # Input box with "/" command autocomplete & "🧩 Extensions" menu
│   │   ├── MessageBubble.tsx        # Renders User, System, WhatsApp Imported, AI Research & Summary cards
│   │   ├── SummaryCard.tsx          # Structured decisions, questions, & action items UI
│   │   └── WhatsAppImportModal.tsx  # WhatsApp chat import dropzone, pre-parse & confirmation
│   ├── settings/
│   │   ├── ApiKeyManager.tsx        # BYOK UI for Groq, Gemini, OpenRouter (shared team key)
│   │   ├── ProfileEditor.tsx        # Profile full_name, displayName, theme & notification preferences
│   │   ├── ProjectBriefEditor.tsx   # SIH problem statement editor
│   │   └── TeamMembersList.tsx      # Roster list, 6-9 capacity meter, invite code copier & custom roles
│   ├── ui/                          # Custom accessible UI kit (Button, Input, Card, Modal, Badge, Textarea)
│   └── Navbar.tsx                   # Top navigation with active team badge, account profile link & call launcher
├── lib/
│   ├── ai/
│   │   ├── extensions.ts            # Chat command extensions registry (/research, /web-search, /tech-stack, /ask)
│   │   ├── gemini.ts                # Google Gemini API integration (gemini-2.5-flash)
│   │   ├── groq.ts                  # Groq API integration (llama-3.3-70b-versatile)
│   │   ├── openrouter.ts            # OpenRouter free model gateway
│   │   ├── provider.ts              # Unified LLM provider factory & system prompt builder
│   │   ├── research.ts              # Grounded research prompt builder & synthesis engine
│   │   ├── search.ts                # Live internet search aggregator (DuckDuckGo + Wikipedia)
│   │   └── types.ts                 # AI provider interfaces and data types
│   ├── auth/
│   │   └── errors.ts                # Friendly error translator for Supabase Auth & custom SMTP (Resend)
│   ├── supabase/
│   │   ├── admin.ts                 # Service role admin client (bypasses RLS for backend routes)
│   │   ├── client.ts                # Browser Supabase client (@supabase/ssr)
│   │   └── server.ts                # Server Supabase client with Next.js cookie handling
│   ├── whatsapp/
│   │   ├── parser.ts                # WhatsApp .txt chat export parser (Android & iOS formats)
│   │   └── matchSenders.ts          # Fuzzy roster matcher for WhatsApp senders
│   ├── crypto.ts                    # AES-256-GCM symmetric encryption/decryption utilities
│   ├── types.ts                     # Core domain types (UserPreferences, TeamMember, Messages, etc.)
│   └── utils.ts                     # cn() class utility & date formatters
├── supabase/
│   └── schema.sql                   # Full PostgreSQL schema with tables, triggers, and RLS policies
├── netlify.toml                     # Netlify Next.js plugin & Node 20 environment configuration
└── package.json
```

---

## 🤖 5. How the "AI 7th Member" Works

1. **Grounding:**
   The team configures their **SIH Problem Statement** in Settings (e.g. *"Problem #1420: AI Disaster Relief Routing"*).
2. **Incremental Context Window:**
   When a user clicks **"⚡ Summarize"** or calls `/api/summarize`:
   - It fetches the **previous summary** for compressed prior state.
   - It queries only **unsummarized messages** since the last summary range.
   - Maps sender user IDs to teammate real names.
3. **Synthesis Output (Strict JSON):**
   The LLM returns:
   ```json
   {
     "summary": "Brief paragraph summarizing the recent discussion",
     "decisions": ["Decided to use Next.js and Supabase for real-time syncing"],
     "openQuestions": ["Who is building the ML dataset pipeline?"],
     "actionItems": [
       { "task": "Design the system architecture diagram", "assignee": "Aarav", "done": false }
     ]
   }
   ```
4. **Live Broadcast:**
   The summary is saved into `summaries` table and inserted as a message with `type: 'agent'`. Supabase Realtime pushes this card to all teammates in the chatroom immediately.

---

## 🔑 6. Environment Variables Guide

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Secret for Symmetric Key Encryption (AES-256-GCM)
ENCRYPTION_SECRET=sih-7th-member-super-secret-key-32chars!

# App URL (Local or Netlify)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### ⚡ Critical Netlify & Supabase Deployment Notes:
1. **Netlify:** Add all 5 environment variables under **Site configuration > Environment variables**, then click **Trigger deploy > Deploy site**.
2. **Supabase Email Rate Limits / Hackathon Mode:**
   - In **Supabase Dashboard > Authentication > Providers > Email**, turn **OFF** `Confirm email`. This avoids the free-tier 3-email/hour limit and allows teammates to sign up and join workspaces instantly.
3. **Supabase Redirect URLs:**
   - In **Supabase Dashboard > Authentication > URL Configuration**, set **Site URL** to `https://your-site.netlify.app` and add `https://your-site.netlify.app/**` to **Redirect URLs**.

---

## 💡 7. Ready-to-Use Prompts for Claude

When starting a conversation with Claude, you can paste this file and use any of the prompts below:

### Prompt 1: Add a New Feature
> *"I have shared my project's `brain.md` context file above. I want to add a feature to allow team members to export the 7th Member's decisions and action items to PDF or Markdown for SIH mentor evaluation. Please review the existing codebase structure and implement this."*

### Prompt 2: Enhance the AI Summarizer
> *"Review the `lib/ai/provider.ts` and `app/api/summarize/route.ts` architecture from `brain.md`. I want to add an automatic summarization trigger when a Jitsi meeting ends, extracting the action items directly from the call transcript. How should we build this?"*

### Prompt 3: UI / UX Polish
> *"Using the component hierarchy from `brain.md`, help me improve the `SummaryCard.tsx` and `ApiKeyManager.tsx` UI to make action items checkable in real-time, saving completion state directly to Supabase."*
