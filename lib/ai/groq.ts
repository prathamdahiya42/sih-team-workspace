import { AIProvider, ChatMessage, SummaryResult } from './types';

export class GroqProvider implements AIProvider {
  name = 'groq' as const;
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async testApiKey(apiKey: string, modelId = 'llama-3.1-8b-instant'): Promise<{ valid: boolean; error?: string }> {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: modelId,
          messages: [{ role: 'user', content: 'Ping' }],
          max_tokens: 5,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        if (res.status === 401) {
          return { valid: false, error: 'Invalid Groq API key. Please check your key at console.groq.com' };
        }
        if (res.status === 429) {
          return { valid: true, error: 'Key is valid, but rate limit / quota exceeded currently.' };
        }
        return { valid: false, error: errorData.error?.message || `Groq API Error (${res.status})` };
      }

      return { valid: true };
    } catch (err: any) {
      return { valid: false, error: err.message || 'Failed to connect to Groq API' };
    }
  }

  async generateReply(params: {
    systemPrompt: string;
    history: ChatMessage[];
    modelId?: string;
  }): Promise<string> {
    const model = params.modelId || 'llama-3.1-8b-instant';

    const messages = [
      { role: 'system', content: params.systemPrompt },
      ...params.history.map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.sender ? `[${m.sender}]: ${m.content}` : m.content,
      })),
    ];

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 800,
      }),
    });

    if (response.status === 429) {
      throw new Error("Today's free quota for Groq is used up — try again later or switch to Gemini/OpenRouter in Settings.");
    }

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || `Groq error: ${response.statusText}`);
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
    const model = params.modelId || 'llama-3.3-70b-versatile';

    let userPrompt = `Please analyze the following recent hackathon team discussion and extract key decisions, open/unresolved questions, and action items with assignees.\n\n`;

    if (params.previousSummary) {
      userPrompt += `### Previous Discussion Context (Compressed Summary):\n`;
      if (params.previousSummary.decisions?.length) {
        userPrompt += `Prior Decisions:\n${params.previousSummary.decisions.map(d => `- ${d}`).join('\n')}\n`;
      }
      if (params.previousSummary.openQuestions?.length) {
        userPrompt += `Prior Open Questions:\n${params.previousSummary.openQuestions.map(q => `- ${q}`).join('\n')}\n`;
      }
      if (params.previousSummary.actionItems?.length) {
        userPrompt += `Prior Action Items:\n${params.previousSummary.actionItems.map(a => `- ${a.text} (Assignee: ${a.assignee || 'Unassigned'}, Done: ${a.done ? 'Yes' : 'No'})`).join('\n')}\n`;
      }
      userPrompt += `\n---\n\n`;
    }

    userPrompt += `### New Discussion Messages:\n${params.transcriptText}\n\n`;
    userPrompt += `Respond strictly in valid JSON format with the following schema:
{
  "summary": "Brief 1-2 sentence executive overview of what was discussed",
  "decisions": ["Decision 1", "Decision 2", ...],
  "openQuestions": ["Question 1", "Question 2", ...],
  "actionItems": [
    { "text": "Specific task description", "assignee": "Teammate name or null", "done": false }
  ]
}`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: `${params.systemPrompt}\nYou are an expert SIH Hackathon AI teammate who organizes team thoughts concisely.` },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      }),
    });

    if (response.status === 429) {
      throw new Error("Today's free quota for Groq is used up — try again later or switch to Gemini/OpenRouter in Settings.");
    }

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || `Groq error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '{}';

    try {
      const parsed = JSON.parse(content);
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
