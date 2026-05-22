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
  location?: string
  notes?: string
}

export interface TestBattery {
  id: EntityId
  name: string
  metricIds: string[]
  teamId?: EntityId
}

export type MetricDirection = 'higher' | 'lower' | 'range' | 'neutral'

export interface MetricDefinition {
  id: string
  name: string
  shortName?: string
  categoryId: string
  categoryName: string
  unit: string
  direction: MetricDirection
  aliases: string[]
  optimalRange?: [number, number]
  supportedContexts: Array<'daily' | 'periodic' | 'comparison' | 'correlation' | 'import'>
}

export interface Measurement {
  id: EntityId
  athleteId: EntityId
  sessionId?: EntityId
  metricId: string
  measuredAt: string
  value: number
  unit?: string
  trialIndex?: number
  source?: 'manual' | 'import' | 'computed'
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
}
