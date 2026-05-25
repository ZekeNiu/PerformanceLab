# PerformanceLab AI Context

This is the canonical project memory file for future AI/Codex sessions.

## Project Vision

PerformanceLab is intended to become a professional-grade sports performance analytics dashboard for performance analysts and head coaches.

The app should support four core capabilities:

1. Basic data display
2. Longitudinal comparison analysis
3. Cross-sectional comparison analysis
4. Correlation analysis

The dashboard should be highly configurable. Analysts may work with different teams whose test batteries and metrics differ. Cards, charts, and tables should eventually let users choose what metric they display. For example, a daily monitoring card that currently shows HRV should be configurable to show HR, RHR, sleep, soreness, readiness, or another compatible metric.

## Product Principles

- The interface should feel like an analyst's operational workspace, not a marketing page.
- Customization is a first-class feature, not an afterthought.
- The app should support team-specific definitions of tests, metrics, target values, and display preferences.
- Maintainability matters: configuration and data definitions should be centralized instead of scattered through visual components.
- Statistical outputs should be explainable and defensible for sports science workflows.

## Current Implementation

- React 19 + TypeScript + Vite
- Tailwind CSS + shadcn-style components
- ECharts for charts
- Framer Motion for animation
- HashRouter for GitHub Pages compatibility
- Mock frontend data only
- Deployed to GitHub Pages through `gh-pages`
- Full Kimi export imported from `D:\Download\Kimi_Agent_仪表盘功能完善_2.zip`
- Pre-import rollback tag: `backup-before-kimi-full-import`

## Important Files

- `src/App.tsx`: route definitions
- `src/components/Navbar.tsx`: side navigation and theme toggle
- `src/pages/Dashboard.tsx`: dashboard entry point and tab switching
- `src/components/dashboard/DailyMonitoring.tsx`: daily monitoring cards and body map
- `src/components/dashboard/PeriodicTesting.tsx`: periodic testing display/comparison surface
- `src/components/dashboard/data.ts`: mock dashboard data and metric/stat helper data
- `.github/workflows/deploy-pages.yml`: build and deploy workflow

## Current Gaps

- Full Kimi pages are now present, but they still need systematic runtime QA and cleanup.
- Most data is still hardcoded/mock data.
- Card configurability is not yet modeled as reusable config.
- First-stage domain model, metric registry, mock measurement selector layer, metric surface config model, and surface-to-measurement adapter now exist in `src/lib/domain-model.ts`, `src/lib/metric-registry.ts`, `src/lib/measurement-store.ts`, `src/lib/metric-surface-config.ts`, and `src/lib/metric-surface-measurements.ts`. Dashboard periodic testing and `/comparison` consume that path.
- Data Entry now uses `src/lib/data-entry-config.ts` as a registry-backed test battery config. Manual saves and Excel confirmation generate domain-model `Measurement[]` through `src/lib/data-entry-measurements.ts` and, as of PL-010, append to the local JSON workspace layer when the user creates or opens `performancelab.workspace.json`.
- `src/lib/workspace-file.ts`, `src/lib/workspace-store.tsx`, `src/lib/workspace-measurement-store.ts`, and `src/components/WorkspaceFileBar.tsx` are the first local-data-file layer. The intended first-stage authority is a user-visible JSON file, not IndexedDB/localStorage; Dashboard periodic testing and `/comparison` now read active workspace measurements, and Settings main preferences now read/write the active workspace. Admin, other Dashboard selectors, and cache-clear reconnection verification are still open.
- `src/lib/performance-statistics.ts` now provides the first shared professional statistics boundary for summary comparison, TE, MDC, SWC, SNR, effect size, summary-level p-values, correlation outputs, sample-size reporting, missing-data policy, assumptions, and data-quality metadata. Dashboard periodic comparison and `/correlation` primary statistics consume it.
- `docs/EXECUTION_BRIEF.md` is the current execution brief for architecture work. It defines the comparison data group model, roadmap status, completion criteria, default next task, and when the brief itself should be updated.
- Build succeeds, but bundle size is large.
- Dependency audit warnings exist and should be reviewed later.

## Collaboration Protocol

At the start of a new AI session:

1. Read `task_plan.md`.
2. Read `findings.md`.
3. Read `progress.md`.
4. Read this file.
5. Read `docs/ROADMAP.md`.
6. Read `docs/EXECUTION_BRIEF.md`.
7. Run `git status --short --branch`.
8. If the user did not specify a task, follow the first unfinished P0/P1 item in `docs/EXECUTION_BRIEF.md`.
9. Confirm the requested task maps to the roadmap before editing.

When work is completed:

1. Run `npm run build`.
2. Update `progress.md` first as the complete chronological work log for work performed, verification, errors, commits, and pushes.
3. Distill durable discoveries into `findings.md` when they should survive future sessions.
4. Update `docs/EXECUTION_BRIEF.md` only when a PL-numbered roadmap item changes status, the default next task changes, completion criteria change, or a decision changes future execution. When those execution-brief changes affect startup context, also update the “当前重要状态” block in `docs/NEXT_CHAT_PROMPT.md`.
5. Commit with a concise message.
6. Push to `main`.
7. Check GitHub Actions if deployment behavior changed.
