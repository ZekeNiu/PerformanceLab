// Demo data for the SportPulse dashboard

export interface AlertCard {
  id: string
  name: string
  metric: string
  change?: string
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
  { id: '1', name: '张伟', metric: 'HRV ↓12%', severity: 'critical' },
  { id: '2', name: '李娜', metric: 'ACWR 1.52', severity: 'warning' },
  { id: '3', name: '王强', metric: 'HRV ↑8%', severity: 'recovering' },
  { id: '4', name: '陈明', metric: '睡眠 ↓18%', severity: 'warning' },
  { id: '5', name: '赵敏', metric: 'ACWR 0.72', severity: 'warning' },
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
