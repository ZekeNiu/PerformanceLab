import { useMemo, useState } from 'react'
import ReactECharts from 'echarts-for-react'
import { AnimatePresence, motion } from 'framer-motion'
import { Calendar, GitCompare, Plus, Users, X } from 'lucide-react'
import type { MetricDefinition } from '@/lib/domain-model'
import { METRIC_DEFINITIONS } from '@/lib/metric-registry'
import { mockMeasurementStore } from '@/lib/measurement-store'
import { compareSummaries } from '@/lib/performance-statistics'
import { selectMetricDataGroupSummary } from '@/lib/metric-surface-measurements'
import type {
  ComparisonDataGroupConfig,
  MetricDataGroupConfig,
  MetricSurfaceConfig,
} from '@/lib/metric-surface-config'
import DashboardCard from './DashboardCard'
import {
  LAYER_COLORS,
  cohensDLabel,
  periodicCategories,
  ratingColors,
  significanceBadge,
} from './data'
import type { ComparisonIndicator, ComparisonLayer, PeriodicCategory, PeriodicIndicator } from './data'

type DisplayMode = 'display' | 'longitudinal' | 'cross-sectional'
type AggregateMode = 'mean' | 'best'
type DateMode = 'single' | 'range' | 'unlimited'

interface Props {
  mode?: DisplayMode
}

interface RadarCategoryScore {
  category: string
  score: number
}

interface PeriodicSurfaceData {
  surfaceConfigs: MetricSurfaceConfig[]
  indicators: ComparisonIndicator[]
  categories: string[]
  displayCategories: PeriodicCategory[]
  radarScores: RadarCategoryScore[]
  defaultCrossLayers: ComparisonLayer[]
  athleteLayerOptions: ComparisonLayer[]
  referenceLayerOptions: ComparisonLayer[]
}

const sortedSessions = [...mockMeasurementStore.sessions].sort((a, b) => a.date.localeCompare(b.date))
const primaryAthlete = mockMeasurementStore.athletes[0]
const primaryPosition = primaryAthlete?.position
const primaryTeamId = primaryAthlete?.teamId ?? mockMeasurementStore.teams[0]?.id
const baselineSession = sortedSessions[0]
const comparisonSession = sortedSessions.at(-1) ?? baselineSession

function anchorScore(value: number, target: number, direction: 'higher' | 'lower'): number {
  if (!Number.isFinite(value) || !Number.isFinite(target) || target === 0 || value === 0) return 0
  if (direction === 'higher') return Math.min(100, Math.max(0, Math.round((value / target) * 100)))
  return Math.min(100, Math.max(0, Math.round((target / value) * 100)))
}

function metricDirectionForScore(metric: MetricDefinition): 'higher' | 'lower' {
  return metric.direction === 'lower' ? 'lower' : 'higher'
}

function formatMetricNumber(value: number | null | undefined, precision = 1) {
  if (value == null || Number.isNaN(value)) return 0
  return Number(value.toFixed(precision))
}

function estimateTargetScore(metric: MetricDefinition, values: number[]) {
  if (!values.length) return 1
  const best = metric.direction === 'lower' ? Math.min(...values) : Math.max(...values)
  if (metric.direction === 'lower') return Math.max(0.01, best * 0.96)
  if (metric.direction === 'range') return values.reduce((total, value) => total + value, 0) / values.length
  return best * 1.04
}

function ratingFromScore(score: number) {
  if (score >= 82) return 'A'
  if (score >= 68) return 'B'
  if (score >= 52) return 'C'
  return 'D'
}

function confidenceInterval(mean: number | null, sd: number | null, n: number): [number, number] {
  if (mean == null || sd == null || n < 2) return [formatMetricNumber(mean), formatMetricNumber(mean)]
  const margin = 1.96 * (sd / Math.sqrt(n))
  return [formatMetricNumber(mean - margin), formatMetricNumber(mean + margin)]
}

function metricValues(metricId: string) {
  return mockMeasurementStore.measurements
    .filter((measurement) => measurement.metricId === metricId)
    .map((measurement) => measurement.value)
}

function buildDataGroup(
  id: string,
  label: string,
  subject: MetricDataGroupConfig['subject'],
  options: Partial<MetricDataGroupConfig> = {},
): MetricDataGroupConfig {
  return {
    id,
    label,
    subject,
    time: { kind: 'all' },
    aggregation: 'mean',
    sources: ['manual'],
    ...options,
  }
}

const primaryAthleteGroup = buildDataGroup(
  'primary-athlete-all',
  primaryAthlete?.name ?? 'Primary athlete',
  { kind: 'athlete', athleteIds: primaryAthlete ? [primaryAthlete.id] : [] },
)

const baselineGroup = buildDataGroup(
  'primary-athlete-baseline',
  '基准期',
  primaryAthleteGroup.subject,
  baselineSession ? { time: { kind: 'session', sessionIds: [baselineSession.id] } } : {},
)

const comparisonGroup = buildDataGroup(
  'primary-athlete-current',
  '对比期',
  primaryAthleteGroup.subject,
  comparisonSession ? { time: { kind: 'session', sessionIds: [comparisonSession.id] } } : {},
)

const teamDisplayGroup = buildDataGroup(
  'team-periodic-display',
  '全队展示',
  primaryTeamId
    ? { kind: 'team', teamIds: [primaryTeamId] }
    : {
        kind: 'custom-group',
        id: 'all-athletes',
        label: 'All athletes',
        athleteIds: mockMeasurementStore.athletes.map((athlete) => athlete.id),
      },
)

const positionReferenceGroup = buildDataGroup(
  'position-reference',
  '同位置均值',
  {
    kind: 'reference-group',
    selector: {
      scope: 'team',
      label: '同位置均值',
      teamIds: primaryTeamId ? [primaryTeamId] : undefined,
      positions: primaryPosition ? [primaryPosition] : undefined,
      statistic: 'mean',
      status: 'active',
    },
  },
)

const teamBestGroup = buildDataGroup(
  'team-best',
  '队内最佳',
  primaryTeamId ? { kind: 'team', teamIds: [primaryTeamId] } : teamDisplayGroup.subject,
  { aggregation: 'best' },
)

function buildSurfaceConfig(
  metric: MetricDefinition,
  mode: DisplayMode,
  primaryDataGroup: MetricDataGroupConfig,
  comparisonDataGroups: ComparisonDataGroupConfig[] = [],
): MetricSurfaceConfig {
  return {
    id: `dashboard-periodic-${mode}-${metric.id}`,
    name: metric.name,
    metricId: metric.id,
    mode,
    context: 'dashboard',
    visualization: mode === 'display' ? 'bar-chart' : 'radar-chart',
    primaryDataGroup,
    comparisonDataGroups: comparisonDataGroups.slice(0, 3) as unknown as MetricSurfaceConfig['comparisonDataGroups'],
    annotations: {
      enabled: true,
      types: ['target', 'swc', 'mdc', 'confidence-interval'],
      confidenceLevel: 0.95,
      showSampleSize: true,
      showMethod: true,
    },
    display: {
      showUnit: true,
      showDirection: true,
      showLegend: mode !== 'display',
      showDataLabels: true,
      valuePrecision: metric.unit === 's' ? 2 : 1,
    },
  }
}

function buildComparisonLayer(
  id: string,
  name: string,
  color: string,
  type: ComparisonLayer['type'],
  group: MetricDataGroupConfig,
  metrics: MetricDefinition[],
): ComparisonLayer {
  return {
    id,
    name,
    color,
    type,
    values: Object.fromEntries(
      metrics.map((metric) => {
        const summary = selectMetricDataGroupSummary(metric.id, group)
        return [metric.id, { mean: summary.value ?? summary.mean ?? 0, sd: summary.sd ?? 0, n: summary.n }]
      }),
    ),
  }
}

function buildPeriodicSurfaceData(): PeriodicSurfaceData {
  const periodicMetrics = METRIC_DEFINITIONS.filter((metric) =>
    metric.supportedContexts.includes('periodic') && metricValues(metric.id).length > 0,
  )

  const surfaceConfigs = periodicMetrics.map((metric) =>
    buildSurfaceConfig(metric, 'longitudinal', baselineGroup, [
      { ...comparisonGroup, id: `${comparisonGroup.id}-${metric.id}`, kind: 'longitudinal' },
      { ...positionReferenceGroup, id: `${positionReferenceGroup.id}-${metric.id}`, kind: 'cross-sectional' },
      { ...teamBestGroup, id: `${teamBestGroup.id}-${metric.id}`, kind: 'cross-sectional' },
    ]),
  )

  const indicators = periodicMetrics.flatMap((metric) => {
    const config = surfaceConfigs.find((surface) => surface.metricId === metric.id)
    const baseline = config ? selectMetricDataGroupSummary(metric.id, config.primaryDataGroup) : null
    const currentGroup = config?.comparisonDataGroups?.[0]
    const current = currentGroup ? selectMetricDataGroupSummary(metric.id, currentGroup) : null
    const values = metricValues(metric.id)
    if (!baseline || !current || baseline.value == null || current.value == null) return []

    return [{
      id: metric.id,
      name: metric.name,
      category: metric.categoryName,
      unit: metric.unit,
      targetScore: estimateTargetScore(metric, values),
      valueA: baseline.value,
      sdA: baseline.sd ?? 0,
      nA: baseline.n,
      valueB: current.value,
      sdB: current.sd ?? 0,
      nB: current.n,
      direction: metricDirectionForScore(metric),
    }]
  })

  const displayCategories = Object.values(
    periodicMetrics.reduce<Record<string, PeriodicCategory>>((groups, metric) => {
      const values = metricValues(metric.id)
      const summary = selectMetricDataGroupSummary(metric.id, teamDisplayGroup)
      if (summary.value == null && summary.mean == null) return groups

      const value = summary.value ?? summary.mean
      const mean = summary.mean ?? value ?? 0
      const sd = summary.sd ?? 0
      const score = anchorScore(value ?? 0, estimateTargetScore(metric, values), metricDirectionForScore(metric))
      const indicator: PeriodicIndicator = {
        name: metric.name,
        unit: metric.unit,
        mean: formatMetricNumber(mean, metric.unit === 's' ? 2 : 1),
        best: formatMetricNumber(summary.best, metric.unit === 's' ? 2 : 1),
        sd: formatMetricNumber(sd, metric.unit === 's' ? 2 : 1),
        cv: mean ? formatMetricNumber(Math.abs((sd / mean) * 100), 1) : 0,
        ci: confidenceInterval(mean, sd, summary.n),
        rating: ratingFromScore(score),
        score,
      }

      if (!groups[metric.categoryName]) groups[metric.categoryName] = { name: metric.categoryName, indicators: [] }
      groups[metric.categoryName].indicators.push(indicator)
      return groups
    }, {}),
  )

  const categories = Object.keys(
    indicators.reduce<Record<string, true>>((groups, indicator) => {
      groups[indicator.category] = true
      return groups
    }, {}),
  )

  const radarScores = displayCategories.map((category) => ({
    category: category.name,
    score: Math.round(category.indicators.reduce((total, indicator) => total + indicator.score, 0) / category.indicators.length),
  }))

  const referenceLayerOptions = [
    buildComparisonLayer('position-reference', positionReferenceGroup.label, '#3B82F6', 'group', positionReferenceGroup, periodicMetrics),
    buildComparisonLayer('team-best', teamBestGroup.label, '#8B5CF6', 'group', teamBestGroup, periodicMetrics),
  ]

  const athleteLayerOptions = mockMeasurementStore.athletes
    .filter((athlete) => athlete.id !== primaryAthlete?.id)
    .slice(0, 6)
    .map((athlete, index) =>
      buildComparisonLayer(
        `athlete-${athlete.id}`,
        athlete.name,
        LAYER_COLORS[index % LAYER_COLORS.length],
        'individual',
        buildDataGroup(`athlete-${athlete.id}`, athlete.name, { kind: 'athlete', athleteIds: [athlete.id] }),
        periodicMetrics,
      ),
    )

  return {
    surfaceConfigs,
    indicators,
    categories,
    displayCategories: displayCategories.length ? displayCategories : periodicCategories,
    radarScores: radarScores.length ? radarScores : periodicCategories.map((category) => ({
      category: category.name,
      score: Math.round(category.indicators.reduce((total, indicator) => total + indicator.score, 0) / category.indicators.length),
    })),
    defaultCrossLayers: referenceLayerOptions.slice(0, 1),
    athleteLayerOptions,
    referenceLayerOptions,
  }
}

const periodicSurfaceData = buildPeriodicSurfaceData()

function RadarChartDisplay({ data }: { data: RadarCategoryScore[] }) {
  const option = useMemo(() => ({
    radar: {
      indicator: data.map((item) => ({
        name: item.category,
        max: 100,
        nameStyle: { color: '#E8ECF1', fontSize: 13, fontWeight: 600 },
      })),
      shape: 'polygon' as const,
      splitNumber: 5,
      axisNameGap: 12,
      splitLine: { lineStyle: { color: 'rgba(42,51,72,0.6)', width: 1 } },
      splitArea: {
        show: true,
        areaStyle: { color: ['rgba(20,24,33,0.5)', 'rgba(20,24,33,0.3)'] },
      },
      axisLine: { lineStyle: { color: 'rgba(42,51,72,0.8)' } },
    },
    series: [{
      name: '综合能力',
      type: 'radar',
      data: [{
        value: data.map((item) => item.score),
        name: '当前得分',
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: { color: '#00D4AA', width: 2 },
        itemStyle: { color: '#00D4AA', borderColor: '#fff', borderWidth: 2 },
        areaStyle: { color: 'rgba(0,212,170,0.2)' },
        label: {
          show: true,
          formatter: (params: { value: number }) => params.value.toString(),
          color: '#E8ECF1',
          fontSize: 11,
          fontFamily: 'JetBrains Mono',
          distance: 8,
        },
      }],
      animationDuration: 800,
      animationEasing: 'cubicOut' as const,
      animationDelay: (idx: number) => idx * 100,
    }],
    tooltip: {
      trigger: 'item' as const,
      backgroundColor: '#1C2130',
      borderColor: '#2A3348',
      textStyle: { color: '#E8ECF1', fontSize: 12 },
    },
  }), [data])

  return (
    <DashboardCard
      title="综合能力评估"
      configOptions={[{ label: 'Registry + measurement store', value: 'registry' }]}
      currentConfig="registry"
    >
      <ReactECharts option={option} style={{ height: 380 }} />
    </DashboardCard>
  )
}

function CategoryCard({ category }: { category: PeriodicCategory }) {
  const avgScore = Math.round(category.indicators.reduce((sum, indicator) => sum + indicator.score, 0) / category.indicators.length)
  const option = useMemo(() => ({
    grid: { top: 8, right: 80, bottom: 16, left: 140 },
    xAxis: {
      type: 'value' as const,
      max: 100,
      axisLine: { show: false },
      splitLine: { lineStyle: { color: 'rgba(42,51,72,0.3)' } },
      axisLabel: { color: '#5A6579', fontSize: 10 },
    },
    yAxis: {
      type: 'category' as const,
      data: category.indicators.map((indicator) => indicator.name).reverse(),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#8B95A5', fontSize: 11, width: 130, overflow: 'truncate' as const },
    },
    tooltip: { trigger: 'axis' as const, backgroundColor: '#1C2130', borderColor: '#2A3348', textStyle: { color: '#E8ECF1', fontSize: 11 } },
    series: [{
      type: 'bar',
      data: category.indicators.map((indicator) => ({
        value: indicator.score,
        itemStyle: {
          color: indicator.score >= 80 ? '#10B981' : indicator.score >= 60 ? '#00D4AA' : indicator.score >= 40 ? '#F59E0B' : '#EF4444',
          borderRadius: [0, 4, 4, 0],
        },
      })).reverse(),
      barWidth: 16,
      label: {
        show: true,
        position: 'right' as const,
        formatter: (params: { value: number }) => `${params.value}`,
        color: '#E8ECF1',
        fontSize: 12,
        fontFamily: 'JetBrains Mono',
        fontWeight: 500,
      },
    }],
    animationDuration: 800,
    animationEasing: 'cubicOut' as const,
  }), [category])

  return (
    <DashboardCard title={`${category.name}测试`} footer={<span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>基于 {category.indicators.length} 项 registry 指标</span>}>
      <div className="mb-3 flex items-center gap-2">
        <span className="rounded-full px-2.5 py-0.5 text-[11px] font-medium" style={{ backgroundColor: 'rgba(0,212,170,0.15)', color: '#00D4AA' }}>
          均值 {avgScore}/100
        </span>
      </div>
      <ReactECharts option={option} style={{ height: category.indicators.length * 40 + 40 }} />
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-[11px]">
          <thead>
            <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border-subtle)' }}>
              <th className="py-1.5 pr-2 text-left font-medium">指标</th>
              <th className="py-1.5 pr-2 text-left font-medium">单位</th>
              <th className="py-1.5 pr-2 text-right font-medium">均值</th>
              <th className="py-1.5 pr-2 text-right font-medium">最佳</th>
              <th className="py-1.5 pr-2 text-right font-medium">SD</th>
              <th className="py-1.5 pr-2 text-right font-medium">CV%</th>
              <th className="py-1.5 pr-2 text-right font-medium">CI</th>
              <th className="py-1.5 text-center font-medium">评级</th>
            </tr>
          </thead>
          <tbody>
            {category.indicators.map((indicator) => (
              <tr key={indicator.name} style={{ borderBottom: '1px solid rgba(42,51,72,0.3)' }}>
                <td className="py-1.5 pr-2" style={{ color: 'var(--text-primary)' }}>{indicator.name}</td>
                <td className="py-1.5 pr-2 font-mono" style={{ color: 'var(--text-secondary)' }}>{indicator.unit}</td>
                <td className="py-1.5 pr-2 text-right font-mono" style={{ color: 'var(--text-primary)' }}>{indicator.mean}</td>
                <td className="py-1.5 pr-2 text-right font-mono" style={{ color: 'var(--text-primary)' }}>{indicator.best}</td>
                <td className="py-1.5 pr-2 text-right font-mono" style={{ color: 'var(--text-secondary)' }}>{indicator.sd}</td>
                <td className="py-1.5 pr-2 text-right font-mono" style={{ color: 'var(--text-secondary)' }}>{indicator.cv}%</td>
                <td className="py-1.5 pr-2 text-right font-mono" style={{ color: 'var(--text-secondary)' }}>[{indicator.ci[0]}, {indicator.ci[1]}]</td>
                <td className="py-1.5 text-center">
                  <span className="inline-block rounded px-1.5 py-0.5 text-[10px] font-bold" style={{ backgroundColor: `${ratingColors[indicator.rating]}20`, color: ratingColors[indicator.rating] }}>
                    {indicator.rating}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardCard>
  )
}

function AggregateSwitch({ aggregate, setAggregate }: { aggregate: AggregateMode; setAggregate: (value: AggregateMode) => void }) {
  return (
    <div className="flex items-center gap-1 rounded-lg border p-0.5" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-subtle)' }}>
      {[{ key: 'mean' as const, label: '均值' }, { key: 'best' as const, label: '最佳值' }].map((option) => (
        <button
          key={option.key}
          onClick={() => setAggregate(option.key)}
          className="rounded-md px-3 py-1.5 text-[12px] transition-colors"
          style={{ backgroundColor: aggregate === option.key ? 'var(--accent-cyan)' : 'transparent', color: aggregate === option.key ? '#0B0E14' : 'var(--text-secondary)' }}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

function LongitudinalControlBar({
  dateMode,
  setDateMode,
  aggregate,
  setAggregate,
}: {
  dateMode: DateMode
  setDateMode: (value: DateMode) => void
  aggregate: AggregateMode
  setAggregate: (value: AggregateMode) => void
}) {
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [dateStart, setDateStart] = useState(baselineSession?.date ?? '2024-01-01')
  const [dateEnd, setDateEnd] = useState(comparisonSession?.date ?? '2024-03-31')
  const dateLabel = dateMode === 'unlimited' ? '不限时间' : dateMode === 'single' ? dateStart : `${dateStart} ~ ${dateEnd}`

  return (
    <div className="flex min-h-[52px] flex-wrap items-center gap-3 border-b px-4 py-2" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-subtle)' }}>
      <div className="relative">
        <button onClick={() => setShowDatePicker(!showDatePicker)} className="flex h-9 items-center gap-2 rounded-lg border px-4 text-[13px] transition-colors" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}>
          <Calendar size={16} style={{ color: 'var(--text-muted)' }} />
          <span>基准期</span>
          <span style={{ color: 'var(--text-secondary)' }}>{dateLabel}</span>
        </button>
        <AnimatePresence>
          {showDatePicker && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowDatePicker(false)} />
              <motion.div className="absolute left-0 top-full z-50 mt-1 w-72 rounded-lg border p-4" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-subtle)', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                <p className="mb-3 text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>选择日期方式</p>
                <div className="mb-3 flex gap-2">
                  {[{ value: 'single' as const, label: '指定日期' }, { value: 'range' as const, label: '日期范围' }, { value: 'unlimited' as const, label: '不限' }].map((option) => (
                    <button key={option.value} className="rounded-md px-3 py-1.5 text-[12px] transition-colors" style={{ backgroundColor: dateMode === option.value ? 'var(--accent-cyan)' : 'var(--bg-secondary)', color: dateMode === option.value ? '#0B0E14' : 'var(--text-primary)' }} onClick={() => setDateMode(option.value)}>
                      {option.label}
                    </button>
                  ))}
                </div>
                {dateMode !== 'unlimited' && (
                  <div className="mb-3 space-y-2">
                    <input type="date" value={dateStart} onChange={(event) => setDateStart(event.target.value)} className="w-full rounded-md border px-2 py-1.5 text-[12px]" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }} />
                    {dateMode === 'range' && (
                      <input type="date" value={dateEnd} onChange={(event) => setDateEnd(event.target.value)} className="w-full rounded-md border px-2 py-1.5 text-[12px]" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }} />
                    )}
                  </div>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
      <AggregateSwitch aggregate={aggregate} setAggregate={setAggregate} />
      <div className="flex items-center gap-2 text-[12px]" style={{ color: 'var(--text-muted)' }}>
        <GitCompare size={14} />
        <span>{baselineGroup.label} vs {comparisonGroup.label}</span>
      </div>
    </div>
  )
}

function CrossSectionalControlBar({
  layers,
  setLayers,
  aggregate,
  setAggregate,
  athleteLayerOptions,
  referenceLayerOptions,
}: {
  layers: ComparisonLayer[]
  setLayers: (value: ComparisonLayer[]) => void
  aggregate: AggregateMode
  setAggregate: (value: AggregateMode) => void
  athleteLayerOptions: ComparisonLayer[]
  referenceLayerOptions: ComparisonLayer[]
}) {
  const [showAddLayer, setShowAddLayer] = useState(false)

  const addLayer = (preset: ComparisonLayer) => {
    if (layers.length >= 3 || layers.some((layer) => layer.id === preset.id)) return
    setLayers([...layers, preset])
    setShowAddLayer(false)
  }

  const removeLayer = (id: string) => {
    setLayers(layers.filter((layer) => layer.id !== id))
  }

  return (
    <div className="flex min-h-[52px] flex-wrap items-center gap-3 border-b px-4 py-2" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-subtle)' }}>
      <AggregateSwitch aggregate={aggregate} setAggregate={setAggregate} />
      <div className="flex flex-wrap items-center gap-2">
        {layers.map((layer) => (
          <span key={layer.id} className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium" style={{ backgroundColor: `${layer.color}20`, color: layer.color }}>
            {layer.name}
            <button onClick={() => removeLayer(layer.id)} className="ml-1" aria-label={`移除 ${layer.name}`}>
              <X size={10} />
            </button>
          </span>
        ))}
      </div>
      <div className="relative">
        <button onClick={() => setShowAddLayer(!showAddLayer)} className="flex h-9 items-center gap-1 rounded-lg border px-3 text-[12px] transition-colors" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}>
          <Plus size={14} />
          添加对比数据
        </button>
        <AnimatePresence>
          {showAddLayer && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowAddLayer(false)} />
              <motion.div className="absolute left-0 top-full z-50 mt-1 w-64 rounded-lg border p-3" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-subtle)', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                <p className="mb-2 text-[12px] font-semibold" style={{ color: 'var(--accent-cyan)' }}>运动员</p>
                {athleteLayerOptions.slice(0, 4).map((layer) => (
                  <button key={layer.id} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[12px] transition-colors hover:bg-[var(--bg-hover)]" style={{ color: layers.some((item) => item.id === layer.id) ? 'var(--text-muted)' : 'var(--text-primary)' }} onClick={() => addLayer(layer)} disabled={layers.some((item) => item.id === layer.id)}>
                    <Users size={12} style={{ color: layer.color }} />
                    {layer.name}
                  </button>
                ))}
                <div className="mt-2 border-t pt-2" style={{ borderColor: 'var(--border-subtle)' }}>
                  <p className="mb-2 text-[12px] font-semibold" style={{ color: 'var(--accent-purple)' }}>参考群体</p>
                  {referenceLayerOptions.map((layer) => (
                    <button key={layer.id} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[12px] transition-colors hover:bg-[var(--bg-hover)]" style={{ color: layers.some((item) => item.id === layer.id) ? 'var(--text-muted)' : 'var(--text-primary)' }} onClick={() => addLayer(layer)} disabled={layers.some((item) => item.id === layer.id)}>
                      <Users size={12} style={{ color: layer.color }} />
                      {layer.name}
                    </button>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function buildCategoryScores(indicators: ComparisonIndicator[], categories: string[], aggregate: AggregateMode, layer?: ComparisonLayer) {
  return categories.map((category) => {
    const categoryIndicators = indicators.filter((indicator) => indicator.category === category)
    if (!categoryIndicators.length) return 0
    const scoreTotal = categoryIndicators.reduce((total, indicator) => {
      const layerValue = layer?.values[indicator.id]
      const value = layerValue
        ? aggregate === 'mean' ? layerValue.mean : layerValue.mean + layerValue.sd
        : aggregate === 'mean' ? indicator.valueB : indicator.valueB + indicator.sdB
      return total + anchorScore(value, indicator.targetScore, indicator.direction)
    }, 0)
    return Math.round(scoreTotal / categoryIndicators.length)
  })
}

function ComparisonRadar({
  title,
  baseLabel,
  indicators,
  categories,
  aggregate,
  layers = [],
}: {
  title: string
  baseLabel: string
  indicators: ComparisonIndicator[]
  categories: string[]
  aggregate: AggregateMode
  layers?: ComparisonLayer[]
}) {
  const option = useMemo(() => {
    const baseScores = categories.map((category) => {
      const categoryIndicators = indicators.filter((indicator) => indicator.category === category)
      if (!categoryIndicators.length) return 0
      return Math.round(categoryIndicators.reduce((total, indicator) => {
        const value = aggregate === 'mean' ? indicator.valueA : indicator.valueA + indicator.sdA
        return total + anchorScore(value, indicator.targetScore, indicator.direction)
      }, 0) / categoryIndicators.length)
    })
    const compareScores = layers.length
      ? layers.map((layer) => buildCategoryScores(indicators, categories, aggregate, layer))
      : [buildCategoryScores(indicators, categories, aggregate)]

    return {
      radar: {
        indicator: categories.map((category) => ({ name: category, max: 100, nameStyle: { color: '#E8ECF1', fontSize: 13, fontWeight: 600 } })),
        shape: 'polygon' as const,
        splitNumber: 5,
        axisNameGap: 12,
        splitLine: { lineStyle: { color: 'rgba(42,51,72,0.6)', width: 1 } },
        splitArea: { show: true, areaStyle: { color: ['rgba(20,24,33,0.5)', 'rgba(20,24,33,0.3)'] } },
        axisLine: { lineStyle: { color: 'rgba(42,51,72,0.8)' } },
      },
      legend: {
        data: [baseLabel, ...(layers.length ? layers.map((layer) => layer.name) : ['对比期'])],
        bottom: 0,
        textStyle: { color: '#8B95A5', fontSize: 11 },
      },
      series: [{
        type: 'radar',
        data: [
          {
            value: baseScores,
            name: baseLabel,
            lineStyle: { color: layers.length ? '#00D4AA' : '#5A6579', width: 2, type: layers.length ? 'solid' : 'dashed' },
            itemStyle: { color: layers.length ? '#00D4AA' : '#5A6579' },
            areaStyle: { color: layers.length ? 'rgba(0,212,170,0.15)' : 'rgba(90,101,121,0.1)' },
            symbol: 'circle',
            symbolSize: 7,
          },
          ...compareScores.map((scores, index) => {
            const layer = layers[index]
            const color = layer?.color ?? '#00D4AA'
            return {
              value: scores,
              name: layer?.name ?? '对比期',
              lineStyle: { color, width: 2, type: index === 0 ? 'solid' as const : 'dashed' as const },
              itemStyle: { color },
              areaStyle: { color: index === 0 && !layers.length ? 'rgba(0,212,170,0.2)' : 'transparent' },
              symbol: 'diamond',
              symbolSize: 6,
            }
          }),
        ],
        animationDuration: 800,
      }],
      tooltip: { trigger: 'item' as const, backgroundColor: '#1C2130', borderColor: '#2A3348', textStyle: { color: '#E8ECF1', fontSize: 12 } },
    }
  }, [aggregate, baseLabel, categories, indicators, layers])

  return (
    <DashboardCard title={title} configOptions={[{ label: 'MetricSurfaceConfig', value: 'surface' }]} currentConfig="surface">
      <ReactECharts option={option} style={{ height: 360 }} />
    </DashboardCard>
  )
}

function LongitudinalCategorySection({ category, aggregate, indicators }: { category: string; aggregate: AggregateMode; indicators: ComparisonIndicator[] }) {
  const categoryIndicators = useMemo(() => indicators.filter((indicator) => indicator.category === category), [category, indicators])
  const tableRows = useMemo(() => categoryIndicators.map((indicator) => {
    const vA = aggregate === 'mean' ? indicator.valueA : indicator.valueA + indicator.sdA
    const vB = aggregate === 'mean' ? indicator.valueB : indicator.valueB + indicator.sdB
    const stats = compareSummaries({
      baseline: { mean: vA, sd: indicator.sdA, n: indicator.nA },
      comparison: { mean: vB, sd: indicator.sdB, n: indicator.nB },
    })
    const diff = stats.change.value
    const pctChange = stats.percentChange.value
    const isGood = indicator.direction === 'higher' ? diff > 0 : diff < 0
    const sig = significanceBadge(stats.pValue.value)
    return {
      ...indicator,
      vA,
      vB,
      te: stats.te.value,
      mdc: stats.mdc.value,
      swc: stats.swc.value,
      snr: stats.snr.value,
      cohensD: stats.effectSize.value,
      pValue: stats.pValue.value,
      diff,
      pctChange,
      isGood,
      sig,
      statisticsMetadata: stats.metadata,
    }
  }), [aggregate, categoryIndicators])

  const chartOption = useMemo(() => {
    const names = categoryIndicators.map((indicator) => indicator.name)
    const baseValues = categoryIndicators.map((indicator) => anchorScore(aggregate === 'mean' ? indicator.valueA : indicator.valueA + indicator.sdA, indicator.targetScore, indicator.direction))
    const compareValues = categoryIndicators.map((indicator) => anchorScore(aggregate === 'mean' ? indicator.valueB : indicator.valueB + indicator.sdB, indicator.targetScore, indicator.direction))
    return {
      grid: { top: 30, right: 30, bottom: 24, left: 140 },
      legend: { data: [baselineGroup.label, comparisonGroup.label], top: 0, textStyle: { color: '#8B95A5', fontSize: 11 } },
      xAxis: { type: 'value' as const, max: 100, axisLine: { show: false }, splitLine: { lineStyle: { color: 'rgba(42,51,72,0.3)' } }, axisLabel: { color: '#5A6579', fontSize: 10, formatter: '{value}%' } },
      yAxis: { type: 'category' as const, data: names.reverse(), axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: '#8B95A5', fontSize: 11, width: 130, overflow: 'truncate' as const } },
      tooltip: { trigger: 'axis' as const, backgroundColor: '#1C2130', borderColor: '#2A3348', textStyle: { color: '#E8ECF1', fontSize: 11 } },
      series: [
        { name: baselineGroup.label, type: 'bar', data: baseValues.reverse().map((value) => ({ value, itemStyle: { color: '#5A6579', borderRadius: [0, 4, 4, 0] } })), barWidth: 12, barGap: '20%' },
        { name: comparisonGroup.label, type: 'bar', data: compareValues.reverse().map((value) => ({ value, itemStyle: { color: '#00D4AA', borderRadius: [0, 4, 4, 0] } })), barWidth: 12 },
      ],
      animationDuration: 800,
      animationEasing: 'cubicOut' as const,
    }
  }, [aggregate, categoryIndicators])

  if (!categoryIndicators.length) return null

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <DashboardCard title={`${category} - 锚定得分对比`}>
        <ReactECharts option={chartOption} style={{ height: categoryIndicators.length * 50 + 60 }} />
      </DashboardCard>
      <DashboardCard title={`${category} - 统计参数`}>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border-subtle)' }}>
                <th className="py-1.5 pr-2 text-left font-medium">指标</th>
                <th className="py-1.5 pr-2 text-right font-medium">基准</th>
                <th className="py-1.5 pr-2 text-right font-medium">对比</th>
                <th className="py-1.5 pr-2 text-right font-medium">变化</th>
                <th className="py-1.5 pr-2 text-right font-medium">TE</th>
                <th className="py-1.5 pr-2 text-right font-medium">MDC</th>
                <th className="py-1.5 pr-2 text-right font-medium">SWC</th>
                <th className="py-1.5 pr-2 text-right font-medium">SNR</th>
                <th className="py-1.5 pr-2 text-right font-medium">d</th>
                <th className="py-1.5 text-center font-medium">显著性</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row) => (
                <tr
                  key={row.id}
                  title={`${row.statisticsMetadata.method}; quality=${row.statisticsMetadata.dataQuality.status}; n=${row.statisticsMetadata.sampleSize.n}`}
                  style={{ borderBottom: '1px solid rgba(42,51,72,0.3)' }}
                >
                  <td className="py-1.5 pr-2" style={{ color: 'var(--text-primary)' }}>{row.name}</td>
                  <td className="py-1.5 pr-2 text-right font-mono" style={{ color: '#5A6579' }}>{row.vA.toFixed(1)}</td>
                  <td className="py-1.5 pr-2 text-right font-mono" style={{ color: '#00D4AA' }}>{row.vB.toFixed(1)}</td>
                  <td className="py-1.5 pr-2 text-right font-mono" style={{ color: row.isGood ? '#10B981' : '#EF4444' }}>{row.pctChange > 0 ? '+' : ''}{row.pctChange.toFixed(1)}%</td>
                  <td className="py-1.5 pr-2 text-right font-mono" style={{ color: 'var(--text-secondary)' }}>{row.te.toFixed(2)}</td>
                  <td className="py-1.5 pr-2 text-right font-mono" style={{ color: 'var(--text-secondary)' }}>{row.mdc.toFixed(2)}</td>
                  <td className="py-1.5 pr-2 text-right font-mono" style={{ color: 'var(--text-secondary)' }}>{row.swc.toFixed(2)}</td>
                  <td className="py-1.5 pr-2 text-right font-mono" style={{ color: row.snr > 1 ? '#00D4AA' : 'var(--text-secondary)' }}>{row.snr.toFixed(2)}</td>
                  <td className="py-1.5 pr-2 text-right font-mono" style={{ color: cohensDLabel(row.cohensD).color }}>{row.cohensD.toFixed(2)}</td>
                  <td className="py-1.5 text-center">
                    <span className="inline-block rounded px-1.5 py-0.5 text-[10px] font-bold" style={{ backgroundColor: `${row.sig.color}20`, color: row.sig.color }}>{row.sig.text}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DashboardCard>
    </div>
  )
}

function CrossSectionalCategorySection({ category, aggregate, indicators, layers }: { category: string; aggregate: AggregateMode; indicators: ComparisonIndicator[]; layers: ComparisonLayer[] }) {
  const categoryIndicators = useMemo(() => indicators.filter((indicator) => indicator.category === category), [category, indicators])
  const chartOption = useMemo(() => {
    const names = categoryIndicators.map((indicator) => indicator.name)
    const baseValues = categoryIndicators.map((indicator) => anchorScore(aggregate === 'mean' ? indicator.valueA : indicator.valueA + indicator.sdA, indicator.targetScore, indicator.direction))
    const layerSeries = layers.map((layer, index) => ({
      name: layer.name,
      type: 'bar' as const,
      data: categoryIndicators.map((indicator) => {
        const layerValue = layer.values[indicator.id]
        const value = layerValue ? (aggregate === 'mean' ? layerValue.mean : layerValue.mean + layerValue.sd) : indicator.valueB
        return { value: anchorScore(value, indicator.targetScore, indicator.direction), itemStyle: { color: layer.color, borderRadius: [0, 4, 4, 0] } }
      }).reverse(),
      barWidth: 12,
      barGap: index === 0 ? '20%' : '0%',
    }))

    return {
      grid: { top: 30, right: 30, bottom: 24, left: 140 },
      legend: { data: [primaryAthleteGroup.label, ...layers.map((layer) => layer.name)], top: 0, textStyle: { color: '#8B95A5', fontSize: 11 } },
      xAxis: { type: 'value' as const, max: 100, axisLine: { show: false }, splitLine: { lineStyle: { color: 'rgba(42,51,72,0.3)' } }, axisLabel: { color: '#5A6579', fontSize: 10, formatter: '{value}%' } },
      yAxis: { type: 'category' as const, data: names.reverse(), axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: '#8B95A5', fontSize: 11, width: 130, overflow: 'truncate' as const } },
      tooltip: { trigger: 'axis' as const, backgroundColor: '#1C2130', borderColor: '#2A3348', textStyle: { color: '#E8ECF1', fontSize: 11 } },
      series: [
        { name: primaryAthleteGroup.label, type: 'bar', data: baseValues.reverse().map((value) => ({ value, itemStyle: { color: '#00D4AA', borderRadius: [0, 4, 4, 0] } })), barWidth: 12, barGap: '20%' },
        ...layerSeries,
      ],
      animationDuration: 800,
      animationEasing: 'cubicOut' as const,
    }
  }, [aggregate, categoryIndicators, layers])

  const tableRows = useMemo(() => categoryIndicators.map((indicator) => {
    const vBase = aggregate === 'mean' ? indicator.valueA : indicator.valueA + indicator.sdA
    const layerStats = layers.map((layer) => {
      const layerValue = layer.values[indicator.id]
      const vLayer = layerValue ? (aggregate === 'mean' ? layerValue.mean : layerValue.mean + layerValue.sd) : indicator.valueB
      const sdLayer = layerValue?.sd ?? indicator.sdB
      const nLayer = layerValue?.n ?? indicator.nB
      const stats = compareSummaries({
        baseline: { mean: vBase, sd: indicator.sdA, n: indicator.nA },
        comparison: { mean: vLayer, sd: sdLayer, n: nLayer },
      })
      const sig = significanceBadge(stats.pValue.value)
      return {
        layerName: layer.name,
        layerColor: layer.color,
        vLayer,
        diff: stats.change.value,
        pct: stats.percentChange.value,
        te: stats.te.value,
        mdc: stats.mdc.value,
        swc: stats.swc.value,
        snr: stats.snr.value,
        cohensD: stats.effectSize.value,
        pValue: stats.pValue.value,
        sig,
        statisticsMetadata: stats.metadata,
      }
    })
    return { ...indicator, vBase, layerStats }
  }), [aggregate, categoryIndicators, layers])

  if (!categoryIndicators.length) return null

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <DashboardCard title={`${category} - 锚定得分对比`}>
        <ReactECharts option={chartOption} style={{ height: categoryIndicators.length * 50 + 60 }} />
      </DashboardCard>
      <DashboardCard title={`${category} - 统计参数`}>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border-subtle)' }}>
                <th className="py-1.5 pr-2 text-left font-medium">指标</th>
                <th className="py-1.5 pr-2 text-right font-medium">当前</th>
                {layers.map((layer) => (
                  <th key={layer.id} className="py-1.5 pr-2 text-right font-medium" style={{ color: layer.color }}>{layer.name}</th>
                ))}
                <th className="py-1.5 pr-2 text-right font-medium">变化</th>
                <th className="py-1.5 pr-2 text-right font-medium">MDC</th>
                <th className="py-1.5 pr-2 text-right font-medium">SWC</th>
                <th className="py-1.5 pr-2 text-right font-medium">SNR</th>
                <th className="py-1.5 text-center font-medium">显著性</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row) => {
                const firstLayer = row.layerStats[0]
                return (
                  <tr
                    key={row.id}
                    title={firstLayer ? `${firstLayer.statisticsMetadata.method}; quality=${firstLayer.statisticsMetadata.dataQuality.status}; n=${firstLayer.statisticsMetadata.sampleSize.n}` : undefined}
                    style={{ borderBottom: '1px solid rgba(42,51,72,0.3)' }}
                  >
                    <td className="py-1.5 pr-2" style={{ color: 'var(--text-primary)' }}>{row.name}</td>
                    <td className="py-1.5 pr-2 text-right font-mono" style={{ color: '#00D4AA' }}>{row.vBase.toFixed(1)}</td>
                    {row.layerStats.map((layerStat) => (
                      <td key={layerStat.layerName} className="py-1.5 pr-2 text-right font-mono" style={{ color: layerStat.layerColor }}>{layerStat.vLayer.toFixed(1)}</td>
                    ))}
                    {firstLayer && (
                      <>
                        <td className="py-1.5 pr-2 text-right font-mono" style={{ color: firstLayer.pct > 0 ? (row.direction === 'higher' ? '#10B981' : '#EF4444') : (row.direction === 'higher' ? '#EF4444' : '#10B981') }}>
                          {firstLayer.pct > 0 ? '+' : ''}{firstLayer.pct.toFixed(1)}%
                        </td>
                        <td className="py-1.5 pr-2 text-right font-mono" style={{ color: 'var(--text-secondary)' }}>{firstLayer.mdc.toFixed(2)}</td>
                        <td className="py-1.5 pr-2 text-right font-mono" style={{ color: 'var(--text-secondary)' }}>{firstLayer.swc.toFixed(2)}</td>
                        <td className="py-1.5 pr-2 text-right font-mono" style={{ color: firstLayer.snr > 1 ? '#00D4AA' : 'var(--text-secondary)' }}>{firstLayer.snr.toFixed(2)}</td>
                        <td className="py-1.5 text-center">
                          <span className="inline-block rounded px-1.5 py-0.5 text-[10px] font-bold" style={{ backgroundColor: `${firstLayer.sig.color}20`, color: firstLayer.sig.color }}>{firstLayer.sig.text}</span>
                        </td>
                      </>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </DashboardCard>
    </div>
  )
}

export default function PeriodicTesting({ mode = 'display' }: Props) {
  const [longDateMode, setLongDateMode] = useState<DateMode>('range')
  const [longAggregate, setLongAggregate] = useState<AggregateMode>('mean')
  const [layers, setLayers] = useState<ComparisonLayer[]>(periodicSurfaceData.defaultCrossLayers)
  const [crossAggregate, setCrossAggregate] = useState<AggregateMode>('mean')

  const surfaceConfigCount = periodicSurfaceData.surfaceConfigs.length

  if (mode === 'display') {
    return (
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-4" data-surface-config-count={surfaceConfigCount}>
        <div className="col-span-1 xl:col-span-4">
          <RadarChartDisplay data={periodicSurfaceData.radarScores} />
        </div>
        {periodicSurfaceData.displayCategories.map((category) => (
          <div key={category.name} className="col-span-1 xl:col-span-2">
            <CategoryCard category={category} />
          </div>
        ))}
      </div>
    )
  }

  if (mode === 'longitudinal') {
    return (
      <div className="flex flex-col gap-6" data-surface-config-count={surfaceConfigCount}>
        <LongitudinalControlBar dateMode={longDateMode} setDateMode={setLongDateMode} aggregate={longAggregate} setAggregate={setLongAggregate} />
        <div className="grid grid-cols-1 gap-6">
          <ComparisonRadar
            title="纵向能力对比（目标锚定）"
            baseLabel={baselineGroup.label}
            indicators={periodicSurfaceData.indicators}
            categories={periodicSurfaceData.categories}
            aggregate={longAggregate}
          />
          {periodicSurfaceData.categories.map((category) => (
            <LongitudinalCategorySection key={category} category={category} aggregate={longAggregate} indicators={periodicSurfaceData.indicators} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6" data-surface-config-count={surfaceConfigCount}>
      <CrossSectionalControlBar
        layers={layers}
        setLayers={setLayers}
        aggregate={crossAggregate}
        setAggregate={setCrossAggregate}
        athleteLayerOptions={periodicSurfaceData.athleteLayerOptions}
        referenceLayerOptions={periodicSurfaceData.referenceLayerOptions}
      />
      <div className="grid grid-cols-1 gap-6">
        <ComparisonRadar
          title="横向能力对比（目标锚定）"
          baseLabel={primaryAthleteGroup.label}
          indicators={periodicSurfaceData.indicators}
          categories={periodicSurfaceData.categories}
          aggregate={crossAggregate}
          layers={layers}
        />
        {periodicSurfaceData.categories.map((category) => (
          <CrossSectionalCategorySection key={category} category={category} aggregate={crossAggregate} indicators={periodicSurfaceData.indicators} layers={layers} />
        ))}
      </div>
    </div>
  )
}
