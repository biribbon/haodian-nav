const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

export async function handleBilibili() {
  const res = await fetch("https://api.bilibili.com/x/web-interface/popular?ps=50&pn=1", {
    headers: { "User-Agent": UA },
  });
  const json = await res.json();
  const list = json.data?.list || [];
  return list.map((item) => ({
    id: item.bvid || item.aid,
    title: item.title || "",
    desc: item.desc || "",
    hot: item.stat?.view || 0,
    url: "https://www.bilibili.com/video/" + item.bvid,
  }));
}
