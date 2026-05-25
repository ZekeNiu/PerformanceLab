import { compareSummaries } from '@/lib/performance-statistics'

// Demo data for the SportPulse dashboard

export interface AlertCard {
  id: string
  name: string
  metric: string
  change: string
  severity: 'critical' | 'warning' | 'recovering'
}

export interface BodyPart {
  name: string
  x: number
  y: number
  score: number
}

export interface DailyData {
  date: string
  hrv: number
  rhr: number
  readiness: number
  sleep: number
  stress: number
  energy: number
  soreness: number
  confidence: number
  acwr: number
  load: number
  sRPE: number
  duration: number
  monotony: number
}

export interface PeriodicIndicator {
  name: string
  unit: string
  mean: number
  best: number
  sd: number
  cv: number
  ci: [number, number]
  rating: string
  score: number
}

export interface PeriodicCategory {
  name: string
  indicators: PeriodicIndicator[]
}

export const alertCards: AlertCard[] = [
  { id: '1', name: '张伟', metric: 'HRV ↓12%', change: '-12%', severity: 'critical' },
  { id: '2', name: '李娜', metric: 'ACWR 1.52', change: '+0.52', severity: 'warning' },
  { id: '3', name: '王强', metric: 'HRV ↑8%', change: '+8%', severity: 'recovering' },
  { id: '4', name: '陈明', metric: '睡眠 ↓18%', change: '-18%', severity: 'warning' },
  { id: '5', name: '赵敏', metric: 'ACWR 0.72', change: '-0.28', severity: 'warning' },
]

export const athletes = ['张伟', '李娜', '王强', '陈明', '赵敏', '刘洋', '周婷', '吴涛']

const dates = Array.from({ length: 30 }, (_, i) => {
  const d = new Date(2024, 0, 1 + i)
  return d.toISOString().split('T')[0]
})

function generateDailyData(): DailyData[] {
  return dates.map((date, i) => {
    const baseHRV = 65 + Math.sin(i / 5) * 8
    const baseRHR = 52 + Math.cos(i / 7) * 4
    return {
      date,
      hrv: Math.round((baseHRV + (Math.random() - 0.5) * 12) * 10) / 10,
      rhr: Math.round((baseRHR + (Math.random() - 0.5) * 6) * 10) / 10,
      readiness: Math.round((7.2 + Math.sin(i / 4) * 1.5 + (Math.random() - 0.5)) * 10) / 10,
      sleep: Math.round((7.5 + Math.cos(i / 6) * 1.2 + (Math.random() - 0.5) * 0.8) * 10) / 10,
      stress: Math.round((4.5 + Math.sin(i / 3) * 1.8 + (Math.random() - 0.5)) * 10) / 10,
      energy: Math.round((7.0 + Math.cos(i / 5) * 1.5 + (Math.random() - 0.5)) * 10) / 10,
      soreness: Math.round((3.2 + Math.sin(i / 4) * 2 + (Math.random() - 0.5)) * 10) / 10,
      confidence: Math.round((7.8 + Math.cos(i / 6) * 0.8 + (Math.random() - 0.5) * 0.6) * 10) / 10,
      acwr: Math.round((0.95 + Math.sin(i / 8) * 0.4 + (Math.random() - 0.5) * 0.2) * 100) / 100,
      load: Math.round(320 + Math.sin(i / 5) * 80 + (Math.random() - 0.5) * 60),
      sRPE: Math.round(5 + Math.random() * 3),
      duration: Math.round(60 + Math.random() * 40),
      monotony: Math.round((1.3 + Math.sin(i / 6) * 0.5 + (Math.random() - 0.5) * 0.3) * 100) / 100,
    }
  })
}

export const dailyData: DailyData[] = generateDailyData()

export const bodyParts: BodyPart[] = [
  { name: '头部', x: 50, y: 8, score: 0 },
  { name: '颈部', x: 50, y: 15, score: 0 },
  { name: '左肩', x: 30, y: 22, score: 0 },
  { name: '右肩', x: 70, y: 22, score: 4 },
  { name: '左肘', x: 20, y: 35, score: 0 },
  { name: '右肘', x: 80, y: 35, score: 0 },
  { name: '左手腕', x: 15, y: 48, score: 0 },
  { name: '右手腕', x: 85, y: 48, score: 2 },
  { name: '胸部/上背', x: 50, y: 28, score: 0 },
  { name: '腰部', x: 50, y: 40, score: 2 },
  { name: '左髋', x: 35, y: 50, score: 0 },
  { name: '右髋', x: 65, y: 50, score: 0 },
  { name: '左膝', x: 32, y: 68, score: 0 },
  { name: '右膝', x: 68, y: 68, score: 7 },
  { name: '左踝', x: 30, y: 85, score: 0 },
  { name: '右踝', x: 70, y: 85, score: 0 },
]

export const radarData = [
  { category: '力量', score: 78 },
  { category: '速度', score: 85 },
  { category: '耐力', score: 72 },
  { category: '身体形态', score: 68 },
  { category: '身体机能', score: 80 },
]

export const periodicCategories: PeriodicCategory[] = [
  {
    name: '力量',
    indicators: [
      { name: '深蹲跳 CMJ - 跳跃高度', unit: 'cm', mean: 42.3, best: 45.1, sd: 2.14, cv: 5.1, ci: [40.2, 44.4], rating: 'A', score: 85 },
      { name: '深蹲跳 CMJ - 峰值力', unit: 'N', mean: 1850, best: 1920, sd: 87.3, cv: 4.7, ci: [1765, 1935], rating: 'A', score: 82 },
      { name: '深蹲 1RM - 绝对力量', unit: 'kg', mean: 125, best: 132, sd: 6.2, cv: 5.0, ci: [113, 137], rating: 'B', score: 72 },
      { name: '卧推 1RM - 绝对力量', unit: 'kg', mean: 85, best: 90, sd: 4.8, cv: 5.6, ci: [76, 94], rating: 'B', score: 68 },
    ],
  },
  {
    name: '速度',
    indicators: [
      { name: '30m 冲刺', unit: 's', mean: 4.12, best: 3.98, sd: 0.08, cv: 1.9, ci: [3.96, 4.28], rating: 'A', score: 88 },
      { name: '10m 冲刺', unit: 's', mean: 1.85, best: 1.78, sd: 0.05, cv: 2.7, ci: [1.75, 1.95], rating: 'A', score: 86 },
      { name: '变向测试 (5-0-5)', unit: 's', mean: 2.45, best: 2.38, sd: 0.06, cv: 2.4, ci: [2.33, 2.57], rating: 'B', score: 74 },
    ],
  },
  {
    name: '耐力',
    indicators: [
      { name: 'Yo-Yo IR1', unit: 'm', mean: 1760, best: 2000, sd: 145, cv: 8.2, ci: [1480, 2040], rating: 'B', score: 70 },
      { name: '12分钟跑', unit: 'm', mean: 3200, best: 3450, sd: 210, cv: 6.6, ci: [2800, 3600], rating: 'B', score: 65 },
    ],
  },
  {
    name: '身体形态',
    indicators: [
      { name: '体重', unit: 'kg', mean: 75.2, best: 74.8, sd: 1.2, cv: 1.6, ci: [73, 78], rating: 'A', score: 90 },
      { name: '体脂率', unit: '%', mean: 12.5, best: 11.8, sd: 0.8, cv: 6.4, ci: [11, 14], rating: 'A', score: 85 },
      { name: '去脂体重', unit: 'kg', mean: 65.8, best: 66.2, sd: 1.5, cv: 2.3, ci: [63, 69], rating: 'A', score: 88 },
    ],
  },
  {
    name: '身体机能',
    indicators: [
      { name: '最大摄氧量 VO2max', unit: 'ml/kg/min', mean: 56.5, best: 58.2, sd: 2.8, cv: 5.0, ci: [51, 62], rating: 'A', score: 82 },
      { name: '安静心率', unit: 'bpm', mean: 48, best: 46, sd: 3.2, cv: 6.7, ci: [42, 54], rating: 'B', score: 76 },
      { name: '心率恢复 (HRR-1min)', unit: 'bpm', mean: 32, best: 38, sd: 5.4, cv: 16.9, ci: [22, 42], rating: 'B', score: 70 },
    ],
  },
]

export function calculateEMA(values: number[], period: number): number[] {
  const k = 2 / (period + 1)
  const ema: number[] = [values[0]]
  for (let i = 1; i < values.length; i++) {
    ema.push(values[i] * k + ema[i - 1] * (1 - k))
  }
  return ema
}

export function calculateRollingMean(values: number[], period: number): number[] {
  const result: number[] = []
  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) {
      result.push(values.slice(0, i + 1).reduce((a, b) => a + b, 0) / (i + 1))
    } else {
      result.push(values.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period)
    }
  }
  return result
}

export function calculateStd(values: number[]): number {
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  return Math.sqrt(values.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / values.length)
}

export const severityConfig = {
  critical: {
    label: '严重异常',
    bg: 'rgba(239,68,68,0.15)',
    color: '#EF4444',
  },
  warning: {
    label: '注意',
    bg: 'rgba(245,158,11,0.15)',
    color: '#F59E0B',
  },
  recovering: {
    label: '恢复中',
    bg: 'rgba(0,212,170,0.15)',
    color: '#00D4AA',
  },
} as const

export const ratingColors: Record<string, string> = {
  A: '#10B981',
  B: '#00D4AA',
  C: '#F59E0B',
  D: '#EF4444',
}

// ═════════════════════════════════════════════════════════════════
//  Comparison Data & Statistics
// ═════════════════════════════════════════════════════════════════

export interface ComparisonIndicator {
  id: string
  name: string
  category: string
  unit: string
  targetScore: number
  valueA: number
  sdA: number
  nA: number
  valueB: number
  sdB: number
  nB: number
  direction: 'higher' | 'lower'
}

export interface ComparisonLayer {
  id: string
  name: string
  color: string
  type: 'individual' | 'group'
  values: Record<string, { mean: number; sd: number; n: number }>
}

export const DEMO_INDICATORS: ComparisonIndicator[] = [
  // 力量测试
  { id: 'cmj_height', name: 'CMJ 跳跃高度', category: '力量', unit: 'cm', targetScore: 50, valueA: 42.3, sdA: 2.1, nA: 5, valueB: 45.8, sdB: 1.9, nB: 5, direction: 'higher' },
  { id: 'cmj_force', name: 'CMJ 峰值力', category: '力量', unit: 'N', targetScore: 2000, valueA: 1850, sdA: 87, nA: 5, valueB: 1920, sdB: 92, nB: 5, direction: 'higher' },
  { id: 'squat_1rm', name: '深蹲 1RM', category: '力量', unit: 'kg', targetScore: 160, valueA: 140, sdA: 8.5, nA: 4, valueB: 152, sdB: 7.2, nB: 4, direction: 'higher' },
  // 速度测试
  { id: 'sprint_30m', name: '30m 冲刺', category: '速度', unit: 's', targetScore: 3.8, valueA: 4.23, sdA: 0.12, nA: 5, valueB: 4.18, sdB: 0.11, nB: 5, direction: 'lower' },
  { id: 'standing_jump', name: '立定跳远', category: '速度', unit: 'cm', targetScore: 300, valueA: 268, sdA: 14.2, nA: 5, valueB: 275, sdB: 12.8, nB: 5, direction: 'higher' },
  { id: 'agility_t', name: '灵敏测试 T-test', category: '速度', unit: 's', targetScore: 8.5, valueA: 9.45, sdA: 0.31, nA: 4, valueB: 9.28, sdB: 0.28, nB: 4, direction: 'lower' },
  // 耐力测试
  { id: 'yoyo_ir1', name: 'Yo-Yo IR1', category: '耐力', unit: 'm', targetScore: 2200, valueA: 1840, sdA: 156, nA: 5, valueB: 1960, sdB: 142, nB: 5, direction: 'higher' },
  { id: 'lactate_threshold', name: '乳酸阈值跑速', category: '耐力', unit: 'km/h', targetScore: 16, valueA: 14.2, sdA: 0.8, nA: 4, valueB: 14.8, sdB: 0.7, nB: 4, direction: 'higher' },
  // 身体形态
  { id: 'body_fat', name: '体脂率', category: '身体形态', unit: '%', targetScore: 10, valueA: 12.4, sdA: 1.2, nA: 5, valueB: 11.8, sdB: 1.1, nB: 5, direction: 'lower' },
  { id: 'muscle_mass', name: '肌肉量', category: '身体形态', unit: 'kg', targetScore: 62, valueA: 58.2, sdA: 3.4, nA: 5, valueB: 59.5, sdB: 3.1, nB: 5, direction: 'higher' },
]

export const LAYER_COLORS = ['#00D4AA', '#3B82F6', '#8B5CF6', '#F59E0B']

export const DEMO_LAYERS: ComparisonLayer[] = [
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

// ── Statistical Utilities ──

export function calcTE(sd1: number, sd2: number, n1: number, n2: number): number {
  return compareSummaries({
    baseline: { mean: 0, sd: sd1, n: n1 },
    comparison: { mean: 0, sd: sd2, n: n2 },
  }).te.value
}

export function calcMDC(te: number): number {
  return compareSummaries({
    baseline: { mean: 0, sd: te / 0.35, n: 2 },
    comparison: { mean: 0, sd: te / 0.35, n: 2 },
  }).mdc.value
}

export function calcSWC(sd1: number, sd2: number, n1: number, n2: number): number {
  return compareSummaries({
    baseline: { mean: 0, sd: sd1, n: n1 },
    comparison: { mean: 0, sd: sd2, n: n2 },
  }).swc.value
}

export function calcSNR(mean1: number, mean2: number, te: number): number {
  return compareSummaries({
    baseline: { mean: mean1, sd: te / 0.35, n: 2 },
    comparison: { mean: mean2, sd: te / 0.35, n: 2 },
  }).snr.value
}

export function calcCohensD(mean1: number, mean2: number, sd1: number, sd2: number, n1: number, n2: number): number {
  return compareSummaries({
    baseline: { mean: mean1, sd: sd1, n: n1 },
    comparison: { mean: mean2, sd: sd2, n: n2 },
  }).effectSize.value
}

export function cohensDLabel(d: number): { text: string; color: string } {
  const absD = Math.abs(d)
  if (absD < 0.2) return { text: '可忽略', color: 'var(--text-muted)' }
  if (absD < 0.5) return { text: '小', color: '#F59E0B' }
  if (absD < 0.8) return { text: '中', color: '#3B82F6' }
  return { text: '大', color: '#10B981' }
}

export function calcPairedTTest(mean1: number, mean2: number, sd1: number, sd2: number, n: number): number {
  return compareSummaries({
    baseline: { mean: mean1, sd: sd1, n },
    comparison: { mean: mean2, sd: sd2, n },
  }).pValue.value
}

export function formatPValue(p: number): string {
  if (p < 0.001) return '< .001'
  return p.toFixed(3).replace(/^0/, '')
}

export function pValueColor(p: number): string {
  if (p < 0.001) return '#10B981'
  if (p < 0.01) return '#00D4AA'
  if (p < 0.05) return '#F59E0B'
  return '#5A6579'
}

export function significanceBadge(p: number): { text: string; color: string } {
  if (p < 0.001) return { text: '***', color: '#10B981' }
  if (p < 0.01) return { text: '**', color: '#00D4AA' }
  if (p < 0.05) return { text: '*', color: '#F59E0B' }
  return { text: 'n.s.', color: '#5A6579' }
}
