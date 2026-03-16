const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

export async function handle36kr() {
  const res = await fetch("https://gateway.36kr.com/api/mis/nav/home/nav/rank/hot", {
    method: "POST",
    headers: {
      "User-Agent": UA,
      "Content-Type": "application/json",
      "Origin": "https://36kr.com",
      "Referer": "https://36kr.com/",
    },
    body: JSON.stringify({
      partner_id: "wap",
      param: { siteId: 1, platformId: 2 },
      timestamp: Date.now(),
    }),
  });
  if (!res.ok) throw new Error("36kr: " + res.status);
  const json = await res.json();
  const list = json.data?.hotRankList || [];
  if (!list.length) throw new Error("36kr: 返回空数据");
  return list.map((item) => ({
    id: item.itemId || item.templateMaterial?.itemId,
    title: item.templateMaterial?.widgetTitle || "",
    desc: item.templateMaterial?.summary || "",
    hot: item.templateMaterial?.statRead || 0,
    url: "https://www.36kr.com/p/" + (item.itemId || item.templateMaterial?.itemId),
  }));
}
