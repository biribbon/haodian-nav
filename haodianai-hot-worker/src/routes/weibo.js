const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

export async function handleWeibo() {
  const res = await fetch("https://weibo.com/ajax/side/hotSearch", {
    headers: {
      "User-Agent": UA,
      "Referer": "https://weibo.com/",
    },
  });
  const json = await res.json();
  const list = json.data?.realtime || [];
  return list.map((item, i) => ({
    id: i + 1,
    title: item.word || item.note || "",
    hot: item.num || item.raw_hot || 0,
    url: "https://s.weibo.com/weibo?q=" + encodeURIComponent("#" + (item.word || "") + "#"),
  }));
}
