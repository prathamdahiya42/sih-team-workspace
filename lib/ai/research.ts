import { AIProvider } from './types';
import { SearchResultItem } from './search';
import { buildSystemPrompt } from './provider';

export interface ResearchSynthesisParams {
  aiProvider: AIProvider;
  modelId: string;
  command: string;
  query: string;
  searchResults: SearchResultItem[];
  projectBrief?: string | null;
}

export interface ResearchSynthesisResult {
  content: string;
  sources: SearchResultItem[];
  query: string;
}

/**
 * Builds grounded prompt for web research synthesis.
 */
export function buildResearchPrompt(params: {
  query: string;
  searchResults: SearchResultItem[];
  projectBrief?: string | null;
  command: string;
}): string {
  const briefSection = params.projectBrief?.trim()
    ? `### SIH Team Project Context / Problem Statement:\n"${params.projectBrief.trim()}"\n\n`
    : '';

  let searchContext = '';
  if (params.searchResults.length > 0) {
    searchContext = `### Live Internet Search Findings:\n`;
    params.searchResults.forEach((item, idx) => {
      searchContext += `[${idx + 1}] Title: ${item.title}\nURL: ${item.url}\nSnippet: ${item.snippet}\n\n`;
    });
  } else {
    searchContext = `### Search Note:\nNo external web results returned. Answer using your deep engineering and domain knowledge.\n\n`;
  }

  let taskSpecificInstruction = `Synthesize an insightful, practical, and highly detailed research report.`;
  if (params.command === '/tech-stack') {
    taskSpecificInstruction = `Recommend the optimal technology stack, open-source libraries, database architecture, and hackathon development roadmap. Focus on rapid prototype speed and hackathon judge evaluation criteria.`;
  } else if (params.command === '/web-search') {
    taskSpecificInstruction = `Summarize the top findings from the web search accurately, highlighting key documentation links, APIs, and takeaways.`;
  }

  return `${briefSection}${searchContext}### User Question / Research Topic:
"${params.query}"

### Instructions:
You are the AI 7th Member of this Smart India Hackathon team.
${taskSpecificInstruction}

Structure your response cleanly using GitHub Markdown:
1. **🎯 Quick Summary / Direct Answer**: 2-3 sentences answering the core question.
2. **🔍 Key Findings & Technical Breakdown**: Detailed analysis, relevant tools/APIs, or system design insights.
3. **💡 Actionable Advice for Our SIH Solution**: How the team should apply this to win their problem statement.
4. **🌐 Sources & Citations**: List the key reference URLs (e.g. [Title](URL)) for teammates to explore.

Keep the tone encouraging, technical, pragmatic, and high-impact. Avoid robotic fluff.`;
}

/**
 * Executes research synthesis using the team's active LLM provider.
 */
export async function executeResearch(
  params: ResearchSynthesisParams
): Promise<ResearchSynthesisResult> {
  const systemPrompt = buildSystemPrompt(params.projectBrief);
  const userPrompt = buildResearchPrompt({
    query: params.query,
    searchResults: params.searchResults,
    projectBrief: params.projectBrief,
    command: params.command,
  });

  const responseText = await params.aiProvider.generateReply({
    systemPrompt,
    history: [{ role: 'user', content: userPrompt }],
    modelId: params.modelId,
  });

  return {
    content: responseText,
    sources: params.searchResults,
    query: params.query,
  };
}
