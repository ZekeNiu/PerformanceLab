import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, User, X, Check } from 'lucide-react'
import { athletes } from './data'

interface FilterState {
  dateMode: 'single' | 'range' | 'unlimited'
  dateStart: string
  dateEnd: string
  athleteType: 'real' | 'group'
  athlete: string
}

export default function ControlCenter() {
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showAthletePicker, setShowAthletePicker] = useState(false)
  const [filters, setFilters] = useState<FilterState>({
    dateMode: 'range',
    dateStart: '2024-01-01',
    dateEnd: '2024-01-30',
    athleteType: 'real',
    athlete: '张伟',
  })

  const dateSummary =
    filters.dateMode === 'unlimited'
      ? '不限时间'
      : filters.dateMode === 'single'
        ? filters.dateStart
        : `${filters.dateStart} ~ ${filters.dateEnd}`

  const athleteSummary = filters.athlete

  const removeFilter = (type: 'date' | 'athlete') => {
    if (type === 'date') {
      setFilters((f) => ({ ...f, dateMode: 'unlimited' }))
    } else {
      setFilters((f) => ({ ...f, athlete: '' }))
    }
  }

  return (
    <div
      className="flex h-[52px] items-center gap-3 border-b px-4"
      style={{
        backgroundColor: 'var(--bg-tertiary)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      {/* Date Selector */}
      <div className="relative">
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
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--border-active)')}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
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
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      className="rounded-md px-3 py-1.5 text-[12px] transition-colors"
                      style={{
                        backgroundColor: filters.dateMode === opt.value ? 'var(--accent-cyan)' : 'var(--bg-secondary)',
                        color: filters.dateMode === opt.value ? '#0B0E14' : 'var(--text-primary)',
                      }}
                      onClick={() => setFilters((f) => ({ ...f, dateMode: opt.value }))}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {filters.dateMode !== 'unlimited' && (
                  <div className="mb-3 space-y-2">
                    <input
                      type="date"
                      value={filters.dateStart}
                      onChange={(e) => setFilters((f) => ({ ...f, dateStart: e.target.value }))}
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
                        onChange={(e) => setFilters((f) => ({ ...f, dateEnd: e.target.value }))}
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

                <div className="border-t pt-2" style={{ borderColor: 'var(--border-subtle)' }}>
                  <p className="mb-2 text-[11px]" style={{ color: 'var(--text-muted)' }}>快速选择</p>
                  <div className="flex flex-wrap gap-1.5">
                    {['今日', '本周', '本月', '本季', '本年'].map((label) => (
                      <button
                        key={label}
                        className="rounded-md px-2 py-1 text-[11px] transition-colors"
                        style={{
                          backgroundColor: 'var(--bg-secondary)',
                          color: 'var(--text-secondary)',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-secondary)')}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Athlete Selector */}
      <div className="relative">
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
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--border-active)')}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
        >
          <User size={16} style={{ color: 'var(--text-muted)' }} />
          <span>运动员</span>
          <span style={{ color: 'var(--text-secondary)' }}>{athleteSummary || '请选择'}</span>
        </button>

        <AnimatePresence>
          {showAthletePicker && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowAthletePicker(false)} />
              <motion.div
                className="absolute left-0 top-full z-50 mt-1 w-80 max-h-[400px] overflow-auto rounded-lg border p-3"
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
                <input
                  type="text"
                  placeholder="搜索运动员姓名..."
                  className="mb-3 w-full rounded-md border px-3 py-2 text-[12px]"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-primary)',
                  }}
                />

                <div className="mb-3">
                  <p className="mb-2 text-[12px] font-semibold" style={{ color: 'var(--accent-cyan)' }}>
                    真实运动员
                  </p>
                  {athletes.map((name) => (
                    <button
                      key={name}
                      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[12px] transition-colors"
                      style={{
                        backgroundColor: filters.athlete === name ? 'rgba(0,212,170,0.08)' : 'transparent',
                        color: filters.athlete === name ? 'var(--accent-cyan)' : 'var(--text-primary)',
                      }}
                      onClick={() => {
                        setFilters((f) => ({ ...f, athlete: name, athleteType: 'real' }))
                        setShowAthletePicker(false)
                      }}
                    >
                      {filters.athlete === name && <Check size={12} />}
                      {name}
                    </button>
                  ))}
                </div>

                <div className="border-t pt-2" style={{ borderColor: 'var(--border-subtle)' }}>
                  <p className="mb-2 text-[12px] font-semibold" style={{ color: 'var(--accent-purple)' }}>
                    参照群组
                  </p>
                  {[
                    '全局数据库 - 同性别 - 均值',
                    '全局数据库 - 同性别+同专项 - 均值',
                    '全局数据库 - 同性别+同位置 - 均值',
                  ].map((label) => (
                    <button
                      key={label}
                      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[11px] transition-colors"
                      style={{ color: 'var(--text-secondary)' }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <User size={12} style={{ color: 'var(--accent-purple)' }} />
                      {label}
                    </button>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Active Filter Pills */}
      <div className="flex flex-1 items-center gap-2">
        {filters.dateMode !== 'unlimited' && (
          <span
            className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium"
            style={{
              backgroundColor: 'rgba(0,212,170,0.15)',
              color: 'var(--accent-cyan)',
            }}
          >
            {dateSummary}
            <button onClick={() => removeFilter('date')} className="ml-1">
              <X size={10} />
            </button>
          </span>
        )}
        {filters.athlete && (
          <span
            className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium"
            style={{
              backgroundColor: 'rgba(0,212,170,0.15)',
              color: 'var(--accent-cyan)',
            }}
          >
            {athleteSummary}
            <button onClick={() => removeFilter('athlete')} className="ml-1">
              <X size={10} />
            </button>
          </span>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <button
          className="h-9 rounded-lg px-4 text-[13px] font-medium transition-opacity hover:opacity-90"
          style={{
            backgroundColor: 'var(--accent-cyan)',
            color: '#0B0E14',
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
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--border-active)')}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
          onClick={() =>
            setFilters({
              dateMode: 'range',
              dateStart: '2024-01-01',
              dateEnd: '2024-01-30',
              athleteType: 'real',
              athlete: athletes[0],
            })
          }
        >
          重置
        </button>
      </div>
    </div>
  )
}
