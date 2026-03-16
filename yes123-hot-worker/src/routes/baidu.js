const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

export async function handleBaidu() {
  const res = await fetch("https://top.baidu.com/board?tab=realtime", {
    headers: { "User-Agent": UA },
  });
  const html = await res.text();
  const match = html.match(/<!--s-data:(.*?)-->/s);
  if (!match) return [];

  try {
    const sData = JSON.parse(match[1]);
    const cards = sData.data?.cards?.[0]?.content || sData.cards?.[0]?.content || [];
    const list = Array.isArray(cards[0]?.content) ? cards[0].content : cards;
    return list.map((item, i) => ({
      id: item.index || i + 1,
      title: item.word || item.title || "",
      desc: item.desc || "",
      hot: parseInt(item.hotScore || item.hotTag || "0", 10),
      url: "https://www.baidu.com/s?wd=" + encodeURIComponent(item.query || item.word || item.title || ""),
    }));
  } catch {
    return [];
  }
}
