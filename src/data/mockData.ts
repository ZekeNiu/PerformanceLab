// ===== TEST SESSIONS =====
export interface TestSession {
  id: string
  name: string
  date: string
  location: string
  temperature?: number
  humidity?: number
  warmUpMethod?: string
  notes?: string
}

export const mockTestSessions: TestSession[] = [
  {
    id: 'ts-1',
    name: '2024夏训期初测',
    date: '2024-06-15',
    location: '田径场B',
    temperature: 28,
    humidity: 65,
    warmUpMethod: '动态拉伸15分钟 + 慢跑800米',
    notes: '天气良好，运动员状态不错',
  },
  {
    id: 'ts-2',
    name: '2024夏训期中测',
    date: '2024-07-20',
    location: '力量房A',
    temperature: 24,
    humidity: 55,
    warmUpMethod: '泡沫轴放松 + 动态拉伸',
    notes: '',
  },
  {
    id: 'ts-3',
    name: '2024赛前测试',
    date: '2024-08-05',
    location: '田径场A',
    temperature: 30,
    humidity: 70,
    warmUpMethod: '专项热身15分钟',
    notes: '赛前最后一周',
  },
]

// ===== ATHLETES =====
export interface Athlete {
  id: string
  name: string
  gender: '男' | '女'
  position: string
  team: string
  uuid: string
}

export const mockAthletes: Athlete[] = [
  { id: 'a-1', name: '张伟', gender: '男', position: '前锋', team: '一队', uuid: 'ATH-2024-001' },
  { id: 'a-2', name: '李娜', gender: '女', position: '后卫', team: '一队', uuid: 'ATH-2024-002' },
  { id: 'a-3', name: '王强', gender: '男', position: '中场', team: '一队', uuid: 'ATH-2024-003' },
  { id: 'a-4', name: '陈明', gender: '男', position: '守门员', team: '一队', uuid: 'ATH-2024-004' },
  { id: 'a-5', name: '刘芳', gender: '女', position: '前锋', team: '二队', uuid: 'ATH-2024-005' },
  { id: 'a-6', name: '赵雷', gender: '男', position: '后卫', team: '二队', uuid: 'ATH-2024-006' },
  { id: 'a-7', name: '孙丽', gender: '女', position: '中场', team: '二队', uuid: 'ATH-2024-007' },
  { id: 'a-8', name: '周杰', gender: '男', position: '前锋', team: '一队', uuid: 'ATH-2024-008' },
]

// ===== INDICATOR DEFINITIONS =====
export type DirectionType = 'higher' | 'lower' | 'range'

export interface IndicatorMetric {
  id: string
  name: string
  unit: string
  direction: DirectionType
  optimalRange?: [number, number]
}

export interface TestAction {
  id: string
  name: string
  description: string
  equipment: string
  metrics: IndicatorMetric[]
}

export interface ActionCategory {
  id: string
  name: string
  actions: TestAction[]
}

export const mockActionCategories: ActionCategory[] = [
  {
    id: 'cat-1',
    name: '爆发力',
    actions: [
      {
        id: 'act-1',
        name: '下蹲跳 CMJ',
        description: '反向跳跃测试下肢爆发力',
        equipment: '测力台',
        metrics: [
          { id: 'm-1', name: '跳跃高度', unit: 'cm', direction: 'higher' },
          { id: 'm-2', name: '峰值力', unit: 'N', direction: 'higher' },
          { id: 'm-3', name: '腾空时间', unit: 's', direction: 'higher' },
          { id: 'm-4', name: '离心利用率', unit: '%', direction: 'higher' },
        ],
      },
      {
        id: 'act-2',
        name: '蹲踞式起跑 SJ',
        description: '静态跳跃测试下肢爆发力',
        equipment: '测力台',
        metrics: [
          { id: 'm-5', name: '跳跃高度', unit: 'cm', direction: 'higher' },
          { id: 'm-6', name: '峰值力', unit: 'N', direction: 'higher' },
          { id: 'm-7', name: '发力速率', unit: 'N/s', direction: 'higher' },
        ],
      },
      {
        id: 'act-3',
        name: '立定跳远',
        description: '测试下肢水平爆发力',
        equipment: '跳远垫',
        metrics: [
          { id: 'm-8', name: '跳跃距离', unit: 'cm', direction: 'higher' },
        ],
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
        metrics: [
          { id: 'm-9', name: '最大重量', unit: 'kg', direction: 'higher' },
          { id: 'm-10', name: '相对力量', unit: 'kg/kg', direction: 'higher' },
        ],
      },
      {
        id: 'act-5',
        name: '1RM 卧推',
        description: '上肢最大力量测试',
        equipment: '卧推架',
        metrics: [
          { id: 'm-11', name: '最大重量', unit: 'kg', direction: 'higher' },
          { id: 'm-12', name: '相对力量', unit: 'kg/kg', direction: 'higher' },
        ],
      },
      {
        id: 'act-6',
        name: '等速肌力',
        description: '等速肌力测试',
        equipment: '等速肌力仪',
        metrics: [
          { id: 'm-13', name: '峰力矩', unit: 'Nm', direction: 'higher' },
          { id: 'm-14', name: '平均功率', unit: 'W', direction: 'higher' },
        ],
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
        metrics: [
          { id: 'm-15', name: '完成时间', unit: 's', direction: 'lower' },
          { id: 'm-16', name: '最大速度', unit: 'm/s', direction: 'higher' },
        ],
      },
      {
        id: 'act-8',
        name: '10m冲刺',
        description: '测试加速度',
        equipment: '电子计时门',
        metrics: [
          { id: 'm-17', name: '完成时间', unit: 's', direction: 'lower' },
        ],
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
        metrics: [
          { id: 'm-18', name: '跑距', unit: 'm', direction: 'higher' },
          { id: 'm-19', name: 'VO2max估算', unit: 'ml/kg/min', direction: 'higher' },
        ],
      },
      {
        id: 'act-10',
        name: '12分钟跑',
        description: '测试有氧耐力',
        equipment: '田径场',
        metrics: [
          { id: 'm-20', name: '跑距', unit: 'm', direction: 'higher' },
        ],
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
        metrics: [
          { id: 'm-21', name: '体重', unit: 'kg', direction: 'range', optimalRange: [50, 80] },
          { id: 'm-22', name: '体脂率', unit: '%', direction: 'lower' },
          { id: 'm-23', name: '肌肉量', unit: 'kg', direction: 'higher' },
        ],
      },
      {
        id: 'act-12',
        name: '身高体重',
        description: '基本身体形态测量',
        equipment: '身高体重仪',
        metrics: [
          { id: 'm-24', name: '身高', unit: 'cm', direction: 'range', optimalRange: [150, 210] },
          { id: 'm-25', name: '体重', unit: 'kg', direction: 'range', optimalRange: [50, 100] },
          { id: 'm-26', name: 'BMI', unit: 'kg/m2', direction: 'range', optimalRange: [18, 25] },
        ],
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
        metrics: [
          { id: 'm-27', name: 'RMSSD', unit: 'ms', direction: 'higher' },
          { id: 'm-28', name: 'SDNN', unit: 'ms', direction: 'higher' },
        ],
      },
      {
        id: 'act-14',
        name: '血乳酸测试',
        description: '无氧阈值评估',
        equipment: '血乳酸仪',
        metrics: [
          { id: 'm-29', name: '静息血乳酸', unit: 'mmol/L', direction: 'lower' },
        ],
      },
    ],
  },
]

// ===== IMPORT HISTORY =====
export interface ImportHistoryEntry {
  id: string
  time: string
  filename: string
  totalRows: number
  successCount: number
  failCount: number
  operator: string
  status: 'success' | 'partial' | 'failed'
}

export const mockImportHistory: ImportHistoryEntry[] = [
  { id: 'ih-1', time: '2024-06-15 14:32', filename: 'training_data.xlsx', totalRows: 156, successCount: 152, failCount: 4, operator: '管理员', status: 'partial' },
  { id: 'ih-2', time: '2024-06-10 09:15', filename: 'spring_test.xlsx', totalRows: 89, successCount: 89, failCount: 0, operator: '管理员', status: 'success' },
  { id: 'ih-3', time: '2024-06-05 16:45', filename: 'import_v2.xlsx', totalRows: 203, successCount: 198, failCount: 5, operator: '管理员', status: 'partial' },
  { id: 'ih-4', time: '2024-05-28 11:20', filename: 'bad_data.xlsx', totalRows: 45, successCount: 30, failCount: 15, operator: '管理员', status: 'partial' },
  { id: 'ih-5', time: '2024-05-15 08:45', filename: 'may_test.xlsx', totalRows: 120, successCount: 120, failCount: 0, operator: '管理员', status: 'success' },
]

// ===== VALIDATION TYPES =====
export type ValidationStatus = 'ok' | 'warning' | 'error'

export interface ValidationRow {
  id: string
  rowNum: number
  athleteName: string
  athleteUUID?: string
  date: string
  action: string
  indicator: string
  repeats: (number | null)[]
  status: ValidationStatus
  statusType: string
  errors?: string[]
  isResolved: boolean
}
