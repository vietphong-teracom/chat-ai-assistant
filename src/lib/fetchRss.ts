// src/services/rssService.ts
export interface RssArticle {
  title: string;
  description: string;
  link: string;
}

function stripHtml(html: string) {
  return html
    .replace(/<\/?[^>]+(>|$)/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Fetch RSS and return joined text (1..limit items).
 * Throw nếu fetch bị lỗi hoặc không tìm thấy item.
 */
export async function fetchRssAsText(feedUrl: string, limit = 5, signal?: AbortSignal): Promise<string> {
  const res = await fetch(feedUrl, { signal });
  if (!res.ok) {
    throw new Error(`Failed to fetch RSS (${res.status})`);
  }

  const xmlText = await res.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, "application/xml");

  const items = Array.from(doc.querySelectorAll("item")).slice(0, limit);
  if (items.length === 0) {
    throw new Error("No items found in RSS feed");
  }

  const articles: RssArticle[] = items.map((item) => {
    const title = item.querySelector("title")?.textContent?.trim() ?? "";
    const descrNode = item.querySelector("description") || item.querySelector("content\\:encoded");
    const description = stripHtml(descrNode?.textContent?.trim() ?? "");
    const link = item.querySelector("link")?.textContent?.trim() ?? "";
    return { title, description, link };
  });

  const text = articles.map((a, i) => `${i + 1}. ${a.title}\n${a.description}\nLink: ${a.link}`).join("\n\n");

  return text;
}

// src/lib/fetchRss.ts

export async function fetchRssAsJson(url: string) {
  const api = "https://api.rss2json.com/v1/api.json?rss_url=";

  try {
    const response = await fetch(api + encodeURIComponent(url));

    if (!response.ok) {
      throw new Error(`Failed to fetch RSS: ${response.statusText}`);
    }

    const data = await response.json();
    return data; // data.items chứa danh sách tin tức
  } catch (error) {
    console.error("fetchRssAsJson error:", error);
    throw error;
  }
}
