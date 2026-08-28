export interface ChatExtension {
  id: string;
  command: string; // e.g. '/research'
  name: string;
  description: string;
  icon: string; // identifier for UI icon
  placeholder: string;
  requiresSearch: boolean;
  category: 'research' | 'ai' | 'tool';
}

export const CHAT_EXTENSIONS: ChatExtension[] = [
  {
    id: 'research',
    command: '/research',
    name: 'Deep Web Research',
    description: 'Searches the live web and synthesizes comprehensive answers with verified source citations.',
    icon: 'Search',
    placeholder: 'e.g. /research best open source APIs for real-time disaster alerts in India',
    requiresSearch: true,
    category: 'research',
  },
  {
    id: 'web-search',
    command: '/web-search',
    name: 'Live Web Search',
    description: 'Quickly fetches top articles, GitHub repositories, and documentation from the internet.',
    icon: 'Globe',
    placeholder: 'e.g. /web-search Supabase Realtime postgres_changes examples',
    requiresSearch: true,
    category: 'research',
  },
  {
    id: 'tech-stack',
    command: '/tech-stack',
    name: 'Tech Stack & Architecture',
    description: 'Explores GitHub & the web to recommend the ideal hackathon stack and architecture for your feature.',
    icon: 'Cpu',
    placeholder: 'e.g. /tech-stack offline-first map rendering in Next.js PWA',
    requiresSearch: true,
    category: 'research',
  },
  {
    id: 'ask',
    command: '/ask',
    name: 'Direct AI 7th Member',
    description: 'Directly queries the active LLM (Groq / Gemini / OpenRouter) grounded in your SIH project brief.',
    icon: 'Bot',
    placeholder: 'e.g. /ask how should we structure our 8-minute final SIH pitch presentation?',
    requiresSearch: false,
    category: 'ai',
  },
  {
    id: 'summarize',
    command: '/summarize',
    name: 'Summarize Discussion',
    description: 'Synthesizes recent team chat into structured decisions, questions, and assigned action items.',
    icon: 'Sparkles',
    placeholder: '/summarize',
    requiresSearch: false,
    category: 'tool',
  },
];

/**
 * Parses user message input to detect if a slash command extension was triggered.
 */
export function parseSlashCommand(input: string): {
  isCommand: boolean;
  command?: string;
  query?: string;
  extension?: ChatExtension;
} {
  const trimmed = input.trim();
  if (!trimmed.startsWith('/')) {
    return { isCommand: false };
  }

  const spaceIndex = trimmed.indexOf(' ');
  const commandWord = (spaceIndex === -1 ? trimmed : trimmed.slice(0, spaceIndex)).toLowerCase();
  const query = spaceIndex === -1 ? '' : trimmed.slice(spaceIndex + 1).trim();

  // Match against registered extensions (or aliases like /ask-gemini, /ask-groq)
  let matchedExt = CHAT_EXTENSIONS.find((ext) => ext.command.toLowerCase() === commandWord);

  if (!matchedExt) {
    if (commandWord.startsWith('/ask-') || commandWord === '/ai') {
      matchedExt = CHAT_EXTENSIONS.find((e) => e.id === 'ask');
    } else if (commandWord === '/search' || commandWord === '/google') {
      matchedExt = CHAT_EXTENSIONS.find((e) => e.id === 'web-search');
    }
  }

  if (matchedExt) {
    return {
      isCommand: true,
      command: commandWord,
      query,
      extension: matchedExt,
    };
  }

  return { isCommand: false };
}
