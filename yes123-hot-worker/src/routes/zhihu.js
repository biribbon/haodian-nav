const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

export async function handleZhihu() {
  // 知乎热榜页面抓取
  const res = await fetch("https://www.zhihu.com/hot", {
    headers: {
      "User-Agent": UA,
      "Accept": "text/html",
    },
  });
  const html = await res.text();
  const items = [];

  // 从 SSR HTML 中提取热榜数据
  const dataMatch = html.match(/initialData['"]\s*[=:]\s*({.*?})\s*[;<]/s)
    || html.match(/"hotList":\s*(\[.*?\])/s);

  if (dataMatch) {
    try {
      const data = JSON.parse(dataMatch[1]);
      const hotList = data?.initialState?.topstory?.hotList || [];
      hotList.forEach((item, i) => {
        const target = item.target || {};
        items.push({
          id: target.id || i + 1,
          title: target.title || item.title || "",
          desc: target.excerpt || "",
          hot: parseInt((item.detailText || "").replace(/[^\d]/g, "") || "0", 10),
          url: target.id ? "https://www.zhihu.com/question/" + target.id : "",
        });
      });
    } catch {}
  }

  // 如果 HTML 抓取失败，尝试 API
  if (!items.length) {
    const apiRes = await fetch("https://www.zhihu.com/api/v3/feed/topstory/hot-lists/total?limit=50", {
      headers: { "User-Agent": UA },
    });
    if (apiRes.ok) {
      const json = await apiRes.json();
      (json.data || []).forEach((item) => {
        const target = item.target || {};
        items.push({
          id: target.id || item.id,
          title: target.title || "",
          desc: target.excerpt || "",
          hot: parseInt((item.detail_text || "").replace(/[^\d]/g, "") || "0", 10),
          url: target.id ? "https://www.zhihu.com/question/" + target.id : "",
        });
      });
    }
  }

  return items;
}
