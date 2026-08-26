import { AIProvider, ChatMessage, SummaryResult } from './types';

export class GeminiProvider implements AIProvider {
  name = 'gemini' as const;
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async testApiKey(apiKey: string, modelId = 'gemini-2.5-flash'): Promise<{ valid: boolean; error?: string }> {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: 'Ping' }] }],
          generationConfig: { maxOutputTokens: 5 },
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        if (res.status === 400 || res.status === 403) {
          return { valid: false, error: 'Invalid Google Gemini API key. Please check your key at aistudio.google.com' };
        }
        if (res.status === 429) {
          return { valid: true, error: 'Key is valid, but rate limit / daily quota exceeded.' };
        }
        return { valid: false, error: errorData.error?.message || `Gemini API Error (${res.status})` };
      }

      return { valid: true };
    } catch (err: any) {
      return { valid: false, error: err.message || 'Failed to connect to Gemini API' };
    }
  }

  async generateReply(params: {
    systemPrompt: string;
    history: ChatMessage[];
    modelId?: string;
  }): Promise<string> {
    const model = params.modelId || 'gemini-2.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;

    const contents = [
      {
        role: 'user',
        parts: [{ text: `[SYSTEM INSTRUCTION: ${params.systemPrompt}]` }],
      },
      ...params.history.map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.sender ? `[${m.sender}]: ${m.content}` : m.content }],
      })),
    ];

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000,
        },
      }),
    });

    if (response.status === 429) {
      throw new Error("Today's free quota for Google Gemini is used up — try again later or switch providers in Settings.");
    }

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || `Gemini error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.';
  }

  async generateSummary(params: {
    systemPrompt: string;
    transcriptText: string;
    previousSummary?: SummaryResult | null;
    modelId?: string;
  }): Promise<SummaryResult> {
    const model = params.modelId || 'gemini-2.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;

    let promptText = `${params.systemPrompt}\n\nYou are the AI 7th team member for a Smart India Hackathon team. Summarize the following team discussion concisely into decisions, open questions, and action items with assignees.\n\n`;

    if (params.previousSummary) {
      promptText += `### Prior Summary Context:\n`;
      if (params.previousSummary.decisions?.length) {
        promptText += `Prior Decisions:\n${params.previousSummary.decisions.map(d => `- ${d}`).join('\n')}\n`;
      }
      if (params.previousSummary.openQuestions?.length) {
        promptText += `Prior Open Questions:\n${params.previousSummary.openQuestions.map(q => `- ${q}`).join('\n')}\n`;
      }
      if (params.previousSummary.actionItems?.length) {
        promptText += `Prior Action Items:\n${params.previousSummary.actionItems.map(a => `- ${a.text} (Assignee: ${a.assignee || 'Unassigned'})`).join('\n')}\n`;
      }
      promptText += `\n---\n\n`;
    }

    promptText += `### Recent Discussion Messages:\n${params.transcriptText}\n\n`;
    promptText += `Output strictly in JSON format matching this schema:
{
  "summary": "Brief 1-2 sentence overview",
  "decisions": ["Decision 1", "Decision 2"],
  "openQuestions": ["Question 1", "Question 2"],
  "actionItems": [
    { "text": "Task description", "assignee": "Teammate name or null", "done": false }
  ]
}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: promptText }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      }),
    });

    if (response.status === 429) {
      throw new Error("Today's free quota for Google Gemini is used up — try again later or switch providers in Settings.");
    }

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || `Gemini error: ${response.statusText}`);
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

    try {
      const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
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
        content: rawText,
        decisions: [],
        openQuestions: [],
        actionItems: [],
      };
    }
  }
}
