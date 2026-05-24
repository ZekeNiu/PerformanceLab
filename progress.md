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
- Verification: `npm run build` passes. Existing Vite >500 kB chunk warning remains.

## 2026-05-24 Continuation Workflow Review

- Reviewed `docs/NEXT_CHAT_PROMPT.md`, `docs/DEEP_REVIEW_2026-05-24.md`, `docs/AI_CONTEXT.md`, `docs/ROADMAP.md`, `README.md`, `task_plan.md`, `findings.md`, and `progress.md` for new-conversation efficiency and duplication.
- Determined that some duplicated startup instructions are acceptable because `NEXT_CHAT_PROMPT.md` is the bootstrap entry point and `DEEP_REVIEW_2026-05-24.md` must remain self-contained.
- Found two useful improvements:
  - `NEXT_CHAT_PROMPT.md` should explain that same-workspace Codex conversations can use a short “read this file” instruction instead of copying the entire prompt.
  - `AI_CONTEXT.md` and `ROADMAP.md` should align with the newer “comparison data group” wording to avoid older “comparison layer” ambiguity.
- Updated `NEXT_CHAT_PROMPT.md`, `AI_CONTEXT.md`, and `ROADMAP.md` accordingly.
- Verification: docs-only change; no build run because no code changed.

## 2026-05-24 PL-001 Measurement Store

- Implemented `src/lib/measurement-store.ts` as the first shared mock measurement source.
- Added normalized mock domain teams, athletes, and sessions mapped from the existing data-entry mock data.
- Added deterministic mock `Measurement[]` rows for periodic testing metrics, daily monitoring metrics, and performance/correlation demo metrics.
- Added selector utilities for filtering by metric, athlete, team, position, session, time range, and source.
- Added summary and series helpers with `mean`, `best`, `latest`, `min`, `max`, and `median` aggregation.
- Kept the current UI unchanged; this is the data/selector foundation for PL-002 and PL-003.
- Updated `docs/DEEP_REVIEW_2026-05-24.md` so `PL-001` is `Done` and the default next task is `PL-002`.
- Verification:
  - `npm run build` passes. Existing Vite >500 kB chunk warning remains.
  - `npm run lint` passes.

## 2026-05-24 New-Conversation Test Review

- Reviewed the new-conversation test result after commit `4b24caf Add shared measurement store`.
- Confirmed the workflow met the main expectation: the new conversation followed the default task path, completed PL-001, updated the execution brief, updated logs, ran build/lint, committed, and pushed.
- Found one documentation boundary issue: PL-001 was marked Done correctly, but its completion wording could be read as if the full horizontal reference-group system already exists.
- Updated `docs/DEEP_REVIEW_2026-05-24.md` and `findings.md` to clarify that PL-001 covers the shared measurement store and basic selectors only; gender, age band, specialty, custom reference groups, and percentiles must be modeled in PL-002 and implemented later.
- Verification:
  - `npm run lint` passes.
  - `npm run build` passes. Existing Vite >500 kB chunk warning remains.

## 2026-05-24 Execution Brief Boundary Review

- Reviewed whether `docs/DEEP_REVIEW_2026-05-24.md` should keep accumulating “新增发现与决策记录” and “已完成修复记录”.
- Decision: the execution brief should not become a second `progress.md` or `findings.md`. It should only hold current product/architecture constraints, the PL roadmap, completion criteria, and default next task.
- Removed the append-only “新增发现与决策记录” section and the “已完成修复记录” table from `docs/DEEP_REVIEW_2026-05-24.md`.
- Added explicit update boundaries: update the execution brief only when roadmap status, default next task, completion criteria, priority, or key product/architecture constraints change.
- Clarified log destinations:
  - `progress.md`: required session log, verification results, attempted fixes, and errors.
  - `findings.md`: durable discoveries that should survive across conversations.
  - `task_plan.md`: high-level task/status summary.
  - `docs/DEEP_REVIEW_2026-05-24.md`: current execution state and next-action guidance only.
- Verification: docs-only change; no build run because no code changed.

## 2026-05-24 PL-002 Metric Surface Config

- Read project context files and confirmed git status started clean on `main...origin/main`.
- Added `src/lib/metric-surface-config.ts` as the first serializable configuration model for metric display surfaces.
- Defined:
  - `MetricSurfaceConfig` for one canonical metric, visualization, mode, context, primary data group, optional comparison data groups, annotations, and display options.
  - `MetricDataGroupConfig` and `ComparisonDataGroupConfig` for subject, time, aggregation, source filters, and longitudinal/cross-sectional comparison semantics.
  - `TimeSelection`, `SubjectSelector`, and `ReferenceGroupSelector` so later dashboard migration can represent athletes, teams, positions, custom groups, same-gender/age/specialty/position/team reference groups, and percentile references.
  - `StatisticalAnnotationConfig` so target, threshold, benchmark, SWC, MDC, confidence interval, and normal range settings stay outside the comparison data group quota.
- Encoded the product constraint of one primary data group plus up to three extra comparison groups with `MAX_COMPARISON_DATA_GROUPS`, `MAX_TOTAL_DATA_GROUPS`, and `UpToThree`.
- Added `docs/METRIC_SURFACE_CONFIG.md` documenting the configuration boundary and confirming that PL-002 does not migrate Dashboard or `/comparison` rendering yet.
- Updated `docs/DEEP_REVIEW_2026-05-24.md`, `task_plan.md`, `findings.md`, `docs/ROADMAP.md`, and `docs/AI_CONTEXT.md` so the default next task is `PL-003`.
- Correction note: the first `apply_patch` call used the workspace parent as its base directory; the two new files were immediately moved into `app/` and the misplaced parent-level copies were removed before validation.
- Commit note: the first combined `git add ... && git commit ...` attempt failed because this PowerShell environment does not accept `&&` as a statement separator; the add and commit were rerun as separate commands.
- Commit: created local commit for `Add metric surface config model`.
- Push note: first `git push origin main` attempt failed because the environment could not connect to `github.com:443`.
- Push: retry succeeded and updated `origin/main`.
- Verification:
  - `npm run build` passes. Existing Vite >500 kB chunk warning remains.
  - `npm run lint` passes.

## 2026-05-24 Continuation Entry Naming Review

- Reviewed whether the living execution brief should keep the dated filename `docs/DEEP_REVIEW_2026-05-24.md`.
- Decision: the dated name is no longer appropriate because the document now functions as a maintained current-state execution brief, not a one-time review snapshot.
- Renamed the authoritative file to `docs/EXECUTION_BRIEF.md`.
- Kept `docs/DEEP_REVIEW_2026-05-24.md` as a short legacy redirect so older prompts and historical references still lead to the current file.
- Updated active references in `docs/NEXT_CHAT_PROMPT.md`, `docs/AI_CONTEXT.md`, and `docs/ROADMAP.md`.
- Refreshed the `docs/NEXT_CHAT_PROMPT.md` “当前重要状态” section so it includes PL-001 Done, PL-002 Done, PL-003 as the default next task, and the comparison-data-group product boundary.
- Added a maintenance rule: update that summary only when `docs/EXECUTION_BRIEF.md` default next task, PL status, or key product/architecture constraints change.
- Verification: docs-only change; no build run because no code changed.

## 2026-05-24 Documentation Logging Boundary Update

- Reviewed the concern that separate rules for `progress.md`, `findings.md`, `docs/EXECUTION_BRIEF.md`, and `docs/NEXT_CHAT_PROMPT.md` could create incomplete or scattered logs.
- Decision: `progress.md` is the single complete chronological work log. Other docs are derived from it or from durable architecture/product decisions.
- Updated `docs/NEXT_CHAT_PROMPT.md` so the copied prompt explicitly says every work item, change, verification, error, commit, and push is recorded in `progress.md` first.
- Updated `docs/EXECUTION_BRIEF.md` with a “文档职责边界” section that separates complete logs, durable findings, authoritative execution state, and bootstrap summary.
- Updated `docs/AI_CONTEXT.md` so future sessions update `progress.md` first before distilling findings or changing execution state docs.
- Updated `findings.md` and `task_plan.md` with the clarified boundary.
- Verification: `npm run build` passes. Existing Vite >500 kB chunk warning remains.

## 2026-05-24 PL-003 Dashboard Periodic Testing Migration

- Started from the default next task in `docs/EXECUTION_BRIEF.md`: `PL-003`, migrate Dashboard periodic testing to registry-derived metrics, metric surface configuration, and measurement selectors.
- Read `task_plan.md`, `findings.md`, `progress.md`, `docs/AI_CONTEXT.md`, `docs/ROADMAP.md`, `README.md`, and `docs/EXECUTION_BRIEF.md`.
- Confirmed initial git status: `main...origin/main` with no local changes.
- Inspected `src/components/dashboard/PeriodicTesting.tsx`, `src/components/dashboard/data.ts`, `src/lib/measurement-store.ts`, `src/lib/metric-registry.ts`, and `src/lib/metric-surface-config.ts`.
- Working decision: keep the current Dashboard visual structure for this pass, but replace `PeriodicTesting`'s local demo indicator truth with registry/store-derived metric surface data and a small adapter from `MetricSurfaceConfig` to measurement selector queries.
- Added `src/lib/metric-surface-measurements.ts` as the first adapter from `MetricDataGroupConfig`/`TimeSelection`/`SubjectSelector` to `measurement-store` selector queries and summaries.
- Replaced `src/components/dashboard/PeriodicTesting.tsx` with a clean implementation because the old file contained mojibake-heavy decorative comments and local `DEMO_INDICATORS`/random layer generation.
- `PeriodicTesting` now derives periodic metrics from `METRIC_DEFINITIONS`, builds dashboard `MetricSurfaceConfig` objects, summarizes display/longitudinal/cross-sectional values through `selectMetricDataGroupSummary`, and keeps comparison data groups to the same max-three product rule.
- Display mode now builds category cards and radar scores from registry metrics and the shared mock `Measurement[]` store.
- Longitudinal mode now compares the primary athlete's baseline session against the latest session through measurement selectors.
- Cross-sectional mode now builds stable athlete/reference comparison layers from measurement selectors; the old `Math.random()` athlete layer generation is removed from `PeriodicTesting`.
- First `npm run build` failed on the `UpToThree<ComparisonDataGroupConfig>` tuple cast after slicing comparison groups; fixed by making the runtime max-three cast explicit.
- Verification: `npm run build` passes. Existing Vite >500 kB chunk warning remains.
- Verification: `npm run lint` passes.
- Browser QA note: Browser plugin is not available in this session, so Playwright was used directly.
- Playwright setup notes:
  - `npx --package playwright node <temp script>` and `npx -p playwright -c "node <temp script>"` both failed because the temporary package was not visible to Node `require()`.
  - `npx playwright test` with a temp config failed because the temp config could not resolve `@playwright/test`.
  - Installed local `playwright` with `npm install --no-save playwright` to run the smoke script; this did not change tracked package metadata.
- Browser smoke verification on local `npm run preview` at `http://127.0.0.1:4173/`:
  - Desktop dashboard periodic display mode rendered with no console errors/warnings and no framework overlay.
  - Desktop longitudinal mode rendered with no console errors/warnings and no framework overlay.
  - Mobile 390px cross-sectional mode rendered, the add-comparison menu opened, 9 comparison option buttons were found, and document width stayed at 390px.
  - Screenshots were saved to the system temp directory, not the repository.
- Residual UI note: mobile screenshots still show existing top dashboard filter/header controls as visually cramped; this is closer to the existing `PL-008` mobile comparison QA scope and was not mixed into `PL-003`.
- Updated `docs/EXECUTION_BRIEF.md` so `PL-003` is `Done`, `PL-004` is the next default P1 task, and the code facts reflect Dashboard periodic testing as the first Dashboard consumer of the shared measurement store.
- Updated `docs/NEXT_CHAT_PROMPT.md`, `docs/ROADMAP.md`, `docs/AI_CONTEXT.md`, `task_plan.md`, and `findings.md` to reflect the PL-003 completion and PL-004 default next step.
- Final verification after documentation updates:
  - `npm run build` passes. Existing Vite >500 kB chunk warning remains.
  - `npm run lint` passes.
- Final pre-commit git status: modified docs/context files plus `src/components/dashboard/PeriodicTesting.tsx`; new `src/lib/metric-surface-measurements.ts`.
- Commit plan: create a local commit for PL-003 with message `Migrate dashboard periodic testing`.
- Push plan: push the resulting `main` commit to `origin/main` so GitHub Actions can deploy Pages.

## 2026-05-24 PL-004 Comparison Page Consolidation

- Started from the default next task in `docs/EXECUTION_BRIEF.md`: `PL-004`, consolidate `/comparison` so it no longer maintains a second metric/stat/chart truth.
- Read the required project context files and confirmed initial git status: `main...origin/main` with no local changes.
- Read the React best-practices skill and frontend testing/debugging skill because this task changes a React route and should be rendered-verified after build.
- Inspected `src/pages/Comparison.tsx`, `src/pages/Dashboard.tsx`, `src/App.tsx`, `src/components/Navbar.tsx`, `src/components/dashboard/PeriodicTesting.tsx`, and `src/lib/metric-surface-measurements.ts`.
- Working decision: keep `/comparison` as a route, but replace the legacy standalone page implementation with a focused wrapper around the already migrated `PeriodicTesting` longitudinal/cross-sectional metric surface. This removes the page-local `DEMO_INDICATORS`, comparison layers, statistical utilities, and chart options from `/comparison` rather than extending them.
- Replaced `src/pages/Comparison.tsx` with a small route wrapper: it keeps longitudinal/cross-sectional mode switching and renders `PeriodicTesting mode={mode}` so comparison data, statistics, charts, and metric identity all come from the shared Dashboard periodic surface path.
- Verification: `npm run build` passes. Existing Vite >500 kB chunk warning remains.
- Verification: `npm run lint` passes.
- Browser QA note: Browser plugin is not available in this session, so Playwright was used directly.
- Playwright smoke on local `npm run preview` at `http://127.0.0.1:4173/#/comparison` passed:
  - Desktop 1440px loaded `/comparison`, rendered the shared periodic-testing comparison surface, switched from longitudinal to cross-sectional mode, and opened the add-comparison menu.
  - Mobile 390px loaded `/comparison`, switched to cross-sectional mode, had no framework overlay, and kept document width at 390px.
  - Console errors, console warnings, and page errors were empty.
  - Screenshots were saved to the system temp directory, not the repository.
- Cleanup note: one Vite preview child `node` process remained listening on port 4173 after the Playwright command wrapper exited; it was stopped manually.
- UI copy follow-up: shortened the `/comparison` page subtitle from an implementation-oriented phrase to `Periodic Testing`.
- Final verification after the subtitle adjustment:
  - `npm run build` passes. Existing Vite >500 kB chunk warning remains.
  - `npm run lint` passes.
- Updated `docs/EXECUTION_BRIEF.md` so `PL-004` is `Done`, `PL-005` is the next default P1 task, and the current code facts reflect `/comparison` as a `PeriodicTesting` route wrapper.
- Updated `docs/NEXT_CHAT_PROMPT.md`, `docs/ROADMAP.md`, `docs/AI_CONTEXT.md`, `task_plan.md`, and `findings.md` to reflect PL-004 completion and PL-005 as the next default task.
- Final pre-commit git status: modified `src/pages/Comparison.tsx`, `docs/AI_CONTEXT.md`, `docs/EXECUTION_BRIEF.md`, `docs/NEXT_CHAT_PROMPT.md`, `docs/ROADMAP.md`, `findings.md`, `progress.md`, and `task_plan.md`.
- Commit plan: create a local commit for PL-004 with message `Consolidate comparison page`.
- Push plan: push the resulting `main` commit to `origin/main` so GitHub Actions can deploy Pages.
- Commit: created and amended one local commit with message `Consolidate comparison page` before push so the progress log stays in the same change.

## 2026-05-24 GitHub Actions Node 20 Warning Maintenance

- Started maintenance task requested by the user: update `.github/workflows/deploy-pages.yml` and run GitHub Actions once to confirm the Node.js 20 actions deprecation warning is gone.
- Confirmed initial git status: `main...origin/main` with no local changes.
- Inspected `.github/workflows/deploy-pages.yml`; the workflow still used `actions/checkout@v4`, `actions/setup-node@v4`, and `peaceiris/actions-gh-pages@v4`.
- Working decision: update those actions to versions that declare Node 24 action runtime while keeping the workflow behavior unchanged.
- Updated `.github/workflows/deploy-pages.yml`:
  - `actions/checkout@v4` -> `actions/checkout@v6`
  - `actions/setup-node@v4` -> `actions/setup-node@v6`
  - `peaceiris/actions-gh-pages@v4` -> `peaceiris/actions-gh-pages@v4.1.0`
- Verification before commit: `npm run build` passes. Existing Vite >500 kB chunk warning remains and is unrelated to the Actions runtime warning.
- Commit plan: create a local commit with message `Update Pages workflow actions`.
- Push plan: push to `main` to trigger `Deploy to GitHub Pages`, then inspect the resulting Actions run for Node 20 deprecation annotations.
- Commit: created and amended one local commit with message `Update Pages workflow actions` before push so the progress log stays in the same change.
- Push: pushed commit `a9f4311` to `origin/main`.
- GitHub Actions verification: `Deploy to GitHub Pages #23` for commit `a9f4311` completed successfully in 35 seconds; `build-and-deploy` completed successfully in 32 seconds.
- Warning verification: the run summary and job page no longer show the previous Node.js 20 actions deprecation annotation after upgrading the workflow actions to Node 24-compatible versions.

## 2026-05-24 PL-005 Data Entry Metric Source Unification

- Started from the default next task in `docs/EXECUTION_BRIEF.md`: `PL-005`, unify Data Entry metric sources so manual entry and Excel confirmation can emit shared `Measurement[]` rows.
- Read the required project context files and confirmed initial git status: `main...origin/main` with no local changes.
- Read the React best-practices, frontend-testing-debugging, and karpathy-guidelines skills because this task changes React data-entry components and should be verified through build/lint plus rendered smoke testing.
- Inspected `src/data/mockData.ts`, `src/components/data-entry/IndicatorSelector.tsx`, `ManualEntryTab.tsx`, `RepeatTestTable.tsx`, `ValidationStagingArea.tsx`, `ExcelImportTab.tsx`, `UploadZone.tsx`, `src/lib/import-parser.ts`, `src/lib/domain-model.ts`, `src/lib/metric-registry.ts`, and `src/lib/measurement-store.ts`.
- Working decision: keep the existing Data Entry UI structure, but replace its metric source with a small registry-backed test battery config and add adapter functions that convert manual rows/import staging rows into domain-model `Measurement[]` records. No backend persistence is being introduced in this pass.
- Extended `src/lib/metric-registry.ts` with the Data Entry test metrics that were still only represented by local `m-*` ids, including SJ, RFD, relative strength, isokinetic, max speed, Yo-Yo VO2max estimate, 12-minute run distance, HRV SDNN, and resting lactate metrics.
- Added `src/lib/data-entry-config.ts` as the registry-backed test battery config for Data Entry categories, actions, equipment, and metric ids.
- Added `src/lib/data-entry-measurements.ts` to build domain-model `Measurement[]` records from manual entry state and Excel staging rows.
- Migrated `IndicatorSelector` from `mockActionCategories`/`IndicatorMetric` to `dataEntryActionCategories` and `MetricDefinition`.
- Migrated `RepeatTestTable` and `ManualEntryTab` to registry metric definitions and manual-entry Measurement generation.
- Migrated `ValidationStagingArea` and `ExcelImportTab` so Excel confirmation passes both accepted parsed rows and generated import-source `Measurement[]` records.
- Updated import parsing to prefer specific headers by alias priority, so templates containing both `动作分类` and `测试动作` use the specific test-action column.
- Added action-aware Data Entry metric resolution so duplicated labels such as `相对力量` can resolve within the selected test action before falling back to global metric aliases.
- Updated `DataEntry` to collect generated Measurement rows in page-level React state and show a user-facing staged-record count without exposing internal store terminology.
- Updated the CSV template examples to use canonical registry metric names (`CMJ 跳跃高度`, `CMJ 峰值力`).
- First verification after code edits: `npm run build` passed with the existing Vite >500 kB chunk warning; `npm run lint` passed.
- Browser QA note: Browser plugin is not available in this session, so Playwright was used directly.
- Preview setup note: the first `Start-Process npm` attempt launched the wrong executable association (`Notepad`) in this Windows environment; stopped it and restarted preview with `npm.cmd`.
- Playwright script note: the first inline script failed before page interaction because PowerShell pipe encoding corrupted Chinese regex literals; reran the script using ASCII-only Unicode escapes.
- Playwright smoke on local `npm run preview` at `http://127.0.0.1:4173/#/data-entry` passed:
  - Manual flow selected an existing test session, CMJ test action, athlete 张伟, entered three repeat values, saved, and showed `当前页面已暂存 3 条测量记录。`.
  - Excel flow uploaded a generated CSV with two canonical registry metrics, reached the staging table, confirmed import, and showed `当前页面已暂存 9 条测量记录。`.
  - Console errors, console warnings, and page errors were empty.
  - Desktop document width matched viewport width (`1440`), with no page-level horizontal overflow.
  - Screenshots were saved to the system temp directory, not the repository.
- Final verification after UI copy cleanup and action-aware import parsing: `npm run build` passes with the existing Vite >500 kB chunk warning; `npm run lint` passes.
- Final Playwright rerun after parser changes passed the same `/data-entry` manual + Excel flow with empty console errors/warnings and staged-record counts of 3 then 9.
- Updated `docs/EXECUTION_BRIEF.md` so `PL-005` is `Done`, `PL-006` is the next default P1 task, and the current code facts reflect Data Entry Measurement generation as frontend-only page state.
- Updated `docs/NEXT_CHAT_PROMPT.md`, `docs/ROADMAP.md`, `docs/AI_CONTEXT.md`, `task_plan.md`, and `findings.md` to reflect PL-005 completion and PL-006 as the next default task.
- Final pre-commit git status: modified docs/context files, Data Entry components, `src/lib/import-parser.ts`, `src/lib/metric-registry.ts`, and `src/pages/DataEntry.tsx`; new `src/lib/data-entry-config.ts` and `src/lib/data-entry-measurements.ts`.
- Commit plan: create a local commit for PL-005 with message `Unify data entry metrics`.
- Push plan: push the resulting `main` commit to `origin/main` so GitHub Actions can deploy Pages.
- Commit: created and amended one local commit with message `Unify data entry metrics` before push so the progress log stays in the same change.
- Push: pushed commit `08dde05` to `origin/main`.
- Follow-up log note: recording the successful push in this progress-only update, then pushing that log update to `origin/main` as well.
- Push: pushed the follow-up progress-log commit `2e86d93` to `origin/main`.
- GitHub Actions note: local `gh` CLI is not installed, so deployment status was checked through the GitHub Actions REST API.
- GitHub Actions verification: `Deploy to GitHub Pages` run `26366340470` for commit `2e86d93` completed successfully. The earlier run for `08dde05` was cancelled because it was superseded by the follow-up log commit.
- Commit/push plan: record this deployment verification in a docs-only `[skip ci]` commit so it does not start another Pages deployment run.
