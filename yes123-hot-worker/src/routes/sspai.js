const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

export async function handleSspai() {
  const res = await fetch("https://sspai.com/api/v1/article/tag/page/get?limit=20&offset=0&tag=%E7%83%AD%E9%97%A8%E6%96%87%E7%AB%A0", {
    headers: { "User-Agent": UA },
  });
  const json = await res.json();
  const list = json.data || [];
  return list.map((item) => ({
    id: item.id,
    title: item.title || "",
    desc: item.summary || "",
    hot: item.like_count || 0,
    url: "https://sspai.com/post/" + item.id,
  }));
}
