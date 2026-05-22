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
- First-stage domain model and metric registry now exist in `src/lib/domain-model.ts` and `src/lib/metric-registry.ts`, but `Comparison.tsx`, dashboard periodic testing, and `mockData.ts` still need migration onto that source.
- Excel/CSV import now performs real parsing through `src/lib/import-parser.ts`, but committed rows are still frontend-only and not persisted to a backend or durable local store.
- Build succeeds, but bundle size is large.
- Dependency audit warnings exist and should be reviewed later.

## Collaboration Protocol

At the start of a new AI session:

1. Read `task_plan.md`.
2. Read `findings.md`.
3. Read `progress.md`.
4. Read this file.
5. Run `git status --short --branch`.
6. Confirm the requested task maps to the roadmap before editing.

When work is completed:

1. Run `npm run build`.
2. Update `progress.md` and any relevant docs.
3. Commit with a concise message.
4. Push to `main`.
5. Check GitHub Actions if deployment behavior changed.
