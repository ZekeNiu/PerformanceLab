# Metric Surface Configuration

`src/lib/metric-surface-config.ts` defines the first serializable model for configurable metric display surfaces.

## Product Boundary

Each `MetricSurfaceConfig` has one canonical `metricId` from `src/lib/metric-registry.ts`.

A surface contains:

- `primaryDataGroup`: the main athlete, team, position, custom group, or reference group selection.
- `comparisonDataGroups`: zero to three extra comparison data groups.
- `annotations`: targets, thresholds, benchmarks, SWC, MDC, confidence intervals, and normal ranges.

The maximum visible data groups are therefore 4: one primary group plus at most 3 comparison groups. Statistical annotations do not count toward the comparison data group limit.

## Comparison Semantics

Longitudinal comparison groups answer whether the same subject changed across time conditions.

Cross-sectional comparison groups answer where the primary subject sits relative to athletes, teams, positions, or reference groups under the same metric and time condition.

`ReferenceGroupSelector` is intentionally modeled before the UI supports it, because PL-003 needs a stable shape for later same-gender, age-band, specialty, position, team, and percentile reference groups.

## Current Scope

PL-002 only defines the configuration boundary. It does not migrate Dashboard or `/comparison` rendering yet. That work belongs to PL-003 and PL-004.

