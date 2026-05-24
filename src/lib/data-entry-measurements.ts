import type { Athlete as EntryAthlete, TestSession as EntryTestSession } from '@/data/mockData'
import { mockAthletes, mockTestSessions } from '@/data/mockData'
import type { ParsedImportRow } from './import-parser'
import type { Measurement, MetricDefinition } from './domain-model'
import { getMetricDefinition, resolveMetricDefinition } from './metric-registry'
import { resolveDataEntryMetric } from './data-entry-config'

export interface ManualMetricData {
  metricId: string
  repeats: (number | null)[]
}

export interface ManualEntryMeasurementInput {
  session: EntryTestSession
  athletes: EntryAthlete[]
  metrics: MetricDefinition[]
  metricData: ManualMetricData[]
}

function isValidNumber(value: number | null): value is number {
  return value !== null && Number.isFinite(value)
}

function compactId(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function buildMeasurementId(parts: string[]) {
  return parts.map(compactId).filter(Boolean).join('-')
}

export function buildManualEntryMeasurements({
  session,
  athletes,
  metrics,
  metricData,
}: ManualEntryMeasurementInput): Measurement[] {
  const metricDataById = new Map(metricData.map((data) => [data.metricId, data]))

  return athletes.flatMap((athlete) =>
    metrics.flatMap((metric) => {
      const repeats = metricDataById.get(metric.id)?.repeats ?? []

      return repeats.flatMap((value, index) => {
        if (!isValidNumber(value)) return []

        return {
          id: buildMeasurementId(['manual', session.id, athlete.id, metric.id, `t${index + 1}`]),
          athleteId: athlete.id,
          sessionId: session.id,
          metricId: metric.id,
          measuredAt: session.date,
          value,
          unit: metric.unit,
          trialIndex: index + 1,
          source: 'manual' as const,
        }
      })
    }),
  )
}

function findImportAthlete(row: ParsedImportRow) {
  return mockAthletes.find((athlete) => athlete.uuid === row.athleteUUID || athlete.name === row.athleteName)
}

function findImportMetric(row: ParsedImportRow) {
  return row.metricId ? getMetricDefinition(row.metricId) : resolveDataEntryMetric(row.action, row.indicator) ?? resolveMetricDefinition(row.indicator)
}

function findImportSession(row: ParsedImportRow) {
  return mockTestSessions.find((session) => session.date === row.date)
}

export function buildImportMeasurements(rows: ParsedImportRow[]): Measurement[] {
  return rows.flatMap((row) => {
    const athlete = findImportAthlete(row)
    const metric = findImportMetric(row)
    const session = findImportSession(row)

    if (!athlete || !metric) return []

    return row.repeats.flatMap((value, index) => {
      if (!isValidNumber(value)) return []

      return {
        id: buildMeasurementId(['import', row.id, athlete.id, metric.id, `t${index + 1}`]),
        athleteId: athlete.id,
        sessionId: session?.id,
        metricId: metric.id,
        measuredAt: row.date,
        value,
        unit: row.unit || metric.unit,
        trialIndex: index + 1,
        source: 'import' as const,
      }
    })
  })
}
