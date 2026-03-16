/**
 * 好点 AI 热搜 API — Cloudflare Worker
 * 轻量级热搜聚合，内置 Cache API 缓存
 */

import { handleBaidu } from "./routes/baidu.js";
import { handleWeibo } from "./routes/weibo.js";
import { handleDouyin } from "./routes/douyin.js";
import { handleZhihu } from "./routes/zhihu.js";
import { handleToutiao } from "./routes/toutiao.js";
import { handle36kr } from "./routes/36kr.js";
import { handleIthome } from "./routes/ithome.js";
import { handleSspai } from "./routes/sspai.js";
import { handleThepaper } from "./routes/thepaper.js";
import { handleBilibili } from "./routes/bilibili.js";

const ROUTES = {
  "/baidu": handleBaidu,
  "/weibo": handleWeibo,
  "/douyin": handleDouyin,
  "/zhihu": handleZhihu,
  "/toutiao": handleToutiao,
  "/36kr": handle36kr,
  "/ithome": handleIthome,
  "/sspai": handleSspai,
  "/thepaper": handleThepaper,
  "/bilibili": handleBilibili,
};

const CACHE_TTL = 60 * 30; // 30 分钟缓存

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export default {
  async fetch(request) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders() });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    // 首页
    if (path === "/" || path === "") {
      const routes = Object.keys(ROUTES).map((r) => r.slice(1));
      return Response.json(
        { code: 200, message: "好点 AI 热搜 API", routes },
        { headers: corsHeaders() }
      );
    }

    const handler = ROUTES[path];
    if (!handler) {
      return Response.json(
        { code: 404, message: "接口不存在" },
        { status: 404, headers: corsHeaders() }
      );
    }

    // 尝试从 Cache API 读取
    const cache = caches.default;
    const cacheKey = new Request(request.url, { method: "GET" });
    const cached = await cache.match(cacheKey);
    if (cached) {
      const resp = new Response(cached.body, cached);
      resp.headers.set("X-Cache", "HIT");
      return resp;
    }

    try {
      const data = await handler();
      const body = JSON.stringify({
        code: 200,
        name: path.slice(1),
        updateTime: new Date().toISOString(),
        total: data.length,
        data,
      });

      const response = new Response(body, {
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": `public, max-age=${CACHE_TTL}`,
          "X-Cache": "MISS",
          ...corsHeaders(),
        },
      });

      // 写入缓存
      const toCache = response.clone();
      await cache.put(cacheKey, toCache);

      return response;
    } catch (err) {
      return Response.json(
        { code: 500, message: err.message || "抓取失败" },
        { status: 500, headers: corsHeaders() }
      );
    }
  },
};
