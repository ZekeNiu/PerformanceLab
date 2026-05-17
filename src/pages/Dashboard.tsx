import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import QuickOverview from '@/components/dashboard/QuickOverview'
import ControlCenter from '@/components/dashboard/ControlCenter'
import DailyMonitoring from '@/components/dashboard/DailyMonitoring'
import PeriodicTesting from '@/components/dashboard/PeriodicTesting'

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'daily' | 'periodic'>('daily')

  const tabs = [
    { key: 'daily' as const, label: '日常监控' },
    { key: 'periodic' as const, label: '定期测试' },
  ]

  return (
    <div className="flex flex-col" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Section 1: Quick Overview Alert Bar */}
      <QuickOverview />

      {/* Section 2: Control Center Bar */}
      <ControlCenter />

      {/* Section 3: Tab Bar */}
      <div
        className="sticky top-0 z-30 flex h-11 items-center gap-0 border-b px-4"
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
      </div>

      {/* Section 4/5: Tab Content */}
      <div className="flex-1 p-6">
        <AnimatePresence mode="wait">
          {activeTab === 'daily' ? (
            <motion.div
              key="daily"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <DailyMonitoring />
            </motion.div>
          ) : (
            <motion.div
              key="periodic"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <PeriodicTesting />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
