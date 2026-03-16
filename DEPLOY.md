# haodianai 部署说明

纯静态导航站，无后端依赖。

## 文件清单

- `index.html` — 入口（自动跳转到 haodianai-index.html）
- `haodianai-index.html` — 首页
- `haodianai-data.js` — 工具和资讯数据
- `haodianai-advertise.html` — 招租合作页
- `advertise.html` — 招租入口跳转

## 修改工具数据

直接编辑 `haodianai-data.js`，改完重新部署即可。

## Docker 部署

```bash
docker build -t haodianai-site .
docker run -d --name haodianai -p 80:80 haodianai-site
```

## Nginx 静态部署

把以下文件上传到站点目录：

- `index.html`
- `haodianai-index.html`
- `haodianai-data.js`
- `advertise.html`
- `haodianai-advertise.html`

并使用仓库里的 `nginx.conf` 作为站点配置。
