import { useState, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Settings, ChevronDown } from 'lucide-react'

interface DashboardCardProps {
  title: string
  children: ReactNode
  className?: string
  style?: React.CSSProperties
  configOptions?: { label: string; value: string }[]
  onConfigChange?: (value: string) => void
  currentConfig?: string
  footer?: ReactNode
}

export default function DashboardCard({
  title,
  children,
  className = '',
  style,
  configOptions,
  onConfigChange,
  currentConfig,
  footer,
}: DashboardCardProps) {
  const [showConfig, setShowConfig] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  return (
    <motion.div
      className={`relative flex flex-col rounded-xl border ${className}`}
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderColor: isHovered ? 'var(--border-active)' : 'var(--border-subtle)',
        boxShadow: isHovered
          ? '0 4px 6px rgba(0,0,0,0.2), 0 12px 24px rgba(0,0,0,0.3)'
          : '0 1px 3px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.2)',
        transition: 'border-color 200ms, box-shadow 200ms',
        ...style,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
    >
      {/* Header */}
      <div
        className="flex h-10 items-center justify-between border-b px-4"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <h3 className="text-h3" style={{ color: 'var(--text-primary)' }}>
          {title}
        </h3>
        {configOptions && configOptions.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setShowConfig(!showConfig)}
              className="flex h-7 w-7 items-center justify-center rounded-md transition-colors"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <Settings size={14} />
            </button>
            <AnimatePresence>
              {showConfig && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowConfig(false)} />
                  <motion.div
                    className="absolute right-0 top-full z-50 mt-1 min-w-[200px] rounded-lg border py-1"
                    style={{
                      backgroundColor: 'var(--bg-tertiary)',
                      borderColor: 'var(--border-subtle)',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                    }}
                    initial={{ opacity: 0, scale: 0.97, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.97, y: -4 }}
                    transition={{ duration: 0.15 }}
                  >
                    {configOptions.map((opt) => (
                      <button
                        key={opt.value}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] transition-colors"
                        style={{
                          color: currentConfig === opt.value ? 'var(--accent-cyan)' : 'var(--text-primary)',
                          backgroundColor: currentConfig === opt.value ? 'rgba(0,212,170,0.08)' : 'transparent',
                        }}
                        onMouseEnter={(e) => {
                          if (currentConfig !== opt.value) e.currentTarget.style.backgroundColor = 'var(--bg-hover)'
                        }}
                        onMouseLeave={(e) => {
                          if (currentConfig !== opt.value) e.currentTarget.style.backgroundColor = 'transparent'
                        }}
                        onClick={() => {
                          onConfigChange?.(opt.value)
                          setShowConfig(false)
                        }}
                      >
                        {currentConfig === opt.value && (
                          <ChevronDown size={12} />
                        )}
                        {opt.label}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 p-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentConfig || 'default'}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer */}
      {footer && (
        <div
          className="flex items-center justify-between border-t px-4 py-2 text-[11px]"
          style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}
        >
          {footer}
        </div>
      )}
    </motion.div>
  )
}
