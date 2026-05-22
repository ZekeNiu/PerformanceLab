import { useState, useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import { motion } from 'framer-motion'
import { GitCompare, Calendar, Plus, X, Users } from 'lucide-react'
import DashboardCard from './DashboardCard'
import {
  radarData,
  periodicCategories,
  ratingColors,
  DEMO_INDICATORS,
  DEMO_LAYERS,
  LAYER_COLORS,
  athletes,
  calcTE,
  calcMDC,
  calcSWC,
  calcSNR,
  calcCohensD,
  cohensDLabel,
  calcPairedTTest,
  significanceBadge,
} from './data'
import type { ComparisonLayer } from './data'

type DisplayMode = 'display' | 'longitudinal' | 'cross-sectional'
type AggregateMode = 'mean' | 'best'

interface Props {
  mode?: DisplayMode
}

// ═══════════════════════════════════════════
//  Anchor score: normalize to 0-100% scale
// ═══════════════════════════════════════════
function anchorScore(value: number, target: number, direction: 'higher' | 'lower'): number {
  if (direction === 'higher') {
    return Math.min(100, Math.round((value / target) * 100))
  }
  // lower-is-better: invert
  const ratio = target / value
  return Math.min(100, Math.round(ratio * 100))
}

// ─── Radar Chart (Display Mode) ───
function RadarChartDisplay() {
  const option = useMemo(() => {
    return {
      radar: {
        indicator: radarData.map((d) => ({
          name: d.category,
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
          value: radarData.map((d) => d.score),
          name: '当前得分',
          symbol: 'circle',
          symbolSize: 8,
          lineStyle: { color: '#00D4AA', width: 2 },
          itemStyle: { color: '#00D4AA', borderColor: '#fff', borderWidth: 2 },
          areaStyle: { color: 'rgba(0,212,170,0.2)' },
          label: {
            show: true,
            formatter: (p: { value: number }) => p.value.toString(),
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
        formatter: (params: { name: string; value: number[] }) => {
          let html = `<div style="font-weight:600;margin-bottom:6px">${params.name}</div>`
          radarData.forEach((d, i) => {
            html += `<div style="display:flex;justify-content:space-between;gap:16px">
              <span>${d.category}</span>
              <span style="font-family:JetBrains Mono;font-weight:500;color:#00D4AA">${params.value[i]}分</span>
            </div>`
          })
          return html
        },
      },
    }
  }, [])

  return (
    <DashboardCard
      title="综合能力评估"
      configOptions={[{ label: '全部类别', value: 'all' }, { label: '力量+速度+耐力', value: 'strength-speed-endurance' }, { label: '自定义...', value: 'custom' }]}
      currentConfig="all"
    >
      <ReactECharts option={option} style={{ height: 380 }} />
    </DashboardCard>
  )
}

// ─── Category Card (Display Mode) ───
function CategoryCard({ category }: { category: (typeof periodicCategories)[0] }) {
  const avgScore = Math.round(category.indicators.reduce((s, ind) => s + ind.score, 0) / category.indicators.length)
  const option = useMemo(() => ({
    grid: { top: 8, right: 80, bottom: 16, left: 140 },
    xAxis: { type: 'value' as const, max: 100, axisLine: { show: false }, splitLine: { lineStyle: { color: 'rgba(42,51,72,0.3)' } }, axisLabel: { color: '#5A6579', fontSize: 10 } },
    yAxis: { type: 'category' as const, data: category.indicators.map((ind) => ind.name).reverse(), axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: '#8B95A5', fontSize: 11, width: 130, overflow: 'truncate' as const } },
    tooltip: { trigger: 'axis' as const, backgroundColor: '#1C2130', borderColor: '#2A3348', textStyle: { color: '#E8ECF1', fontSize: 11 } },
    series: [{
      type: 'bar',
      data: category.indicators.map((ind) => ({
        value: ind.score,
        itemStyle: { color: ind.score >= 80 ? '#10B981' : ind.score >= 60 ? '#00D4AA' : ind.score >= 40 ? '#F59E0B' : '#EF4444', borderRadius: [0, 4, 4, 0] },
      })).reverse(),
      barWidth: 16,
      label: { show: true, position: 'right' as const, formatter: (p: { value: number }) => `${p.value}`, color: '#E8ECF1', fontSize: 12, fontFamily: 'JetBrains Mono', fontWeight: 500 },
    }],
    animationDuration: 800,
    animationEasing: 'cubicOut' as const,
  }), [category])

  return (
    <DashboardCard title={`${category.name}测试`} footer={<span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>基于 {category.indicators.length} 项指标</span>}>
      <div className="mb-3 flex items-center gap-2">
        <span className="rounded-full px-2.5 py-0.5 text-[11px] font-medium" style={{ backgroundColor: 'rgba(0,212,170,0.15)', color: '#00D4AA' }}>均值: {avgScore}/100</span>
      </div>
      <ReactECharts option={option} style={{ height: category.indicators.length * 40 + 40 }} />
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-[11px]">
          <thead>
            <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border-subtle)' }}>
              <th className="py-1.5 pr-2 text-left font-medium">指标</th><th className="py-1.5 pr-2 text-left font-medium">单位</th>
              <th className="py-1.5 pr-2 text-right font-medium">均值</th><th className="py-1.5 pr-2 text-right font-medium">最佳</th>
              <th className="py-1.5 pr-2 text-right font-medium">SD</th><th className="py-1.5 pr-2 text-right font-medium">CV%</th>
              <th className="py-1.5 pr-2 text-right font-medium">CI</th><th className="py-1.5 text-center font-medium">评级</th>
            </tr>
          </thead>
          <tbody>
            {category.indicators.map((ind) => (
              <tr key={ind.name} style={{ borderBottom: '1px solid rgba(42,51,72,0.3)' }} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}>
                <td className="py-1.5 pr-2" style={{ color: 'var(--text-primary)' }}>{ind.name}</td>
                <td className="py-1.5 pr-2 font-mono" style={{ color: 'var(--text-secondary)' }}>{ind.unit}</td>
                <td className="py-1.5 pr-2 text-right font-mono" style={{ color: 'var(--text-primary)' }}>{typeof ind.mean === 'number' && ind.mean % 1 !== 0 ? ind.mean.toFixed(1) : ind.mean}</td>
                <td className="py-1.5 pr-2 text-right font-mono" style={{ color: 'var(--text-primary)' }}>{typeof ind.best === 'number' && ind.best % 1 !== 0 ? ind.best.toFixed(1) : ind.best}</td>
                <td className="py-1.5 pr-2 text-right font-mono" style={{ color: 'var(--text-secondary)' }}>{ind.sd.toFixed(1)}</td>
                <td className="py-1.5 pr-2 text-right font-mono" style={{ color: 'var(--text-secondary)' }}>{ind.cv}%</td>
                <td className="py-1.5 pr-2 text-right font-mono" style={{ color: 'var(--text-secondary)' }}>[{ind.ci[0]}, {ind.ci[1]}]</td>
                <td className="py-1.5 text-center">
                  <span className="inline-block rounded px-1.5 py-0.5 text-[10px] font-bold" style={{ backgroundColor: `${ratingColors[ind.rating]}20`, color: ratingColors[ind.rating] }}>{ind.rating}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardCard>
  )
}

// ═══════════════════════════════════════════
//  Longitudinal Comparison Components
// ═══════════════════════════════════════════

function LongitudinalControlBar({
  dateMode, setDateMode, aggregate, setAggregate,
}: {
  dateMode: 'single' | 'range' | 'unlimited'
  setDateMode: (m: 'single' | 'range' | 'unlimited') => void
  aggregate: AggregateMode
  setAggregate: (a: AggregateMode) => void
}) {
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [dateStart, setDateStart] = useState('2024-01-01')
  const [dateEnd, setDateEnd] = useState('2024-03-31')

  const dateLabel = dateMode === 'unlimited' ? '不限时间' : dateMode === 'single' ? dateStart : `${dateStart} ~ ${dateEnd}`

  return (
    <div className="flex h-[52px] items-center gap-3 border-b px-4" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-subtle)' }}>
      <div className="relative">
        <button onClick={() => setShowDatePicker(!showDatePicker)} className="flex h-9 items-center gap-2 rounded-lg border px-4 text-[13px] transition-colors" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}>
          <Calendar size={16} style={{ color: 'var(--text-muted)' }} />
          <span>基准期</span>
          <span style={{ color: 'var(--text-secondary)' }}>{dateLabel}</span>
        </button>
        {showDatePicker && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowDatePicker(false)} />
            <motion.div className="absolute left-0 top-full z-50 mt-1 w-72 rounded-lg border p-4" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-subtle)', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              <p className="mb-3 text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>选择日期方式</p>
              <div className="mb-3 flex gap-2">
                {[{ v: 'single' as const, l: '指定日期' }, { v: 'range' as const, l: '日期范围' }, { v: 'unlimited' as const, l: '不限' }].map((o) => (
                  <button key={o.v} className="rounded-md px-3 py-1.5 text-[12px] transition-colors" style={{ backgroundColor: dateMode === o.v ? 'var(--accent-cyan)' : 'var(--bg-secondary)', color: dateMode === o.v ? '#0B0E14' : 'var(--text-primary)' }} onClick={() => setDateMode(o.v)}>{o.l}</button>
                ))}
              </div>
              {dateMode !== 'unlimited' && (
                <div className="mb-3 space-y-2">
                  <input type="date" value={dateStart} onChange={(e) => setDateStart(e.target.value)} className="w-full rounded-md border px-2 py-1.5 text-[12px]" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }} />
                  {dateMode === 'range' && <input type="date" value={dateEnd} onChange={(e) => setDateEnd(e.target.value)} className="w-full rounded-md border px-2 py-1.5 text-[12px]" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }} />}
                </div>
              )}
            </motion.div>
          </>
        )}
      </div>

      <div className="flex items-center gap-1 rounded-lg border p-0.5" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-subtle)' }}>
        {[{ k: 'mean' as const, l: '均值' }, { k: 'best' as const, l: '最佳值' }].map((o) => (
          <button key={o.k} onClick={() => setAggregate(o.k)} className="rounded-md px-3 py-1.5 text-[12px] transition-colors" style={{ backgroundColor: aggregate === o.k ? 'var(--accent-cyan)' : 'transparent', color: aggregate === o.k ? '#0B0E14' : 'var(--text-secondary)' }}>{o.l}</button>
        ))}
      </div>

      <div className="flex items-center gap-2 text-[12px]" style={{ color: 'var(--text-muted)' }}>
        <GitCompare size={14} />
        <span>对比: 基准期 vs 对比期</span>
      </div>
    </div>
  )
}

// ─── Longitudinal Radar ───
function LongitudinalRadar({ aggregate }: { aggregate: AggregateMode }) {
  const option = useMemo(() => {
    // Group indicators by category, compute category avg anchor scores
    const cats = ['力量', '速度', '耐力', '身体形态']
    const catScoresA = cats.map((cat) => {
      const inds = DEMO_INDICATORS.filter((d) => d.category === cat)
      if (!inds.length) return 0
      return Math.round(inds.reduce((s, d) => s + anchorScore(aggregate === 'mean' ? d.valueA : d.valueA + d.sdA, d.targetScore, d.direction), 0) / inds.length)
    })
    const catScoresB = cats.map((cat) => {
      const inds = DEMO_INDICATORS.filter((d) => d.category === cat)
      if (!inds.length) return 0
      return Math.round(inds.reduce((s, d) => s + anchorScore(aggregate === 'mean' ? d.valueB : d.valueB + d.sdB, d.targetScore, d.direction), 0) / inds.length)
    })

    return {
      radar: {
        indicator: cats.map((c) => ({ name: c, max: 100, nameStyle: { color: '#E8ECF1', fontSize: 13, fontWeight: 600 } })),
        shape: 'polygon' as const,
        splitNumber: 5,
        axisNameGap: 12,
        splitLine: { lineStyle: { color: 'rgba(42,51,72,0.6)', width: 1 } },
        splitArea: { show: true, areaStyle: { color: ['rgba(20,24,33,0.5)', 'rgba(20,24,33,0.3)'] } },
        axisLine: { lineStyle: { color: 'rgba(42,51,72,0.8)' } },
      },
      legend: { data: ['基准期', '对比期'], bottom: 0, textStyle: { color: '#8B95A5', fontSize: 11 } },
      series: [{
        type: 'radar',
        data: [
          { value: catScoresA, name: '基准期', lineStyle: { color: '#5A6579', width: 2, type: 'dashed' }, itemStyle: { color: '#5A6579' }, areaStyle: { color: 'rgba(90,101,121,0.1)' }, symbol: 'circle', symbolSize: 6 },
          { value: catScoresB, name: '对比期', lineStyle: { color: '#00D4AA', width: 2 }, itemStyle: { color: '#00D4AA', borderColor: '#fff', borderWidth: 2 }, areaStyle: { color: 'rgba(0,212,170,0.2)' }, symbol: 'circle', symbolSize: 8 },
        ],
        animationDuration: 800,
      }],
      tooltip: { trigger: 'item' as const, backgroundColor: '#1C2130', borderColor: '#2A3348', textStyle: { color: '#E8ECF1', fontSize: 12 } },
    }
  }, [aggregate])

  return (
    <DashboardCard title="维度能力对比 (目标基准锚定)" configOptions={[{ label: '锚定模式', value: 'anchor' }]} currentConfig="anchor">
      <ReactECharts option={option} style={{ height: 360 }} />
    </DashboardCard>
  )
}

// ─── Longitudinal: Per-indicator Chart + Table (Left-Right Layout) ───
function LongitudinalCategorySection({ category, aggregate }: { category: string; aggregate: AggregateMode }) {
  const inds = useMemo(() => DEMO_INDICATORS.filter((d) => d.category === category), [category])

  // Chart: anchor scores comparison (left side)
  const chartOption = useMemo(() => {
    const names = inds.map((d) => d.name)
    const valA = inds.map((d) => anchorScore(aggregate === 'mean' ? d.valueA : d.valueA + d.sdA, d.targetScore, d.direction))
    const valB = inds.map((d) => anchorScore(aggregate === 'mean' ? d.valueB : d.valueB + d.sdB, d.targetScore, d.direction))

    return {
      grid: { top: 30, right: 30, bottom: 24, left: 140 },
      legend: { data: ['基准期', '对比期'], top: 0, textStyle: { color: '#8B95A5', fontSize: 11 } },
      xAxis: { type: 'value' as const, max: 100, axisLine: { show: false }, splitLine: { lineStyle: { color: 'rgba(42,51,72,0.3)' } }, axisLabel: { color: '#5A6579', fontSize: 10, formatter: '{value}%' } },
      yAxis: { type: 'category' as const, data: names.reverse(), axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: '#8B95A5', fontSize: 11, width: 130, overflow: 'truncate' as const } },
      tooltip: { trigger: 'axis' as const, backgroundColor: '#1C2130', borderColor: '#2A3348', textStyle: { color: '#E8ECF1', fontSize: 11 } },
      series: [
        { name: '基准期', type: 'bar', data: valA.reverse().map((v) => ({ value: v, itemStyle: { color: '#5A6579', borderRadius: [0, 4, 4, 0] } })), barWidth: 12, barGap: '20%' },
        { name: '对比期', type: 'bar', data: valB.reverse().map((v) => ({ value: v, itemStyle: { color: '#00D4AA', borderRadius: [0, 4, 4, 0] } })), barWidth: 12 },
      ],
      animationDuration: 800,
      animationEasing: 'cubicOut' as const,
    }
  }, [inds, aggregate])

  if (!inds.length) return null

  // Table with SNR, MDC, SWC (right side)
  const tableRows = inds.map((ind) => {
    const vA = aggregate === 'mean' ? ind.valueA : ind.valueA + ind.sdA
    const vB = aggregate === 'mean' ? ind.valueB : ind.valueB + ind.sdB
    const te = calcTE(ind.sdA, ind.sdB, ind.nA, ind.nB)
    const mdc = calcMDC(te)
    const swc = calcSWC(ind.sdA, ind.sdB, ind.nA, ind.nB)
    const snr = calcSNR(vA, vB, te)
    const cohensD = calcCohensD(vA, vB, ind.sdA, ind.sdB, ind.nA, ind.nB)
    const pValue = calcPairedTTest(vA, vB, ind.sdA, ind.sdB, Math.min(ind.nA, ind.nB))
    const diff = vB - vA
    const pctChange = ((diff / vA) * 100)
    const isGood = ind.direction === 'higher' ? diff > 0 : diff < 0
    const sig = significanceBadge(pValue)

    return {
      ...ind,
      vA, vB, te, mdc, swc, snr, cohensD, pValue, diff, pctChange, isGood, sig,
    }
  })

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      {/* Left: Chart */}
      <DashboardCard title={`${category} — 锚定得分对比`}>
        <ReactECharts option={chartOption} style={{ height: inds.length * 50 + 60 }} />
      </DashboardCard>

      {/* Right: Statistics Table */}
      <DashboardCard title={`${category} — 统计参数`}>
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
                <tr key={row.id} style={{ borderBottom: '1px solid rgba(42,51,72,0.3)' }} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}>
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

// ═══════════════════════════════════════════
//  Cross-Sectional Comparison Components
// ═══════════════════════════════════════════

function CrossSectionalControlBar({
  layers, setLayers, aggregate, setAggregate,
}: {
  layers: ComparisonLayer[]
  setLayers: (l: ComparisonLayer[]) => void
  aggregate: AggregateMode
  setAggregate: (a: AggregateMode) => void
}) {
  const [showAddLayer, setShowAddLayer] = useState(false)

  const addLayer = (preset: ComparisonLayer) => {
    if (layers.length >= 3) return
    if (layers.find((l) => l.id === preset.id)) return
    setLayers([...layers, preset])
    setShowAddLayer(false)
  }

  const removeLayer = (id: string) => {
    setLayers(layers.filter((l) => l.id !== id))
  }

  return (
    <div className="flex h-[52px] items-center gap-3 border-b px-4" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-subtle)' }}>
      <div className="flex items-center gap-1 rounded-lg border p-0.5" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-subtle)' }}>
        {[{ k: 'mean' as const, l: '均值' }, { k: 'best' as const, l: '最佳值' }].map((o) => (
          <button key={o.k} onClick={() => setAggregate(o.k)} className="rounded-md px-3 py-1.5 text-[12px] transition-colors" style={{ backgroundColor: aggregate === o.k ? 'var(--accent-cyan)' : 'transparent', color: aggregate === o.k ? '#0B0E14' : 'var(--text-secondary)' }}>{o.l}</button>
        ))}
      </div>

      {/* Active layers */}
      <div className="flex items-center gap-2">
        {layers.map((layer) => (
          <span key={layer.id} className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium" style={{ backgroundColor: `${layer.color}20`, color: layer.color }}>
            {layer.name}
            <button onClick={() => removeLayer(layer.id)} className="ml-1"><X size={10} /></button>
          </span>
        ))}
      </div>

      {/* Add Layer */}
      <div className="relative">
        <button onClick={() => setShowAddLayer(!showAddLayer)} className="flex h-9 items-center gap-1 rounded-lg border px-3 text-[12px] transition-colors" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}>
          <Plus size={14} />添加对比层
        </button>
        {showAddLayer && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowAddLayer(false)} />
            <motion.div className="absolute left-0 top-full z-50 mt-1 w-64 rounded-lg border p-3" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-subtle)', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
              <p className="mb-2 text-[12px] font-semibold" style={{ color: 'var(--accent-cyan)' }}>运动员</p>
              {athletes.slice(0, 4).map((name, i) => (
                <button key={name} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[12px] transition-colors hover:bg-[var(--bg-hover)]" style={{ color: 'var(--text-primary)' }} onClick={() => addLayer({ id: `ath_${name}`, name, color: LAYER_COLORS[layers.length % LAYER_COLORS.length], type: 'individual', values: Object.fromEntries(DEMO_INDICATORS.map((ind) => [ind.id, { mean: ind.valueB + (Math.random() - 0.5) * ind.sdB * 2, sd: ind.sdB, n: ind.nB }])) })}>
                  <Users size={12} style={{ color: LAYER_COLORS[i % LAYER_COLORS.length] }} />{name}
                </button>
              ))}
              <div className="mt-2 border-t pt-2" style={{ borderColor: 'var(--border-subtle)' }}>
                <p className="mb-2 text-[12px] font-semibold" style={{ color: 'var(--accent-purple)' }}>参照群组</p>
                {DEMO_LAYERS.map((layer) => (
                  <button key={layer.id} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[12px] transition-colors hover:bg-[var(--bg-hover)]" style={{ color: layers.find((l) => l.id === layer.id) ? 'var(--text-muted)' : 'var(--text-primary)' }} onClick={() => addLayer(layer)} disabled={!!layers.find((l) => l.id === layer.id)}>
                    <Users size={12} style={{ color: layer.color }} />{layer.name}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Cross-Sectional Radar ───
function CrossSectionalRadar({ layers, aggregate }: { layers: ComparisonLayer[]; aggregate: AggregateMode }) {
  const option = useMemo(() => {
    const cats = ['力量', '速度', '耐力', '身体形态']
    const baseScores = cats.map((cat) => {
      const inds = DEMO_INDICATORS.filter((d) => d.category === cat)
      if (!inds.length) return 0
      return Math.round(inds.reduce((s, d) => s + anchorScore(aggregate === 'mean' ? d.valueA : d.valueA + d.sdA, d.targetScore, d.direction), 0) / inds.length)
    })

    const layerScores = layers.map((layer) =>
      cats.map((cat) => {
        const inds = DEMO_INDICATORS.filter((d) => d.category === cat)
        if (!inds.length) return 0
        return Math.round(inds.reduce((s, d) => {
          const lv = layer.values[d.id]
          if (!lv) return s + anchorScore(aggregate === 'mean' ? d.valueA : d.valueA + d.sdA, d.targetScore, d.direction)
          return s + anchorScore(aggregate === 'mean' ? lv.mean : lv.mean + lv.sd, d.targetScore, d.direction)
        }, 0) / inds.length)
      })
    )

    return {
      radar: {
        indicator: cats.map((c) => ({ name: c, max: 100, nameStyle: { color: '#E8ECF1', fontSize: 13, fontWeight: 600 } })),
        shape: 'polygon' as const,
        splitNumber: 5,
        axisNameGap: 12,
        splitLine: { lineStyle: { color: 'rgba(42,51,72,0.6)', width: 1 } },
        splitArea: { show: true, areaStyle: { color: ['rgba(20,24,33,0.5)', 'rgba(20,24,33,0.3)'] } },
        axisLine: { lineStyle: { color: 'rgba(42,51,72,0.8)' } },
      },
      legend: { data: ['当前运动员', ...layers.map((l) => l.name)], bottom: 0, textStyle: { color: '#8B95A5', fontSize: 11 } },
      series: [{
        type: 'radar',
        data: [
          { value: baseScores, name: '当前运动员', lineStyle: { color: '#00D4AA', width: 2.5 }, itemStyle: { color: '#00D4AA', borderColor: '#fff', borderWidth: 2 }, areaStyle: { color: 'rgba(0,212,170,0.15)' }, symbol: 'circle', symbolSize: 8 },
          ...layers.map((layer, i) => ({
            value: layerScores[i],
            name: layer.name,
            lineStyle: { color: layer.color, width: 2, type: i === 0 ? 'solid' as const : 'dashed' as const },
            itemStyle: { color: layer.color },
            areaStyle: { color: 'transparent' },
            symbol: 'diamond',
            symbolSize: 6,
          })),
        ],
        animationDuration: 800,
      }],
      tooltip: { trigger: 'item' as const, backgroundColor: '#1C2130', borderColor: '#2A3348', textStyle: { color: '#E8ECF1', fontSize: 12 } },
    }
  }, [layers, aggregate])

  return (
    <DashboardCard title="横向能力对比 (目标基准锚定)" configOptions={[{ label: '多对象叠加', value: 'multi' }]} currentConfig="multi">
      <ReactECharts option={option} style={{ height: 360 }} />
    </DashboardCard>
  )
}

// ─── Cross-Sectional: Per-indicator Chart + Table ───
function CrossSectionalCategorySection({ category, layers, aggregate }: { category: string; layers: ComparisonLayer[]; aggregate: AggregateMode }) {
  const inds = useMemo(() => DEMO_INDICATORS.filter((d) => d.category === category), [category])

  const chartOption = useMemo(() => {
    const names = inds.map((d) => d.name)
    const baseVal = inds.map((d) => anchorScore(aggregate === 'mean' ? d.valueA : d.valueA + d.sdA, d.targetScore, d.direction))

    const layerSeries = layers.map((layer, idx) => ({
      name: layer.name,
      type: 'bar' as const,
      data: inds.map((d) => {
        const lv = layer.values[d.id]
        const v = lv ? (aggregate === 'mean' ? lv.mean : lv.mean + lv.sd) : d.valueB
        return { value: anchorScore(v, d.targetScore, d.direction), itemStyle: { color: layer.color, borderRadius: [0, 4, 4, 0] } }
      }).reverse(),
      barWidth: 12,
      barGap: idx === 0 ? '20%' : '0%',
    }))

    return {
      grid: { top: 30, right: 30, bottom: 24, left: 140 },
      legend: { data: ['当前运动员', ...layers.map((l) => l.name)], top: 0, textStyle: { color: '#8B95A5', fontSize: 11 } },
      xAxis: { type: 'value' as const, max: 100, axisLine: { show: false }, splitLine: { lineStyle: { color: 'rgba(42,51,72,0.3)' } }, axisLabel: { color: '#5A6579', fontSize: 10, formatter: '{value}%' } },
      yAxis: { type: 'category' as const, data: names.reverse(), axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: '#8B95A5', fontSize: 11, width: 130, overflow: 'truncate' as const } },
      tooltip: { trigger: 'axis' as const, backgroundColor: '#1C2130', borderColor: '#2A3348', textStyle: { color: '#E8ECF1', fontSize: 11 } },
      series: [
        { name: '当前运动员', type: 'bar', data: baseVal.reverse().map((v) => ({ value: v, itemStyle: { color: '#00D4AA', borderRadius: [0, 4, 4, 0] } })), barWidth: 12, barGap: '20%' },
        ...layerSeries,
      ],
      animationDuration: 800,
      animationEasing: 'cubicOut' as const,
    }
  }, [inds, layers, aggregate])

  if (!inds.length) return null

  // Stats table: current vs each layer
  const tableRows = inds.map((ind) => {
    const vBase = aggregate === 'mean' ? ind.valueA : ind.valueA + ind.sdA

    const layerStats = layers.map((layer) => {
      const lv = layer.values[ind.id]
      const vL = lv ? (aggregate === 'mean' ? lv.mean : lv.mean + lv.sd) : ind.valueB
      const te = calcTE(ind.sdA, lv?.sd ?? ind.sdB, ind.nA, lv?.n ?? ind.nB)
      const mdc = calcMDC(te)
      const swc = calcSWC(ind.sdA, lv?.sd ?? ind.sdB, ind.nA, lv?.n ?? ind.nB)
      const snr = calcSNR(vBase, vL, te)
      const cohensD = calcCohensD(vBase, vL, ind.sdA, lv?.sd ?? ind.sdB, ind.nA, lv?.n ?? ind.nB)
      const pValue = calcPairedTTest(vBase, vL, ind.sdA, lv?.sd ?? ind.sdB, Math.min(ind.nA, lv?.n ?? ind.nB))
      const diff = vL - vBase
      const pct = ((diff / vBase) * 100)
      const sig = significanceBadge(pValue)
      return { layerName: layer.name, layerColor: layer.color, vL, diff, pct, te, mdc, swc, snr, cohensD, pValue, sig }
    })

    return { ...ind, vBase, layerStats }
  })

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      {/* Left: Chart */}
      <DashboardCard title={`${category} — 锚定得分对比`}>
        <ReactECharts option={chartOption} style={{ height: inds.length * 50 + 60 }} />
      </DashboardCard>

      {/* Right: Statistics Table */}
      <DashboardCard title={`${category} — 统计参数`}>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border-subtle)' }}>
                <th className="py-1.5 pr-2 text-left font-medium">指标</th>
                <th className="py-1.5 pr-2 text-right font-medium">基准</th>
                {layers.map((l) => (
                  <th key={l.id} className="py-1.5 pr-2 text-right font-medium" style={{ color: l.color }}>{l.name}</th>
                ))}
                <th className="py-1.5 pr-2 text-right font-medium">变化</th>
                <th className="py-1.5 pr-2 text-right font-medium">MDC</th>
                <th className="py-1.5 pr-2 text-right font-medium">SWC</th>
                <th className="py-1.5 pr-2 text-right font-medium">SNR</th>
                <th className="py-1.5 text-center font-medium">显著性</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row) => (
                <tr key={row.id} style={{ borderBottom: '1px solid rgba(42,51,72,0.3)' }} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}>
                  <td className="py-1.5 pr-2" style={{ color: 'var(--text-primary)' }}>{row.name}</td>
                  <td className="py-1.5 pr-2 text-right font-mono" style={{ color: '#00D4AA' }}>{row.vBase.toFixed(1)}</td>
                  {row.layerStats.map((ls) => (
                    <td key={ls.layerName} className="py-1.5 pr-2 text-right font-mono" style={{ color: ls.layerColor }}>{ls.vL.toFixed(1)}</td>
                  ))}
                  {row.layerStats.length > 0 && (
                    <>
                      <td className="py-1.5 pr-2 text-right font-mono" style={{ color: row.layerStats[0].pct > 0 ? (row.direction === 'higher' ? '#10B981' : '#EF4444') : (row.direction === 'higher' ? '#EF4444' : '#10B981') }}>
                        {row.layerStats[0].pct > 0 ? '+' : ''}{row.layerStats[0].pct.toFixed(1)}%
                      </td>
                      <td className="py-1.5 pr-2 text-right font-mono" style={{ color: 'var(--text-secondary)' }}>{row.layerStats[0].mdc.toFixed(2)}</td>
                      <td className="py-1.5 pr-2 text-right font-mono" style={{ color: 'var(--text-secondary)' }}>{row.layerStats[0].swc.toFixed(2)}</td>
                      <td className="py-1.5 pr-2 text-right font-mono" style={{ color: row.layerStats[0].snr > 1 ? '#00D4AA' : 'var(--text-secondary)' }}>{row.layerStats[0].snr.toFixed(2)}</td>
                      <td className="py-1.5 text-center">
                        <span className="inline-block rounded px-1.5 py-0.5 text-[10px] font-bold" style={{ backgroundColor: `${row.layerStats[0].sig.color}20`, color: row.layerStats[0].sig.color }}>{row.layerStats[0].sig.text}</span>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DashboardCard>
    </div>
  )
}

// ═══════════════════════════════════════════
//  Main Periodic Testing Component
// ═══════════════════════════════════════════
export default function PeriodicTesting({ mode = 'display' }: Props) {
  // Longitudinal state
  const [longDateMode, setLongDateMode] = useState<'single' | 'range' | 'unlimited'>('range')
  const [longAggregate, setLongAggregate] = useState<AggregateMode>('mean')

  // Cross-sectional state
  const [layers, setLayers] = useState<ComparisonLayer[]>([DEMO_LAYERS[0]])
  const [crossAggregate, setCrossAggregate] = useState<AggregateMode>('mean')

  // Unique categories from DEMO_INDICATORS
  const comparisonCategories = useMemo(() => {
    const cats = new Set(DEMO_INDICATORS.map((d) => d.category))
    return Array.from(cats)
  }, [])

  if (mode === 'display') {
    return (
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
        <div className="col-span-1 xl:col-span-4"><RadarChartDisplay /></div>
        {periodicCategories.map((cat) => (
          <div key={cat.name} className="col-span-1 xl:col-span-2"><CategoryCard category={cat} /></div>
        ))}
      </div>
    )
  }

  if (mode === 'longitudinal') {
    return (
      <div className="flex flex-col gap-6">
        <LongitudinalControlBar dateMode={longDateMode} setDateMode={setLongDateMode} aggregate={longAggregate} setAggregate={setLongAggregate} />
        <div className="grid grid-cols-1 gap-6">
          <LongitudinalRadar aggregate={longAggregate} />
          {comparisonCategories.map((cat) => (
            <LongitudinalCategorySection key={cat} category={cat} aggregate={longAggregate} />
          ))}
        </div>
      </div>
    )
  }

  // cross-sectional
  return (
    <div className="flex flex-col gap-6">
      <CrossSectionalControlBar layers={layers} setLayers={setLayers} aggregate={crossAggregate} setAggregate={setCrossAggregate} />
      <div className="grid grid-cols-1 gap-6">
        <CrossSectionalRadar layers={layers} aggregate={crossAggregate} />
        {comparisonCategories.map((cat) => (
          <CrossSectionalCategorySection key={cat} category={cat} layers={layers} aggregate={crossAggregate} />
        ))}
      </div>
    </div>
  )
}
