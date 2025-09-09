// src/services/rssService.ts
export interface NewsItem {
  title: string;
  link: string;
  description: string;
}

export async function fetchVNExpressRSS(): Promise<NewsItem[]> {
  const rssUrl = "https://vnexpress.net/rss/tin-moi-nhat.rss";

  const response = await fetch(rssUrl);
  const text = await response.text();

  // Parse XML
  const parser = new DOMParser();
  const xml = parser.parseFromString(text, "application/xml");
  const items = xml.querySelectorAll("item");

  const news: NewsItem[] = [];
  items.forEach((item, index) => {
    if (index < 5) {
      news.push({
        title: item.querySelector("title")?.textContent || "",
        link: item.querySelector("link")?.textContent || "",
        description: item.querySelector("description")?.textContent || "",
      });
    }
  });

  return news;
}
