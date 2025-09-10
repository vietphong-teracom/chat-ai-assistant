// src/lib/fetchRss.ts
export interface RssJsonItem {
  title: string;
  link: string;
  description: string;
  pubDate?: string;
  content?: string;
}

export interface Rss2JsonResponse {
  status: "ok" | string;
  feed?: any;
  items: RssJsonItem[];
}

function stripHtml(html: string) {
  return html
    .replace(/<\/?[^>]+(>|$)/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function truncate(text: string, max = 400) {
  if (!text) return "";
  return text.length > max ? text.slice(0, max).trim() + "…" : text;
}

/**
 * Fetch RSS via rss2json.com and return parsed JSON.
 * Throws on network / parse error.
 */
export async function fetchRssAsJson(rssUrl: string, signal?: AbortSignal): Promise<Rss2JsonResponse> {
  const api = "https://api.rss2json.com/v1/api.json?rss_url=" + encodeURIComponent(rssUrl);

  const res = await fetch(api, { signal });
  if (!res.ok) {
    throw new Error(`RSS->JSON fetch failed (${res.status})`);
  }
  const data = (await res.json()) as Rss2JsonResponse;
  if (!data || !Array.isArray(data.items)) {
    throw new Error("Invalid RSS->JSON response");
  }
  return data;
}

/**
 * Return a joined text containing top `limit` articles,
 * each: "1. Title\nshort description\nLink: ..."
 */
export async function fetchTopArticlesText(rssUrl: string, limit = 10, signal?: AbortSignal) {
  const json = await fetchRssAsJson(rssUrl, signal);
  const items = (json.items || []).slice(0, limit);

  if (items.length === 0) throw new Error("No items in RSS feed");

  const parts = items.map((it, i) => {
    const desc = stripHtml(it.description || it.content || "");
    const short = truncate(desc, 600);
    return `${i + 1}. ${it.title}\n${short}\nLink: ${it.link}`;
  });

  return parts.join("\n\n");
}
