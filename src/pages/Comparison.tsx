import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { GitCompare, LineChart, Users } from 'lucide-react'
import PeriodicTesting from '@/components/dashboard/PeriodicTesting'

type ComparisonMode = 'longitudinal' | 'cross-sectional'

const comparisonModes: Array<{
  key: ComparisonMode
  label: string
  icon: typeof LineChart
}> = [
  { key: 'longitudinal', label: '纵向比较', icon: LineChart },
  { key: 'cross-sectional', label: '横向比较', icon: Users },
]

export default function Comparison() {
  const [mode, setMode] = useState<ComparisonMode>('longitudinal')

  return (
    <div className="flex min-h-full flex-col" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <header
        className="sticky top-0 z-30 border-b px-3 py-3 md:px-6"
        style={{
          backgroundColor: 'var(--bg-primary)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--accent-cyan)',
              }}
            >
              <GitCompare size={20} strokeWidth={1.8} />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-[18px] font-semibold md:text-[20px]" style={{ color: 'var(--text-primary)' }}>
                Comparison Analysis
              </h1>
              <p className="truncate text-[12px] md:text-[13px]" style={{ color: 'var(--text-secondary)' }}>
                Periodic Testing
              </p>
            </div>
          </div>

          <div
            className="flex max-w-full items-center gap-1 overflow-x-auto rounded-lg border p-0.5"
            style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-subtle)' }}
          >
            {comparisonModes.map((item) => {
              const Icon = item.icon
              const active = mode === item.key

              return (
                <button
                  key={item.key}
                  onClick={() => setMode(item.key)}
                  className="flex h-9 shrink-0 items-center gap-2 rounded-md px-3 text-[12px] font-medium transition-colors md:text-[13px]"
                  style={{
                    backgroundColor: active ? 'var(--accent-cyan)' : 'transparent',
                    color: active ? '#0B0E14' : 'var(--text-secondary)',
                  }}
                >
                  <Icon size={15} strokeWidth={1.8} />
                  {item.label}
                </button>
              )
            })}
          </div>
        </div>
      </header>

      <main className="min-w-0 flex-1 p-3 md:p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            data-comparison-surface="periodic-testing"
            data-comparison-mode={mode}
          >
            <PeriodicTesting mode={mode} />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}
