import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ArrowUp, ArrowDown, ArrowLeftRight } from 'lucide-react'
import type { MetricDefinition } from '@/lib/domain-model'
import { useWorkspaceStore } from '@/lib/workspace-store'
import {
  buildWorkspaceDefinitionCategories,
  getWorkspaceActionMetrics,
} from '@/lib/workspace-definition-config'
import { Checkbox } from '@/components/ui/checkbox'

interface IndicatorSelectorProps {
  selectedMetrics: MetricDefinition[]
  onMetricsChange: (metrics: MetricDefinition[]) => void
}

function DirectionBadge({ direction, range }: { direction: MetricDefinition['direction']; range?: [number, number] }) {
  if (direction === 'higher') {
    return (
      <span className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium" style={{ backgroundColor: 'rgba(16,185,129,0.15)', color: '#10B981' }}>
        <ArrowUp size={10} /> 越大越好
      </span>
    )
  }
  if (direction === 'lower') {
    return (
      <span className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium" style={{ backgroundColor: 'rgba(239,68,68,0.15)', color: '#EF4444' }}>
        <ArrowDown size={10} /> 越小越好
      </span>
    )
  }
  if (direction === 'neutral') {
    return null
  }
  return (
    <span className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium" style={{ backgroundColor: 'rgba(59,130,246,0.15)', color: '#3B82F6' }} title={range ? `最优范围: ${range[0]}-${range[1]}` : undefined}>
      <ArrowLeftRight size={10} /> 区间最优
    </span>
  )
}

export default function IndicatorSelector({
  selectedMetrics,
  onMetricsChange,
}: IndicatorSelectorProps) {
  const [level1Id, setLevel1Id] = useState('')
  const [level2Id, setLevel2Id] = useState('')
  const { workspace } = useWorkspaceStore()
  const actionCategories = useMemo(() => buildWorkspaceDefinitionCategories(workspace), [workspace])

  const selectedCategory = actionCategories.find((c) => c.id === level1Id)
  const selectedAction = selectedCategory?.actions.find((a) => a.id === level2Id)

  const availableMetrics = selectedAction
    ? getWorkspaceActionMetrics(selectedAction, workspace.metricDefinitions)
    : []

  const toggleMetric = (metric: MetricDefinition) => {
    const exists = selectedMetrics.find((m) => m.id === metric.id)
    if (exists) {
      onMetricsChange(selectedMetrics.filter((m) => m.id !== metric.id))
    } else {
      onMetricsChange([...selectedMetrics, metric])
    }
  }

  const handleL1Change = (id: string) => {
    setLevel1Id(id)
    setLevel2Id('')
    onMetricsChange([])
  }

  const handleL2Change = (id: string) => {
    setLevel2Id(id)
    // Auto-select all metrics by default when action changes
    const action = selectedCategory?.actions.find((a) => a.id === id)
    if (action) {
      onMetricsChange(getWorkspaceActionMetrics(action, workspace.metricDefinitions))
    } else {
      onMetricsChange([])
    }
  }

  return (
    <div
      className="rounded-xl border p-5"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      <h3 className="mb-4 text-h3 font-semibold" style={{ color: 'var(--text-primary)' }}>
        选择测试指标
      </h3>

      <div className="space-y-4">
        {/* Level 1 - Category */}
        <div>
          <label className="mb-1.5 block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
            一级 — 动作分类
          </label>
          <div className="relative">
            <select
              className="w-full appearance-none rounded-md border px-3 py-2 pr-10 text-sm outline-none transition-colors"
              style={{
                backgroundColor: 'var(--bg-tertiary)',
                borderColor: 'var(--border-subtle)',
                color: level1Id ? 'var(--text-primary)' : 'var(--text-muted)',
              }}
              value={level1Id}
              onChange={(e) => handleL1Change(e.target.value)}
            >
              <option value="" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                请选择动作分类
              </option>
              {actionCategories.map((cat) => (
                <option key={cat.id} value={cat.id} style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  {cat.name} ({cat.actions.length}项测试)
                </option>
              ))}
            </select>
            <ChevronDown
              size={16}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--text-muted)' }}
            />
          </div>
        </div>

        {/* Level 2 - Action */}
        <AnimatePresence>
          {level1Id && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <label className="mb-1.5 block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                二级 — 测试动作
              </label>
              <div className="relative">
                <select
                  className="w-full appearance-none rounded-md border px-3 py-2 pr-10 text-sm outline-none transition-colors"
                  style={{
                    backgroundColor: 'var(--bg-tertiary)',
                    borderColor: 'var(--border-subtle)',
                    color: level2Id ? 'var(--text-primary)' : 'var(--text-muted)',
                  }}
                  value={level2Id}
                  onChange={(e) => handleL2Change(e.target.value)}
                >
                  <option value="" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                    请选择测试动作
                  </option>
                  {selectedCategory?.actions.map((act) => (
                    <option key={act.id} value={act.id} style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                      {act.name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={16}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--text-muted)' }}
                />
              </div>

              {/* Action info */}
              <AnimatePresence>
                {selectedAction && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    <span>所属类别: {selectedCategory?.name}</span>
                    <span>测量设备: {selectedAction.equipment}</span>
                    <span style={{ color: 'var(--text-muted)' }}>{selectedAction.description}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Level 3 - Metrics */}
        <AnimatePresence>
          {level2Id && availableMetrics.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <label className="mb-2 block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                三级 — 测试指标 (选择要录入的指标)
              </label>
              <div className="flex flex-wrap gap-3">
                {availableMetrics.map((metric) => {
                  const isChecked = selectedMetrics.some((m) => m.id === metric.id)
                  return (
                    <label
                      key={metric.id}
                      className="flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 transition-colors"
                      style={{
                        borderColor: isChecked ? 'var(--accent-cyan)' : 'var(--border-subtle)',
                        backgroundColor: isChecked ? 'rgba(0,212,170,0.05)' : 'var(--bg-tertiary)',
                      }}
                    >
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={() => toggleMetric(metric)}
                      />
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                          {metric.name}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                            单位: {metric.unit}
                          </span>
                          <DirectionBadge direction={metric.direction} range={metric.optimalRange} />
                        </div>
                      </div>
                    </label>
                  )
                })}
              </div>
              {selectedMetrics.length === 0 && (
                <p className="mt-2 text-xs" style={{ color: 'var(--accent-amber)' }}>
                  请至少选择一个测试指标
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
