import type { MeasurementStore } from './measurement-store'
import type { PerformanceLabWorkspace } from './workspace-file'

export function workspaceToMeasurementStore(workspace: PerformanceLabWorkspace): MeasurementStore {
  return {
    teams: workspace.teams,
    athletes: workspace.athletes,
    sessions: workspace.testSessions,
    measurements: workspace.measurements,
  }
}
