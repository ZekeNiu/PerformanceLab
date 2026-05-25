import { useState } from 'react'
import { Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'
import type { TestSession, Athlete } from '@/data/mockData'
import type { Measurement, MetricDefinition } from '@/lib/domain-model'
import { buildManualEntryMeasurements } from '@/lib/data-entry-measurements'
import TestSessionSelector from './TestSessionSelector'
import IndicatorSelector from './IndicatorSelector'
import AthleteSelector from './AthleteSelector'
import type { EntryMode } from './AthleteSelector'
import RepeatTestTable from './RepeatTestTable'

interface MetricData {
  metricId: string
  repeats: (number | null)[]
}

interface ManualEntryTabProps {
  onMeasurementsCommitted?: (measurements: Measurement[]) => void | Promise<void>
}

export default function ManualEntryTab({ onMeasurementsCommitted }: ManualEntryTabProps) {
  const [selectedSession, setSelectedSession] = useState<TestSession | null>(null)
  const [selectedMetrics, setSelectedMetrics] = useState<MetricDefinition[]>([])
  const [selectedAthletes, setSelectedAthletes] = useState<Athlete[]>([])
  const [entryMode, setEntryMode] = useState<EntryMode>('single')
  const [metricData, setMetricData] = useState<MetricData[]>([])
  const [isSaving, setIsSaving] = useState(false)

  const canProceed = selectedSession && selectedMetrics.length > 0 && selectedAthletes.length > 0

  const handleSave = async () => {
    if (!selectedSession || selectedMetrics.length === 0 || selectedAthletes.length === 0) return
    setIsSaving(true)
    const measurements = buildManualEntryMeasurements({
      session: selectedSession,
      athletes: selectedAthletes,
      metrics: selectedMetrics,
      metricData,
    })
    try {
      await new Promise((resolve) => setTimeout(resolve, 300))
      await onMeasurementsCommitted?.(measurements)
      toast.success('数据已保存', {
        description: `已生成 ${measurements.length} 条测量记录`,
      })
      setMetricData([])
      setSelectedAthletes([])
    } catch (error) {
      toast.error('数据保存失败', {
        description: error instanceof Error ? error.message : '请重新授权本地文件或导出备份。',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveDraft = () => {
    toast.info('已保存为草稿', {
      description: '数据已保存为草稿，可随时继续编辑',
    })
  }

  return (
    <div className="space-y-5">
      {/* Test Session Selector */}
      <TestSessionSelector
        selectedSession={selectedSession}
        onSelectSession={setSelectedSession}
      />

      {/* Hierarchical Indicator Selector */}
      <IndicatorSelector
        selectedMetrics={selectedMetrics}
        onMetricsChange={setSelectedMetrics}
      />

      {/* Athlete Selector */}
      <AthleteSelector
        selectedAthletes={selectedAthletes}
        onAthletesChange={setSelectedAthletes}
        entryMode={entryMode}
        onEntryModeChange={setEntryMode}
      />

      {/* Data Entry Form */}
      {canProceed && (
        <div
          className="rounded-xl border p-5"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-h3 font-semibold" style={{ color: 'var(--text-primary)' }}>
              {selectedAthletes.length === 1 ? (
                <>
                  <span className="mr-1">👤</span> {selectedAthletes[0].name} — {selectedMetrics[0]?.name.split(' ')[0] || ''} 测试数据
                </>
              ) : (
                <>批量录入 — {selectedMetrics.length} 项指标</>
              )}
            </h3>
          </div>

          <RepeatTestTable
            metrics={selectedMetrics}
            data={metricData}
            onDataChange={setMetricData}
          />

          {/* Save Buttons */}
          <div className="mt-5 flex justify-end gap-3">
            <button
              onClick={handleSaveDraft}
              className="rounded-lg border px-4 py-2 text-xs font-medium transition-colors"
              style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--bg-hover)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              保存草稿
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-medium transition-all disabled:opacity-60"
              style={{
                backgroundColor: 'var(--accent-cyan)',
                color: 'var(--bg-primary)',
                boxShadow: '0 0 12px rgba(0,212,170,0.2)',
              }}
            >
              {isSaving ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> 保存中...
                </>
              ) : (
                <>
                  <Save size={14} /> 保存数据
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Prompt when prerequisites not met */}
      {!canProceed && (
        <div
          className="rounded-xl border py-8 text-center"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <div className="mb-2 flex items-center justify-center gap-2">
            {!selectedSession && (
              <span className="rounded-md px-2 py-1 text-[11px]" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>
                请选择测试批次
              </span>
            )}
            {selectedSession && selectedMetrics.length === 0 && (
              <span className="rounded-md px-2 py-1 text-[11px]" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>
                请选择测试指标
              </span>
            )}
            {selectedSession && selectedMetrics.length > 0 && selectedAthletes.length === 0 && (
              <span className="rounded-md px-2 py-1 text-[11px]" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>
                请选择录入对象
              </span>
            )}
          </div>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            完成上述步骤后即可开始录入测试数据
          </p>
        </div>
      )}
    </div>
  )
}
