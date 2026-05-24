# PerformanceLab Roadmap

This roadmap prioritizes architecture that supports a large customizable sports analytics dashboard.

## Phase 1: Stabilize The Existing App

- Keep GitHub Pages deployment reliable.
- Fix obvious console errors, broken assets, and build blockers.
- Replace placeholder pages with basic working layouts.
- Add lightweight smoke checks for navigation and asset loading.
- Review dependency audit warnings without blindly upgrading major packages.

## Phase 2: Build A Real Domain Model

Define the core entities before adding many new charts:

- Team
- Athlete
- Season / phase
- Test session
- Test battery
- Metric definition
- Measurement
- Target / benchmark
- Display preset

The central question: "What metric can this card display, and under what data constraints?"

## Phase 3: Configurable Cards And Charts

Refactor from fixed cards to reusable configurable surfaces:

- Metric picker
- Compatible visualization picker
- Aggregation picker
- Time range picker
- Athlete/team/group picker
- Threshold/target display options

Recommended direction:

- Keep visual components dumb.
- Put metric metadata in central definitions.
- Put chart/card config in serializable objects.
- Use adapters to transform raw measurements into display series.

## Phase 4: Core Analysis Features

Implement the four core modules as first-class workflows:

- Basic data display: status, trends, readiness, load, test summaries
- Longitudinal comparison: athlete or team over time
- Cross-sectional comparison: athlete vs athlete, group vs group, position vs position
- Correlation analysis: metric relationships, scatter plots, regression, correlation matrix

## Phase 5: Data Entry And Import

- Manual entry forms
- Excel import parsing
- Validation and staging
- Import history
- Metric/test mapping
- Error reporting for missing or invalid values

## Phase 6: Persistence And User Configuration

Options when the project is ready:

- Local-only persistence first: browser storage or local JSON import/export
- Then backend: Supabase/Postgres or another database
- Eventually auth and roles if multiple users/teams are needed

## Phase 7: Performance And Maintainability

- Split large pages/components.
- Lazy-load heavy routes and chart modules.
- Add unit tests for statistics and data transforms.
- Add browser smoke tests for critical flows.
- Document key design decisions in `docs/`.

## Current Recommended Next Step

Start with a shared mock `Measurement[]` store and selector layer, then add the card/chart configuration layer. This unlocks the user's core requirement: every chart/card should eventually be able to display a compatible metric selected by the analyst and optionally compare it with other data groups.

## Analysis Workflow Direction

For longitudinal and cross-sectional comparison, the preferred direction is to treat them as optional comparison data groups on the same metric display surface, not as fully separate data islands. A card or chart should have one primary data group and allow up to three additional comparison data groups:

- Longitudinal comparison data group: compare the same athlete/team/group and metric across baseline and target time conditions.
- Cross-sectional comparison data group: compare the same metric and time condition across athletes, positions, teams, or reference groups.
- Statistical annotations/reference lines: benchmark, target range, SWC, MDC, confidence interval, and threshold lines. These do not count as comparison data groups.
- Correlation analysis: stay as a dedicated exploratory workflow, but reuse the same metric definitions and measurement source.

This keeps the analyst's mental model stable: select a metric, then add context. It also supports future card configurability because display mode and comparison mode become serializable chart configuration instead of separate page-specific implementations.

Implementation sequence:

- Use `MetricDefinition` as the single source for metric name, unit, category, aliases, direction, and supported contexts.
- Store raw imported data as `Measurement` rows linked to athlete, session, and metric ids.
- Keep longitudinal and cross-sectional comparison as chart/card comparison data group config, not as separate metric definitions.
- Let correlation analysis consume the same metric registry and measurement store, but keep a dedicated page because variable selection, model diagnostics, collinearity checks, and residual plots are a different exploratory workflow from routine dashboard review.
- Use `docs/DEEP_REVIEW_2026-05-24.md` as the current execution brief for detailed task status, completion criteria, and new-decision logging.
