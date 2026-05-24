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

## 2026-05-22 Registry, Import, And Lint Pass

- Restored `docs/NEXT_CHAT_PROMPT.md` to readable Chinese and included the latest continuation context.
- Fixed the remaining lint errors:
  - Disabled the generated shadcn-style fast-refresh export rule in ESLint config.
  - Replaced `Math.random` in `SidebarMenuSkeleton` with a stable width.
  - Fixed `prefer-const` issues in statistics and comparison code.
  - Added type boundaries in `Correlation.tsx` and fixed its hook dependency.
  - Removed stale lint warning path in `Admin.tsx` without changing the current modal initialization behavior.
- Added first-stage domain model and metric registry:
  - `src/lib/domain-model.ts`
  - `src/lib/metric-registry.ts`
- Refactored `src/lib/correlation-data.ts` to derive correlation indicator names/categories from the metric registry instead of maintaining a separate indicator list.
- Replaced mock Excel parsing with real CSV/XLSX parsing:
  - Added `src/lib/import-parser.ts`.
  - Updated `UploadZone` to parse uploaded files asynchronously and show parse errors.
  - Updated `ExcelImportTab` to preserve the uploaded filename in import history.
  - Added registry-based unknown metric validation in `ValidationStagingArea`.
  - Changed `xlsx` to a dynamic import so it loads only during file parsing instead of inflating the initial app bundle.
- Verification:
  - `npm run lint` passes with 0 warnings.
  - `npm run build` passes. Vite still warns about the main JS bundle being larger than 500 kB.
  - Playwright smoke on local preview: uploaded a real CSV file through `#/data-entry`; the app showed parsed filename, rendered the staging validation table, accepted 2 preview rows, kept mobile page width at 390px, and logged no console errors. `#/correlation` also rendered with no console errors.

## 2026-05-24 Deep Review And Low-Risk Fixes

- Read project memory files, roadmap, README, and current next-chat prompt.
- Confirmed git status started clean on `main...origin/main`.
- `rg --files` failed with `Access is denied` from the bundled WindowsApps `rg.exe`; used PowerShell file traversal and `Select-String` instead.
- Confirmed Chinese source/docs are valid UTF-8 when read with `Get-Content -Encoding utf8`.
- Completed a systematic review across routing, dashboard, comparison, correlation, data-entry, metric registry, domain model, statistics, and mock data.
- Added `docs/DEEP_REVIEW_2026-05-24.md` with architecture direction, prioritized issues, professional/statistical concerns, and recommended implementation sequence.
- Updated `docs/NEXT_CHAT_PROMPT.md` so future sessions read the deep review document.
- Fixed import validation staging so a newly parsed file remounts `ValidationStagingArea` with fresh validation state.
- Fixed the downloaded CSV template to use `李娜 / ATH-2024-002`, which exists in `mockAthletes`.
- Removed duplicate `body_fat` metric definition and kept `body_fat` as an alias of canonical `body_fat_pct`; removed unregistered `body_fat` from correlation demo values.
- Lint note: an initial `useEffect` reset implementation failed `react-hooks/set-state-in-effect`; replaced it with a parse-specific component `key`.
- Verification:
  - `npm run lint` passes.
  - `npm run build` passes. Vite still warns that the main JS chunk is larger than 500 kB.

## 2026-05-24 Deep Review Restructure

- Re-read `docs/DEEP_REVIEW_2026-05-24.md` and evaluated it as a future-session execution document.
- Conclusion: the previous version was directionally useful but not sufficient for high-efficiency continuation because it mixed product direction, issue list, completed fixes, and next-step suggestions without status, completion criteria, or a new-problem recording loop.
- Rewrote `docs/DEEP_REVIEW_2026-05-24.md` as an execution brief:
  - Reframed the product direction as “指标展示和统计学深度 + 高度自由配置”.
  - Replaced unclear “比较作为图表层” wording with “主数据 + 最多 3 组额外对比数据”.
  - Clarified that benchmark, thresholds, SWC, MDC, confidence intervals, and normal ranges are statistical annotations/reference lines, not comparison data groups.
  - Added detailed longitudinal and cross-sectional comparison boundaries.
  - Added status definitions, a PL-numbered execution roadmap, completion criteria, and a default next task.
  - Added a required “新增发现与决策记录” format so future sessions can preserve new problems and decisions.
- Updated `docs/NEXT_CHAT_PROMPT.md` to match the new wording and default-task workflow.
- Verification: docs-only change; no build run because no code changed.

## 2026-05-24 Continuation Workflow Review

- Reviewed `docs/NEXT_CHAT_PROMPT.md`, `docs/DEEP_REVIEW_2026-05-24.md`, `docs/AI_CONTEXT.md`, `docs/ROADMAP.md`, `README.md`, `task_plan.md`, `findings.md`, and `progress.md` for new-conversation efficiency and duplication.
- Determined that some duplicated startup instructions are acceptable because `NEXT_CHAT_PROMPT.md` is the bootstrap entry point and `DEEP_REVIEW_2026-05-24.md` must remain self-contained.
- Found two useful improvements:
  - `NEXT_CHAT_PROMPT.md` should explain that same-workspace Codex conversations can use a short “read this file” instruction instead of copying the entire prompt.
  - `AI_CONTEXT.md` and `ROADMAP.md` should align with the newer “comparison data group” wording to avoid older “comparison layer” ambiguity.
- Updated `NEXT_CHAT_PROMPT.md`, `AI_CONTEXT.md`, and `ROADMAP.md` accordingly.
- Verification: docs-only change; no build run because no code changed.
