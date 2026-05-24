# Prompt For A New Codex Conversation

Use this file as the new-conversation entry point for continuing PerformanceLab.

If the new Codex conversation has access to this same local workspace, the shortest useful message is:

```text
请读取并遵循 D:\AI\PerformanceLab_1\app\docs\NEXT_CHAT_PROMPT.md，继续开发 PerformanceLab。
```

If the new conversation cannot access local files directly, copy the full prompt below into the conversation:

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
7. docs/EXECUTION_BRIEF.md

然后运行：
git status --short --branch

重要背景：
- 这是一个面向运动表现分析师和主教练的专业级运动表现数据仪表盘。
- 四个核心功能是：基础数据展示、纵向比较分析、横向比较分析、相关性分析。
- 长期目标是高度可自定义化：每个卡片、图、表都应能选择要展示的数据指标，并适配不同队伍的不同测试内容。
- 当前是 React 19 + TypeScript + Vite + Tailwind + ECharts，部署在 GitHub Pages。
- 数据目前主要是 mock 前端数据，没有后端。
- 每次代码修改后请运行 npm run build。
- 每次进行改动必须先在 progress.md 记录完整工作日志。
- 如果完成了可提交的工作，请提交并推送到 main；GitHub Actions 会自动部署到 Pages。

当前重要状态：
- docs/EXECUTION_BRIEF.md 是后续架构工作的权威执行简报；如果用户没有指定任务，默认从其中第一个未完成的 P0/P1 任务开始。
- 当前默认下一步是 PL-003：迁移 Dashboard periodic testing 到 registry + measurement selector。
- PL-001 已完成：src/lib/measurement-store.ts 提供第一版共享 mock Measurement[] store 和 selector。
- PL-002 已完成：src/lib/metric-surface-config.ts 和 docs/METRIC_SURFACE_CONFIG.md 定义第一版可序列化指标展示面配置模型。
- 横向/纵向比较的推荐方向是同一指标展示面上的“主数据 + 最多 3 组额外对比数据”，同屏最多 4 组；目标、阈值、benchmark、SWC、MDC、置信区间等是统计注释或参考线，不占对比数据组名额。
- 相关性分析建议保留独立探索工作流，但必须复用统一 metric registry 和 measurement store。
- Excel/CSV 导入已从纯 mock 改为真实解析，入口在 src/lib/import-parser.ts 和 src/components/data-entry/UploadZone.tsx；npm run lint 当前已修到通过。
- npm run build 当前通过，但仍有既有 Vite >500 kB chunk 警告。

文档维护规则：
- progress.md 是唯一完整工作日志。每次工作、改动、验证、错误、提交和推送都先记录到 progress.md；不要只记录在其他文件。
- findings.md 只保存从 progress.md 或代码审查中提炼出的长期有效发现，不替代 progress.md。
- docs/EXECUTION_BRIEF.md 是权威执行状态源，只维护路线图、默认下一步、完成判据和关键产品/架构约束，不记录普通过程日志。
- 本 prompt 的“当前重要状态”只是无法读取本地文件时使用的最小启动摘要；如果新对话可以读取本地文件，以 docs/EXECUTION_BRIEF.md 为准。
- 每次 docs/EXECUTION_BRIEF.md 的默认下一步、PL 状态或关键产品/架构约束变化时，同步更新本 prompt 的“当前重要状态”。

本次我想做的任务是：
【在这里写具体任务。如果没有具体任务，请按 docs/EXECUTION_BRIEF.md 的默认下一步继续。】
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
