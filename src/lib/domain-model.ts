export type EntityId = string

export interface Team {
  id: EntityId
  name: string
  sport?: string
  season?: string
}

export interface Athlete {
  id: EntityId
  uuid: string
  name: string
  teamId?: EntityId
  position?: string
  status?: 'active' | 'inactive' | 'injured'
}

export interface TestSession {
  id: EntityId
  teamId?: EntityId
  name: string
  date: string
  batteryIds?: EntityId[]
  phase?: string
  location?: string
  notes?: string
}

export interface TestBattery {
  id: EntityId
  name: string
  metricIds: string[]
  testActionIds?: EntityId[]
  teamId?: EntityId
  description?: string
}

export interface TestAction {
  id: EntityId
  categoryId: EntityId
  name: string
  description?: string
  equipment?: string
  metricIds: string[]
}

export interface SessionBatteryAssignment {
  id: EntityId
  sessionId: EntityId
  batteryId: EntityId
  athleteIds?: EntityId[]
  teamId?: EntityId
  notes?: string
}

export type MetricDirection = 'higher' | 'lower' | 'range' | 'neutral'
export type MetricKind = 'raw' | 'derived'
export type DerivedMetricFormulaId = 'asymmetry' | 'ratio' | 'relative_to_bodyweight' | 'difference' | 'mean'

export interface MetricDimensionDefinition {
  key: string
  label: string
  values?: string[]
}

export interface DerivedMetricDefinition {
  id: EntityId
  metricId: string
  formulaId: DerivedMetricFormulaId
  inputMetricIds: string[]
  parameters?: Record<string, string | number | boolean>
}

export type MeasurementDimensionKey = 'side' | 'joint' | 'movement' | 'speed' | 'position' | string
export type MeasurementDimensions = Partial<Record<MeasurementDimensionKey, string>>
export type MeasurementQualityFlag = 'missing' | 'partial' | 'incompatible' | 'outlier' | 'manual_review'

export interface MetricDefinition {
  id: string
  name: string
  shortName?: string
  kind?: MetricKind
  categoryId: string
  categoryName: string
  unit: string
  direction: MetricDirection
  aliases: string[]
  formulaId?: DerivedMetricFormulaId
  dependsOnMetricIds?: string[]
  dimensions?: MetricDimensionDefinition[]
  optimalRange?: [number, number]
  supportedContexts: Array<'daily' | 'periodic' | 'comparison' | 'correlation' | 'import'>
}

export interface Measurement {
  id: EntityId
  athleteId: EntityId
  sessionId?: EntityId
  testActionId?: EntityId
  batteryId?: EntityId
  importBatchId?: EntityId
  metricId: string
  measuredAt: string
  value: number
  unit?: string
  trialIndex?: number
  source?: 'manual' | 'import' | 'computed'
  dimensions?: MeasurementDimensions
  qualityFlags?: MeasurementQualityFlag[]
  device?: string
  equipment?: string
  operator?: string
  notes?: string
}

export interface Benchmark {
  id: EntityId
  metricId: string
  scope: 'athlete' | 'position' | 'team' | 'population'
  target?: number
  range?: [number, number]
  source?: string
}

export interface DisplayPreset {
  id: EntityId
  name: string
  metricIds: string[]
  chartType: 'card' | 'line' | 'bar' | 'radar' | 'scatter' | 'table'
  comparisonMode?: 'none' | 'longitudinal' | 'cross-sectional'
}

export interface ImportBatch {
  id: EntityId
  filename: string
  importedAt: string
  totalRows: number
  acceptedRows: number
  rejectedRows: number
  measurementIds?: EntityId[]
  operator?: string
}
