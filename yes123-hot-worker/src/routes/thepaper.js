const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

export async function handleThepaper() {
  const res = await fetch("https://cache.thepaper.cn/contentapi/wwwIndex/rightSidebar", {
    headers: { "User-Agent": UA },
  });
  const json = await res.json();
  const list = json.data?.hotNews || [];
  return list.map((item) => ({
    id: item.contId,
    title: item.name || "",
    hot: item.praiseTimes || 0,
    url: "https://www.thepaper.cn/newsDetail_forward_" + item.contId,
  }));
}
