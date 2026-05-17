import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, TrendingDown, AlertCircle, TrendingUp, ChevronDown } from 'lucide-react'
import { alertCards, severityConfig, type AlertCard } from './data'

export default function QuickOverview() {
  const [time, setTime] = useState(new Date())
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [filterOpen, setFilterOpen] = useState(false)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const handleCardClick = (card: AlertCard) => {
    setSelectedId(card.id)
  }

  const filteredAlerts = filter === 'all'
    ? alertCards
    : alertCards.filter((c) => severityConfig[c.severity].label === filter)

  const filterOptions = [
    { value: 'all', label: '全部' },
    { value: '严重异常', label: '严重异常' },
    { value: '注意', label: '注意' },
    { value: '恢复中', label: '恢复中' },
  ]

  return (
    <div
      className="flex h-14 items-center gap-4 border-b px-4"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      {/* Left: Title & Timestamp */}
      <div className="flex shrink-0 items-center gap-2">
        <AlertTriangle size={18} style={{ color: 'var(--accent-amber)' }} />
        <span className="text-h3 whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>
          快速概览
        </span>
        <span className="text-mono whitespace-nowrap text-[11px]" style={{ color: 'var(--text-muted)' }}>
          {time.toLocaleTimeString('zh-CN', { hour12: false })}
        </span>
      </div>

      {/* Center: Scrolling Alert Cards */}
      <div className="scrollbar-hide flex flex-1 gap-3 overflow-x-auto">
        {filteredAlerts.map((card, index) => {
          const config = severityConfig[card.severity]
          const isSelected = selectedId === card.id
          const icons = {
            critical: TrendingDown,
            warning: AlertCircle,
            recovering: TrendingUp,
          }
          const Icon = icons[card.severity]

          return (
            <motion.button
              key={card.id}
              className="flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-1.5 text-left transition-all duration-200"
              style={{
                backgroundColor: 'var(--bg-tertiary)',
                border: `1px solid ${isSelected ? 'var(--accent-cyan)' : 'var(--border-subtle)'}`,
                boxShadow: isSelected ? '0 0 0 2px rgba(0,212,170,0.3)' : 'none',
              }}
              onClick={() => handleCardClick(card)}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: 0.4,
                delay: index * 0.08,
                ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
              }}
              whileHover={{ y: -2, boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}
            >
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-semibold"
                style={{
                  backgroundColor: `hsl(${parseInt(card.name.charCodeAt(0).toString()) % 360} 50% 30%)`,
                  color: '#fff',
                }}
              >
                {card.name[0]}
              </div>
              <div className="flex flex-col">
                <span className="text-[12px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {card.name}
                </span>
                <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                  {card.metric}
                </span>
              </div>
              <span
                className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium"
                style={{ backgroundColor: config.bg, color: config.color }}
              >
                <Icon size={10} />
                {config.label}
              </span>
              {isSelected && (
                <div
                  className="absolute inset-0 rounded-lg animate-pulse-ring"
                  style={{ pointerEvents: 'none' }}
                />
              )}
            </motion.button>
          )
        })}
      </div>

      {/* Right: Filter */}
      <div className="relative shrink-0">
        <button
          onClick={() => setFilterOpen(!filterOpen)}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors"
          style={{
            backgroundColor: 'var(--bg-tertiary)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          {filterOptions.find((f) => f.label === filter || (filter === 'all' && f.value === 'all'))?.label || '全部'}
          <ChevronDown size={12} />
        </button>
        {filterOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setFilterOpen(false)} />
            <div
              className="absolute right-0 top-full z-50 mt-1 min-w-[100px] rounded-lg border py-1"
              style={{
                backgroundColor: 'var(--bg-tertiary)',
                borderColor: 'var(--border-subtle)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              }}
            >
              {filterOptions.map((opt) => (
                <button
                  key={opt.value}
                  className="flex w-full px-3 py-1.5 text-left text-[12px] transition-colors"
                  style={{
                    color: (filter === 'all' && opt.value === 'all') || filter === opt.value
                      ? 'var(--accent-cyan)'
                      : 'var(--text-primary)',
                  }}
                  onClick={() => {
                    setFilter(opt.value === 'all' ? 'all' : opt.label)
                    setFilterOpen(false)
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
