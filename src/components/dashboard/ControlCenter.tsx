import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Calendar, Check, User, X } from 'lucide-react'
import { athletes } from './data'
import { defaultDashboardFilters, type DashboardFilters } from './filter-types'
import { useWorkspaceStore } from '@/lib/workspace-store'

interface AthleteOption {
  id: string
  name: string
}

interface ControlCenterProps {
  filters: DashboardFilters
  onFiltersChange: (filters: DashboardFilters | ((current: DashboardFilters) => DashboardFilters)) => void
}

export default function ControlCenter({ filters, onFiltersChange }: ControlCenterProps) {
  const { workspace } = useWorkspaceStore()
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showAthletePicker, setShowAthletePicker] = useState(false)

  const athleteOptions = useMemo<AthleteOption[]>(() => {
    const workspaceAthletes = workspace.athletes
      .filter((athlete) => athlete.name)
      .map((athlete) => ({ id: athlete.id, name: athlete.name }))

    return workspaceAthletes.length > 0
      ? workspaceAthletes
      : athletes.map((name, index) => ({ id: `mock-athlete-${index + 1}`, name }))
  }, [workspace.athletes])

  const dateSummary =
    filters.dateMode === 'unlimited'
      ? '不限时间'
      : filters.dateMode === 'single'
        ? filters.dateStart
        : `${filters.dateStart} ~ ${filters.dateEnd}`

  const removeFilter = (type: 'date' | 'athlete') => {
    if (type === 'date') {
      onFiltersChange((current) => ({ ...current, dateMode: 'unlimited' }))
    } else {
      onFiltersChange((current) => ({ ...current, athleteId: '', athleteName: '' }))
    }
  }

  return (
    <div
      className="flex min-h-[52px] items-center gap-3 overflow-x-auto border-b px-4"
      style={{
        backgroundColor: 'var(--bg-tertiary)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      <div className="relative shrink-0">
        <button
          onClick={() => {
            setShowDatePicker(!showDatePicker)
            setShowAthletePicker(false)
          }}
          className="flex h-9 items-center gap-2 rounded-lg border px-4 text-[13px] transition-colors"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            borderColor: 'var(--border-subtle)',
            color: 'var(--text-primary)',
          }}
        >
          <Calendar size={16} style={{ color: 'var(--text-muted)' }} />
          <span>日期</span>
          <span style={{ color: 'var(--text-secondary)' }}>{dateSummary}</span>
        </button>

        <AnimatePresence>
          {showDatePicker && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowDatePicker(false)} />
              <motion.div
                className="absolute left-0 top-full z-50 mt-1 w-72 rounded-lg border p-4"
                style={{
                  backgroundColor: 'var(--bg-tertiary)',
                  borderColor: 'var(--border-subtle)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                }}
                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.97 }}
                transition={{ duration: 0.2 }}
              >
                <p className="mb-3 text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>
                  选择日期方式
                </p>
                <div className="mb-3 flex gap-2">
                  {[
                    { value: 'single' as const, label: '指定日期' },
                    { value: 'range' as const, label: '日期范围' },
                    { value: 'unlimited' as const, label: '不限时间' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      className="rounded-md px-3 py-1.5 text-[12px] transition-colors"
                      style={{
                        backgroundColor:
                          filters.dateMode === option.value ? 'var(--accent-cyan)' : 'var(--bg-secondary)',
                        color: filters.dateMode === option.value ? '#0B0E14' : 'var(--text-primary)',
                      }}
                      onClick={() => {
                        onFiltersChange((current) => ({ ...current, dateMode: option.value }))
                        if (option.value === 'unlimited') setShowDatePicker(false)
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                {filters.dateMode !== 'unlimited' && (
                  <div className="space-y-2">
                    <input
                      type="date"
                      value={filters.dateStart}
                      onChange={(event) => onFiltersChange((current) => ({ ...current, dateStart: event.target.value }))}
                      className="w-full rounded-md border px-2 py-1.5 text-[12px]"
                      style={{
                        backgroundColor: 'var(--bg-secondary)',
                        borderColor: 'var(--border-subtle)',
                        color: 'var(--text-primary)',
                      }}
                    />
                    {filters.dateMode === 'range' && (
                      <input
                        type="date"
                        value={filters.dateEnd}
                        onChange={(event) => onFiltersChange((current) => ({ ...current, dateEnd: event.target.value }))}
                        className="w-full rounded-md border px-2 py-1.5 text-[12px]"
                        style={{
                          backgroundColor: 'var(--bg-secondary)',
                          borderColor: 'var(--border-subtle)',
                          color: 'var(--text-primary)',
                        }}
                      />
                    )}
                  </div>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      <div className="relative shrink-0">
        <button
          onClick={() => {
            setShowAthletePicker(!showAthletePicker)
            setShowDatePicker(false)
          }}
          className="flex h-9 items-center gap-2 rounded-lg border px-4 text-[13px] transition-colors"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            borderColor: 'var(--border-subtle)',
            color: 'var(--text-primary)',
          }}
        >
          <User size={16} style={{ color: 'var(--text-muted)' }} />
          <span>运动员</span>
          <span style={{ color: 'var(--text-secondary)' }}>{filters.athleteName || '请选择'}</span>
        </button>

        <AnimatePresence>
          {showAthletePicker && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowAthletePicker(false)} />
              <motion.div
                className="absolute left-0 top-full z-50 mt-1 max-h-[400px] w-80 overflow-auto rounded-lg border p-3"
                style={{
                  backgroundColor: 'var(--bg-tertiary)',
                  borderColor: 'var(--border-subtle)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                }}
                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.97 }}
                transition={{ duration: 0.2 }}
              >
                <p className="mb-2 text-[12px] font-semibold" style={{ color: 'var(--accent-cyan)' }}>
                  真实运动员
                </p>
                {athleteOptions.map((option) => (
                  <button
                    key={option.id}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[12px] transition-colors"
                    style={{
                      backgroundColor: filters.athleteId === option.id ? 'rgba(0,212,170,0.08)' : 'transparent',
                      color: filters.athleteId === option.id ? 'var(--accent-cyan)' : 'var(--text-primary)',
                    }}
                    onClick={() => {
                      onFiltersChange((current) => ({
                        ...current,
                        athleteType: 'real',
                        athleteId: option.id,
                        athleteName: option.name,
                      }))
                      setShowAthletePicker(false)
                    }}
                  >
                    {filters.athleteId === option.id && <Check size={12} />}
                    {option.name}
                  </button>
                ))}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      <div className="flex min-w-0 flex-1 items-center gap-2">
        {filters.dateMode !== 'unlimited' && (
          <span
            className="flex max-w-[260px] items-center gap-1 truncate rounded-full px-2.5 py-1 text-[11px] font-medium"
            style={{ backgroundColor: 'rgba(0,212,170,0.15)', color: 'var(--accent-cyan)' }}
          >
            <span className="truncate">{dateSummary}</span>
            <button onClick={() => removeFilter('date')} className="ml-1 shrink-0" aria-label="移除日期筛选">
              <X size={10} />
            </button>
          </span>
        )}
        {filters.athleteName && (
          <span
            className="flex max-w-[180px] items-center gap-1 truncate rounded-full px-2.5 py-1 text-[11px] font-medium"
            style={{ backgroundColor: 'rgba(0,212,170,0.15)', color: 'var(--accent-cyan)' }}
          >
            <span className="truncate">{filters.athleteName}</span>
            <button onClick={() => removeFilter('athlete')} className="ml-1 shrink-0" aria-label="移除运动员筛选">
              <X size={10} />
            </button>
          </span>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          className="h-9 rounded-lg px-4 text-[13px] font-medium transition-opacity hover:opacity-90"
          style={{ backgroundColor: 'var(--accent-cyan)', color: '#0B0E14' }}
          onClick={() => {
            setShowDatePicker(false)
            setShowAthletePicker(false)
          }}
        >
          应用
        </button>
        <button
          className="h-9 rounded-lg border px-4 text-[13px] transition-colors"
          style={{
            backgroundColor: 'transparent',
            borderColor: 'var(--border-subtle)',
            color: 'var(--text-secondary)',
          }}
          onClick={() =>
            onFiltersChange({
              ...defaultDashboardFilters,
              athleteId: athleteOptions[0]?.id ?? '',
              athleteName: athleteOptions[0]?.name ?? '',
            })
          }
        >
          重置
        </button>
      </div>
    </div>
  )
}
