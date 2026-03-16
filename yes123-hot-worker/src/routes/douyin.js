const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

export async function handleDouyin() {
  const res = await fetch("https://www.douyin.com/aweme/v1/web/hot/search/list/?device_platform=webapp&aid=6383&channel=channel_pc_web&detail_list=1", {
    headers: {
      "User-Agent": UA,
      "Referer": "https://www.douyin.com/",
    },
  });
  const json = await res.json();
  const list = json.data?.word_list || json.word_list || [];
  return list.map((item, i) => ({
    id: i + 1,
    title: item.word || "",
    hot: item.hot_value || 0,
    url: "https://www.douyin.com/search/" + encodeURIComponent(item.word || ""),
  }));
}
