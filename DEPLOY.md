# yes123 部署说明

纯静态导航站，无后端依赖。

## 文件清单

- `index.html` — 入口（自动跳转到 yes123-index.html）
- `yes123-index.html` — 首页
- `yes123-data.js` — 工具和资讯数据
- `yes123-advertise.html` — 招租合作页
- `advertise.html` — 招租入口跳转

## 修改工具数据

直接编辑 `yes123-data.js`，改完重新部署即可。

## Docker 部署

```bash
docker build -t yes123-site .
docker run -d --name yes123 -p 80:80 yes123-site
```

## Nginx 静态部署

把以下文件上传到站点目录：

- `index.html`
- `yes123-index.html`
- `yes123-data.js`
- `advertise.html`
- `yes123-advertise.html`

并使用仓库里的 `nginx.conf` 作为站点配置。
