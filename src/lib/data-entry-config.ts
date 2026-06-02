import type { MetricDefinition } from './domain-model'
import { getMetricDefinition, resolveMetricDefinition } from './metric-registry'

export interface DataEntryTestAction {
  id: string
  name: string
  description: string
  equipment: string
  metricIds: string[]
}

export interface DataEntryActionCategory {
  id: string
  name: string
  actions: DataEntryTestAction[]
}

export const dataEntryActionCategories: DataEntryActionCategory[] = [
  {
    id: 'cat-1',
    name: '爆发力',
    actions: [
      {
        id: 'act-1',
        name: '下蹲跳 CMJ',
        description: '反向跳跃测试下肢爆发力',
        equipment: '测力台',
        metricIds: ['cmj_height', 'cmj_power', 'cmj_force', 'flight_time', 'eccentric_utilization_ratio'],
      },
      {
        id: 'act-2',
        name: '蹲踞式起跑 SJ',
        description: '静态跳跃测试下肢爆发力',
        equipment: '测力台',
        metricIds: ['sj_height', 'sj_peak_force', 'rfd'],
      },
      {
        id: 'act-3',
        name: '立定跳远',
        description: '测试下肢水平爆发力',
        equipment: '跳远垫',
        metricIds: ['standing_jump'],
      },
    ],
  },
  {
    id: 'cat-2',
    name: '力量',
    actions: [
      {
        id: 'act-4',
        name: '1RM 深蹲',
        description: '下肢最大力量测试',
        equipment: '深蹲架',
        metricIds: ['squat_1rm', 'squat_relative_strength'],
      },
      {
        id: 'act-5',
        name: '1RM 卧推',
        description: '上肢最大力量测试',
        equipment: '卧推架',
        metricIds: ['bench_1rm', 'bench_relative_strength'],
      },
      {
        id: 'act-6',
        name: '等速肌力',
        description: '等速肌力测试',
        equipment: '等速肌力仪',
        metricIds: ['isokinetic_peak_torque', 'isokinetic_average_power'],
      },
    ],
  },
  {
    id: 'cat-3',
    name: '速度',
    actions: [
      {
        id: 'act-7',
        name: '30m冲刺',
        description: '测试加速度和最高速度',
        equipment: '电子计时门',
        metricIds: ['sprint_30m', 'sprint_30m_max_speed'],
      },
      {
        id: 'act-8',
        name: '10m冲刺',
        description: '测试加速度',
        equipment: '电子计时门',
        metricIds: ['sprint_10m'],
      },
      {
        id: 'act-15',
        name: 'T-test agility',
        description: 'Change-of-direction agility test',
        equipment: 'Timing gates',
        metricIds: ['agility_t'],
      },
    ],
  },
  {
    id: 'cat-4',
    name: '耐力',
    actions: [
      {
        id: 'act-9',
        name: 'Yo-Yo间歇恢复测试',
        description: '测试有氧间歇恢复能力',
        equipment: '计时器',
        metricIds: ['yoyo_ir1', 'yoyo_vo2max_estimate'],
      },
      {
        id: 'act-10',
        name: '12分钟跑',
        description: '测试有氧耐力',
        equipment: '田径场',
        metricIds: ['twelve_min_run_distance'],
      },
    ],
  },
  {
    id: 'cat-5',
    name: '身体形态',
    actions: [
      {
        id: 'act-11',
        name: '体成分分析',
        description: '身体成分测量',
        equipment: '体成分仪',
        metricIds: ['weight', 'body_fat_pct', 'muscle_mass'],
      },
      {
        id: 'act-12',
        name: '身高体重',
        description: '基本身体形态测量',
        equipment: '身高体重仪',
        metricIds: ['height', 'weight', 'bmi'],
      },
    ],
  },
  {
    id: 'cat-6',
    name: '身体机能',
    actions: [
      {
        id: 'act-13',
        name: '心率变异性 HRV',
        description: '自主神经功能评估',
        equipment: '心率带',
        metricIds: ['hrv_rmssd', 'hrv_sdnn'],
      },
      {
        id: 'act-14',
        name: '血乳酸测试',
        description: '无氧阈值评估',
        equipment: '血乳酸仪',
        metricIds: ['lactate_resting', 'lactate_threshold'],
      },
    ],
  },
]

export function getDataEntryActionMetrics(action: DataEntryTestAction): MetricDefinition[] {
  return action.metricIds
    .map((metricId) => getMetricDefinition(metricId))
    .filter((metric): metric is MetricDefinition => Boolean(metric))
}

function normalizeDataEntryKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[()（）_-]/g, '')
}

function actionMatches(action: DataEntryTestAction, actionName: string) {
  const actionKey = normalizeDataEntryKey(actionName)
  const nameKey = normalizeDataEntryKey(action.name)
  return Boolean(actionKey) && (nameKey.includes(actionKey) || actionKey.includes(nameKey))
}

function metricMatches(metric: MetricDefinition, indicator: string) {
  const indicatorKey = normalizeDataEntryKey(indicator)
  if (!indicatorKey) return false
  const keys = [metric.id, metric.name, metric.shortName ?? '', ...metric.aliases].map(normalizeDataEntryKey)
  return keys.includes(indicatorKey)
}

export function resolveDataEntryMetric(actionName: string, indicator: string): MetricDefinition | undefined {
  const matchedActions = dataEntryActionCategories
    .flatMap((category) => category.actions)
    .filter((action) => actionMatches(action, actionName))

  for (const action of matchedActions) {
    const metric = getDataEntryActionMetrics(action).find((candidate) => metricMatches(candidate, indicator))
    if (metric) return metric
  }

  return resolveMetricDefinition(indicator)
}
