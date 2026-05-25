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

## 2026-05-24 Deep Review Task

- Completed: Systematic review of current code, product direction, data model, comparison workflow, statistics, import flow, and UI/UX risks.
- Completed: Added `docs/DEEP_REVIEW_2026-05-24.md` as the durable continuation document for the next conversation.
- Completed: Updated `docs/NEXT_CHAT_PROMPT.md` to include the deep review document in the required reading list.
- Completed: Fixed low-risk import/registry bugs found during the review:
  - Validation staging remounts for a newly parsed file.
  - Downloaded CSV template uses an athlete that exists in `mockAthletes`.
  - `body_fat` now resolves as an alias of canonical `body_fat_pct` instead of a duplicate metric definition.
- Verification: `npm run lint` passes.
- Verification: `npm run build` passes. Existing Vite chunk-size warning remains.
- Completed: Created the first shared mock `Measurement[]` store and selector layer in `src/lib/measurement-store.ts`.
- Next recommended architecture work: unify Data Entry metric sources so manual entry and Excel confirmation can emit shared `Measurement[]` rows (`PL-005`), now that Dashboard periodic testing and `/comparison` share the same comparison surface.

## 2026-05-24 PL-002 Metric Surface Config Task

- Completed: Added `src/lib/metric-surface-config.ts` with the first serializable metric display surface model.
- Completed: Modeled `MetricSurfaceConfig`, `MetricDataGroupConfig`, `ComparisonDataGroupConfig`, `TimeSelection`, `SubjectSelector`, `ReferenceGroupSelector`, and statistical annotation options.
- Completed: Encoded the product rule of one primary data group plus up to three additional comparison data groups with `MAX_COMPARISON_DATA_GROUPS` and `UpToThree`.
- Completed: Added `docs/METRIC_SURFACE_CONFIG.md` to document the boundary between comparison data groups and statistical annotations/reference lines.
- Completed: Updated `docs/DEEP_REVIEW_2026-05-24.md` so `PL-002` is `Done` and the default next task is `PL-003`.
- Verification: `npm run build` passes. Existing Vite chunk-size warning remains.
- Verification: `npm run lint` passes.

## 2026-05-24 Deep Review Restructure Task

- Completed: Reworked `docs/DEEP_REVIEW_2026-05-24.md` from a narrative review into an execution brief.
- Completed: Clarified product direction as metric display, statistical depth, and highly configurable display surfaces.
- Completed: Replaced ambiguous comparison-layer wording with explicit comparison data group constraints: one primary data group plus up to three additional comparison data groups.
- Completed: Moved benchmark/threshold/SWC/MDC/CI into statistical annotations/reference lines rather than comparison data groups.
- Completed: Added PL-numbered roadmap items with priority, status, completion criteria, and main files.
- Completed: Added future-session update rules and a “new findings and decisions” recording template.
- Completed: Updated `docs/NEXT_CHAT_PROMPT.md`, `progress.md`, and `findings.md` to match the new document structure.
- Verification: `npm run build` passes. Existing Vite chunk-size warning remains.

## 2026-05-24 Continuation Workflow Review Task

- Completed: Reviewed the new-conversation workflow across `docs/NEXT_CHAT_PROMPT.md`, `docs/DEEP_REVIEW_2026-05-24.md`, `docs/AI_CONTEXT.md`, `docs/ROADMAP.md`, `README.md`, `task_plan.md`, `findings.md`, and `progress.md`.
- Completed: Clarified that same-workspace Codex conversations can start with a short instruction to read `docs/NEXT_CHAT_PROMPT.md`; full prompt copying is only needed when the new conversation cannot access local files.
- Completed: Kept intentional startup-step duplication between `NEXT_CHAT_PROMPT.md` and `DEEP_REVIEW_2026-05-24.md` because they serve different roles: bootstrap prompt vs authoritative execution brief.
- Completed: Updated `AI_CONTEXT.md` and `ROADMAP.md` to align with the newer “comparison data group” wording and default execution-brief workflow.
- Verification: docs-only change; no build required.

## 2026-05-24 New-Conversation Test Review Task

- Completed: Reviewed the result of a new-conversation test that produced commit `4b24caf Add shared measurement store`.
- Completed: Confirmed the continuation workflow achieved its main goal: the new conversation selected the default task, implemented PL-001, updated `docs/DEEP_REVIEW_2026-05-24.md`, wrote logs, verified build/lint, committed, and pushed.
- Completed: Clarified PL-001 wording so it does not overclaim full reference-group support. Current selector coverage is metric, athlete, team, position, session, time range, source, and aggregation; gender/age/specialty/custom group/percentile selectors remain future work.
- Verification: `npm run lint` and `npm run build` pass after review. Existing Vite chunk-size warning remains.

## 2026-05-24 Execution Brief Boundary Task

- Completed: Reviewed whether `docs/DEEP_REVIEW_2026-05-24.md` should keep detailed “新增发现与决策记录” and “已完成修复记录” sections.
- Completed: Decided to keep `docs/DEEP_REVIEW_2026-05-24.md` as a lean execution brief rather than an append-only log.
- Completed: Removed routine decision/fix-history sections from the execution brief and added explicit update boundaries.
- Completed: Clarified that the required session log is `progress.md`; durable discoveries go to `findings.md`; high-level task status goes to `task_plan.md`.
- Verification: docs-only change; no build required.

## 2026-05-24 Continuation Entry Naming Task

- Completed: Renamed the living architecture continuation document from dated `docs/DEEP_REVIEW_2026-05-24.md` to stable `docs/EXECUTION_BRIEF.md`.
- Completed: Kept the old dated path as a short redirect so older prompts and historical references do not hard-fail.
- Completed: Updated active startup references in `docs/NEXT_CHAT_PROMPT.md`, `docs/AI_CONTEXT.md`, and `docs/ROADMAP.md`.
- Completed: Refreshed `docs/NEXT_CHAT_PROMPT.md` “当前重要状态” so it mirrors the current PL-001/PL-002/PL-003 state and added its maintenance boundary.
- Verification: docs-only change; no build required.

## 2026-05-24 Documentation Logging Boundary Task

- Completed: Clarified that `progress.md` is the single complete chronological work log.
- Completed: Clarified that `findings.md`, `docs/EXECUTION_BRIEF.md`, and `docs/NEXT_CHAT_PROMPT.md` are derived/context files rather than parallel logs.
- Completed: Clarified that `NEXT_CHAT_PROMPT.md` “当前重要状态” is only a minimal bootstrap fallback for conversations that cannot read local files.
- Verification: `npm run build` passes. Existing Vite chunk-size warning remains.

## 2026-05-24 PL-003 Dashboard Periodic Testing Task

- Completed: Added `src/lib/metric-surface-measurements.ts` as the first adapter from metric surface data-group config to measurement-store selectors.
- Completed: Migrated `src/components/dashboard/PeriodicTesting.tsx` away from local `DEMO_INDICATORS` and random athlete comparison layers.
- Completed: Dashboard periodic display, longitudinal comparison, and cross-sectional comparison now derive metric identity from the registry and values from the shared mock `Measurement[]` store.
- Completed: Preserved the current dashboard visual structure while making the periodic surface driven by registry/store-derived surface data.
- Verification: `npm run build` passes. Existing Vite chunk-size warning remains.
- Verification: `npm run lint` passes.
- Verification: Local Playwright smoke passed for desktop display, desktop longitudinal, and 390px mobile cross-sectional add-comparison flow with no console errors/warnings and no page-level horizontal overflow.
- Next recommended architecture work: unify Data Entry metric sources so manual entry and Excel confirmation can emit shared `Measurement[]` rows (`PL-005`).

## 2026-05-24 PL-004 Comparison Page Consolidation Task

- Completed: Replaced the legacy `/comparison` implementation with a focused route wrapper around `PeriodicTesting`.
- Completed: Removed the page-local demo indicators, comparison layers, statistical utilities, and ECharts option truth from `src/pages/Comparison.tsx`.
- Completed: `/comparison` longitudinal and cross-sectional modes now reuse the Dashboard periodic testing path: registry metrics, `MetricSurfaceConfig`, `metric-surface-measurements`, shared mock `Measurement[]` selectors, statistics, and chart components.
- Verification: `npm run build` passes. Existing Vite chunk-size warning remains.
- Verification: `npm run lint` passes.
- Verification: Local Playwright smoke passed for `/comparison` desktop longitudinal-to-cross-sectional interaction, add-comparison menu, and 390px mobile cross-sectional width with no console errors/warnings and no page-level horizontal overflow.
- Next recommended architecture work: unify Data Entry metric sources so manual entry and Excel confirmation can emit shared `Measurement[]` rows (`PL-005`).

## 2026-05-24 PL-005 Data Entry Metric Source Task

- Completed: Added `src/lib/data-entry-config.ts` as the registry-backed test battery config for Data Entry actions and metrics.
- Completed: Added `src/lib/data-entry-measurements.ts` to convert manual entry data and Excel staging rows into domain-model `Measurement[]`.
- Completed: Migrated `IndicatorSelector`, `ManualEntryTab`, `RepeatTestTable`, `ValidationStagingArea`, `ExcelImportTab`, and `DataEntry` to use registry metric definitions and committed Measurement rows.
- Completed: Extended `src/lib/metric-registry.ts` with the remaining Data Entry test metrics needed by the current test battery.
- Verification: `npm run build` passes. Existing Vite chunk-size warning remains.
- Verification: `npm run lint` passes.
- Verification: Local Playwright smoke passed for `/data-entry` manual save and Excel confirmation. Manual entry generated 3 frontend-staged Measurement rows; Excel confirmation generated 6 more rows for a total of 9; console errors/warnings were empty and desktop width had no page-level overflow.
- Next recommended architecture work: centralize professional statistics outputs and metadata (`PL-006`).

## 2026-05-25 PL-006 Statistics Module Task

- Completed: Added `src/lib/performance-statistics.ts` as the first professional statistics boundary.
- Completed: Centralized summary comparison, TE, MDC, SWC, SNR, Cohen's d, summary-level p-value, Pearson/Spearman correlation, confidence interval, sample-size reporting, missing-data policy, assumptions, and data-quality metadata.
- Completed: Migrated Dashboard periodic longitudinal/cross-sectional statistics to consume `compareSummaries`.
- Completed: Migrated `/correlation` primary pairwise correlation table to consume `analyzeCorrelation`.
- Verification: `npm run build` passes. Existing Vite chunk-size warning remains.
- Verification: `npm run lint` passes.
- Verification: Local Playwright smoke passed for `/comparison` cross-sectional statistics and `/correlation` detailed statistics with no console errors/warnings and no desktop page-level overflow.
- Next recommended architecture work: local JSON workspace file persistence (`PL-010`), because the user clears browser cache and core data must survive outside IndexedDB/localStorage.

## 2026-05-25 PL-010 Local Workspace File Task

- In progress: Added the first local JSON workspace file layer around `performancelab.workspace.json`.
- Completed this pass: Extended domain-model types for test actions, test batteries, session-battery assignments, derived metrics, measurement dimensions, quality flags, import batch metadata, device/equipment/operator/notes fields.
- Completed this pass: Added `src/lib/workspace-file.ts` for workspace schema, initial workspace seeding, File System Access API open/save, and JSON import/export fallback.
- Completed this pass: Added `src/lib/workspace-store.tsx` and mounted `WorkspaceProvider` globally.
- Completed this pass: Added `src/components/WorkspaceFileBar.tsx` with create/open/save/save-as/export/import controls.
- Completed this pass: Connected Data Entry manual save and Excel import confirmation to workspace measurements and import batches.
- Completed this pass: Connected Settings display thresholds and notification settings to workspace settings.
- Completed this pass: Added `src/lib/derived-metric-formulas.ts` as the first formula registry skeleton.
- Completed this continuation pass: Added `src/lib/workspace-measurement-store.ts` and migrated `PeriodicTesting`/`/comparison` to derive periodic surface data from the active workspace measurements instead of module-level `mockMeasurementStore`.
- Completed this continuation pass: Settings appearance preferences, body-map coordinates/images, display thresholds, notification rules, system statistics, and data export now read/write the active workspace instead of only local component state, localStorage, hardcoded counts, or alerts.
- Completed this continuation pass: Added `src/lib/workspace-definition-config.ts`, migrated Admin definition library edits/deletes to workspace `metricDefinitions`/`testActionCategories`/`testActions`, and updated Data Entry indicator selection plus import metric resolution to prefer active workspace definitions.
- Verification: `npm run build` passes. Existing Vite chunk-size warning remains.
- Verification: `npm run lint` passes.
- Verification: Playwright workspace import smoke passed for `/comparison`; after importing a temporary JSON workspace, the longitudinal table displayed the JSON-provided `88.0` value and the cross-sectional add-comparison menu listed a workspace-provided athlete.
- Verification: Playwright workspace import smoke passed for `/settings`; after importing a temporary JSON workspace, Settings rendered workspace-derived counts, body-map joint config, notification config, and exported a JSON backup with no console errors/warnings or desktop page overflow.
- Verification: Playwright Admin/Data Entry smoke passed; a custom Admin metric/category/action appeared in Data Entry's hierarchical indicator selector with no console errors/warnings or desktop page overflow.
- Still open before PL-010 can be marked Done: remaining workspace-powered selector/page consumers, Admin athlete/session persistence, import-history consumption, and browser/manual verification that clearing cache then reopening the same JSON restores core data.
- Next recommended architecture work: continue PL-010, then proceed to PL-011/PL-012 for availability matrix and derived metric computation.

## 2026-05-22 Active Task

- Completed: Settings defensive `localStorage` parsing for chart colors.
- Completed: PeriodicTesting hook-order fix for longitudinal and cross-sectional category sections.
- Completed: UploadZone callback dependency fix.
- Completed: Mobile minimum viable layout with bottom navigation and page-level overflow containment.
- Completed: Roadmap note for treating longitudinal/cross-sectional analysis as comparison layers on metric display surfaces.
- Verified: `npm run build` passes.
- Verified: 390px mobile smoke check renders six core routes without page-level horizontal overflow.
- Known remaining lint debt: existing shadcn/ui fast-refresh exports, sidebar purity, statistics prefer-const, Comparison prefer-const, and Correlation any/dependency issues.

## 2026-05-22 Follow-up Task

- Completed: `docs/NEXT_CHAT_PROMPT.md` restored to readable Chinese and included in the next commit.
- Completed: `npm run lint` now passes with no warnings.
- Completed: Added first-stage domain model and unified metric registry.
- Completed: Correlation indicator metadata now comes from the registry.
- Completed: Excel/CSV upload now performs real parsing with `xlsx` loaded dynamically.
- Completed: Data import keeps filename, previews parsed rows, validates unknown athletes/repeat counts, and flags metrics not found in the registry.
- Verified: real CSV upload smoke test reached the staging validation table with 2 parsed rows and no console errors.
- Remaining architecture work: migrate `mockData.ts` and Data Entry fully onto registry ids and the shared measurement store instead of local `m-*` metric ids.
