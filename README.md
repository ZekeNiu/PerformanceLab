# PerformanceLab

PerformanceLab 是一个基于 React、TypeScript、Vite、Tailwind CSS 和 ECharts 的运动表现数据仪表盘。

## 技术栈

- React 19
- TypeScript
- Vite
- Tailwind CSS
- ECharts / echarts-for-react
- Framer Motion
- react-router-dom HashRouter

## 本地运行

```bash
npm install
npm run dev
```

开发服务器默认运行在 `http://localhost:3000/`。

## 本地构建

```bash
npm run build
```

构建产物会生成到 `dist/` 目录。

## GitHub Pages 部署

本仓库已经配置 GitHub Actions 自动部署：

- 每次推送到 `main` 分支时，会自动安装依赖、运行 `npm run build`，并把 `dist/` 发布到 GitHub Pages。
- 也可以在 GitHub 仓库的 Actions 页面手动运行 `Deploy to GitHub Pages`。

部署完成后，访问地址通常是：

```text
https://zekeniu.github.io/PerformanceLab/
```
