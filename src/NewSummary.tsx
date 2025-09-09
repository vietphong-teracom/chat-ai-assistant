import { useEffect, useState } from "react";

function NewsSummary() {
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAndSummarize() {
      try {
        // 1. Lấy RSS feed từ VNExpress
        const res = await fetch("https://vnexpress.net/rss/tin-moi-nhat.rss");
        const text = await res.text();

        // 2. Parse XML → lấy 5 bài đầu
        const parser = new DOMParser();
        const xml = parser.parseFromString(text, "application/xml");
        const items = Array.from(xml.querySelectorAll("item")).slice(0, 5);

        const news = items.map((item) => ({
          title: item.querySelector("title")?.textContent ?? "",
          description: item.querySelector("description")?.textContent ?? "",
        }));

        // 3. Chuẩn bị nội dung cho GPT
        const prompt = `Hãy tóm tắt ngắn gọn các tin tức sau:\n\n${news
          .map((n, i) => `${i + 1}. ${n.title} - ${n.description}`)
          .join("\n")}`;

        // 4. Gọi OpenAI API để tóm tắt
        const gptRes = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
          }),
        });

        const data = await gptRes.json();
        setSummary(data.choices[0].message.content);
      } catch (err) {
        console.error(err);
        setSummary("Có lỗi khi lấy tin tức hoặc tóm tắt.");
      } finally {
        setLoading(false);
      }
    }

    fetchAndSummarize();
  }, []);

  return (
    <div>
      <h2>Tóm tắt tin tức VNExpress</h2>
      {loading ? <p>Đang tải...</p> : <p>{summary}</p>}
    </div>
  );
}

export default NewsSummary;
