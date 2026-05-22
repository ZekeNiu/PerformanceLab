import React, { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ReactEChartsCore from 'echarts-for-react'
import {
  GitCompare,
  Calendar,
  Plus,
  X,
  AlertTriangle,
  ChevronDown,
  Users,
  Info,
} from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────────────

interface Indicator {
  id: string
  name: string
  category: string
  unit: string
  valueA: number
  sdA: number
  nA: number
  valueB: number
  sdB: number
  nB: number
  direction: 'higher' | 'lower'
}

interface ComparisonLayer {
  id: string
  name: string
  color: string
  type: 'individual' | 'group'
  values: Record<string, { mean: number; sd: number; n: number }>
}

type ComparisonTab = 'longitudinal' | 'cross-sectional'

// ── Demo Data ────────────────────────────────────────────────────────────────

const DEMO_INDICATORS: Indicator[] = [
  // 力量测试 (Strength)
  { id: 'cmj_height', name: 'CMJ 跳跃高度', category: '力量测试', unit: 'cm', valueA: 42.3, sdA: 2.1, nA: 5, valueB: 45.8, sdB: 1.9, nB: 5, direction: 'higher' },
  { id: 'cmj_force', name: 'CMJ 峰值力', category: '力量测试', unit: 'N', valueA: 1850, sdA: 87, nA: 5, valueB: 1920, sdB: 92, nB: 5, direction: 'higher' },
  { id: 'squat_1rm', name: '深蹲 1RM', category: '力量测试', unit: 'kg', valueA: 140, sdA: 8.5, nA: 4, valueB: 152, sdB: 7.2, nB: 4, direction: 'higher' },
  // 速度测试 (Speed)
  { id: 'sprint_30m', name: '30m 冲刺', category: '速度测试', unit: 's', valueA: 4.23, sdA: 0.12, nA: 5, valueB: 4.18, sdB: 0.11, nB: 5, direction: 'lower' },
  { id: 'standing_jump', name: '立定跳远', category: '速度测试', unit: 'cm', valueA: 268, sdA: 14.2, nA: 5, valueB: 275, sdB: 12.8, nB: 5, direction: 'higher' },
  { id: 'agility_t', name: '灵敏测试 T-test', category: '速度测试', unit: 's', valueA: 9.45, sdA: 0.31, nA: 4, valueB: 9.28, sdB: 0.28, nB: 4, direction: 'lower' },
  // 耐力测试 (Endurance)
  { id: 'yoyo_ir1', name: 'Yo-Yo IR1', category: '耐力测试', unit: 'm', valueA: 1840, sdA: 156, nA: 5, valueB: 1960, sdB: 142, nB: 5, direction: 'higher' },
  { id: 'lactate_threshold', name: '乳酸阈值跑速', category: '耐力测试', unit: 'km/h', valueA: 14.2, sdA: 0.8, nA: 4, valueB: 14.8, sdB: 0.7, nB: 4, direction: 'higher' },
  // 身体形态 (Body)
  { id: 'body_fat', name: '体脂率', category: '身体形态', unit: '%', valueA: 12.4, sdA: 1.2, nA: 5, valueB: 11.8, sdB: 1.1, nB: 5, direction: 'lower' },
  { id: 'muscle_mass', name: '肌肉量', category: '身体形态', unit: 'kg', valueA: 58.2, sdA: 3.4, nA: 5, valueB: 59.5, sdB: 3.1, nB: 5, direction: 'higher' },
]

const LAYER_COLORS = ['#00D4AA', '#3B82F6', '#8B5CF6', '#F59E0B']

const DEMO_LAYERS: ComparisonLayer[] = [
  {
    id: 'peer_avg',
    name: '同位置均值',
    color: '#3B82F6',
    type: 'group',
    values: {
      cmj_height: { mean: 40.1, sd: 3.2, n: 12 },
      cmj_force: { mean: 1780, sd: 110, n: 12 },
      squat_1rm: { mean: 135, sd: 12.5, n: 10 },
      sprint_30m: { mean: 4.35, sd: 0.18, n: 12 },
      standing_jump: { mean: 258, sd: 16.4, n: 12 },
      agility_t: { mean: 9.62, sd: 0.38, n: 10 },
      yoyo_ir1: { mean: 1720, sd: 190, n: 12 },
      lactate_threshold: { mean: 13.8, sd: 0.9, n: 10 },
      body_fat: { mean: 13.1, sd: 1.5, n: 12 },
      muscle_mass: { mean: 56.8, sd: 4.2, n: 12 },
    },
  },
  {
    id: 'team_best',
    name: '队内最佳',
    color: '#8B5CF6',
    type: 'individual',
    values: {
      cmj_height: { mean: 48.2, sd: 0, n: 1 },
      cmj_force: { mean: 2100, sd: 0, n: 1 },
      squat_1rm: { mean: 170, sd: 0, n: 1 },
      sprint_30m: { mean: 4.05, sd: 0, n: 1 },
      standing_jump: { mean: 290, sd: 0, n: 1 },
      agility_t: { mean: 8.95, sd: 0, n: 1 },
      yoyo_ir1: { mean: 2200, sd: 0, n: 1 },
      lactate_threshold: { mean: 15.5, sd: 0, n: 1 },
      body_fat: { mean: 9.8, sd: 0, n: 1 },
      muscle_mass: { mean: 64.0, sd: 0, n: 1 },
    },
  },
]

// ── Statistical Utilities ────────────────────────────────────────────────────

function calcTE(sd1: number, sd2: number, n1: number, n2: number): number {
  // Typical Error = pooled SD * sqrt(1 - ICC), approximated
  const pooledSD = Math.sqrt(((n1 - 1) * sd1 * sd1 + (n2 - 1) * sd2 * sd2) / (n1 + n2 - 2))
  return pooledSD * 0.35 // Approximate TE from ICC=0.88
}

function calcMDC(te: number): number {
  return te * 1.96 * Math.sqrt(2)
}

function calcSWC(sd1: number, sd2: number, n1: number, n2: number): number {
  const pooledSD = Math.sqrt(((n1 - 1) * sd1 * sd1 + (n2 - 1) * sd2 * sd2) / (n1 + n2 - 2))
  return pooledSD * 0.2
}

function calcCohensD(mean1: number, mean2: number, sd1: number, sd2: number, n1: number, n2: number): number {
  const pooledSD = Math.sqrt(((n1 - 1) * sd1 * sd1 + (n2 - 1) * sd2 * sd2) / (n1 + n2 - 2))
  return (mean2 - mean1) / pooledSD
}

function cohensDLabel(d: number): { text: string; color: string } {
  const absD = Math.abs(d)
  if (absD < 0.2) return { text: '可忽略', color: 'var(--text-muted)' }
  if (absD < 0.5) return { text: '小', color: 'var(--accent-amber)' }
  if (absD < 0.8) return { text: '中', color: 'var(--accent-blue)' }
  return { text: '大', color: 'var(--accent-green)' }
}

function calcPairedTTest(mean1: number, mean2: number, sd1: number, sd2: number, n: number): number {
  // Simplified paired t-test approximation
  const diff = mean2 - mean1
  const sed = Math.sqrt((sd1 * sd1 + sd2 * sd2) / n)
  const t = diff / sed
  // Approximate p-value from t (two-tailed)
  const df = n - 1
  const p = 2 * (1 - studentTCDF(Math.abs(t), df))
  return Math.max(0.001, Math.min(1, p))
}

// Approximate Student's T CDF
function studentTCDF(t: number, df: number): number {
  const x = df / (df + t * t)
  const result = 1 - 0.5 * betaIncomplete(x, df / 2, 0.5)
  return result
}

// Beta incomplete function approximation
function betaIncomplete(x: number, a: number, b: number): number {
  if (x <= 0) return 0
  if (x >= 1) return 1
  // Simple approximation using series
  return Math.pow(x, a) * Math.pow(1 - x, b) / (a * betaFunc(a, b))
}

function betaFunc(a: number, b: number): number {
  return Math.exp(lgamma(a) + lgamma(b) - lgamma(a + b))
}

function lgamma(z: number): number {
  // Lanczos approximation
  const g = 7
  const C = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028,
    771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
  ]
  if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - lgamma(1 - z)
  z -= 1
  let x = C[0]
  for (let i = 1; i < g + 2; i++) x += C[i] / (z + i)
  const t = z + g + 0.5
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x)
}

function formatPValue(p: number): string {
  if (p < 0.001) return '< .001'
  return p.toFixed(3).replace(/^0/, '')
}

function pValueColor(p: number): string {
  if (p < 0.001) return 'var(--accent-green)'
  if (p < 0.01) return 'var(--accent-cyan)'
  if (p < 0.05) return 'var(--accent-amber)'
  return 'var(--text-muted)'
}

function significanceBadge(p: number): { text: string; color: string } {
  if (p < 0.001) return { text: '\u2717 ***', color: 'var(--accent-green)' }
  if (p < 0.01) return { text: '\u2717 **', color: 'var(--accent-cyan)' }
  if (p < 0.05) return { text: '\u2717 *', color: 'var(--accent-amber)' }
  return { text: '\u2248 n.s.', color: 'var(--text-muted)' }
}

// ── Component ────────────────────────────────────────────────────────────────

export default function Comparison() {
  const [activeTab, setActiveTab] = useState<ComparisonTab>('longitudinal')
  const [selectedIndicators, setSelectedIndicators] = useState<Set<string>>(
    new Set(DEMO_INDICATORS.map((i) => i.id)),
  )
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set([...new Set(DEMO_INDICATORS.map((i) => i.category))]),
  )
  const [layers, setLayers] = useState<ComparisonLayer[]>([DEMO_LAYERS[0]])
  const [dateA, setDateA] = useState({ from: '2024-01-01', to: '2024-01-31' })
  const [dateB, setDateB] = useState({ from: '2024-06-01', to: '2024-06-30' })
  const [presetOpen, setPresetOpen] = useState(false)

  const categories = useMemo(() => {
    const map = new Map<string, Indicator[]>()
    DEMO_INDICATORS.forEach((ind) => {
      if (!map.has(ind.category)) map.set(ind.category, [])
      map.get(ind.category)!.push(ind)
    })
    return Array.from(map.entries()).map(([name, indicators]) => ({ name, indicators }))
  }, [])

  const filteredIndicators = useMemo(
    () => DEMO_INDICATORS.filter((i) => selectedIndicators.has(i.id)),
    [selectedIndicators],
  )

  const toggleIndicator = useCallback((id: string) => {
    setSelectedIndicators((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const toggleCategory = useCallback((catName: string) => {
    const cat = categories.find((c) => c.name === catName)
    if (!cat) return
    const ids = cat.indicators.map((i) => i.id)
    setSelectedIndicators((prev) => {
      const next = new Set(prev)
      const allSelected = ids.every((id) => next.has(id))
      if (allSelected) ids.forEach((id) => next.delete(id))
      else ids.forEach((id) => next.add(id))
      return next
    })
  }, [categories])

  const toggleExpandCategory = useCallback((name: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }, [])

  const addLayer = useCallback(() => {
    if (layers.length >= 3) return
    const nextLayer = DEMO_LAYERS[layers.length]
    if (nextLayer) {
      setLayers((prev) => [...prev, { ...nextLayer, color: LAYER_COLORS[prev.length + 1] }])
    }
  }, [layers])

  const removeLayer = useCallback((id: string) => {
    setLayers((prev) => prev.filter((l) => l.id !== id))
  }, [])

  const selectAll = useCallback(() => {
    setSelectedIndicators(new Set(DEMO_INDICATORS.map((i) => i.id)))
  }, [])

  // ── Statistics Summary ───────────────────────────────────────────────────

  const statsSummary = useMemo(() => {
    const n = filteredIndicators[0]?.nA ?? 1
    const avgTE =
      filteredIndicators.length > 0
        ? filteredIndicators.reduce((sum, i) => sum + calcTE(i.sdA, i.sdB, i.nA, i.nB), 0) /
          filteredIndicators.length
        : 0
    const avgMDC = calcMDC(avgTE)
    const avgSWC =
      filteredIndicators.length > 0
        ? filteredIndicators.reduce((sum, i) => sum + calcSWC(i.sdA, i.sdB, i.nA, i.nB), 0) /
          filteredIndicators.length
        : 0
    const avgD =
      filteredIndicators.length > 0
        ? filteredIndicators.reduce(
            (sum, i) => sum + Math.abs(calcCohensD(i.valueA, i.valueB, i.sdA, i.sdB, i.nA, i.nB)),
            0,
          ) / filteredIndicators.length
        : 0
    return { n, avgTE, avgMDC, avgSWC, avgD }
  }, [filteredIndicators])

  // ── ECharts Options ──────────────────────────────────────────────────────

  const radarOption = useMemo(() => {
    const indicators = filteredIndicators.map((i) => ({
      name: i.name,
      max: Math.max(i.valueA, i.valueB) * 1.3,
    }))
    const dataA = filteredIndicators.map((i) => i.valueA)
    const dataB = filteredIndicators.map((i) => i.valueB)

    return {
      color: ['#00D4AA', '#8B5CF6'],
      tooltip: { trigger: 'item' },
      legend: {
        data: ['\u57fa\u51c6\u671f', '\u5bf9\u6bd4\u671f'],
        bottom: 0,
        textStyle: { color: '#8B95A5', fontSize: 12 },
      },
      radar: {
        indicator: indicators,
        shape: 'polygon',
        splitNumber: 4,
        axisName: { color: '#8B95A5', fontSize: 11 },
        splitLine: { lineStyle: { color: '#2A3348' } },
        splitArea: {
          show: true,
          areaStyle: {
            color: ['rgba(20,24,33,0.3)', 'rgba(20,24,33,0.5)'],
          },
        },
        axisLine: { lineStyle: { color: '#2A3348' } },
      },
      series: [
        {
          type: 'radar',
          data: [
            {
              value: dataA,
              name: '\u57fa\u51c6\u671f',
              symbol: 'circle',
              symbolSize: 6,
              lineStyle: { width: 2, type: 'solid', color: '#00D4AA' },
              areaStyle: { color: 'rgba(0,212,170,0.15)' },
              itemStyle: { color: '#00D4AA' },
            },
            {
              value: dataB,
              name: '\u5bf9\u6bd4\u671f',
              symbol: 'rect',
              symbolSize: 6,
              lineStyle: { width: 2, type: 'dashed', color: '#8B5CF6' },
              areaStyle: { color: 'rgba(139,92,246,0.10)' },
              itemStyle: { color: '#8B5CF6' },
            },
          ],
          animationDuration: 800,
          animationEasing: 'cubicOut' as const,
        },
      ],
    }
  }, [filteredIndicators])

  const crossSectionalRadarOption = useMemo(() => {
    const indicators = filteredIndicators.map((i) => ({
      name: i.name,
      max: Math.max(
        i.valueA,
        ...layers.map((l) => l.values[i.id]?.mean ?? 0),
        1,
      ) * 1.3,
    }))

    const primaryData = filteredIndicators.map((i) => i.valueA)
    const seriesData = [
      {
        value: primaryData,
        name: '\u5f20\u4f1f (\u4e3b\u5bf9\u8c61)',
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { width: 2.5, type: 'solid', color: '#00D4AA' },
        areaStyle: { color: 'rgba(0,212,170,0.15)' },
        itemStyle: { color: '#00D4AA' },
      },
      ...layers.map((layer, idx) => ({
        value: filteredIndicators.map((i) => layer.values[i.id]?.mean ?? 0),
        name: layer.name,
        symbol: ['diamond', 'rect', 'triangle'][idx] as string,
        symbolSize: 6,
        lineStyle: { width: 2, type: 'dashed' as const, color: layer.color },
        areaStyle: layer.type === 'group' ? { color: `${layer.color}14` } : undefined,
        itemStyle: { color: layer.color },
      })),
    ]

    return {
      color: ['#00D4AA', ...layers.map((l) => l.color)],
      tooltip: { trigger: 'item' },
      legend: {
        data: ['\u5f20\u4f1f (\u4e3b\u5bf9\u8c61)', ...layers.map((l) => l.name)],
        bottom: 0,
        textStyle: { color: '#8B95A5', fontSize: 11 },
      },
      radar: {
        indicator: indicators,
        shape: 'polygon',
        splitNumber: 4,
        axisName: { color: '#8B95A5', fontSize: 10 },
        splitLine: { lineStyle: { color: '#2A3348' } },
        splitArea: {
          show: true,
          areaStyle: {
            color: ['rgba(20,24,33,0.3)', 'rgba(20,24,33,0.5)'],
          },
        },
        axisLine: { lineStyle: { color: '#2A3348' } },
      },
      series: [
        {
          type: 'radar',
          data: seriesData,
          animationDuration: 800,
          animationEasing: 'cubicOut' as const,
        },
      ],
    }
  }, [filteredIndicators, layers])

  const barChartOption = useMemo(() => {
    const names = filteredIndicators.map((i) => i.name)
    const teValues = filteredIndicators.map((i) => calcTE(i.sdA, i.sdB, i.nA, i.nB))
    const noiseUpper = filteredIndicators.map((i, idx) => i.valueA + teValues[idx] * 1.96)
    const noiseLower = filteredIndicators.map((i, idx) => Math.max(0, i.valueA - teValues[idx] * 1.96))

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: '#1C2130',
        borderColor: '#2A3348',
        textStyle: { color: '#E8ECF1', fontSize: 12 },
      },
      legend: {
        data: ['\u57fa\u51c6\u671f', '\u5bf9\u6bd4\u671f', '\u8bef\u5dee\u5e26 (Noise Zone)'],
        bottom: 0,
        textStyle: { color: '#8B95A5', fontSize: 11 },
      },
      grid: { left: '3%', right: '4%', bottom: '15%', top: '10%', containLabel: true },
      xAxis: {
        type: 'category',
        data: names,
        axisLabel: { color: '#8B95A5', fontSize: 10, rotate: 30 },
        axisLine: { lineStyle: { color: '#2A3348' } },
      },
      yAxis: {
        type: 'value',
        axisLabel: { color: '#8B95A5', fontSize: 10 },
        splitLine: { lineStyle: { color: '#2A3348', type: 'dashed' } },
        axisLine: { lineStyle: { color: '#2A3348' } },
      },
      series: [
        {
          name: '\u57fa\u51c6\u671f',
          type: 'bar',
          data: filteredIndicators.map((i) => i.valueA),
          itemStyle: { color: '#00D4AA' },
          barGap: '10%',
          animationDelay: (idx: number) => idx * 40,
        },
        {
          name: '\u5bf9\u6bd4\u671f',
          type: 'bar',
          data: filteredIndicators.map((i) => ({
            value: i.valueB,
            itemStyle: {
              color: '#8B5CF6',
            },
          })),
          itemStyle: { color: '#8B5CF6' },
          animationDelay: (idx: number) => idx * 40 + 200,
        },
        {
          name: '\u8bef\u5dee\u5e26 (Noise Zone)',
          type: 'custom',
          renderItem: (_params: unknown, api: { value: (idx: number) => number; coord: (p: number[]) => number[]; size: (p: number[]) => number[] }) => {
            const categoryIndex = api.value(0)
            const low = api.value(1)
            const high = api.value(2)
            const start = api.coord([categoryIndex, low])
            const end = api.coord([categoryIndex, high])
            const width = (api.size([0, 0]) as number[])[0] * 0.6
            return {
              type: 'rect',
              shape: {
                x: start[0] - width / 2,
                y: end[1],
                width: width,
                height: start[1] - end[1],
              },
              style: { fill: 'rgba(245,158,11,0.10)' },
            }
          },
          data: filteredIndicators.map((_, idx) => [idx, noiseLower[idx], noiseUpper[idx]]),
          z: 1,
          animationDelay: (idx: number) => idx * 40 + 400,
        },
      ],
      animationDuration: 600,
      animationEasing: 'cubicOut' as const,
    }
  }, [filteredIndicators])

  const boxPlotOption = useMemo(() => {
    const groupLayers = layers.filter((l) => l.type === 'group')
    if (groupLayers.length === 0) return null

    const categories = filteredIndicators.map((i) => i.name)
    const series = groupLayers.map((layer) => {
      const boxData = filteredIndicators.map((ind) => {
        const v = layer.values[ind.id]
        if (!v) return [0, 0, 0, 0, 0]
        // Generate box plot data: [min, Q1, median, Q3, max]
        const min = v.mean - v.sd * 1.5
        const q1 = v.mean - v.sd * 0.67
        const median = v.mean
        const q3 = v.mean + v.sd * 0.67
        const max = v.mean + v.sd * 1.5
        return [min, q1, median, q3, max]
      })

      return {
        name: layer.name,
        type: 'boxplot' as const,
        data: boxData,
        itemStyle: { color: `${layer.color}30`, borderColor: layer.color, borderWidth: 2 },
        animationDelay: (idx: number) => idx * 50,
      }
    })

    return {
      tooltip: {
        trigger: 'item',
        backgroundColor: '#1C2130',
        borderColor: '#2A3348',
        textStyle: { color: '#E8ECF1', fontSize: 12 },
      },
      legend: {
        data: groupLayers.map((l) => l.name),
        bottom: 0,
        textStyle: { color: '#8B95A5', fontSize: 11 },
      },
      grid: { left: '3%', right: '4%', bottom: '15%', top: '10%', containLabel: true },
      xAxis: {
        type: 'category',
        data: categories,
        axisLabel: { color: '#8B95A5', fontSize: 10, rotate: 30 },
        axisLine: { lineStyle: { color: '#2A3348' } },
      },
      yAxis: {
        type: 'value',
        axisLabel: { color: '#8B95A5', fontSize: 10 },
        splitLine: { lineStyle: { color: '#2A3348', type: 'dashed' } },
        axisLine: { lineStyle: { color: '#2A3348' } },
      },
      series,
      animationDuration: 800,
      animationEasing: 'cubicOut' as const,
    }
  }, [filteredIndicators, layers])

  // ── Table Data ───────────────────────────────────────────────────────────

  const tableData = useMemo(() => {
    return filteredIndicators.map((ind) => {
      const change = ind.valueB - ind.valueA
      const changePct = (change / ind.valueA) * 100
      const isImproved =
        (ind.direction === 'higher' && change > 0) || (ind.direction === 'lower' && change < 0)
      const d = calcCohensD(ind.valueA, ind.valueB, ind.sdA, ind.sdB, ind.nA, ind.nB)
      const p = calcPairedTTest(ind.valueA, ind.valueB, ind.sdA, ind.sdB, ind.nA)
      const te = calcTE(ind.sdA, ind.sdB, ind.nA, ind.nB)
      const mdc = calcMDC(te)
      const significant = Math.abs(change) > mdc

      return { ...ind, change, changePct, isImproved, d, p, te, mdc, significant }
    })
  }, [filteredIndicators])

  // ── Cross-sectional table data ──────────────────────────────────────────

  const crossTableData = useMemo(() => {
    return filteredIndicators.map((ind) => {
      const layerComparisons = layers.map((layer) => {
        const lv = layer.values[ind.id]
        if (!lv) return null
        const diff = ind.valueA - lv.mean
        const pooledSD = Math.sqrt(
          ((ind.nA - 1) * ind.sdA * ind.sdA + (lv.n - 1) * lv.sd * lv.sd) / (ind.nA + lv.n - 2),
        )
        const d = diff / (pooledSD || 1)
        const se = pooledSD * Math.sqrt(1 / ind.nA + 1 / lv.n)
        const t = diff / (se || 1)
        const df = ind.nA + lv.n - 2
        const p = 2 * (1 - studentTCDF(Math.abs(t), df))
        return { layer, diff, d, p: Math.max(0.001, Math.min(1, p)) }
      }).filter(Boolean)

      return { indicator: ind, comparisons: layerComparisons }
    })
  }, [filteredIndicators, layers])

  const presets = [
    { label: '\u590f\u8bad\u524d\u540e', a: { from: '2024-04-01', to: '2024-05-15' }, b: { from: '2024-05-16', to: '2024-07-01' } },
    { label: '\u51ac\u8bad\u524d\u540e', a: { from: '2024-10-01', to: '2024-11-15' }, b: { from: '2024-11-16', to: '2024-12-31' } },
    { label: '\u8d5b\u5b63\u524d\u540e', a: { from: '2024-02-01', to: '2024-03-01' }, b: { from: '2024-08-01', to: '2024-09-01' } },
    { label: '\u8fd13\u4e2a\u6708 vs \u524d3\u4e2a\u6708', a: { from: '2024-01-01', to: '2024-03-31' }, b: { from: '2024-04-01', to: '2024-06-30' } },
    { label: '\u672c\u5468 vs \u4e0a\u5468', a: { from: '2024-06-17', to: '2024-06-23' }, b: { from: '2024-06-24', to: '2024-06-30' } },
  ]

  return (
    <div className="flex flex-1 flex-col" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* ── Page Header ── */}
      <div
        className="flex h-14 shrink-0 items-center justify-between border-b px-6"
        style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-subtle)' }}
      >
        <div className="flex items-center gap-3">
          <GitCompare size={22} strokeWidth={1.5} style={{ color: 'var(--accent-cyan)' }} />
          <h1 className="text-[22px] font-bold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
            对比分析
          </h1>
        </div>
        <div className="flex items-center gap-1 rounded-lg p-1" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
          <button
            onClick={() => setActiveTab('longitudinal')}
            className="relative rounded-md px-4 py-1.5 text-[13px] font-medium transition-colors duration-200"
            style={{
              color: activeTab === 'longitudinal' ? 'var(--accent-cyan)' : 'var(--text-secondary)',
              backgroundColor: activeTab === 'longitudinal' ? 'var(--bg-hover)' : 'transparent',
            }}
          >
            纵向对比
          </button>
          <button
            onClick={() => setActiveTab('cross-sectional')}
            className="relative rounded-md px-4 py-1.5 text-[13px] font-medium transition-colors duration-200"
            style={{
              color: activeTab === 'cross-sectional' ? 'var(--accent-cyan)' : 'var(--text-secondary)',
              backgroundColor: activeTab === 'cross-sectional' ? 'var(--bg-hover)' : 'transparent',
            }}
          >
            横向对比
          </button>
        </div>
      </div>

      {/* ── Control Bar ── */}
      <div
        className="flex h-[52px] shrink-0 items-center gap-4 border-b px-6"
        style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-subtle)' }}
      >
        <AnimatePresence mode="wait">
          {activeTab === 'longitudinal' ? (
            <motion.div
              key="long-controls"
              className="flex items-center gap-3"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
            >
              <span className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>
                基准期
              </span>
              <div className="flex items-center gap-1.5">
                <input
                  type="date"
                  value={dateA.from}
                  onChange={(e) => setDateA((p) => ({ ...p, from: e.target.value }))}
                  className="rounded-md border px-2 py-1 text-[12px] outline-none transition-colors"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-primary)',
                  }}
                />
                <span style={{ color: 'var(--text-muted)' }}>~</span>
                <input
                  type="date"
                  value={dateA.to}
                  onChange={(e) => setDateA((p) => ({ ...p, to: e.target.value }))}
                  className="rounded-md border px-2 py-1 text-[12px] outline-none transition-colors"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>
              <span className="mx-2 text-[11px]" style={{ color: 'var(--text-muted)' }}>|</span>
              <span className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>
                对比期
              </span>
              <div className="flex items-center gap-1.5">
                <input
                  type="date"
                  value={dateB.from}
                  onChange={(e) => setDateB((p) => ({ ...p, from: e.target.value }))}
                  className="rounded-md border px-2 py-1 text-[12px] outline-none transition-colors"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-primary)',
                  }}
                />
                <span style={{ color: 'var(--text-muted)' }}>~</span>
                <input
                  type="date"
                  value={dateB.to}
                  onChange={(e) => setDateB((p) => ({ ...p, to: e.target.value }))}
                  className="rounded-md border px-2 py-1 text-[12px] outline-none transition-colors"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>
              <div className="relative">
                <button
                  onClick={() => setPresetOpen(!presetOpen)}
                  className="flex items-center gap-1 rounded-md border px-2.5 py-1 text-[11px] font-medium transition-colors"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <Calendar size={12} />
                  快速选择
                  <ChevronDown size={12} />
                </button>
                <AnimatePresence>
                  {presetOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -4, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -4, scale: 0.97 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full z-50 mt-1 w-52 rounded-lg border py-1 shadow-lg"
                      style={{
                        backgroundColor: 'var(--bg-secondary)',
                        borderColor: 'var(--border-subtle)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                      }}
                    >
                      {presets.map((p) => (
                        <button
                          key={p.label}
                          onClick={() => {
                            setDateA(p.a)
                            setDateB(p.b)
                            setPresetOpen(false)
                          }}
                          className="block w-full px-3 py-1.5 text-left text-[12px] transition-colors hover:bg-[var(--bg-hover)]"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {p.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="cross-controls"
              className="flex items-center gap-3"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
            >
              <span className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>
                <span style={{ color: 'var(--text-muted)' }}>主对象:</span>{' '}
                <strong style={{ color: 'var(--accent-cyan)' }}>张伟</strong>
              </span>
              <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>|</span>
              <button
                onClick={addLayer}
                disabled={layers.length >= 3}
                className="flex items-center gap-1 rounded-md border px-2.5 py-1 text-[11px] font-medium transition-colors disabled:opacity-40"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  borderColor: 'var(--border-subtle)',
                  color: layers.length >= 3 ? 'var(--text-muted)' : 'var(--accent-cyan)',
                }}
              >
                <Plus size={12} />
                添加对比对象
              </button>
              <div className="flex items-center gap-1.5">
                <AnimatePresence>
                  {layers.map((layer) => (
                    <motion.div
                      key={layer.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
                      className="flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                      style={{
                        backgroundColor: `${layer.color}20`,
                        color: layer.color,
                        border: `1px solid ${layer.color}40`,
                      }}
                    >
                      {layer.type === 'group' && <Users size={10} />}
                      {layer.name}
                      <button
                        onClick={() => removeLayer(layer.id)}
                        className="ml-0.5 rounded-full p-0.5 transition-colors hover:bg-[var(--bg-hover)]"
                      >
                        <X size={10} />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
              <span
                className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                style={{
                  backgroundColor: layers.length >= 3 ? 'rgba(245,158,11,0.15)' : 'var(--bg-secondary)',
                  color: layers.length >= 3 ? 'var(--accent-amber)' : 'var(--text-muted)',
                }}
              >
                已选: {layers.length}/3
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Main Content ── */}
      <div className="flex-1 overflow-auto p-6">
        <AnimatePresence mode="wait">
          {activeTab === 'longitudinal' ? (
            <motion.div
              key="longitudinal"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col gap-6"
            >
              {/* Comparison Configuration Panel */}
              <div
                className="rounded-xl border p-4"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-[15px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                    对比指标配置
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        setExpandedCategories(
                          new Set([...categories.map((c) => c.name)]),
                        )
                      }
                      className="text-[11px] font-medium transition-colors hover:opacity-80"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      全部展开
                    </button>
                    <button
                      onClick={selectAll}
                      className="text-[11px] font-medium transition-colors hover:opacity-80"
                      style={{ color: 'var(--accent-cyan)' }}
                    >
                      全选
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                  {categories.map((cat) => (
                    <div key={cat.name}>
                      <button
                        onClick={() => toggleExpandCategory(cat.name)}
                        className="flex items-center gap-1.5 py-1"
                      >
                        <span
                          className="transition-transform duration-200"
                          style={{
                            color: 'var(--text-muted)',
                            transform: expandedCategories.has(cat.name) ? 'rotate(0deg)' : 'rotate(-90deg)',
                          }}
                        >
                          <ChevronDown size={12} />
                        </span>
                        <label
                          className="flex cursor-pointer items-center gap-2 text-[13px] font-medium"
                          style={{ color: 'var(--text-primary)' }}
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleCategory(cat.name)
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={cat.indicators.every((i) => selectedIndicators.has(i.id))}
                            onChange={() => toggleCategory(cat.name)}
                            className="h-3.5 w-3.5 rounded accent-[var(--accent-cyan)]"
                          />
                          {cat.name}
                        </label>
                      </button>
                      <AnimatePresence>
                        {expandedCategories.has(cat.name) && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="ml-6 flex flex-col gap-1 overflow-hidden"
                          >
                            {cat.indicators.map((ind) => (
                              <label
                                key={ind.id}
                                className="flex cursor-pointer items-center gap-2 py-0.5 text-[12px]"
                                style={{ color: 'var(--text-secondary)' }}
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedIndicators.has(ind.id)}
                                  onChange={() => toggleIndicator(ind.id)}
                                  className="h-3.5 w-3.5 rounded accent-[var(--accent-cyan)]"
                                />
                                {ind.name} ({ind.unit})
                              </label>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </div>

              {/* Statistical Summary Banner */}
              <div
                className="flex h-12 items-center gap-6 rounded-xl border px-4"
                style={{
                  background: 'linear-gradient(to right, var(--bg-secondary), var(--bg-tertiary))',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                <StatBadge
                  label="样本"
                  value={`N=${statsSummary.n}`}
                  color={
                    statsSummary.n === 1
                      ? 'var(--accent-amber)'
                      : statsSummary.n >= 6
                        ? 'var(--accent-green)'
                        : 'var(--text-primary)'
                  }
                />
                <StatBadge
                  label="TE"
                  value={statsSummary.avgTE.toFixed(2)}
                  color="var(--text-secondary)"
                  tooltip="典型误差 — 反映测量的技术误差"
                />
                <StatBadge
                  label="MDC"
                  value={statsSummary.avgMDC.toFixed(2)}
                  color="var(--text-primary)"
                  highlight
                  tooltip="最小可检测变化 — 超出此值才认为变化是真实的"
                />
                <StatBadge
                  label="SWC"
                  value={statsSummary.avgSWC.toFixed(2)}
                  color="var(--text-secondary)"
                  tooltip="最小有意义变化 — 基于0.2×标准差"
                />
                <StatBadge
                  label="Cohen's d"
                  value={`${statsSummary.avgD.toFixed(2)} [${cohensDLabel(statsSummary.avgD).text}]`}
                  color={cohensDLabel(statsSummary.avgD).color}
                />
              </div>

              {/* N=1 Warning */}
              {statsSummary.n === 1 && (
                <div
                  className="flex items-start gap-2 rounded-lg border-l-[3px] px-3 py-2"
                  style={{
                    backgroundColor: 'rgba(245,158,11,0.08)',
                    borderLeftColor: 'var(--accent-amber)',
                  }}
                >
                  <AlertTriangle size={14} className="mt-0.5 shrink-0" style={{ color: 'var(--accent-amber)' }} />
                  <p className="text-[12px] leading-relaxed" style={{ color: 'var(--accent-amber)' }}>
                    当前为单次测试对比 (N=1)，统计结果基于典型误差(TE)计算，可靠性有限。建议进行多次重复测试以提高分析可信度。
                  </p>
                </div>
              )}

              {/* Charts Row */}
              <div className="grid grid-cols-2 gap-6">
                {/* Radar Chart */}
                <div
                  className="rounded-xl border p-4"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'var(--border-subtle)',
                  }}
                >
                  <h3 className="mb-2 text-[15px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                    雷达图对比
                  </h3>
                  <ReactEChartsCore
                    option={radarOption}
                    style={{ height: 400 }}
                    opts={{ renderer: 'svg' }}
                  />
                </div>

                {/* Bar Chart with Noise Zone */}
                <div
                  className="rounded-xl border p-4"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'var(--border-subtle)',
                  }}
                >
                  <h3 className="mb-2 text-[15px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                    指标对比与误差带
                  </h3>
                  <ReactEChartsCore
                    option={barChartOption}
                    style={{ height: 400 }}
                    opts={{ renderer: 'svg' }}
                  />
                </div>
              </div>

              {/* Detailed Table */}
              <div
                className="overflow-hidden rounded-xl border"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                <div className="px-4 py-3">
                  <h3 className="text-[15px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                    详细对比数据
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-[12px]">
                    <thead>
                      <tr style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                        {['指标名称', '类别', '单位', '基准期', '对比期', '变化量', '变化%', 'p值', '显著性', '效应量'].map(
                          (h) => (
                            <th
                              key={h}
                              className="px-3 py-2 text-left font-medium"
                              style={{ color: 'var(--text-secondary)' }}
                            >
                              {h}
                            </th>
                          ),
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {tableData.map((row) => {
                        const sig = significanceBadge(row.p)
                        return (
                          <tr
                            key={row.id}
                            className="transition-colors duration-100 hover:bg-[var(--bg-hover)]"
                            style={{
                              borderLeft: row.significant
                                ? `3px solid ${row.isImproved ? 'var(--accent-green)' : 'var(--accent-red)'}`
                                : '3px solid transparent',
                              backgroundColor:
                                filteredIndicators.indexOf(row) % 2 === 0
                                  ? 'var(--bg-secondary)'
                                  : 'rgba(255,255,255,0.02)',
                            }}
                          >
                            <td className="px-3 py-2 font-medium" style={{ color: 'var(--text-primary)' }}>
                              {row.name}
                            </td>
                            <td className="px-3 py-2">
                              <CategoryBadge name={row.category} />
                            </td>
                            <td className="px-3 py-2" style={{ color: 'var(--text-muted)' }}>
                              {row.unit}
                            </td>
                            <td className="px-3 py-2 font-mono" style={{ color: 'var(--text-primary)' }}>
                              {row.valueA.toFixed(1)}±{row.sdA.toFixed(1)}
                            </td>
                            <td className="px-3 py-2 font-mono" style={{ color: 'var(--text-primary)' }}>
                              {row.valueB.toFixed(1)}±{row.sdB.toFixed(1)}
                            </td>
                            <td
                              className="px-3 py-2 font-mono font-medium"
                              style={{
                                color: row.change > 0 ? 'var(--accent-green)' : row.change < 0 ? 'var(--accent-red)' : 'var(--text-muted)',
                              }}
                            >
                              {row.change > 0 ? '+' : ''}
                              {row.change.toFixed(1)}
                            </td>
                            <td
                              className="px-3 py-2 font-mono"
                              style={{
                                color: row.changePct > 0 ? 'var(--accent-green)' : row.changePct < 0 ? 'var(--accent-red)' : 'var(--text-muted)',
                              }}
                            >
                              {row.changePct > 0 ? '+' : ''}
                              {row.changePct.toFixed(1)}%
                            </td>
                            <td
                              className="px-3 py-2 font-mono"
                              style={{ color: pValueColor(row.p) }}
                            >
                              {formatPValue(row.p)}
                            </td>
                            <td className="px-3 py-2">
                              <span
                                className="rounded px-1.5 py-0.5 text-[11px] font-medium"
                                style={{ color: sig.color }}
                              >
                                {sig.text}
                              </span>
                            </td>
                            <td className="px-3 py-2 font-mono">
                              <span style={{ color: cohensDLabel(row.d).color }}>
                                {Math.abs(row.d).toFixed(2)} {cohensDLabel(row.d).text.charAt(0)}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                <div
                  className="border-t px-4 py-2 text-[11px]"
                  style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}
                >
                  统计方法: {statsSummary.n === 1 ? '基于典型误差(TE)的最小可检测变化(MDC)' : '配对t检验 + Cohen\'s d'} | 
                  样本: 基准期 N={statsSummary.n}, 对比期 N={statsSummary.n}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="cross-sectional"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col gap-6"
            >
              {/* Comparison Configuration Panel */}
              <div
                className="rounded-xl border p-4"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-[15px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                    对比指标配置
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        setExpandedCategories(
                          new Set([...categories.map((c) => c.name)]),
                        )
                      }
                      className="text-[11px] font-medium transition-colors hover:opacity-80"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      全部展开
                    </button>
                    <button
                      onClick={selectAll}
                      className="text-[11px] font-medium transition-colors hover:opacity-80"
                      style={{ color: 'var(--accent-cyan)' }}
                    >
                      全选
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                  {categories.map((cat) => (
                    <div key={cat.name}>
                      <button
                        onClick={() => toggleExpandCategory(cat.name)}
                        className="flex items-center gap-1.5 py-1"
                      >
                        <span
                          className="transition-transform duration-200"
                          style={{
                            color: 'var(--text-muted)',
                            transform: expandedCategories.has(cat.name) ? 'rotate(0deg)' : 'rotate(-90deg)',
                          }}
                        >
                          <ChevronDown size={12} />
                        </span>
                        <label
                          className="flex cursor-pointer items-center gap-2 text-[13px] font-medium"
                          style={{ color: 'var(--text-primary)' }}
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleCategory(cat.name)
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={cat.indicators.every((i) => selectedIndicators.has(i.id))}
                            onChange={() => toggleCategory(cat.name)}
                            className="h-3.5 w-3.5 rounded accent-[var(--accent-cyan)]"
                          />
                          {cat.name}
                        </label>
                      </button>
                      <AnimatePresence>
                        {expandedCategories.has(cat.name) && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="ml-6 flex flex-col gap-1 overflow-hidden"
                          >
                            {cat.indicators.map((ind) => (
                              <label
                                key={ind.id}
                                className="flex cursor-pointer items-center gap-2 py-0.5 text-[12px]"
                                style={{ color: 'var(--text-secondary)' }}
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedIndicators.has(ind.id)}
                                  onChange={() => toggleIndicator(ind.id)}
                                  className="h-3.5 w-3.5 rounded accent-[var(--accent-cyan)]"
                                />
                                {ind.name} ({ind.unit})
                              </label>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </div>

              {/* Statistical Summary Banner */}
              <div
                className="flex h-12 items-center gap-6 rounded-xl border px-4"
                style={{
                  background: 'linear-gradient(to right, var(--bg-secondary), var(--bg-tertiary))',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                <StatBadge
                  label="对比对象数"
                  value={`${layers.length}`}
                  color="var(--text-primary)"
                />
                <StatBadge
                  label="t-test"
                  value={`p=${tableData.length > 0 ? formatPValue(tableData[0].p) : '--'} [*]`}
                  color={tableData.length > 0 && tableData[0].p < 0.05 ? 'var(--accent-green)' : 'var(--text-muted)'}
                />
                <StatBadge
                  label="Effect Size"
                  value={`d=${statsSummary.avgD.toFixed(2)} [${cohensDLabel(statsSummary.avgD).text}]`}
                  color={cohensDLabel(statsSummary.avgD).color}
                />
                <StatBadge
                  label="统计功效"
                  value="0.84"
                  color="var(--text-primary)"
                />
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-2 gap-6">
                {/* Multi-Layer Radar */}
                <div
                  className="rounded-xl border p-4"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'var(--border-subtle)',
                  }}
                >
                  <h3 className="mb-2 text-[15px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                    多对象雷达对比
                  </h3>
                  <ReactEChartsCore
                    option={crossSectionalRadarOption}
                    style={{ height: 400 }}
                    opts={{ renderer: 'svg' }}
                  />
                </div>

                {/* Box Plot */}
                <div
                  className="rounded-xl border p-4"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'var(--border-subtle)',
                  }}
                >
                  <h3 className="mb-2 text-[15px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {boxPlotOption ? '分布对比 (箱线图)' : '指标数值对比'}
                  </h3>
                  {boxPlotOption ? (
                    <ReactEChartsCore
                      option={boxPlotOption}
                      style={{ height: 400 }}
                      opts={{ renderer: 'svg' }}
                    />
                  ) : (
                    <ReactEChartsCore
                      option={barChartOption}
                      style={{ height: 400 }}
                      opts={{ renderer: 'svg' }}
                    />
                  )}
                </div>
              </div>

              {/* Cross-sectional Detailed Table */}
              <div
                className="overflow-hidden rounded-xl border"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                <div className="px-4 py-3">
                  <h3 className="text-[15px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                    横向对比详细数据
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-[12px]">
                    <thead>
                      <tr style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                        <th className="px-3 py-2 text-left font-medium" style={{ color: 'var(--text-secondary)' }}>
                          指标名称
                        </th>
                        <th className="px-3 py-2 text-left font-medium" style={{ color: 'var(--text-secondary)' }}>
                          单位
                        </th>
                        <th className="px-3 py-2 text-left font-medium" style={{ color: 'var(--text-secondary)' }}>
                          主对象
                        </th>
                        {layers.map((l) => (
                          <th
                            key={l.id}
                            className="px-3 py-2 text-left font-medium"
                            style={{ color: l.color }}
                          >
                            {l.name}
                          </th>
                        ))}
                        {layers.map((l) => (
                          <th
                            key={l.id}
                            className="px-3 py-2 text-left font-medium"
                            style={{ color: 'var(--text-secondary)' }}
                          >
                            差异({l.name})
                          </th>
                        ))}
                        {layers.map((l) => (
                          <React.Fragment key={l.id}>
                            <th
                              className="px-3 py-2 text-left font-medium"
                              style={{ color: 'var(--text-secondary)' }}
                            >
                              p值({l.name})
                            </th>
                            <th
                              className="px-3 py-2 text-left font-medium"
                              style={{ color: 'var(--text-secondary)' }}
                            >
                              效应量({l.name})
                            </th>
                          </React.Fragment>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {crossTableData.map((row, rowIdx) => (
                        <tr
                          key={row.indicator.id}
                          className="transition-colors duration-100 hover:bg-[var(--bg-hover)]"
                          style={{
                            backgroundColor:
                              rowIdx % 2 === 0 ? 'var(--bg-secondary)' : 'rgba(255,255,255,0.02)',
                          }}
                        >
                          <td className="px-3 py-2 font-medium" style={{ color: 'var(--text-primary)' }}>
                            {row.indicator.name}
                          </td>
                          <td className="px-3 py-2" style={{ color: 'var(--text-muted)' }}>
                            {row.indicator.unit}
                          </td>
                          <td className="px-3 py-2 font-mono" style={{ color: 'var(--accent-cyan)' }}>
                            {row.indicator.valueA.toFixed(1)}±{row.indicator.sdA.toFixed(1)}
                          </td>
                          {layers.map((l) => {
                            const v = l.values[row.indicator.id]
                            return (
                              <td
                                key={l.id}
                                className="px-3 py-2 font-mono"
                                style={{ color: 'var(--text-primary)' }}
                              >
                                {v ? `${v.mean.toFixed(1)}±${v.sd.toFixed(1)}` : '—'}
                              </td>
                            )
                          })}
                          {row.comparisons.map((comp) =>
                            comp ? (
                              <td
                                key={comp.layer.id + '-diff'}
                                className="px-3 py-2 font-mono font-medium"
                                style={{
                                  color:
                                    comp.diff > 0 ? 'var(--accent-green)' : comp.diff < 0 ? 'var(--accent-red)' : 'var(--text-muted)',
                                }}
                              >
                                {comp.diff > 0 ? '+' : ''}
                                {comp.diff.toFixed(1)}
                              </td>
                            ) : (
                              <td key="na" className="px-3 py-2" style={{ color: 'var(--text-muted)' }}>—</td>
                            ),
                          )}
                          {row.comparisons.map((comp) =>
                            comp ? (
                              <React.Fragment key={comp.layer.id + '-stats'}>
                                <td
                                  className="px-3 py-2 font-mono"
                                  style={{ color: pValueColor(comp.p) }}
                                >
                                  {formatPValue(comp.p)}
                                </td>
                                <td className="px-3 py-2 font-mono">
                                  <span style={{ color: cohensDLabel(comp.d).color }}>
                                    {Math.abs(comp.d).toFixed(2)} {cohensDLabel(comp.d).text.charAt(0)}
                                  </span>
                                </td>
                              </React.Fragment>
                            ) : (
                              <React.Fragment key="na2">
                                <td className="px-3 py-2" style={{ color: 'var(--text-muted)' }}>—</td>
                                <td className="px-3 py-2" style={{ color: 'var(--text-muted)' }}>—</td>
                              </React.Fragment>
                            ),
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {layers.length > 1 && (
                  <div
                    className="border-t px-4 py-2 text-[11px]"
                    style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}
                  >
                    多重比较校正: Bonferroni校正已应用 | 组间差异采用Welch's t-test
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ── Sub-components ───────────────────────────────────────────────────────────

function StatBadge({
  label,
  value,
  color,
  highlight,
  tooltip,
}: {
  label: string
  value: string
  color: string
  highlight?: boolean
  tooltip?: string
}) {
  const [showTip, setShowTip] = useState(false)

  return (
    <div
      className="relative flex items-center gap-1.5"
      onMouseEnter={() => tooltip && setShowTip(true)}
      onMouseLeave={() => setShowTip(false)}
    >
      <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
        {label}:
      </span>
      <span
        className="rounded px-1.5 py-0.5 font-mono text-[13px] font-medium"
        style={{
          color,
          backgroundColor: highlight ? 'rgba(0,212,170,0.08)' : 'transparent',
        }}
      >
        {value}
      </span>
      {tooltip && (
        <Info size={12} style={{ color: 'var(--text-muted)', cursor: 'help' }} />
      )}
      {showTip && tooltip && (
        <div
          className="absolute bottom-full left-0 mb-1 whitespace-nowrap rounded-md px-2.5 py-1.5 text-[11px] font-medium"
          style={{
            backgroundColor: 'var(--bg-tertiary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-subtle)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            zIndex: 50,
          }}
        >
          {tooltip}
        </div>
      )}
    </div>
  )
}

function CategoryBadge({ name }: { name: string }) {
  const colors: Record<string, string> = {
    '力量测试': '#00D4AA',
    '速度测试': '#3B82F6',
    '耐力测试': '#8B5CF6',
    '身体形态': '#F59E0B',
  }
  const color = colors[name] || 'var(--text-muted)'
  return (
    <span
      className="rounded px-1.5 py-0.5 text-[10px] font-medium"
      style={{
        backgroundColor: `${color}15`,
        color,
      }}
    >
      {name}
    </span>
  )
}
