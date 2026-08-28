export type ThemeMode = 'system' | 'light' | 'dark';

export interface UserNotifications {
  newMessage?: boolean;
  aiSummary?: boolean;
  callStarted?: boolean;
}

export interface UserPreferences {
  theme?: ThemeMode;
  notifications?: UserNotifications;
  displayName?: string;
  [key: string]: any;
}

export interface UserProfile {
  id: string;
  full_name?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  preferences?: UserPreferences;
  updated_at?: string;
}

export const PRESET_CUSTOM_ROLES = [
  'Frontend Lead',
  'Backend Lead',
  'ML/AI Lead',
  'UI/UX Designer',
  'Presenter',
  'Documentation Lead',
  'Project Manager',
] as const;

export type PresetCustomRole = (typeof PRESET_CUSTOM_ROLES)[number];

export interface TeamMember {
  team_id: string;
  user_id: string;
  role: 'owner' | 'member';
  custom_role?: string | null;
  joined_at?: string;
  profile?: UserProfile;
}

export type MessageType = 'text' | 'agent' | 'transcript' | 'system' | 'imported';

export interface MessageMeta {
  source?: string;
  originalSenderName?: string;
  matchedUserId?: string | null;
  originalTimestamp?: string;
  call_id?: string;
  model?: string;
  provider?: string;
  decisions?: string[];
  openQuestions?: string[];
  actionItems?: Array<{ text: string; assignee?: string | null; done?: boolean }>;
  [key: string]: any;
}

export interface ChatMessageItem {
  id: string;
  team_id: string;
  user_id?: string | null;
  content: string;
  type: MessageType;
  meta?: MessageMeta;
  created_at?: string;
  sender_name?: string;
  sender_role?: string | null;
}

export interface ChatImportRecord {
  id: string;
  team_id: string;
  uploaded_by: string;
  filename: string;
  message_count: number;
  matched_count: number;
  unmatched_senders: string[];
  created_at: string;
}
