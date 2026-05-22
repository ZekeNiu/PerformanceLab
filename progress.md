# PerformanceLab Progress Log

Use this file as the session-by-session project journal.

## 2026-05-17

- Initialized Git in `D:\AI\PerformanceLab_1\app`.
- Connected remote `https://github.com/ZekeNiu/PerformanceLab.git`.
- Pushed source code to GitHub `main`.
- Added GitHub Actions workflow to build and publish `dist/` to `gh-pages`.
- Enabled GitHub Pages with source `gh-pages` branch, path `/`.
- Fixed build-blocking TypeScript issues:
  - Removed unused imports/variables in `DailyMonitoring.tsx`.
  - Made `AlertCard.change` optional in `data.ts`.
- Fixed GitHub Pages asset paths by using `import.meta.env.BASE_URL`.
- Added `.playwright-cli` to `.gitignore`.
- Verified:
  - `npm run build` passes.
  - GitHub Actions deploy succeeds.
  - Live URL returns HTTP 200.
  - Browser console has 0 errors and 0 warnings on the deployed page.

## Next Session Checklist

- Read `docs/NEXT_CHAT_PROMPT.md`.
- Read `task_plan.md`, `findings.md`, `progress.md`, and `docs/AI_CONTEXT.md`.
- Run `git status --short --branch`.
- If changing code, run `npm run build` before finalizing.

## 2026-05-17 Kimi Full Import

- Received Kimi export zip: `D:\Download\Kimi_Agent_仪表盘功能完善_2.zip`.
- Extracted it outside the Git repo to `D:\AI\PerformanceLab_1\incoming\kimi-20260517-130148`.
- Verified the extracted Kimi app builds successfully before importing.
- Tagged the pre-import repository state as `backup-before-kimi-full-import`.
- Imported Kimi's full app source into the current Git repo while preserving GitHub Pages deployment workflow and project memory docs.
- Restored full-size feature pages and modules:
  - `src/pages/Comparison.tsx`
  - `src/pages/Correlation.tsx`
  - `src/pages/Admin.tsx`
  - `src/pages/Settings.tsx`
  - `src/pages/DataEntry.tsx`
  - `src/components/data-entry/*`
  - `src/lib/statistics.ts`
  - `src/lib/correlation-data.ts`
  - `src/data/mockData.ts`
  - `src/types/simple-statistics.d.ts`
- Added/installed `simple-statistics` from the Kimi package.
- Re-applied GitHub Pages asset path fixes using `import.meta.env.BASE_URL`.
- Verified `npm run build` passes after import.
- Fixed `index.html` title markup and added a relative SVG favicon to avoid deployed console 404 noise.

## 2026-05-22 Stabilization And Mobile Pass

- Added roadmap guidance: longitudinal and cross-sectional comparison should become optional comparison layers on metric display surfaces; correlation should remain a dedicated exploratory workflow while sharing the same metric/measurement source.
- Fixed Settings route crash risk by safely parsing `sportpulse-chart-colors` from `localStorage` and clearing invalid cached JSON.
- Changed Settings notification rule rendering from an inline component definition to a render helper to avoid React Compiler component-in-render diagnostics.
- Fixed `PeriodicTesting` hook-order risks by moving category filtering into `useMemo` before early returns in longitudinal and cross-sectional category sections.
- Fixed `UploadZone` callback dependency stability by memoizing mock row generation, file processing, drop handling, and file input handling.
- Implemented minimum mobile layout containment:
  - Mobile bottom navigation below 768px.
  - Content margin is `0` on mobile, `64px` on tablet, `240px` on desktop.
  - Main layout, cards, dashboard content, and tables now constrain width and use local horizontal scrolling where needed.
  - Dashboard comparison mode switcher only appears on the periodic tab.
- Verification:
  - `npm run build` passes. Vite still warns about the existing >500 kB JS bundle.
  - Mobile smoke check via Playwright runtime at 390px for `#/`, `#/comparison`, `#/correlation`, `#/data-entry`, `#/admin`, `#/settings`: each route rendered content, console errors were empty, and page-level scroll width stayed at 390px.
  - Settings survived invalid `sportpulse-chart-colors` cache after reload.
  - `npm run lint` still fails due to existing issues outside this pass: shadcn/ui fast-refresh exports, `src/components/ui/sidebar.tsx` `Math.random`, `src/lib/statistics.ts` `prefer-const`, `Comparison.tsx` `prefer-const`, and `Correlation.tsx` `any`/hook dependency issues.
