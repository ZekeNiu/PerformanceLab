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

- Replace placeholder pages with real feature surfaces.
- Refactor dashboard cards toward metric-configurable components.
- Centralize metric definitions and chart/card configuration.
- Add a clean data model for athletes, teams, sessions, tests, metrics, and measurements.
- Add regression checks for Pages asset paths and core navigation.
