import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, FileInput } from 'lucide-react'
import ManualEntryTab from '@/components/data-entry/ManualEntryTab'
import ExcelImportTab from '@/components/data-entry/ExcelImportTab'

type SubTab = 'manual' | 'excel'

export default function DataEntry() {
  const [activeTab, setActiveTab] = useState<SubTab>('manual')

  const tabs = [
    { id: 'manual' as SubTab, label: '手动录入', icon: FileInput },
    { id: 'excel' as SubTab, label: 'Excel导入', icon: Upload },
  ]

  return (
    <div className="flex flex-1 flex-col">
      {/* Page Header */}
      <div
        className="flex h-14 items-center justify-between border-b px-6"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        <div className="flex items-center gap-3">
          <Upload size={22} strokeWidth={1.5} style={{ color: 'var(--accent-cyan)' }} />
          <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            数据录入
          </h1>
        </div>

        {/* Sub-tab switcher */}
        <div className="flex items-center" style={{ borderBottom: '2px solid var(--border-subtle)' }}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="relative flex items-center gap-1.5 px-4 py-3.5 text-sm font-medium transition-colors"
                style={{
                  color: isActive ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.color = 'var(--text-primary)'
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.color = 'var(--text-secondary)'
                }}
              >
                <Icon size={16} strokeWidth={1.5} />
                {tab.label}
                {isActive && (
                  <motion.div
                    layoutId="data-entry-tab-indicator"
                    className="absolute bottom-[-2px] left-0 right-0 h-[2px]"
                    style={{ backgroundColor: 'var(--accent-cyan)' }}
                    transition={{ duration: 0.2, ease: [0.45, 0, 0.55, 1] as [number, number, number, number] }}
                  />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <AnimatePresence mode="wait">
          {activeTab === 'manual' ? (
            <motion.div
              key="manual"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.45, 0, 0.55, 1] as [number, number, number, number] }}
            >
              <ManualEntryTab />
            </motion.div>
          ) : (
            <motion.div
              key="excel"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.45, 0, 0.55, 1] as [number, number, number, number] }}
            >
              <ExcelImportTab />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
