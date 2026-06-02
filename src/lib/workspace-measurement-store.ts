import type { MeasurementStore } from './measurement-store'
import type { PerformanceLabWorkspace } from './workspace-file'
import { computeDerivedMeasurements } from './derived-metric-formulas'

export function workspaceToMeasurementStore(workspace: PerformanceLabWorkspace): MeasurementStore {
  const derivedMeasurements = computeDerivedMeasurements({
    definitions: workspace.derivedMetricDefinitions,
    measurements: workspace.measurements,
    metricDefinitions: workspace.metricDefinitions,
  }).measurements

  return {
    teams: workspace.teams,
    athletes: workspace.athletes,
    sessions: workspace.testSessions,
    measurements: [...workspace.measurements, ...derivedMeasurements],
  }
}
