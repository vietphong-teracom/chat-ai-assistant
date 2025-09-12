const KNOWN_FEEDS: Record<string, string> = {
  vnexpress: 'https://vnexpress.net/rss/tin-moi-nhat.rss',
  thanhnien: 'https://thanhnien.vn/rss/home.rss',
  laodong: 'https://laodong.vn/rss/home.rss',
};

export const getRssFeed = (feedKey: string) => {
  const feedUrl = KNOWN_FEEDS[feedKey] ?? KNOWN_FEEDS['thanhnien'];
  return feedUrl;
};
