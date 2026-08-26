import { AIProvider, AIProviderType } from './types';
import { GroqProvider } from './groq';
import { GeminiProvider } from './gemini';
import { OpenRouterProvider } from './openrouter';

export function getAIProvider(provider: AIProviderType, apiKey: string): AIProvider {
  switch (provider) {
    case 'groq':
      return new GroqProvider(apiKey);
    case 'gemini':
      return new GeminiProvider(apiKey);
    case 'openrouter':
      return new OpenRouterProvider(apiKey);
    default:
      throw new Error(`Unsupported AI Provider: ${provider}`);
  }
}

export function buildSystemPrompt(projectBrief?: string | null): string {
  const briefContext = projectBrief?.trim()
    ? `\n### Team's SIH Project Brief / Problem Statement:\n"${projectBrief.trim()}"\n`
    : `\n### Team Context: Smart India Hackathon (SIH) Project.\n`;

  return `You are the genuine 7th member of a Smart India Hackathon (SIH) team (comprising 6 students + you). 
Your objective is to act as an insightful, proactive, and constructive collaborator who helps the team synthesize ideas, resolve blockers, formulate decisions, and track actionable tasks.
${briefContext}
Always be concise, practical, and encourage team alignment without robotic filler. Focus on high-impact technical choices, UX considerations, and hackathon presentation readiness.`;
}

export function formatTranscript(messages: Array<{
  sender?: string | null;
  content: string;
  type?: string;
  created_at?: string;
}>): string {
  return messages
    .map((m) => {
      const sender = m.sender || 'Teammate';
      const typeTag = m.type === 'transcript' ? '🎙️ [Call Recap] ' : '';
      return `${typeTag}${sender}: ${m.content}`;
    })
    .join('\n');
}
