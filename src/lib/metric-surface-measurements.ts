import type { EntityId } from './domain-model'
import type { MeasurementQuery, MeasurementStore } from './measurement-store'
import {
  mockMeasurementStore,
  selectMeasurementSeries,
  selectMeasurementSummary,
  type MeasurementSeriesPoint,
  type MeasurementSummary,
} from './measurement-store'
import type { MetricDataGroupConfig, TimeSelection } from './metric-surface-config'

export function timeSelectionToMeasurementQuery(time: TimeSelection): Pick<MeasurementQuery, 'from' | 'to' | 'sessionIds'> {
  if (time.kind === 'single-date') return { from: time.date, to: time.date }
  if (time.kind === 'date-range') return { from: time.from, to: time.to }
  if (time.kind === 'session') return { sessionIds: time.sessionIds }
  if (time.kind === 'named-period') return { from: time.from, to: time.to }
  return {}
}

function referenceGroupToAthleteIds(group: MetricDataGroupConfig, store: MeasurementStore): EntityId[] | undefined {
  if (group.subject.kind !== 'reference-group') return undefined

  const selector = group.subject.selector
  let athletes = store.athletes

  if (selector.athleteIds?.length) {
    const allowed = new Set(selector.athleteIds)
    athletes = athletes.filter((athlete) => allowed.has(athlete.id))
  }

  if (selector.scope === 'team' && selector.teamIds?.length) {
    const allowedTeams = new Set(selector.teamIds)
    athletes = athletes.filter((athlete) => athlete.teamId && allowedTeams.has(athlete.teamId))
  }

  if (selector.positions?.length) {
    const allowedPositions = new Set(selector.positions)
    athletes = athletes.filter((athlete) => athlete.position && allowedPositions.has(athlete.position))
  }

  if (selector.status) {
    athletes = athletes.filter((athlete) => athlete.status === selector.status)
  }

  return athletes.map((athlete) => athlete.id)
}

export function metricDataGroupToMeasurementQuery(
  group: MetricDataGroupConfig,
  store: MeasurementStore = mockMeasurementStore,
): Omit<MeasurementQuery, 'metricIds'> {
  const query: Omit<MeasurementQuery, 'metricIds'> = {
    ...timeSelectionToMeasurementQuery(group.time),
    sources: group.sources,
  }

  if (group.subject.kind === 'athlete') query.athleteIds = group.subject.athleteIds
  if (group.subject.kind === 'team') query.teamIds = group.subject.teamIds
  if (group.subject.kind === 'position') {
    query.positions = group.subject.positions
    query.teamIds = group.subject.teamIds
  }
  if (group.subject.kind === 'custom-group') query.athleteIds = group.subject.athleteIds

  const referenceAthleteIds = referenceGroupToAthleteIds(group, store)
  if (referenceAthleteIds) query.athleteIds = referenceAthleteIds

  return query
}

export function selectMetricDataGroupSummary(
  metricId: string,
  group: MetricDataGroupConfig,
  store: MeasurementStore = mockMeasurementStore,
): MeasurementSummary {
  return selectMeasurementSummary(metricId, metricDataGroupToMeasurementQuery(group, store), group.aggregation, store)
}

export function selectMetricDataGroupSeries(
  metricId: string,
  group: MetricDataGroupConfig,
  options: Parameters<typeof selectMeasurementSeries>[2] = {},
  store: MeasurementStore = mockMeasurementStore,
): MeasurementSeriesPoint[] {
  return selectMeasurementSeries(
    metricId,
    metricDataGroupToMeasurementQuery(group, store),
    { aggregation: group.aggregation, ...options },
    store,
  )
}
