export type AIProviderType = 'groq' | 'gemini' | 'openrouter';

export interface ActionItem {
  text: string;
  assignee?: string | null;
  done?: boolean;
}

export interface SummaryResult {
  content?: string;
  decisions: string[];
  openQuestions: string[];
  actionItems: ActionItem[];
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  sender?: string;
  timestamp?: string;
  type?: 'text' | 'agent' | 'transcript' | 'system';
}

export interface AIProvider {
  name: AIProviderType;
  generateReply(params: {
    systemPrompt: string;
    history: ChatMessage[];
    modelId?: string;
  }): Promise<string>;
  generateSummary(params: {
    systemPrompt: string;
    transcriptText: string;
    previousSummary?: SummaryResult | null;
    modelId?: string;
  }): Promise<SummaryResult>;
  testApiKey(apiKey: string, modelId?: string): Promise<{ valid: boolean; error?: string }>;
}

export interface OpenRouterModel {
  id: string;
  name: string;
  description?: string;
  context_length?: number;
  pricing: {
    prompt: string;
    completion: string;
  };
}
