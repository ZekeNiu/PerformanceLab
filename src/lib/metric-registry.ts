import type { MetricDefinition } from './domain-model'

export const METRIC_DEFINITIONS: MetricDefinition[] = [
  {
    id: 'cmj_height',
    name: 'CMJ 跳跃高度',
    shortName: 'CMJ Height',
    categoryId: 'power',
    categoryName: '爆发力',
    unit: 'cm',
    direction: 'higher',
    aliases: ['跳跃高度', 'CMJ跳跃高度', 'CMJ 跳跃高度', 'cmj_height', 'jump height'],
    supportedContexts: ['periodic', 'comparison', 'correlation', 'import'],
  },
  {
    id: 'cmj_power',
    name: 'CMJ 峰值功率',
    shortName: 'CMJ Power',
    categoryId: 'power',
    categoryName: '爆发力',
    unit: 'W',
    direction: 'higher',
    aliases: ['CMJ峰值功率', '峰值功率', 'cmj_power', 'peak power'],
    supportedContexts: ['periodic', 'comparison', 'correlation', 'import'],
  },
  {
    id: 'cmj_force',
    name: 'CMJ 峰值力',
    shortName: 'CMJ Force',
    categoryId: 'power',
    categoryName: '爆发力',
    unit: 'N',
    direction: 'higher',
    aliases: ['峰值力', 'CMJ峰值力', 'CMJ 峰值力', 'cmj_force', 'peak force'],
    supportedContexts: ['periodic', 'comparison', 'import'],
  },
  {
    id: 'flight_time',
    name: '腾空时间',
    categoryId: 'power',
    categoryName: '爆发力',
    unit: 's',
    direction: 'higher',
    aliases: ['腾空时间', 'flight_time', 'flight time'],
    supportedContexts: ['periodic', 'import'],
  },
  {
    id: 'eccentric_utilization_ratio',
    name: '离心利用率',
    categoryId: 'power',
    categoryName: '爆发力',
    unit: '%',
    direction: 'higher',
    aliases: ['离心利用率', 'eccentric_utilization_ratio', 'eur'],
    supportedContexts: ['periodic', 'import'],
  },
  {
    id: 'squat_1rm',
    name: '深蹲 1RM',
    categoryId: 'strength',
    categoryName: '力量',
    unit: 'kg',
    direction: 'higher',
    aliases: ['深蹲1RM', '深蹲 1RM', 'squat_1rm', 'squat 1rm'],
    supportedContexts: ['periodic', 'comparison', 'correlation', 'import'],
  },
  {
    id: 'bench_1rm',
    name: '卧推 1RM',
    categoryId: 'strength',
    categoryName: '力量',
    unit: 'kg',
    direction: 'higher',
    aliases: ['卧推1RM', '卧推 1RM', 'bench_1rm', 'bench 1rm'],
    supportedContexts: ['periodic', 'comparison', 'correlation', 'import'],
  },
  {
    id: 'sprint_30m',
    name: '30m 冲刺',
    categoryId: 'speed',
    categoryName: '速度',
    unit: 's',
    direction: 'lower',
    aliases: ['30m冲刺', '30m 冲刺', '30m', 'sprint_30m', '30m sprint'],
    supportedContexts: ['periodic', 'comparison', 'correlation', 'import'],
  },
  {
    id: 'sprint_10m',
    name: '10m 冲刺',
    categoryId: 'speed',
    categoryName: '速度',
    unit: 's',
    direction: 'lower',
    aliases: ['10m冲刺', '10m 冲刺', '10m', 'sprint_10m', '10m sprint'],
    supportedContexts: ['periodic', 'comparison', 'correlation', 'import'],
  },
  {
    id: 'standing_jump',
    name: '立定跳远',
    categoryId: 'speed',
    categoryName: '速度',
    unit: 'cm',
    direction: 'higher',
    aliases: ['立定跳远', 'standing_jump', 'standing long jump'],
    supportedContexts: ['periodic', 'comparison', 'import'],
  },
  {
    id: 'agility_t',
    name: 'T-test 灵敏测试',
    categoryId: 'speed',
    categoryName: '速度',
    unit: 's',
    direction: 'lower',
    aliases: ['T-test', '灵敏测试', 'agility_t', 'agility'],
    supportedContexts: ['periodic', 'comparison', 'import'],
  },
  {
    id: 'beep_test',
    name: '渐进跑测试',
    categoryId: 'endurance',
    categoryName: '耐力',
    unit: 'level',
    direction: 'higher',
    aliases: ['渐进跑测试', 'beep_test', 'beep test'],
    supportedContexts: ['periodic', 'correlation', 'import'],
  },
  {
    id: 'yoyo_test',
    name: 'Yo-Yo 间歇测试',
    categoryId: 'endurance',
    categoryName: '耐力',
    unit: 'm',
    direction: 'higher',
    aliases: ['Yo-Yo间歇测试', 'Yo-Yo 间歇测试', 'YoYo', 'yoyo_test'],
    supportedContexts: ['periodic', 'correlation', 'import'],
  },
  {
    id: 'yoyo_ir1',
    name: 'Yo-Yo IR1',
    categoryId: 'endurance',
    categoryName: '耐力',
    unit: 'm',
    direction: 'higher',
    aliases: ['Yo-Yo IR1', 'yoyo_ir1'],
    supportedContexts: ['periodic', 'comparison', 'import'],
  },
  {
    id: 'lactate_threshold',
    name: '乳酸阈值跑速',
    categoryId: 'endurance',
    categoryName: '耐力',
    unit: 'km/h',
    direction: 'higher',
    aliases: ['乳酸阈值跑速', '乳酸阈值', 'lactate_threshold'],
    supportedContexts: ['periodic', 'comparison', 'import'],
  },
  {
    id: 'hrv_rmssd',
    name: 'HRV RMSSD',
    categoryId: 'physiology',
    categoryName: '生理监测',
    unit: 'ms',
    direction: 'higher',
    aliases: ['HRV', 'RMSSD', 'HRV RMSSD', 'hrv_rmssd'],
    supportedContexts: ['daily', 'correlation', 'import'],
  },
  {
    id: 'hr_resting',
    name: '静息心率',
    categoryId: 'physiology',
    categoryName: '生理监测',
    unit: 'bpm',
    direction: 'lower',
    aliases: ['静息心率', 'RHR', 'hr_resting', 'resting heart rate'],
    supportedContexts: ['daily', 'correlation', 'import'],
  },
  {
    id: 'spo2',
    name: '血氧饱和度',
    categoryId: 'physiology',
    categoryName: '生理监测',
    unit: '%',
    direction: 'higher',
    aliases: ['血氧饱和度', 'SpO2', 'spo2'],
    supportedContexts: ['daily', 'correlation', 'import'],
  },
  {
    id: 'sleep_score',
    name: '睡眠质量评分',
    categoryId: 'physiology',
    categoryName: '生理监测',
    unit: 'score',
    direction: 'higher',
    aliases: ['睡眠', '睡眠质量', '睡眠质量评分', 'sleep_score'],
    supportedContexts: ['daily', 'correlation', 'import'],
  },
  {
    id: 'rpe',
    name: 'RPE 主观疲劳',
    categoryId: 'physiology',
    categoryName: '生理监测',
    unit: 'score',
    direction: 'lower',
    aliases: ['RPE', '主观疲劳', 'rpe'],
    supportedContexts: ['daily', 'correlation', 'import'],
  },
  {
    id: 'body_fat_pct',
    name: '体脂率',
    categoryId: 'body-composition',
    categoryName: '身体成分',
    unit: '%',
    direction: 'lower',
    aliases: ['体脂率', '体脂', 'body_fat_pct', 'body_fat'],
    supportedContexts: ['periodic', 'comparison', 'correlation', 'import'],
  },
  {
    id: 'body_fat',
    name: '体脂率',
    categoryId: 'body-composition',
    categoryName: '身体成分',
    unit: '%',
    direction: 'lower',
    aliases: ['body_fat'],
    supportedContexts: ['comparison'],
  },
  {
    id: 'muscle_mass',
    name: '肌肉量',
    categoryId: 'body-composition',
    categoryName: '身体成分',
    unit: 'kg',
    direction: 'higher',
    aliases: ['肌肉量', 'muscle_mass'],
    supportedContexts: ['periodic', 'comparison', 'correlation', 'import'],
  },
  {
    id: 'weight',
    name: '体重',
    categoryId: 'body-composition',
    categoryName: '身体成分',
    unit: 'kg',
    direction: 'range',
    aliases: ['体重', 'weight'],
    supportedContexts: ['daily', 'periodic', 'correlation', 'import'],
  },
  {
    id: 'height',
    name: '身高',
    categoryId: 'body-composition',
    categoryName: '身体成分',
    unit: 'cm',
    direction: 'range',
    aliases: ['身高', 'height'],
    supportedContexts: ['periodic', 'correlation', 'import'],
  },
  {
    id: 'bmi',
    name: 'BMI',
    categoryId: 'body-composition',
    categoryName: '身体成分',
    unit: 'kg/m2',
    direction: 'range',
    aliases: ['BMI', 'bmi'],
    supportedContexts: ['periodic', 'correlation', 'import'],
  },
  {
    id: 'match_score',
    name: '比赛得分',
    categoryId: 'performance',
    categoryName: '专项成绩',
    unit: 'score',
    direction: 'higher',
    aliases: ['比赛得分', 'match_score', 'match score'],
    supportedContexts: ['correlation', 'import'],
  },
  {
    id: 'training_score',
    name: '训练评分',
    categoryId: 'performance',
    categoryName: '专项成绩',
    unit: 'score',
    direction: 'higher',
    aliases: ['训练评分', 'training_score'],
    supportedContexts: ['correlation', 'import'],
  },
  {
    id: 'tactical_score',
    name: '战术评分',
    categoryId: 'performance',
    categoryName: '专项成绩',
    unit: 'score',
    direction: 'higher',
    aliases: ['战术评分', 'tactical_score'],
    supportedContexts: ['correlation', 'import'],
  },
  {
    id: 'technical_score',
    name: '技术评分',
    categoryId: 'performance',
    categoryName: '专项成绩',
    unit: 'score',
    direction: 'higher',
    aliases: ['技术评分', 'technical_score'],
    supportedContexts: ['correlation', 'import'],
  },
]

const normalizeMetricKey = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[()（）_-]/g, '')

const metricById = new Map(METRIC_DEFINITIONS.map((metric) => [metric.id, metric]))

const metricAliasIndex = new Map<string, MetricDefinition>()

METRIC_DEFINITIONS.forEach((metric) => {
  metricAliasIndex.set(normalizeMetricKey(metric.id), metric)
  metricAliasIndex.set(normalizeMetricKey(metric.name), metric)
  metric.aliases.forEach((alias) => metricAliasIndex.set(normalizeMetricKey(alias), metric))
})

export function getMetricDefinition(id: string): MetricDefinition | undefined {
  return metricById.get(id)
}

export function resolveMetricDefinition(nameOrId: string): MetricDefinition | undefined {
  return metricAliasIndex.get(normalizeMetricKey(nameOrId))
}

export function getMetricDisplayName(id: string): string {
  return getMetricDefinition(id)?.name ?? id
}

export function getMetricCategoryName(id: string): string {
  return getMetricDefinition(id)?.categoryName ?? '其他'
}

export function getMetricUnit(id: string): string {
  return getMetricDefinition(id)?.unit ?? ''
}

export function getMetricIdsByCategoryName() {
  return METRIC_DEFINITIONS.reduce<Record<string, string[]>>((groups, metric) => {
    if (!groups[metric.categoryName]) groups[metric.categoryName] = []
    groups[metric.categoryName].push(metric.id)
    return groups
  }, {})
}

export function getImportableMetricDefinitions() {
  return METRIC_DEFINITIONS.filter((metric) => metric.supportedContexts.includes('import'))
}
