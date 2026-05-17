# Prompt For A New Codex Conversation

Copy this into a new conversation when continuing work on PerformanceLab:

```text
请继续开发我的 PerformanceLab 项目。项目路径是：
D:\AI\PerformanceLab_1\app

请先阅读这些文件恢复上下文：
1. task_plan.md
2. findings.md
3. progress.md
4. docs/AI_CONTEXT.md
5. docs/ROADMAP.md
6. README.md

然后运行：
git status --short --branch

重要背景：
- 这是一个面向运动表现分析师和主教练的专业级运动表现数据仪表盘。
- 四个核心功能是：基础数据展示、纵向比较分析、横向比较分析、相关性分析。
- 长期目标是高度可自定义化：每个卡片、图、表都应能选择要展示的数据指标，并适配不同队伍的不同测试内容。
- 当前是 React 19 + TypeScript + Vite + Tailwind + ECharts，部署在 GitHub Pages。
- 数据目前主要是 mock 前端数据，没有后端。
- 每次代码修改后请运行 npm run build。
- 如果完成了可提交的工作，请提交并推送到 main；GitHub Actions 会自动部署到 Pages。

本次我想做的任务是：
【在这里写具体任务】
```

## Git Sync Commands

Use these when manually syncing local changes:

```bash
git status --short --branch
npm run build
git add -A
git commit -m "Short description"
git push
```

The live site is:

```text
https://zekeniu.github.io/PerformanceLab/
```
