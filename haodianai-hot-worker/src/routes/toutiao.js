const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

export async function handleToutiao() {
  const res = await fetch("https://www.toutiao.com/hot-event/hot-board/?origin=toutiao_pc", {
    headers: { "User-Agent": UA },
  });
  const json = await res.json();
  return (json.data || []).map((item, i) => ({
    id: item.ClusterIdStr || i + 1,
    title: item.Title || "",
    hot: parseInt(item.HotValue || "0", 10),
    url: item.Url || "",
  }));
}
