import type { EntityId, Measurement } from './domain-model'
import type { AggregationMethod } from './measurement-store'

export const MAX_COMPARISON_DATA_GROUPS = 3
export const MAX_TOTAL_DATA_GROUPS = 1 + MAX_COMPARISON_DATA_GROUPS

export type UpToThree<T> = readonly [] | readonly [T] | readonly [T, T] | readonly [T, T, T]

export type MetricSurfaceVisualization =
  | 'summary-card'
  | 'line-chart'
  | 'bar-chart'
  | 'radar-chart'
  | 'scatter-chart'
  | 'table'

export type MetricSurfaceMode = 'display' | 'longitudinal' | 'cross-sectional'

export type MetricSurfaceContext = 'dashboard' | 'comparison' | 'report'

export type TimeSelection =
  | { kind: 'all' }
  | { kind: 'single-date'; date: string }
  | { kind: 'date-range'; from: string; to: string }
  | { kind: 'session'; sessionIds: EntityId[] }
  | { kind: 'named-period'; id: EntityId; label: string; from?: string; to?: string }
  | { kind: 'latest'; count: number }

export type MeasurementSourceSelection = NonNullable<Measurement['source']>

export type SubjectSelector =
  | { kind: 'athlete'; athleteIds: EntityId[] }
  | { kind: 'team'; teamIds: EntityId[] }
  | { kind: 'position'; positions: string[]; teamIds?: EntityId[] }
  | { kind: 'custom-group'; id: EntityId; label: string; athleteIds: EntityId[] }
  | { kind: 'reference-group'; selector: ReferenceGroupSelector }

export type ReferenceGroupScope = 'global' | 'team' | 'custom'

export type ReferenceGroupStatistic = 'mean' | 'best' | 'median' | 'percentile'

export interface ReferenceGroupSelector {
  scope: ReferenceGroupScope
  label: string
  teamIds?: EntityId[]
  athleteIds?: EntityId[]
  gender?: 'female' | 'male' | 'mixed' | 'unspecified'
  ageBand?: string
  specialty?: string
  positions?: string[]
  season?: string
  status?: 'active' | 'inactive' | 'injured'
  statistic: ReferenceGroupStatistic
  percentile?: number
}

export interface MetricDataGroupConfig {
  id: EntityId
  label: string
  subject: SubjectSelector
  time: TimeSelection
  aggregation: AggregationMethod
  sources?: MeasurementSourceSelection[]
}

export type ComparisonDataGroupKind = 'longitudinal' | 'cross-sectional'

export interface ComparisonDataGroupConfig extends MetricDataGroupConfig {
  kind: ComparisonDataGroupKind
}

export type StatisticalAnnotationType =
  | 'target'
  | 'target-range'
  | 'benchmark'
  | 'threshold'
  | 'swc'
  | 'mdc'
  | 'confidence-interval'
  | 'normal-range'

export interface StatisticalAnnotationConfig {
  enabled: boolean
  types: StatisticalAnnotationType[]
  benchmarkIds?: EntityId[]
  confidenceLevel?: number
  showSampleSize?: boolean
  showMethod?: boolean
}

export interface MetricSurfaceDisplayOptions {
  showUnit?: boolean
  showDirection?: boolean
  showLegend?: boolean
  showDataLabels?: boolean
  valuePrecision?: number
}

export interface MetricSurfaceConfig {
  id: EntityId
  name: string
  metricId: string
  mode: MetricSurfaceMode
  context: MetricSurfaceContext
  visualization: MetricSurfaceVisualization
  primaryDataGroup: MetricDataGroupConfig
  comparisonDataGroups?: UpToThree<ComparisonDataGroupConfig>
  annotations?: StatisticalAnnotationConfig
  display?: MetricSurfaceDisplayOptions
}

export function hasTooManyComparisonDataGroups(config: { comparisonDataGroups?: readonly ComparisonDataGroupConfig[] }) {
  return (config.comparisonDataGroups?.length ?? 0) > MAX_COMPARISON_DATA_GROUPS
}
