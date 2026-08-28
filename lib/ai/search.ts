export interface SearchResultItem {
  title: string;
  url: string;
  snippet: string;
}

export interface WebSearchResponse {
  query: string;
  results: SearchResultItem[];
  sourceEngine: 'duckduckgo' | 'wikipedia' | 'direct';
}

function cleanHtml(raw: string): string {
  return raw
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Searches DuckDuckGo HTML endpoint for organic web results.
 */
async function searchDuckDuckGoHtml(query: string): Promise<SearchResultItem[]> {
  try {
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const res = await fetch(searchUrl, {
      method: 'POST',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `q=${encodeURIComponent(query)}&b=`,
      signal: AbortSignal.timeout(6000),
    });

    if (!res.ok) {
      return [];
    }

    const html = await res.text();
    const results: SearchResultItem[] = [];

    // Parse results block using regex
    const resultBlocks = html.split(/class="result\s+results_links/g).slice(1);

    for (const block of resultBlocks) {
      if (results.length >= 6) break;

      // Extract title and URL
      const titleMatch = block.match(/<a class="result__snippet[^>]*>([\s\S]*?)<\/a>/i);
      const linkMatch = block.match(/<a class="result__url"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i) ||
                         block.match(/href="([^"]*(?:uddg=)?([^"&]+)[^"]*)"\s+class="result__a"/i);
      const headingMatch = block.match(/<a class="result__a"[^>]*>([\s\S]*?)<\/a>/i);

      let title = headingMatch ? cleanHtml(headingMatch[1]) : '';
      let snippet = titleMatch ? cleanHtml(titleMatch[1]) : '';
      let url = '';

      if (linkMatch) {
        const rawHref = linkMatch[1];
        // DuckDuckGo redirects often look like //duckduckgo.com/l/?uddg=https%3A%2F%2F...
        const uddgParam = rawHref.match(/uddg=([^&]+)/);
        if (uddgParam) {
          url = decodeURIComponent(uddgParam[1]);
        } else if (rawHref.startsWith('http')) {
          url = rawHref;
        } else if (rawHref.startsWith('//')) {
          url = 'https:' + rawHref;
        }
      }

      if (!title && headingMatch) {
        title = cleanHtml(headingMatch[1]);
      }

      if (!snippet) {
        const fallbackSnippet = block.match(/<a class="result__snippet[^>]*>([\s\S]*?)<\/a>/i);
        if (fallbackSnippet) snippet = cleanHtml(fallbackSnippet[1]);
      }

      if (title && (snippet || url)) {
        results.push({
          title,
          url: url || `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
          snippet: snippet || `Search result for ${title}`,
        });
      }
    }

    return results;
  } catch (e) {
    return [];
  }
}

/**
 * Fallback to DuckDuckGo Instant Answer API
 */
async function searchDuckDuckGoApi(query: string): Promise<SearchResultItem[]> {
  try {
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'SIH-Collab-AI-7th-Member/1.0' },
      signal: AbortSignal.timeout(4000),
    });

    if (!res.ok) return [];
    const data = await res.json();
    const results: SearchResultItem[] = [];

    if (data.AbstractText && data.AbstractURL) {
      results.push({
        title: data.Heading || query,
        url: data.AbstractURL,
        snippet: data.AbstractText,
      });
    }

    if (Array.isArray(data.RelatedTopics)) {
      for (const topic of data.RelatedTopics) {
        if (results.length >= 5) break;
        if (topic.Text && topic.FirstURL) {
          results.push({
            title: topic.Text.split(' - ')[0] || topic.Text.slice(0, 40),
            url: topic.FirstURL,
            snippet: topic.Text,
          });
        }
      }
    }

    return results;
  } catch (e) {
    return [];
  }
}

/**
 * Wikipedia search API fallback for technical / conceptual queries
 */
async function searchWikipediaApi(query: string): Promise<SearchResultItem[]> {
  try {
    const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(4000),
    });

    if (!res.ok) return [];
    const data = await res.json();
    const searchItems = data.query?.search || [];

    return searchItems.slice(0, 4).map((item: any) => ({
      title: item.title,
      url: `https://en.wikipedia.org/wiki/${encodeURIComponent(item.title.replace(/ /g, '_'))}`,
      snippet: cleanHtml(item.snippet),
    }));
  } catch (e) {
    return [];
  }
}

/**
 * Unified web search aggregator. Tries DuckDuckGo HTML -> DuckDuckGo API -> Wikipedia.
 */
export async function executeWebSearch(query: string): Promise<WebSearchResponse> {
  const trimmed = query.trim();
  if (!trimmed) {
    return { query: '', results: [], sourceEngine: 'direct' };
  }

  // 1. Try DuckDuckGo HTML scraper (richest results)
  let results = await searchDuckDuckGoHtml(trimmed);

  if (results.length >= 2) {
    return {
      query: trimmed,
      results,
      sourceEngine: 'duckduckgo',
    };
  }

  // 2. Fallback to DuckDuckGo Instant Answer API
  const apiResults = await searchDuckDuckGoApi(trimmed);
  if (apiResults.length > 0) {
    results = [...results, ...apiResults];
  }

  // 3. Fallback to Wikipedia API if still low on results
  if (results.length < 3) {
    const wikiResults = await searchWikipediaApi(trimmed);
    results = [...results, ...wikiResults];
  }

  // Ensure unique URLs
  const seenUrls = new Set<string>();
  const uniqueResults = results.filter((item) => {
    if (seenUrls.has(item.url)) return false;
    seenUrls.add(item.url);
    return true;
  });

  return {
    query: trimmed,
    results: uniqueResults,
    sourceEngine: 'duckduckgo',
  };
}
