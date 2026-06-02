import type { EntityId, Measurement, MetricDefinition } from './domain-model'
import type { PerformanceLabWorkspace } from './workspace-file'

export type MetricAvailabilityStatus = 'available' | 'missing' | 'partial' | 'incompatible'

export interface MetricAvailabilitySubject {
  id: string
  label: string
  athleteIds: EntityId[]
}

export interface MetricAvailabilityRow {
  metricId: string
  metricName: string
  categoryName: string
  unit: string
  status: MetricAvailabilityStatus
  subjectCount: number
  assignedAthleteCount: number
  measuredAthleteCount: number
  totalAthleteCount: number
  incompatibleSubjects: string[]
  missingSubjects: string[]
  partialSubjects: string[]
  reason: string
}

export interface BuildMetricAvailabilityMatrixOptions {
  workspace: PerformanceLabWorkspace
  metrics: MetricDefinition[]
  subjects: MetricAvailabilitySubject[]
  sessionIds?: EntityId[]
  from?: string
  to?: string
}

interface SubjectMetricAvailability {
  status: MetricAvailabilityStatus
  assignedAthleteCount: number
  measuredAthleteCount: number
  totalAthleteCount: number
}

function unique<T>(values: T[]) {
  return Array.from(new Set(values))
}

function metricIdsForBattery(workspace: PerformanceLabWorkspace, batteryId: EntityId): string[] {
  const battery = workspace.testBatteries.find((candidate) => candidate.id === batteryId)
  if (!battery) return []

  const actionMetricIds = (battery.testActionIds ?? [])
    .flatMap((actionId) => workspace.testActions.find((action) => action.id === actionId)?.metricIds ?? [])

  return unique([...(battery.metricIds ?? []), ...actionMetricIds])
}

function assignmentAppliesToAthlete(
  workspace: PerformanceLabWorkspace,
  assignmentId: EntityId,
  athleteId: EntityId,
) {
  const assignment = workspace.sessionBatteryAssignments.find((candidate) => candidate.id === assignmentId)
  if (!assignment) return false
  if (assignment.athleteIds?.length) return assignment.athleteIds.includes(athleteId)

  const athlete = workspace.athletes.find((candidate) => candidate.id === athleteId)
  if (assignment.teamId && athlete?.teamId && assignment.teamId !== athlete.teamId) return false
  return true
}

export function getSessionAssignedBatteryIds(
  workspace: PerformanceLabWorkspace,
  sessionId: EntityId,
  athleteId?: EntityId,
): EntityId[] {
  const session = workspace.testSessions.find((candidate) => candidate.id === sessionId)
  const fromSession = session?.batteryIds ?? []
  const fromAssignments = workspace.sessionBatteryAssignments
    .filter((assignment) => assignment.sessionId === sessionId)
    .filter((assignment) => !athleteId || assignmentAppliesToAthlete(workspace, assignment.id, athleteId))
    .map((assignment) => assignment.batteryId)

  return unique([...fromSession, ...fromAssignments])
}

export function getSessionAvailableMetricIds(
  workspace: PerformanceLabWorkspace,
  sessionId: EntityId,
  athleteId?: EntityId,
): string[] {
  return unique(
    getSessionAssignedBatteryIds(workspace, sessionId, athleteId)
      .flatMap((batteryId) => metricIdsForBattery(workspace, batteryId)),
  )
}

function dateInRange(date: string, from?: string, to?: string) {
  if (from && date < from) return false
  if (to && date > to) return false
  return true
}

function measurementMatches(
  measurement: Measurement,
  metricId: string,
  athleteId: EntityId,
  sessionIds?: EntityId[],
  from?: string,
  to?: string,
) {
  if (measurement.metricId !== metricId) return false
  if (measurement.athleteId !== athleteId) return false
  if (sessionIds?.length && (!measurement.sessionId || !sessionIds.includes(measurement.sessionId))) return false
  return dateInRange(measurement.measuredAt, from, to)
}

function metricAssignedToAthlete(
  workspace: PerformanceLabWorkspace,
  metricId: string,
  athleteId: EntityId,
  sessionIds?: EntityId[],
) {
  if (!sessionIds?.length) {
    return workspace.testActions.some((action) => action.metricIds.includes(metricId))
  }

  return sessionIds.some((sessionId) =>
    getSessionAvailableMetricIds(workspace, sessionId, athleteId).includes(metricId),
  )
}

function evaluateSubjectMetric(
  workspace: PerformanceLabWorkspace,
  subject: MetricAvailabilitySubject,
  metricId: string,
  sessionIds?: EntityId[],
  from?: string,
  to?: string,
): SubjectMetricAvailability {
  const athleteIds = unique(subject.athleteIds)
  if (!athleteIds.length) {
    return {
      status: 'incompatible',
      assignedAthleteCount: 0,
      measuredAthleteCount: 0,
      totalAthleteCount: 0,
    }
  }

  const assignedAthleteIds = athleteIds.filter((athleteId) =>
    metricAssignedToAthlete(workspace, metricId, athleteId, sessionIds),
  )
  const measuredAthleteIds = assignedAthleteIds.filter((athleteId) =>
    workspace.measurements.some((measurement) =>
      measurementMatches(measurement, metricId, athleteId, sessionIds, from, to),
    ),
  )

  if (!assignedAthleteIds.length) {
    return {
      status: 'incompatible',
      assignedAthleteCount: 0,
      measuredAthleteCount: 0,
      totalAthleteCount: athleteIds.length,
    }
  }

  if (!measuredAthleteIds.length) {
    return {
      status: 'missing',
      assignedAthleteCount: assignedAthleteIds.length,
      measuredAthleteCount: 0,
      totalAthleteCount: athleteIds.length,
    }
  }

  if (assignedAthleteIds.length < athleteIds.length || measuredAthleteIds.length < assignedAthleteIds.length) {
    return {
      status: 'partial',
      assignedAthleteCount: assignedAthleteIds.length,
      measuredAthleteCount: measuredAthleteIds.length,
      totalAthleteCount: athleteIds.length,
    }
  }

  return {
    status: 'available',
    assignedAthleteCount: assignedAthleteIds.length,
    measuredAthleteCount: measuredAthleteIds.length,
    totalAthleteCount: athleteIds.length,
  }
}

function rowStatus(subjectResults: SubjectMetricAvailability[]): MetricAvailabilityStatus {
  if (subjectResults.some((result) => result.status === 'incompatible')) return 'incompatible'
  if (subjectResults.some((result) => result.status === 'missing')) return 'missing'
  if (subjectResults.some((result) => result.status === 'partial')) return 'partial'
  return 'available'
}

function buildReason(
  status: MetricAvailabilityStatus,
  incompatibleSubjects: string[],
  missingSubjects: string[],
  partialSubjects: string[],
) {
  if (status === 'available') return 'Commonly available across selected test content and subjects.'
  if (status === 'incompatible') return `Not assigned in the selected test content: ${incompatibleSubjects.join(', ')}.`
  if (status === 'missing') return `Assigned but no measurement rows found: ${missingSubjects.join(', ')}.`
  return `Only partially available for selected subjects: ${partialSubjects.join(', ')}.`
}

export function buildMetricAvailabilityMatrix({
  workspace,
  metrics,
  subjects,
  sessionIds,
  from,
  to,
}: BuildMetricAvailabilityMatrixOptions): MetricAvailabilityRow[] {
  return metrics.map((metric) => {
    const subjectResults = subjects.map((subject) => ({
      subject,
      result: evaluateSubjectMetric(workspace, subject, metric.id, sessionIds, from, to),
    }))
    const status = rowStatus(subjectResults.map(({ result }) => result))
    const incompatibleSubjects = subjectResults
      .filter(({ result }) => result.status === 'incompatible')
      .map(({ subject }) => subject.label)
    const missingSubjects = subjectResults
      .filter(({ result }) => result.status === 'missing')
      .map(({ subject }) => subject.label)
    const partialSubjects = subjectResults
      .filter(({ result }) => result.status === 'partial')
      .map(({ subject }) => subject.label)

    return {
      metricId: metric.id,
      metricName: metric.name,
      categoryName: metric.categoryName,
      unit: metric.unit,
      status,
      subjectCount: subjects.length,
      assignedAthleteCount: subjectResults.reduce((total, { result }) => total + result.assignedAthleteCount, 0),
      measuredAthleteCount: subjectResults.reduce((total, { result }) => total + result.measuredAthleteCount, 0),
      totalAthleteCount: subjectResults.reduce((total, { result }) => total + result.totalAthleteCount, 0),
      incompatibleSubjects,
      missingSubjects,
      partialSubjects,
      reason: buildReason(status, incompatibleSubjects, missingSubjects, partialSubjects),
    }
  })
}
