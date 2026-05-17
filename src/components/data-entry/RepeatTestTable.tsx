import { useState, useCallback } from 'react'

import { Plus, ArrowUp, ArrowDown, Trash2 } from 'lucide-react'
import type { IndicatorMetric, DirectionType } from '@/data/mockData'
import { Input } from '@/components/ui/input'

interface MetricData {
  metricId: string
  repeats: (number | null)[]
}

interface RepeatTestTableProps {
  metrics: IndicatorMetric[]
  data: MetricData[]
  onDataChange: (data: MetricData[]) => void
}

function calcStats(repeats: (number | null)[], direction: DirectionType) {
  const values = repeats.filter((v): v is number => v != null && !isNaN(v))
  if (values.length === 0) {
    return { mean: null, best: null, sd: null, cv: null, count: 0 }
  }
  const count = values.length
  const mean = values.reduce((a, b) => a + b, 0) / count
  const best = direction === 'lower' ? Math.min(...values) : Math.max(...values)
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / count
  const sd = Math.sqrt(variance)
  const cv = mean !== 0 ? (sd / Math.abs(mean)) * 100 : 0
  return { mean, best, sd, cv, count }
}

function StatBadge({ label, value, unit }: { label: string; value: number | null; unit: string }) {
  return (
    <div className="flex items-center gap-1 rounded-md px-2 py-1" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span className="font-mono text-xs font-medium" style={{ color: 'var(--accent-cyan)' }}>
        {value != null ? value.toFixed(2) : '—'}
      </span>
      {value != null && <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{unit}</span>}
    </div>
  )
}

export default function RepeatTestTable({
  metrics,
  data,
  onDataChange,
}: RepeatTestTableProps) {
  const defaultRepeats = 6
  const [columnCount, setColumnCount] = useState(defaultRepeats)

  const getMetricData = useCallback(
    (metricId: string) => {
      const found = data.find((d) => d.metricId === metricId)
      if (found) return found
      return { metricId, repeats: Array(columnCount).fill(null) }
    },
    [data, columnCount]
  )

  const handleValueChange = (metricId: string, colIndex: number, val: string) => {
    const numVal = val === '' ? null : parseFloat(val)
    const newData = [...data]
    const idx = newData.findIndex((d) => d.metricId === metricId)
    if (idx >= 0) {
      const repeats = [...newData[idx].repeats]
      repeats[colIndex] = numVal
      newData[idx] = { ...newData[idx], repeats }
    } else {
      const repeats = Array(columnCount).fill(null)
      repeats[colIndex] = numVal
      newData.push({ metricId, repeats })
    }
    onDataChange(newData)
  }

  const addColumn = () => {
    setColumnCount((prev) => prev + 1)
    onDataChange(
      data.map((d) => ({
        ...d,
        repeats: [...d.repeats, null],
      }))
    )
  }

  const removeColumn = (colIndex: number) => {
    if (columnCount <= 3) return // minimum 3 columns
    setColumnCount((prev) => prev - 1)
    onDataChange(
      data.map((d) => ({
        ...d,
        repeats: d.repeats.filter((_, i) => i !== colIndex),
      }))
    )
  }

  return (
    <div className="space-y-6">
      {metrics.map((metric) => {
        const md = getMetricData(metric.id)
        const stats = calcStats(md.repeats, metric.direction)
        const hasMin3 = stats.count >= 3

        return (
          <div
            key={metric.id}
            className="rounded-xl border p-4"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            {/* Metric Header */}
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {metric.name}
                </span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  ({metric.unit})
                </span>
                {metric.direction === 'higher' && (
                  <span className="flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px]" style={{ backgroundColor: 'rgba(16,185,129,0.12)', color: '#10B981' }}>
                    <ArrowUp size={10} /> 越大越好
                  </span>
                )}
                {metric.direction === 'lower' && (
                  <span className="flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px]" style={{ backgroundColor: 'rgba(239,68,68,0.12)', color: '#EF4444' }}>
                    <ArrowDown size={10} /> 越小越好
                  </span>
                )}
                {metric.direction === 'range' && metric.optimalRange && (
                  <span className="rounded px-1.5 py-0.5 text-[10px]" style={{ backgroundColor: 'rgba(59,130,246,0.12)', color: '#3B82F6' }}>
                    ↔ 最优: {metric.optimalRange[0]}-{metric.optimalRange[1]}
                  </span>
                )}
              </div>
            </div>

            {/* Repeat Table */}
            <div className="mb-3 overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    {md.repeats.map((_, i) => (
                      <th
                        key={i}
                        className="px-1 pb-1.5 text-center text-[11px] font-medium"
                        style={{ color: 'var(--text-muted)', minWidth: 70 }}
                      >
                        第{i + 1}次
                        {i >= 3 && (
                          <button
                            onClick={() => removeColumn(i)}
                            className="ml-1 inline-flex items-center"
                            style={{ color: 'var(--text-muted)' }}
                            title="删除此列"
                          >
                            <Trash2 size={10} />
                          </button>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {md.repeats.map((val, i) => (
                      <td key={i} className="px-1 py-0.5">
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="—"
                          value={val != null ? val : ''}
                          onChange={(e) => handleValueChange(metric.id, i, e.target.value)}
                          className="h-8 text-center font-mono text-xs"
                          style={{
                            backgroundColor: 'var(--bg-tertiary)',
                            borderColor: 'var(--border-subtle)',
                            color: 'var(--text-primary)',
                          }}
                        />
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Stats & Actions Row */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                <StatBadge label="均值" value={stats.mean} unit={metric.unit} />
                <StatBadge label="最佳" value={stats.best} unit={metric.unit} />
                <StatBadge label="标准差" value={stats.sd} unit={metric.unit} />
                <StatBadge label="CV" value={stats.cv} unit="%" />
              </div>

              <div className="flex items-center gap-2">
                {!hasMin3 && (
                  <span className="text-[11px]" style={{ color: 'var(--accent-amber)' }}>
                    至少3次重复
                  </span>
                )}
                {hasMin3 && (
                  <span className="text-[11px]" style={{ color: 'var(--accent-green)' }}>
                    ✓ 数据充足
                  </span>
                )}
                <button
                  onClick={addColumn}
                  className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] transition-colors"
                  style={{
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-secondary)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--bg-hover)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }}
                >
                  <Plus size={12} /> 添加列
                </button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
