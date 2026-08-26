import { AIProvider, ChatMessage, OpenRouterModel, SummaryResult } from './types';

export class OpenRouterProvider implements AIProvider {
  name = 'openrouter' as const;
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  static async fetchFreeModels(): Promise<OpenRouterModel[]> {
    try {
      const res = await fetch('https://openrouter.ai/api/v1/models', {
        headers: { 'Content-Type': 'application/json' },
        next: { revalidate: 3600 },
      });
      if (!res.ok) return [];
      const data = await res.json();
      const allModels = data.data || [];
      return allModels
        .filter((m: any) => m.pricing?.prompt === '0' && m.pricing?.completion === '0')
        .map((m: any) => ({
          id: m.id,
          name: m.name || m.id,
          description: m.description,
          context_length: m.context_length,
          pricing: m.pricing,
        }));
    } catch (e) {
      console.error('Failed to fetch OpenRouter models:', e);
      return [];
    }
  }

  async testApiKey(apiKey: string, modelId?: string): Promise<{ valid: boolean; error?: string }> {
    try {
      const model = modelId || 'meta-llama/llama-3.3-70b-instruct:free';
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://sih-collab.app',
          'X-Title': 'SIH 7th Member',
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: 'Ping' }],
          max_tokens: 5,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        if (res.status === 401) {
          return { valid: false, error: 'Invalid OpenRouter API key. Please check your key at openrouter.ai' };
        }
        if (res.status === 429) {
          return { valid: true, error: 'Key is valid, but rate limit / quota exceeded currently.' };
        }
        return { valid: false, error: errorData.error?.message || `OpenRouter Error (${res.status})` };
      }

      return { valid: true };
    } catch (err: any) {
      return { valid: false, error: err.message || 'Failed to connect to OpenRouter API' };
    }
  }

  async generateReply(params: {
    systemPrompt: string;
    history: ChatMessage[];
    modelId?: string;
  }): Promise<string> {
    const model = params.modelId || 'meta-llama/llama-3.3-70b-instruct:free';

    const messages = [
      { role: 'system', content: params.systemPrompt },
      ...params.history.map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.sender ? `[${m.sender}]: ${m.content}` : m.content,
      })),
    ];

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'HTTP-Referer': 'https://sih-collab.app',
        'X-Title': 'SIH 7th Member',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 800,
      }),
    });

    if (response.status === 429) {
      throw new Error("Today's free quota for OpenRouter is used up — try again later or select a different model in Settings.");
    }

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || `OpenRouter error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || 'No response generated.';
  }

  async generateSummary(params: {
    systemPrompt: string;
    transcriptText: string;
    previousSummary?: SummaryResult | null;
    modelId?: string;
  }): Promise<SummaryResult> {
    const model = params.modelId || 'meta-llama/llama-3.3-70b-instruct:free';

    let userPrompt = `Analyze the following hackathon discussion and extract key decisions, open questions, and action items with assignees.\n\n`;

    if (params.previousSummary) {
      userPrompt += `### Prior Summary Context:\n`;
      if (params.previousSummary.decisions?.length) {
        userPrompt += `Prior Decisions:\n${params.previousSummary.decisions.map(d => `- ${d}`).join('\n')}\n`;
      }
      if (params.previousSummary.openQuestions?.length) {
        userPrompt += `Prior Open Questions:\n${params.previousSummary.openQuestions.map(q => `- ${q}`).join('\n')}\n`;
      }
      if (params.previousSummary.actionItems?.length) {
        userPrompt += `Prior Action Items:\n${params.previousSummary.actionItems.map(a => `- ${a.text} (Assignee: ${a.assignee || 'Unassigned'})`).join('\n')}\n`;
      }
      userPrompt += `\n---\n\n`;
    }

    userPrompt += `### New Discussion Messages:\n${params.transcriptText}\n\n`;
    userPrompt += `Respond strictly in valid JSON format:
{
  "summary": "Brief 1-2 sentence overview",
  "decisions": ["Decision 1", "Decision 2"],
  "openQuestions": ["Question 1", "Question 2"],
  "actionItems": [
    { "text": "Task description", "assignee": "Teammate name or null", "done": false }
  ]
}`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'HTTP-Referer': 'https://sih-collab.app',
        'X-Title': 'SIH 7th Member',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: `${params.systemPrompt}\nYou are the 7th member of an SIH team organizing decisions and action items.` },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      }),
    });

    if (response.status === 429) {
      throw new Error("Today's free quota for OpenRouter is used up — try again later or select a different model in Settings.");
    }

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || `OpenRouter error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '{}';

    try {
      const cleanJson = content.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      return {
        content: parsed.summary || parsed.content || '',
        decisions: Array.isArray(parsed.decisions) ? parsed.decisions : [],
        openQuestions: Array.isArray(parsed.openQuestions) ? parsed.openQuestions : [],
        actionItems: Array.isArray(parsed.actionItems)
          ? parsed.actionItems.map((a: any) => ({
              text: typeof a === 'string' ? a : a.text || 'Action item',
              assignee: typeof a === 'object' ? a.assignee || null : null,
              done: typeof a === 'object' ? !!a.done : false,
            }))
          : [],
      };
    } catch {
      return {
        content,
        decisions: [],
        openQuestions: [],
        actionItems: [],
      };
    }
  }
}
