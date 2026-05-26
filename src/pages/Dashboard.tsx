import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import QuickOverview from '@/components/dashboard/QuickOverview'
import ControlCenter from '@/components/dashboard/ControlCenter'
import DailyMonitoring from '@/components/dashboard/DailyMonitoring'
import PeriodicTesting from '@/components/dashboard/PeriodicTesting'
import { defaultDashboardFilters, dashboardFiltersToMeasurementFilter } from '@/components/dashboard/filter-types'

type DashboardTab = 'daily' | 'periodic'
type ComparisonMode = 'display' | 'longitudinal' | 'cross-sectional'

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<DashboardTab>('daily')
  const [comparisonMode, setComparisonMode] = useState<ComparisonMode>('display')
  const [filters, setFilters] = useState(defaultDashboardFilters)
  const measurementFilter = useMemo(() => dashboardFiltersToMeasurementFilter(filters), [filters])

  const tabs = [
    { key: 'daily' as const, label: '日常监控' },
    { key: 'periodic' as const, label: '定期测试' },
  ]

  const modeButtons: { key: ComparisonMode; label: string }[] = [
    { key: 'display', label: '数据展示' },
    { key: 'longitudinal', label: '纵向比较' },
    { key: 'cross-sectional', label: '横向比较' },
  ]

  return (
    <div className="flex flex-col" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Section 1: Quick Overview Alert Bar */}
      <QuickOverview />

      {/* Section 2: Control Center Bar */}
      <ControlCenter filters={filters} onFiltersChange={setFilters} />

      {/* Section 3: Tab Bar */}
      <div
        className="sticky top-0 z-30 flex min-h-11 flex-wrap items-center gap-0 border-b px-3 py-1 md:h-11 md:px-4 md:py-0"
        style={{
          backgroundColor: 'var(--bg-primary)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="relative px-5 py-2.5 text-[14px] font-medium transition-colors duration-200"
            style={{
              color: activeTab === tab.key ? 'var(--text-primary)' : 'var(--text-secondary)',
            }}
          >
            {tab.label}
            {activeTab === tab.key && (
              <motion.div
                className="absolute bottom-0 left-0 right-0 h-0.5"
                style={{ backgroundColor: 'var(--accent-cyan)' }}
                layoutId="tab-indicator"
                transition={{ duration: 0.2, ease: [0.45, 0, 0.55, 1] as [number, number, number, number] }}
              />
            )}
          </button>
        ))}

        {/* Comparison mode switcher — only show on periodic tab */}
        {activeTab === 'periodic' && (
          <div className="ml-auto flex max-w-full items-center gap-1 overflow-x-auto rounded-lg border p-0.5" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-subtle)' }}>
            {modeButtons.map((btn) => (
              <button
                key={btn.key}
                onClick={() => setComparisonMode(btn.key)}
                className="shrink-0 rounded-md px-3 py-1 text-[12px] font-medium transition-colors"
                style={{
                  backgroundColor: comparisonMode === btn.key ? 'var(--accent-cyan)' : 'transparent',
                  color: comparisonMode === btn.key ? '#0B0E14' : 'var(--text-secondary)',
                }}
              >
                {btn.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Section 4/5: Tab Content */}
      <div className="min-w-0 flex-1 p-3 md:p-6">
        <AnimatePresence mode="wait">
          {activeTab === 'daily' ? (
            <motion.div
              key="daily"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <DailyMonitoring filter={measurementFilter} />
            </motion.div>
          ) : (
            <motion.div
              key={`periodic-${comparisonMode}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <PeriodicTesting mode={comparisonMode} filter={measurementFilter} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
