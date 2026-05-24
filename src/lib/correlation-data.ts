import {
  getMetricCategoryName,
  getMetricDisplayName,
  METRIC_DEFINITIONS,
} from './metric-registry'

export interface Indicator {
  id: string
  name: string
  category: string
}

export interface DataPoint {
  athlete: string
  date: string
  values: Record<string, number>
}

const CORRELATION_METRICS = METRIC_DEFINITIONS.filter((metric) => metric.supportedContexts.includes('correlation'))

export const INDICATOR_CATEGORIES: Record<string, string[]> = CORRELATION_METRICS.reduce<Record<string, string[]>>(
  (groups, metric) => {
    if (!groups[metric.categoryName]) groups[metric.categoryName] = []
    groups[metric.categoryName].push(metric.id)
    return groups
  },
  {},
)

export const INDICATORS: Indicator[] = CORRELATION_METRICS.map((metric) => ({
  id: metric.id,
  name: metric.name,
  category: metric.categoryName,
}))

function seededRandom(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

/** Generate demo dataset with N athletes. */
export function generateDemoData(n: number): DataPoint[] {
  const rng = seededRandom(12345)
  const athletes = [
    '张伟', '李明', '王强', '刘洋', '陈浩', '赵磊', '孙鹏', '周杰',
    '吴昊', '郑宇', '黄凯', '杨帆', '朱诚', '徐磊', '马超', '胡军',
    '林涛', '郭鑫', '何伟', '高峰', '梁波', '宋杰', '谢军', '韩冰',
    '唐勇', '曹阳', '许鹏', '邓超', '萧峰', '冯雷', '程坤', '蔡明',
    '彭亮', '潘军', '袁浩', '蒋波', '魏然', '傅鑫', '沈诚', '陆伟',
    '姚远', '卢刚', '钱坤', '董洋', '汪涛', '戴军', '崔鹏', '钟磊',
    '范冰', '金阳', '邹凯', '孔杰', '白军', '龙翔', '万波', '段明',
    '雷浩', '江涛', '顾鑫',
  ]

  const data: DataPoint[] = []
  for (let i = 0; i < n; i++) {
    const athlete = athletes[i % athletes.length]
    const baseFitness = rng() * 40 + 40
    const fatigue = rng() * 30 + 10

    const values: Record<string, number> = {
      cmj_height: Math.round((baseFitness * 0.6 + rng() * 15 + 20) * 10) / 10,
      cmj_power: Math.round((baseFitness * 8 + rng() * 200 + 1500) * 10) / 10,
      squat_1rm: Math.round((baseFitness * 2.5 + rng() * 30 + 80) * 10) / 10,
      bench_1rm: Math.round((baseFitness * 1.5 + rng() * 20 + 50) * 10) / 10,
      sprint_30m: Math.round((4.8 - baseFitness * 0.015 + rng() * 0.3) * 100) / 100,
      sprint_10m: Math.round((1.9 - baseFitness * 0.006 + rng() * 0.15) * 100) / 100,
      beep_test: Math.round((18 - fatigue * 0.15 + rng() * 2) * 10) / 10,
      yoyo_test: Math.round((2000 - fatigue * 15 + rng() * 200) * 10) / 10,
      hrv_rmssd: Math.round((80 - fatigue * 0.8 + rng() * 15) * 10) / 10,
      hr_resting: Math.round((50 + fatigue * 0.4 + rng() * 5) * 10) / 10,
      spo2: Math.round((98 - rng() * 2) * 10) / 10,
      sleep_score: Math.round((85 - fatigue * 0.5 + rng() * 15) * 10) / 10,
      rpe: Math.round((fatigue * 0.6 + rng() * 2) * 10) / 10,
      body_fat_pct: Math.round((8 + rng() * 12) * 10) / 10,
      muscle_mass: Math.round((65 + baseFitness * 0.3 + rng() * 5) * 10) / 10,
      weight: Math.round((75 + rng() * 20) * 10) / 10,
      height: Math.round((175 + rng() * 15) * 10) / 10,
      bmi: 0,
      match_score: Math.round((baseFitness * 0.5 + (100 - fatigue) * 0.3 + rng() * 10 + 10) * 10) / 10,
      training_score: Math.round((baseFitness * 0.6 + (100 - fatigue) * 0.2 + rng() * 8 + 15) * 10) / 10,
      tactical_score: Math.round((70 + rng() * 25) * 10) / 10,
      technical_score: Math.round((baseFitness * 0.4 + rng() * 30 + 40) * 10) / 10,
    }

    values.bmi = Math.round((values.weight / ((values.height / 100) ** 2)) * 10) / 10

    data.push({
      athlete,
      date: `2025-01-${String((i % 31) + 1).padStart(2, '0')}`,
      values,
    })
  }
  return data
}

export function getIndicatorName(id: string): string {
  return getMetricDisplayName(id)
}

export function getIndicatorCategory(id: string): string {
  return getMetricCategoryName(id)
}
