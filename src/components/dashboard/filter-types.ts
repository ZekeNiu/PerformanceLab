export type DashboardDateMode = 'single' | 'range' | 'unlimited'
export type DashboardAthleteType = 'real' | 'group'

export interface DashboardFilters {
  dateMode: DashboardDateMode
  dateStart: string
  dateEnd: string
  athleteType: DashboardAthleteType
  athleteId: string
  athleteName: string
  sessionId: string
  sessionName: string
}

export interface DashboardMeasurementFilter {
  athleteId?: string
  from?: string
  to?: string
  sessionIds?: string[]
}

export const defaultDashboardFilters: DashboardFilters = {
  dateMode: 'range',
  dateStart: '2024-01-01',
  dateEnd: '2024-01-30',
  athleteType: 'real',
  athleteId: 'ATH-2024-001',
  athleteName: '张伟',
  sessionId: '',
  sessionName: '',
}

export function dashboardFiltersToMeasurementFilter(filters: DashboardFilters): DashboardMeasurementFilter {
  return {
    athleteId: filters.athleteType === 'real' ? filters.athleteId || undefined : undefined,
    sessionIds: filters.sessionId ? [filters.sessionId] : undefined,
    from:
      filters.dateMode === 'single' || filters.dateMode === 'range'
        ? filters.dateStart || undefined
        : undefined,
    to:
      filters.dateMode === 'single'
        ? filters.dateStart || undefined
        : filters.dateMode === 'range'
          ? filters.dateEnd || undefined
          : undefined,
  }
}
