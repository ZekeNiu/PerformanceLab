import { mockAthletes, mockTestSessions } from '@/data/mockData'
import type { Athlete, EntityId, Measurement, Team, TestSession } from './domain-model'
import { getMetricDefinition } from './metric-registry'

export type AggregationMethod = 'mean' | 'best' | 'latest' | 'min' | 'max' | 'median'
export type SeriesGroupBy = 'date' | 'session' | 'athlete'

export interface MeasurementStore {
  teams: Team[]
  athletes: Athlete[]
  sessions: TestSession[]
  measurements: Measurement[]
}

export interface MeasurementQuery {
  metricIds?: string[]
  athleteIds?: EntityId[]
  teamIds?: EntityId[]
  positions?: string[]
  sessionIds?: EntityId[]
  from?: string
  to?: string
  sources?: Array<NonNullable<Measurement['source']>>
}

export interface MeasurementSummary {
  metricId: string
  aggregation: AggregationMethod
  value: number | null
  n: number
  mean: number | null
  sd: number | null
  min: number | null
  max: number | null
  best: number | null
  latest: number | null
  latestAt: string | null
}

export interface MeasurementSeriesPoint {
  key: string
  label: string
  metricId: string
  value: number | null
  n: number
  from: string
  to: string
}

const teamNameToId = new Map([
  ['一队', 'team-1'],
  ['二队', 'team-2'],
])

export const mockMeasurementTeams: Team[] = [
  { id: 'team-1', name: '一队', sport: '足球', season: '2024 夏训' },
  { id: 'team-2', name: '二队', sport: '足球', season: '2024 夏训' },
]

export const mockMeasurementAthletes: Athlete[] = mockAthletes.map((athlete) => ({
  id: athlete.id,
  uuid: athlete.uuid,
  name: athlete.name,
  teamId: teamNameToId.get(athlete.team),
  position: athlete.position,
  status: 'active',
}))

export const mockMeasurementSessions: TestSession[] = mockTestSessions.map((session) => ({
  id: session.id,
  teamId: 'team-1',
  name: session.name,
  date: session.date,
  location: session.location,
  notes: session.notes,
}))

interface MetricSeed {
  base: number
  athleteStep: number
  sessionStep: number
  trialStep: number
  wave: number
  decimals: number
}

const periodicMetricSeeds: Record<string, MetricSeed> = {
  cmj_height: { base: 38.4, athleteStep: 0.92, sessionStep: 1.18, trialStep: 0.22, wave: 0.42, decimals: 1 },
  cmj_power: { base: 2820, athleteStep: 86, sessionStep: 95, trialStep: 18, wave: 34, decimals: 0 },
  cmj_force: { base: 1760, athleteStep: 42, sessionStep: 54, trialStep: 12, wave: 24, decimals: 0 },
  flight_time: { base: 0.51, athleteStep: 0.012, sessionStep: 0.014, trialStep: 0.004, wave: 0.006, decimals: 3 },
  eccentric_utilization_ratio: { base: 86, athleteStep: 1.1, sessionStep: 1.4, trialStep: 0.3, wave: 0.8, decimals: 1 },
  squat_1rm: { base: 118, athleteStep: 4.8, sessionStep: 5.5, trialStep: 1.2, wave: 2.1, decimals: 1 },
  bench_1rm: { base: 72, athleteStep: 2.9, sessionStep: 3.2, trialStep: 0.8, wave: 1.4, decimals: 1 },
  sprint_30m: { base: 4.38, athleteStep: -0.026, sessionStep: -0.045, trialStep: -0.006, wave: 0.018, decimals: 2 },
  sprint_10m: { base: 1.92, athleteStep: -0.012, sessionStep: -0.018, trialStep: -0.003, wave: 0.008, decimals: 2 },
  standing_jump: { base: 246, athleteStep: 4.8, sessionStep: 7.2, trialStep: 1.5, wave: 3.4, decimals: 0 },
  agility_t: { base: 9.7, athleteStep: -0.035, sessionStep: -0.06, trialStep: -0.01, wave: 0.026, decimals: 2 },
  yoyo_ir1: { base: 1520, athleteStep: 52, sessionStep: 96, trialStep: 20, wave: 42, decimals: 0 },
  lactate_threshold: { base: 13.4, athleteStep: 0.18, sessionStep: 0.32, trialStep: 0.04, wave: 0.12, decimals: 1 },
  body_fat_pct: { base: 15.8, athleteStep: -0.42, sessionStep: -0.38, trialStep: 0.08, wave: 0.35, decimals: 1 },
  muscle_mass: { base: 53.5, athleteStep: 1.35, sessionStep: 0.62, trialStep: 0.12, wave: 0.48, decimals: 1 },
  weight: { base: 66.2, athleteStep: 2.15, sessionStep: 0.18, trialStep: 0.05, wave: 0.42, decimals: 1 },
  height: { base: 168, athleteStep: 1.8, sessionStep: 0, trialStep: 0, wave: 0.4, decimals: 1 },
  bmi: { base: 21.6, athleteStep: 0.18, sessionStep: 0.04, trialStep: 0.01, wave: 0.12, decimals: 1 },
}

const dailyMetricSeeds: Record<string, MetricSeed> = {
  hrv_rmssd: { base: 58, athleteStep: 2.1, sessionStep: 0.22, trialStep: 0, wave: 5.4, decimals: 1 },
  hr_resting: { base: 56, athleteStep: -0.6, sessionStep: -0.08, trialStep: 0, wave: 2.8, decimals: 0 },
  spo2: { base: 96.4, athleteStep: 0.08, sessionStep: 0.02, trialStep: 0, wave: 0.5, decimals: 1 },
  sleep_score: { base: 74, athleteStep: 1.6, sessionStep: 0.35, trialStep: 0, wave: 6.8, decimals: 0 },
  rpe: { base: 4.8, athleteStep: 0.08, sessionStep: 0.05, trialStep: 0, wave: 1.1, decimals: 1 },
}

const performanceMetricSeeds: Record<string, MetricSeed> = {
  match_score: { base: 72, athleteStep: 1.8, sessionStep: 2.5, trialStep: 0, wave: 4.2, decimals: 0 },
  training_score: { base: 76, athleteStep: 1.4, sessionStep: 1.6, trialStep: 0, wave: 3.7, decimals: 0 },
  tactical_score: { base: 70, athleteStep: 1.2, sessionStep: 1.4, trialStep: 0, wave: 3.4, decimals: 0 },
  technical_score: { base: 74, athleteStep: 1.5, sessionStep: 1.2, trialStep: 0, wave: 3.1, decimals: 0 },
}

function round(value: number, decimals: number) {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

function seededValue(seed: MetricSeed, athleteIndex: number, sessionIndex: number, trialIndex: number) {
  const cycle = ((athleteIndex + 1) * (sessionIndex + 2) * (trialIndex + 3)) % 7
  const offset = (cycle - 3) * seed.wave
  return round(
    seed.base +
      athleteIndex * seed.athleteStep +
      sessionIndex * seed.sessionStep +
      trialIndex * seed.trialStep +
      offset,
    seed.decimals,
  )
}

function addDays(date: string, days: number) {
  const value = new Date(`${date}T00:00:00`)
  value.setDate(value.getDate() + days)
  return value.toISOString().slice(0, 10)
}

function buildPeriodicMeasurements(): Measurement[] {
  return mockMeasurementAthletes.flatMap((athlete, athleteIndex) =>
    mockMeasurementSessions.flatMap((session, sessionIndex) =>
      Object.entries(periodicMetricSeeds).flatMap(([metricId, seed]) =>
        Array.from({ length: 3 }, (_, trialIndex) => ({
          id: `meas-${metricId}-${athlete.id}-${session.id}-t${trialIndex + 1}`,
          athleteId: athlete.id,
          sessionId: session.id,
          metricId,
          measuredAt: session.date,
          value: seededValue(seed, athleteIndex, sessionIndex, trialIndex),
          unit: getMetricDefinition(metricId)?.unit,
          trialIndex: trialIndex + 1,
          source: 'manual' as const,
        })),
      ),
    ),
  )
}

function buildDailyMeasurements(): Measurement[] {
  return mockMeasurementAthletes.flatMap((athlete, athleteIndex) =>
    Array.from({ length: 30 }, (_, dayIndex) => {
      const measuredAt = addDays('2024-07-01', dayIndex)
      return Object.entries(dailyMetricSeeds).map(([metricId, seed]) => ({
        id: `meas-${metricId}-${athlete.id}-${measuredAt}`,
        athleteId: athlete.id,
        metricId,
        measuredAt,
        value: seededValue(seed, athleteIndex, dayIndex, 0),
        unit: getMetricDefinition(metricId)?.unit,
        source: 'computed' as const,
      }))
    }).flat(),
  )
}

function buildPerformanceMeasurements(): Measurement[] {
  return mockMeasurementAthletes.flatMap((athlete, athleteIndex) =>
    mockMeasurementSessions.flatMap((session, sessionIndex) =>
      Object.entries(performanceMetricSeeds).map(([metricId, seed]) => ({
        id: `meas-${metricId}-${athlete.id}-${session.id}`,
        athleteId: athlete.id,
        sessionId: session.id,
        metricId,
        measuredAt: session.date,
        value: seededValue(seed, athleteIndex, sessionIndex, 0),
        unit: getMetricDefinition(metricId)?.unit,
        source: 'computed' as const,
      })),
    ),
  )
}

export const mockMeasurements: Measurement[] = [
  ...buildPeriodicMeasurements(),
  ...buildDailyMeasurements(),
  ...buildPerformanceMeasurements(),
]

export const mockMeasurementStore: MeasurementStore = {
  teams: mockMeasurementTeams,
  athletes: mockMeasurementAthletes,
  sessions: mockMeasurementSessions,
  measurements: mockMeasurements,
}

function dateInRange(date: string, from?: string, to?: string) {
  if (from && date < from) return false
  if (to && date > to) return false
  return true
}

export function selectMeasurements(query: MeasurementQuery = {}, store = mockMeasurementStore): Measurement[] {
  const athleteById = new Map(store.athletes.map((athlete) => [athlete.id, athlete]))

  return store.measurements.filter((measurement) => {
    const athlete = athleteById.get(measurement.athleteId)
    if (query.metricIds?.length && !query.metricIds.includes(measurement.metricId)) return false
    if (query.athleteIds?.length && !query.athleteIds.includes(measurement.athleteId)) return false
    if (query.teamIds?.length && (!athlete?.teamId || !query.teamIds.includes(athlete.teamId))) return false
    if (query.positions?.length && (!athlete?.position || !query.positions.includes(athlete.position))) return false
    if (query.sessionIds?.length && (!measurement.sessionId || !query.sessionIds.includes(measurement.sessionId))) {
      return false
    }
    if (query.sources?.length && (!measurement.source || !query.sources.includes(measurement.source))) return false
    return dateInRange(measurement.measuredAt, query.from, query.to)
  })
}

function mean(values: number[]) {
  return values.reduce((total, value) => total + value, 0) / values.length
}

function median(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  if (sorted.length % 2) return sorted[mid]
  return (sorted[mid - 1] + sorted[mid]) / 2
}

function standardDeviation(values: number[]) {
  if (values.length < 2) return 0
  const average = mean(values)
  const variance = values.reduce((total, value) => total + (value - average) ** 2, 0) / (values.length - 1)
  return Math.sqrt(variance)
}

function bestValue(metricId: string, values: number[]) {
  const metric = getMetricDefinition(metricId)
  if (metric?.direction === 'lower') return Math.min(...values)
  if (metric?.direction === 'range' && metric.optimalRange) {
    const midpoint = (metric.optimalRange[0] + metric.optimalRange[1]) / 2
    return values.reduce((best, value) => (Math.abs(value - midpoint) < Math.abs(best - midpoint) ? value : best), values[0])
  }
  return Math.max(...values)
}

function aggregateValue(metricId: string, measurements: Measurement[], aggregation: AggregationMethod) {
  if (!measurements.length) return null
  const values = measurements.map((measurement) => measurement.value)
  if (aggregation === 'mean') return mean(values)
  if (aggregation === 'best') return bestValue(metricId, values)
  if (aggregation === 'latest') return [...measurements].sort((a, b) => b.measuredAt.localeCompare(a.measuredAt))[0].value
  if (aggregation === 'min') return Math.min(...values)
  if (aggregation === 'max') return Math.max(...values)
  return median(values)
}

export function summarizeMeasurements(
  metricId: string,
  measurements: Measurement[],
  aggregation: AggregationMethod = 'mean',
): MeasurementSummary {
  const metricMeasurements = measurements
    .filter((measurement) => measurement.metricId === metricId)
    .sort((a, b) => a.measuredAt.localeCompare(b.measuredAt))
  const values = metricMeasurements.map((measurement) => measurement.value)
  const latestMeasurement = metricMeasurements.at(-1)

  return {
    metricId,
    aggregation,
    value: aggregateValue(metricId, metricMeasurements, aggregation),
    n: values.length,
    mean: values.length ? mean(values) : null,
    sd: values.length ? standardDeviation(values) : null,
    min: values.length ? Math.min(...values) : null,
    max: values.length ? Math.max(...values) : null,
    best: values.length ? bestValue(metricId, values) : null,
    latest: latestMeasurement?.value ?? null,
    latestAt: latestMeasurement?.measuredAt ?? null,
  }
}

export function selectMeasurementSummary(
  metricId: string,
  query: Omit<MeasurementQuery, 'metricIds'> = {},
  aggregation: AggregationMethod = 'mean',
  store = mockMeasurementStore,
): MeasurementSummary {
  const measurements = selectMeasurements({ ...query, metricIds: [metricId] }, store)
  return summarizeMeasurements(metricId, measurements, aggregation)
}

function seriesLabel(groupBy: SeriesGroupBy, key: string, store: MeasurementStore) {
  const athleteById = new Map(store.athletes.map((athlete) => [athlete.id, athlete]))
  const sessionById = new Map(store.sessions.map((session) => [session.id, session]))

  if (groupBy === 'athlete') return athleteById.get(key)?.name ?? key
  if (groupBy === 'session') return sessionById.get(key)?.name ?? key
  return key
}

function groupKey(measurement: Measurement, groupBy: SeriesGroupBy) {
  if (groupBy === 'athlete') return measurement.athleteId
  if (groupBy === 'session') return measurement.sessionId ?? 'no-session'
  return measurement.measuredAt
}

export function selectMeasurementSeries(
  metricId: string,
  query: Omit<MeasurementQuery, 'metricIds'> = {},
  options: { aggregation?: AggregationMethod; groupBy?: SeriesGroupBy } = {},
  store = mockMeasurementStore,
): MeasurementSeriesPoint[] {
  const aggregation = options.aggregation ?? 'mean'
  const groupBy = options.groupBy ?? 'date'
  const measurements = selectMeasurements({ ...query, metricIds: [metricId] }, store)
  const groups = new Map<string, Measurement[]>()

  measurements.forEach((measurement) => {
    const key = groupKey(measurement, groupBy)
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)?.push(measurement)
  })

  return Array.from(groups.entries())
    .map(([key, group]) => {
      const dates = group.map((measurement) => measurement.measuredAt).sort()
      return {
        key,
        label: seriesLabel(groupBy, key, store),
        metricId,
        value: aggregateValue(metricId, group, aggregation),
        n: group.length,
        from: dates[0],
        to: dates.at(-1) ?? dates[0],
      }
    })
    .sort((a, b) => a.from.localeCompare(b.from) || a.label.localeCompare(b.label))
}
