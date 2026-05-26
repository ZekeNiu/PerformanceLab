export type DashboardDateMode = 'single' | 'range' | 'unlimited'
export type DashboardAthleteType = 'real' | 'group'

export interface DashboardFilters {
  dateMode: DashboardDateMode
  dateStart: string
  dateEnd: string
  athleteType: DashboardAthleteType
  athleteId: string
  athleteName: string
}

export interface DashboardMeasurementFilter {
  athleteId?: string
  from?: string
  to?: string
}

export const defaultDashboardFilters: DashboardFilters = {
  dateMode: 'range',
  dateStart: '2024-01-01',
  dateEnd: '2024-01-30',
  athleteType: 'real',
  athleteId: 'ATH-2024-001',
  athleteName: '张伟',
}

export function dashboardFiltersToMeasurementFilter(filters: DashboardFilters): DashboardMeasurementFilter {
  return {
    athleteId: filters.athleteType === 'real' ? filters.athleteId || undefined : undefined,
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
