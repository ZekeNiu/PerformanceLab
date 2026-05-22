# PerformanceLab Working Plan

This file is the persistent task plan for Codex sessions. Read it before starting major work, then update it when scope, decisions, or verification results change.

## Current State

- Repository: `ZekeNiu/PerformanceLab`
- Local project root: `D:\AI\PerformanceLab_1\app`
- Primary branch: `main`
- GitHub Pages branch: `gh-pages`
- Live URL: `https://zekeniu.github.io/PerformanceLab/`
- Frontend stack: React 19, TypeScript, Vite, Tailwind CSS, ECharts, Framer Motion, react-router-dom HashRouter
- Data layer: mock frontend data only; no backend/API yet
- Current source now includes the Kimi full export imported from `D:\Download\Kimi_Agent_仪表盘功能完善_2.zip`.
- Pre-import rollback tag: `backup-before-kimi-full-import`

## Git History Notes

- Current repository history starts from the upload/deploy work done on 2026-05-17.
- The older V1-V7 history mentioned in `PROJECT_SUMMARY.md` is not present in this working copy. Only `D:\AI\PerformanceLab_1\app\.git` exists.
- Current reachable commits:
  - `c7fee44` Ignore Playwright CLI artifacts
  - `128f731` Fix GitHub Pages asset paths
  - `527da0a` Deploy Pages through gh-pages branch
  - `ce44265` Enable Pages from deployment workflow
  - `a1dab57` Merge remote initial commit
  - `da3c473` Initial PerformanceLab deployment
  - `8e68524` Initial commit

## Durable Product Goal

Build a professional sports performance dashboard for performance analysts and head coaches. The dashboard should support:

- Basic data display
- Longitudinal comparison analysis
- Cross-sectional comparison analysis
- Correlation analysis
- Highly configurable cards and charts
- Team-specific test batteries and metrics
- Maintainable architecture as the app grows

## Working Rules

- Prefer small, testable changes over broad rewrites.
- Before changing UI behavior, inspect the component and shared data shape first.
- After frontend changes, run `npm run build`.
- For deployed UI changes, verify GitHub Actions and the live Pages URL.
- Keep persistent context in `docs/AI_CONTEXT.md`, `docs/ROADMAP.md`, `findings.md`, and `progress.md`.

## Near-Term Priorities

- Audit the imported Kimi full pages for runtime bugs and broken interactions.
- Refactor dashboard cards toward metric-configurable components.
- Centralize metric definitions and chart/card configuration.
- Add a clean data model for athletes, teams, sessions, tests, metrics, and measurements.
- Add regression checks for Pages asset paths and core navigation.

## 2026-05-22 Active Task

- Completed: Settings defensive `localStorage` parsing for chart colors.
- Completed: PeriodicTesting hook-order fix for longitudinal and cross-sectional category sections.
- Completed: UploadZone callback dependency fix.
- Completed: Mobile minimum viable layout with bottom navigation and page-level overflow containment.
- Completed: Roadmap note for treating longitudinal/cross-sectional analysis as comparison layers on metric display surfaces.
- Verified: `npm run build` passes.
- Verified: 390px mobile smoke check renders six core routes without page-level horizontal overflow.
- Known remaining lint debt: existing shadcn/ui fast-refresh exports, sidebar purity, statistics prefer-const, Comparison prefer-const, and Correlation any/dependency issues.
