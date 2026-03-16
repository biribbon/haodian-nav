const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

export async function handleIthome() {
  const res = await fetch("https://api.ithome.com/json/newslist/rank?client=wap&type=hot", {
    headers: { "User-Agent": UA, "Accept": "application/json" },
  });
  const text = await res.text();
  const json = JSON.parse(text);
  const list = json.channel48rank || json.channelweekhotrank || [];
  return list.map((item, i) => ({
    id: item.newsid || i + 1,
    title: item.title || "",
    desc: item.description || "",
    hot: item.z || item.hitcount || 0,
    url: item.url ? "https://www.ithome.com" + item.url : "",
  }));
}
