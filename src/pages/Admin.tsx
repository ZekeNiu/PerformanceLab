import React, { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Database,
  Search,
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  X,
  Copy,
  MapPin,
  Thermometer,
  Droplets,
  Users,
  FileText,
  ArrowUp,
  ArrowDown,
  Minus,
  Stethoscope,
  Trophy,
  Activity,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'

/* ─────────────────────── Types ─────────────────────── */

type Category = '力量' | '速度' | '耐力' | '身体形态' | '身体机能' | '灵敏' | '柔韧'
type Direction = 1 | -1 | 0
type Phase = '离心阶段' | '向心阶段' | '等长阶段' | '全阶段'
type AthleteStatus = '现役' | '受伤' | '离队' | '退役'

interface Metric {
  id: string
  category: Category
  action: string
  name: string
  unit: string
  targetValue: number
  minValue?: number
  maxValue?: number
  phase: Phase
  direction: Direction
  targetMaxScore: number
  definition: string
  createdAt: string
  updatedAt: string
}

interface Athlete {
  uuid: string
  name: string
  gender: '男' | '女'
  birthDate: string
  height: number
  weight: number
  sport: string
  team: string
  position: string
  status: AthleteStatus
  createdAt: string
}

interface TestSession {
  id: string
  name: string
  date: string
  location: string
  temperature: string
  humidity: string
  warmupMethod: string
  notes: string
  athleteCount: number
}

/* ─────────────────────── Constants ─────────────────────── */

const CATEGORIES: Category[] = ['力量', '速度', '耐力', '身体形态', '身体机能', '灵敏', '柔韧']
const PHASES: Phase[] = ['离心阶段', '向心阶段', '等长阶段', '全阶段']
const ATHLETE_STATUS: AthleteStatus[] = ['现役', '受伤', '离队', '退役']

const CATEGORY_COLORS: Record<Category, string> = {
  '力量': 'var(--accent-red)',
  '速度': 'var(--accent-cyan)',
  '耐力': 'var(--accent-blue)',
  '身体形态': 'var(--accent-purple)',
  '身体机能': 'var(--accent-green)',
  '灵敏': 'var(--accent-amber)',
  '柔韧': 'var(--text-secondary)',
}

const STATUS_CONFIG: Record<AthleteStatus, { color: string; bg: string; dot: string }> = {
  '现役': { color: 'var(--accent-green)', bg: 'rgba(16,185,129,0.15)', dot: 'var(--accent-green)' },
  '受伤': { color: 'var(--accent-red)', bg: 'rgba(239,68,68,0.15)', dot: 'var(--accent-red)' },
  '离队': { color: 'var(--accent-amber)', bg: 'rgba(245,158,11,0.15)', dot: 'var(--accent-amber)' },
  '退役': { color: 'var(--text-muted)', bg: 'rgba(90,101,121,0.15)', dot: 'var(--text-muted)' },
}

const SPORTS_POSITIONS: Record<string, string[]> = {
  '足球': ['前锋', '中场', '后卫', '守门员'],
  '篮球': ['控球后卫', '得分后卫', '小前锋', '大前锋', '中锋'],
  '田径': ['短跑', '中长跑', '跳跃', '投掷'],
  '游泳': ['自由泳', '蛙泳', '仰泳', '蝶泳'],
  '排球': ['主攻手', '副攻手', '二传手', '接应', '自由人'],
}

const DIRECTION_ICONS: Record<number, { icon: typeof ArrowUp; color: string; label: string }> = {
  1: { icon: ArrowUp, color: 'var(--accent-green)', label: '越大越好' },
  [-1]: { icon: ArrowDown, color: 'var(--accent-red)', label: '越小越好' },
  0: { icon: Minus, color: 'var(--accent-blue)', label: '区间最优' },
}

/* ─────────────────────── Mock Data ─────────────────────── */

const INITIAL_METRICS: Metric[] = [
  { id: 'CMJ_jump_height', category: '力量', action: '下蹲跳CMJ', name: '跳跃高度', unit: 'cm', targetValue: 45.0, phase: '向心阶段', direction: 1, targetMaxScore: 100, definition: '运动员从站立位快速下蹲至膝关节约90度屈曲后，立即向上全力跳跃，测量重心的最大垂直位移。', createdAt: '2024-01-15', updatedAt: '2024-03-20' },
  { id: 'CMJ_peak_force', category: '力量', action: '下蹲跳CMJ', name: '峰值力', unit: 'N', targetValue: 2000, phase: '离心阶段', direction: 1, targetMaxScore: 100, definition: '下蹲跳过程中测力台记录的垂直方向最大地面反作用力。', createdAt: '2024-01-15', updatedAt: '2024-02-10' },
  { id: 'CMJ_rsi', category: '力量', action: '下蹲跳CMJ', name: '离心利用率', unit: '%', targetValue: 1.2, phase: '全阶段', direction: 1, targetMaxScore: 100, definition: '反应力量指数，等于跳跃高度与触地时间的比值。', createdAt: '2024-01-20', updatedAt: '2024-03-01' },
  { id: 'sprint_30m_time', category: '速度', action: '30米冲刺', name: '完成时间', unit: 's', targetValue: 4.00, phase: '全阶段', direction: -1, targetMaxScore: 100, definition: '从起跑线静止开始，全力冲刺30米所需时间，使用光电计时系统测量。', createdAt: '2024-01-10', updatedAt: '2024-03-15' },
  { id: 'BF_percent', category: '身体形态', action: '皮褶厚度测量', name: '体脂百分比', unit: '%', targetValue: 12.5, minValue: 10, maxValue: 15, phase: '全阶段', direction: 0, targetMaxScore: 100, definition: '通过皮褶厚度测量（肱三头肌、肩胛下角、腹部、大腿）估算的身体脂肪百分比。', createdAt: '2024-01-05', updatedAt: '2024-02-28' },
  { id: 'VO2max_ml', category: '身体机能', action: '递增负荷跑', name: '最大摄氧量', unit: 'ml/kg/min', targetValue: 56, phase: '全阶段', direction: 1, targetMaxScore: 100, definition: '通过递增负荷跑台测试测得的最大摄氧量值。', createdAt: '2024-02-01', updatedAt: '2024-03-10' },
  { id: 'pro_agility', category: '灵敏', action: 'Pro敏捷测试', name: '完成时间', unit: 's', targetValue: 4.5, phase: '全阶段', direction: -1, targetMaxScore: 100, definition: '5-10-5码折返跑，评估变向能力和敏捷性。', createdAt: '2024-02-10', updatedAt: '2024-03-05' },
  { id: 'sit_reach', category: '柔韧', action: '坐位体前屈', name: '前伸距离', unit: 'cm', targetValue: 25, phase: '全阶段', direction: 1, targetMaxScore: 100, definition: '坐位体前屈测试中指尖达到的最大距离，评估腘绳肌和下背柔韧性。', createdAt: '2024-02-15', updatedAt: '2024-03-12' },
]

const INITIAL_ATHLETES: Athlete[] = [
  { uuid: 'ath-550e8400-e29b-41d4-a716-446655440001', name: '张伟', gender: '男', birthDate: '1998-03-15', height: 182, weight: 75, sport: '足球', team: '一队', position: '前锋', status: '现役', createdAt: '2023-01-10' },
  { uuid: 'ath-550e8400-e29b-41d4-a716-446655440002', name: '李娜', gender: '女', birthDate: '2000-07-22', height: 168, weight: 58, sport: '游泳', team: '二队', position: '自由泳', status: '现役', createdAt: '2023-02-05' },
  { uuid: 'ath-550e8400-e29b-41d4-a716-446655440003', name: '王强', gender: '男', birthDate: '1997-11-08', height: 190, weight: 85, sport: '篮球', team: '一队', position: '中锋', status: '受伤', createdAt: '2023-01-15' },
  { uuid: 'ath-550e8400-e29b-41d4-a716-446655440004', name: '刘敏', gender: '女', birthDate: '1999-05-30', height: 175, weight: 62, sport: '排球', team: '一队', position: '主攻手', status: '现役', createdAt: '2023-03-01' },
  { uuid: 'ath-550e8400-e29b-41d4-a716-446655440005', name: '陈浩', gender: '男', birthDate: '1996-09-12', height: 178, weight: 70, sport: '足球', team: '二队', position: '中场', status: '离队', createdAt: '2023-01-20' },
  { uuid: 'ath-550e8400-e29b-41d4-a716-446655440006', name: '赵磊', gender: '男', birthDate: '1995-01-25', height: 185, weight: 80, sport: '田径', team: '一队', position: '短跑', status: '退役', createdAt: '2023-02-10' },
]

const INITIAL_SESSIONS: TestSession[] = [
  { id: 'ses-001', name: '2024夏训期初测', date: '2024-06-15', location: '田径场B', temperature: '28°C', humidity: '65%', warmupMethod: '动态拉伸15分钟 + 慢跑800米', notes: '天气良好，运动员状态普遍较好', athleteCount: 23 },
  { id: 'ses-002', name: '2024春训期末测', date: '2024-05-01', location: '综合训练馆', temperature: '22°C', humidity: '55%', warmupMethod: '静态拉伸10分钟 + 跳绳5分钟', notes: '部分运动员因赛程冲突未参加全部项目', athleteCount: 19 },
  { id: 'ses-003', name: '冬训中期评估', date: '2024-02-20', location: '室内场馆A', temperature: '20°C', humidity: '50%', warmupMethod: '慢跑10分钟 + 动态拉伸', notes: '室内测试，环境控制良好', athleteCount: 25 },
  { id: 'ses-004', name: '2023年终总测', date: '2023-12-10', location: '田径场A', temperature: '15°C', humidity: '70%', warmupMethod: '慢跑800米 + 动态拉伸', notes: '年末收官测试，全员参与', athleteCount: 28 },
]

/* ─────────────────────── Utility Functions ─────────────────────── */

function generateUUID(): string {
  return 'ath-' + crypto.randomUUID()
}

function getAge(birthDate: string): number {
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

function getInitials(name: string): string {
  return name.slice(0, 1)
}

function stringToColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  const colors = ['#00D4AA', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#10B981', '#EC4899', '#06B6D4']
  return colors[Math.abs(hash) % colors.length]
}

const tabEase = [0.45, 0, 0.55, 1] as [number, number, number, number]

/* ─════════════════════════ ADMIN PAGE ═══════════════════════─ */

export default function Admin() {
  const [activeTab, setActiveTab] = useState<'definitions' | 'athletes' | 'sessions'>('definitions')

  return (
    <div className="flex min-h-full flex-col" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Page Header */}
      <div
        className="flex h-14 shrink-0 items-center justify-between border-b px-6"
        style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-subtle)' }}
      >
        <div className="flex items-center gap-3">
          <Database size={24} style={{ color: 'var(--accent-cyan)' }} />
          <h1 className="text-[22px] font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            后台管理
          </h1>
        </div>

        {/* Sub-tabs */}
        <div className="flex gap-1 rounded-lg p-1" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
          {[
            { key: 'definitions' as const, label: '定义库' },
            { key: 'athletes' as const, label: '档案库' },
            { key: 'sessions' as const, label: '测试批次' },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className="relative rounded-md px-4 py-1.5 text-[13px] font-medium transition-colors duration-200"
              style={{
                color: activeTab === t.key ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                backgroundColor: activeTab === t.key ? 'var(--bg-hover)' : 'transparent',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto p-6">
        <AnimatePresence mode="wait">
          {activeTab === 'definitions' && (
            <motion.div
              key="definitions"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: tabEase }}
            >
              <DefinitionLibrary />
            </motion.div>
          )}
          {activeTab === 'athletes' && (
            <motion.div
              key="athletes"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: tabEase }}
            >
              <AthleteProfiles />
            </motion.div>
          )}
          {activeTab === 'sessions' && (
            <motion.div
              key="sessions"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: tabEase }}
            >
              <TestSessions />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

/* ══════════════════ DEFINITION LIBRARY TAB ══════════════════ */

function DefinitionLibrary() {
  const [metrics, setMetrics] = useState<Metric[]>(INITIAL_METRICS)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('全部')
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingMetric, setEditingMetric] = useState<Metric | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const filteredMetrics = useMemo(() => {
    return metrics.filter((m) => {
      const matchSearch = !searchQuery ||
        m.name.includes(searchQuery) ||
        m.action.includes(searchQuery) ||
        m.id.includes(searchQuery) ||
        m.category.includes(searchQuery)
      const matchCategory = categoryFilter === '全部' || m.category === categoryFilter
      return matchSearch && matchCategory
    })
  }, [metrics, searchQuery, categoryFilter])

  const handleSaveMetric = useCallback((metric: Metric) => {
    setMetrics((prev) => {
      const exists = prev.find((m) => m.id === metric.id)
      if (exists) return prev.map((m) => (m.id === metric.id ? metric : m))
      return [...prev, metric]
    })
    setModalOpen(false)
    setEditingMetric(null)
  }, [])

  const handleDelete = useCallback((id: string) => {
    setMetrics((prev) => prev.filter((m) => m.id !== id))
    setDeleteConfirmId(null)
  }, [])

  const openEdit = useCallback((metric: Metric) => {
    setEditingMetric(metric)
    setModalOpen(true)
  }, [])

  const openCreate = useCallback(() => {
    setEditingMetric(null)
    setModalOpen(true)
  }, [])

  return (
    <div>
      {/* Toolbar */}
      <div
        className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border p-3"
        style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-subtle)' }}
      >
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <Input
            placeholder="搜索指标名称、动作..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)', fontSize: 13 }}
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-36" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}>
            <SelectValue placeholder="分类" />
          </SelectTrigger>
          <SelectContent style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-subtle)' }}>
            <SelectItem value="全部">全部分类</SelectItem>
            {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: 'var(--accent-cyan)' }}
        >
          <Plus size={16} /> 新增指标
        </button>
      </div>

      {/* Table */}
      <div
        className="rounded-xl border overflow-hidden"
        style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-subtle)' }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                <th className="px-4 py-3 text-left font-medium" style={{ color: 'var(--text-secondary)' }}>指标ID</th>
                <th className="px-4 py-3 text-left font-medium" style={{ color: 'var(--text-secondary)' }}>动作分类</th>
                <th className="px-4 py-3 text-left font-medium" style={{ color: 'var(--text-secondary)' }}>测试动作</th>
                <th className="px-4 py-3 text-left font-medium" style={{ color: 'var(--text-secondary)' }}>指标名称</th>
                <th className="px-4 py-3 text-left font-medium" style={{ color: 'var(--text-secondary)' }}>单位</th>
                <th className="px-4 py-3 text-left font-medium" style={{ color: 'var(--text-secondary)' }}>评价标准</th>
                <th className="px-4 py-3 text-left font-medium" style={{ color: 'var(--text-secondary)' }}>阶段位置</th>
                <th className="px-4 py-3 text-left font-medium" style={{ color: 'var(--text-secondary)' }}>方向</th>
                <th className="px-4 py-3 text-left font-medium" style={{ color: 'var(--text-secondary)' }}>目标满分</th>
                <th className="px-4 py-3 text-left font-medium" style={{ color: 'var(--text-secondary)' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredMetrics.map((metric) => (
                <React.Fragment key={metric.id}>
                  <tr
                    className="cursor-pointer border-t transition-colors duration-100"
                    style={{
                      borderColor: 'var(--border-subtle)',
                      backgroundColor: 'var(--bg-secondary)',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-secondary)')}
                    onClick={() => setExpandedRow(expandedRow === metric.id ? null : metric.id)}
                  >
                    <td className="px-4 py-3 font-mono text-[12px]" style={{ color: 'var(--text-secondary)' }}>{metric.id}</td>
                    <td className="px-4 py-3">
                      <Badge
                        className="text-[11px]"
                        style={{ backgroundColor: CATEGORY_COLORS[metric.category] + '26', color: CATEGORY_COLORS[metric.category], borderColor: CATEGORY_COLORS[metric.category] + '40' }}
                        variant="outline"
                      >
                        {metric.category}
                      </Badge>
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-primary)' }}>{metric.action}</td>
                    <td className="px-4 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>{metric.name}</td>
                    <td className="px-4 py-3 font-mono text-[12px]" style={{ color: 'var(--text-secondary)' }}>{metric.unit}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-primary)' }}>
                      {metric.direction === 0 && metric.minValue !== undefined && metric.maxValue !== undefined
                        ? `${metric.minValue}–${metric.maxValue}`
                        : metric.targetValue}
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{metric.phase}</td>
                    <td className="px-4 py-3">
                      {(() => {
                        const d = DIRECTION_ICONS[metric.direction]
                        const Icon = d.icon
                        return <Icon size={14} style={{ color: d.color }} />
                      })()}
                    </td>
                    <td className="px-4 py-3 font-mono text-[12px]" style={{ color: 'var(--text-primary)' }}>{metric.targetMaxScore}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); openEdit(metric) }}
                          className="flex h-7 w-7 items-center justify-center rounded-md transition-colors"
                          style={{ color: 'var(--text-secondary)' }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(metric.id) }}
                          className="flex h-7 w-7 items-center justify-center rounded-md transition-colors"
                          style={{ color: 'var(--accent-red)' }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.1)')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {/* Expanded detail row */}
                  <AnimatePresence>
                    {expandedRow === metric.id && (
                      <motion.tr
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
                      >
                        <td colSpan={10} className="border-t px-4 py-3" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-primary)' }}>
                          <div className="flex flex-col gap-2 text-[12px]">
                            <div style={{ color: 'var(--text-secondary)' }}>
                              <span className="font-medium" style={{ color: 'var(--text-primary)' }}>定义:</span> {metric.definition}
                            </div>
                            {metric.direction === 0 && metric.minValue !== undefined && metric.maxValue !== undefined && (
                              <div style={{ color: 'var(--text-secondary)' }}>
                                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>最优区间:</span>{' '}
                                最小值 {metric.minValue} | 最大值 {metric.maxValue}
                              </div>
                            )}
                            <div className="flex gap-6" style={{ color: 'var(--text-muted)' }}>
                              <span>创建时间: {metric.createdAt}</span>
                              <span>最后修改: {metric.updatedAt}</span>
                              <span>创建者: 管理员</span>
                            </div>
                          </div>
                        </td>
                      </motion.tr>
                    )}
                  </AnimatePresence>
                </React.Fragment>
              ))}
              {filteredMetrics.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-12 text-center" style={{ color: 'var(--text-muted)' }}>
                    <img src={`${import.meta.env.BASE_URL}empty-state-data.svg`} alt="" className="mx-auto mb-3 h-16 w-16 opacity-60" />
                    <p className="text-[13px]">暂无指标数据</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      <MetricModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingMetric(null) }}
        onSave={handleSaveMetric}
        initialData={editingMetric}
      />

      {/* Delete Confirm */}
      <Dialog open={!!deleteConfirmId} onOpenChange={(o) => !o && setDeleteConfirmId(null)}>
        <DialogContent style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-subtle)' }}>
          <DialogHeader>
            <DialogTitle style={{ color: 'var(--text-primary)' }}>确认删除</DialogTitle>
            <DialogDescription style={{ color: 'var(--text-secondary)' }}>
              此操作不可撤销，确定要删除该指标吗？
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              onClick={() => setDeleteConfirmId(null)}
              className="rounded-lg px-4 py-2 text-[13px] font-medium transition-colors"
              style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--text-primary)' }}
            >
              取消
            </button>
            <button
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              className="rounded-lg px-4 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: 'var(--accent-red)' }}
            >
              删除
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* ═════════════ Metric Create/Edit Modal ═════════════ */

function MetricModal({ open, onClose, onSave, initialData }: {
  open: boolean
  onClose: () => void
  onSave: (m: Metric) => void
  initialData: Metric | null
}) {
  const [form, setForm] = useState<Partial<Metric>>({
    category: '力量', action: '', name: '', unit: '', targetValue: 0,
    phase: '全阶段', direction: 1, targetMaxScore: 100, definition: '',
    minValue: undefined, maxValue: undefined,
  })

  const actionsForCategory = useMemo(() => {
    const allActions: Record<string, string[]> = {
      '力量': ['下蹲跳CMJ', '深蹲1RM', '卧推1RM', '硬拉1RM', '纵跳', '等长大腿中段拉'],
      '速度': ['30米冲刺', '60米冲刺', '100米冲刺', '10码加速', '变向跑'],
      '耐力': ['YO-YO间歇恢复测试', '12分钟跑', '台阶试验', '乳酸阈测试'],
      '身体形态': ['皮褶厚度测量', '身高体重', '臂展', '坐高'],
      '身体机能': ['递增负荷跑', '台阶指数', '血乳酸测试', '无创血红蛋白'],
      '灵敏': ['Pro敏捷测试', 'T型测试', ' Illinois敏捷测试', '方形跑'],
      '柔韧': ['坐位体前屈', '肩关节活动度', '髋关节活动度', '踝关节背屈'],
    }
    return allActions[form.category || '力量'] || []
  }, [form.category])

  // Reset form when opened
  useState(() => {
    if (open) {
      if (initialData) {
        setForm({ ...initialData })
      } else {
        setForm({
          category: '力量', action: '', name: '', unit: '', targetValue: 0,
          phase: '全阶段', direction: 1, targetMaxScore: 100, definition: '',
          minValue: undefined, maxValue: undefined,
        })
      }
    }
  })

  const handleSubmit = useCallback(() => {
    if (!form.name || !form.action || !form.unit) return
    const id = initialData?.id || `${form.action}_${form.name}`.replace(/\s+/g, '_').toLowerCase()
    const metric: Metric = {
      id,
      category: (form.category as Category) || '力量',
      action: form.action || '',
      name: form.name || '',
      unit: form.unit || '',
      targetValue: Number(form.targetValue) || 0,
      minValue: form.direction === 0 ? Number(form.minValue) : undefined,
      maxValue: form.direction === 0 ? Number(form.maxValue) : undefined,
      phase: (form.phase as Phase) || '全阶段',
      direction: (form.direction as Direction) || 1,
      targetMaxScore: Number(form.targetMaxScore) || 100,
      definition: form.definition || '',
      createdAt: initialData?.createdAt || new Date().toISOString().slice(0, 10),
      updatedAt: new Date().toISOString().slice(0, 10),
    }
    onSave(metric)
  }, [form, initialData, onSave])

  const update = (field: string, value: unknown) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-[640px] max-h-[90vh] overflow-y-auto" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-subtle)' }}>
        <DialogHeader>
          <DialogTitle style={{ color: 'var(--text-primary)' }}>{initialData ? '编辑指标' : '新增指标'}</DialogTitle>
        </DialogHeader>

        <div className="mt-4 flex flex-col gap-4">
          {/* Metric ID */}
          <div>
            <Label style={{ color: 'var(--text-primary)' }}>指标ID *</Label>
            <Input
              value={form.id || `${form.action || 'action'}_${form.name || 'name'}`.replace(/\s+/g, '_').toLowerCase()}
              onChange={(e) => update('id', e.target.value)}
              className="mt-1.5 font-mono text-[12px]"
              style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
            />
            <span className="mt-1 block text-[11px]" style={{ color: 'var(--text-muted)' }}>自动填充，可修改</span>
          </div>

          {/* Category */}
          <div>
            <Label style={{ color: 'var(--text-primary)' }}>动作分类 *</Label>
            <Select value={form.category} onValueChange={(v) => update('category', v)}>
              <SelectTrigger className="mt-1.5" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-subtle)' }}>
                {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Action */}
          <div>
            <Label style={{ color: 'var(--text-primary)' }}>测试动作 *</Label>
            <Select value={form.action} onValueChange={(v) => update('action', v)}>
              <SelectTrigger className="mt-1.5" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}>
                <SelectValue placeholder="选择动作" />
              </SelectTrigger>
              <SelectContent style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-subtle)' }}>
                {actionsForCategory.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Name */}
          <div>
            <Label style={{ color: 'var(--text-primary)' }}>指标名称 *</Label>
            <Input
              value={form.name || ''}
              onChange={(e) => update('name', e.target.value)}
              className="mt-1.5"
              placeholder="如：跳跃高度"
              style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
            />
          </div>

          {/* Unit */}
          <div>
            <Label style={{ color: 'var(--text-primary)' }}>单位 *</Label>
            <Input
              value={form.unit || ''}
              onChange={(e) => update('unit', e.target.value)}
              className="mt-1.5"
              placeholder="如：cm"
              style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
            />
          </div>

          {/* Target Value */}
          <div>
            <Label style={{ color: 'var(--text-primary)' }}>评价标准 *</Label>
            <Input
              type="number"
              value={form.targetValue ?? ''}
              onChange={(e) => update('targetValue', parseFloat(e.target.value))}
              className="mt-1.5"
              style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
            />
            <span className="mt-1 block text-[11px]" style={{ color: 'var(--text-muted)' }}>雷达图中该值 = 100分满分</span>
          </div>

          {/* Phase */}
          <div>
            <Label style={{ color: 'var(--text-primary)' }}>阶段位置</Label>
            <Select value={form.phase} onValueChange={(v) => update('phase', v as Phase)}>
              <SelectTrigger className="mt-1.5" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-subtle)' }}>
                {PHASES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Direction */}
          <div>
            <Label style={{ color: 'var(--text-primary)' }}>方向常数 *</Label>
            <div className="mt-2 flex gap-6">
              {([1, -1, 0] as Direction[]).map((d) => {
                const di = DIRECTION_ICONS[d]
                const Icon = di.icon
                return (
                  <label key={d} className="flex cursor-pointer items-center gap-2 text-[13px]" style={{ color: 'var(--text-primary)' }}>
                    <input
                      type="radio"
                      name="direction"
                      checked={form.direction === d}
                      onChange={() => update('direction', d)}
                      className="h-4 w-4"
                      style={{ accentColor: 'var(--accent-cyan)' }}
                    />
                    <Icon size={14} style={{ color: di.color }} />
                    <span>{di.label}</span>
                  </label>
                )
              })}
            </div>
          </div>

          {/* Interval settings (only when direction = 0) */}
          <AnimatePresence>
            {form.direction === 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden rounded-lg border p-4"
                style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-subtle)' }}
              >
                <h4 className="mb-3 text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>区间最优设置</h4>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Label style={{ color: 'var(--text-secondary)' }}>最小值</Label>
                    <Input
                      type="number"
                      value={form.minValue ?? ''}
                      onChange={(e) => update('minValue', parseFloat(e.target.value))}
                      className="mt-1"
                      style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
                    />
                  </div>
                  <div className="flex-1">
                    <Label style={{ color: 'var(--text-secondary)' }}>最大值</Label>
                    <Input
                      type="number"
                      value={form.maxValue ?? ''}
                      onChange={(e) => update('maxValue', parseFloat(e.target.value))}
                      className="mt-1"
                      style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
                    />
                  </div>
                </div>
                <p className="mt-2 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  评分公式: Score = max(0, 100 - |current - midpoint| / (range/2) × 100)
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Target Max Score */}
          <div>
            <Label style={{ color: 'var(--text-primary)' }}>目标满分</Label>
            <Input
              type="number"
              value={form.targetMaxScore ?? 100}
              onChange={(e) => update('targetMaxScore', parseFloat(e.target.value))}
              className="mt-1.5"
              style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
            />
          </div>

          {/* Definition */}
          <div>
            <Label style={{ color: 'var(--text-primary)' }}>定义</Label>
            <Textarea
              value={form.definition || ''}
              onChange={(e) => update('definition', e.target.value)}
              className="mt-1.5 min-h-[100px]"
              placeholder="在此输入该指标的详细定义和测试方法说明..."
              style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)', fontSize: 13 }}
            />
          </div>
        </div>

        <DialogFooter className="mt-6">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-[13px] font-medium transition-colors"
            style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--text-primary)' }}
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            className="rounded-lg px-4 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: 'var(--accent-cyan)' }}
          >
            保存
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* ══════════════════ ATHLETE PROFILES TAB ══════════════════ */

function AthleteProfiles() {
  const [athletes, setAthletes] = useState<Athlete[]>(INITIAL_ATHLETES)
  const [searchQuery, setSearchQuery] = useState('')
  const [teamFilter, setTeamFilter] = useState('全部')
  const [statusFilter, setStatusFilter] = useState<AthleteStatus | '全部'>('全部')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingAthlete, setEditingAthlete] = useState<Athlete | null>(null)
  const [detailDrawer, setDetailDrawer] = useState<Athlete | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const teams = useMemo(() => {
    const set = new Set(athletes.map((a) => a.team))
    return ['全部', ...Array.from(set)]
  }, [athletes])

  const filteredAthletes = useMemo(() => {
    return athletes.filter((a) => {
      const matchSearch = !searchQuery || a.name.includes(searchQuery)
      const matchTeam = teamFilter === '全部' || a.team === teamFilter
      const matchStatus = statusFilter === '全部' || a.status === statusFilter
      return matchSearch && matchTeam && matchStatus
    })
  }, [athletes, searchQuery, teamFilter, statusFilter])

  const handleSaveAthlete = useCallback((athlete: Athlete) => {
    setAthletes((prev) => {
      const exists = prev.find((a) => a.uuid === athlete.uuid)
      if (exists) return prev.map((a) => (a.uuid === athlete.uuid ? athlete : a))
      return [...prev, athlete]
    })
    setModalOpen(false)
    setEditingAthlete(null)
  }, [])

  const handleDelete = useCallback((uuid: string) => {
    setAthletes((prev) => prev.filter((a) => a.uuid !== uuid))
    setDeleteConfirmId(null)
    if (detailDrawer?.uuid === uuid) setDetailDrawer(null)
  }, [detailDrawer])

  return (
    <div>
      {/* Toolbar */}
      <div
        className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border p-3"
        style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-subtle)' }}
      >
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <Input
            placeholder="搜索姓名..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)', fontSize: 13 }}
          />
        </div>
        <Select value={teamFilter} onValueChange={setTeamFilter}>
          <SelectTrigger className="w-32" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}>
            <SelectValue placeholder="队伍" />
          </SelectTrigger>
          <SelectContent style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-subtle)' }}>
            {teams.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as AthleteStatus | '全部')}>
          <SelectTrigger className="w-32" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}>
            <SelectValue placeholder="状态" />
          </SelectTrigger>
          <SelectContent style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-subtle)' }}>
            <SelectItem value="全部">全部状态</SelectItem>
            {ATHLETE_STATUS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <button
          onClick={() => { setEditingAthlete(null); setModalOpen(true) }}
          className="flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: 'var(--accent-cyan)' }}
        >
          <Plus size={16} /> 新增运动员
        </button>
      </div>

      {/* Athlete Grid */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {filteredAthletes.map((athlete) => (
          <AthleteCard
            key={athlete.uuid}
            athlete={athlete}
            onEdit={() => { setEditingAthlete(athlete); setModalOpen(true) }}
            onView={() => setDetailDrawer(athlete)}
            onDelete={() => setDeleteConfirmId(athlete.uuid)}
          />
        ))}
      </div>

      {filteredAthletes.length === 0 && (
        <div className="py-16 text-center" style={{ color: 'var(--text-muted)' }}>
          <img src={`${import.meta.env.BASE_URL}empty-state-data.svg`} alt="" className="mx-auto mb-3 h-16 w-16 opacity-60" />
          <p className="text-[13px]">暂无运动员数据</p>
        </div>
      )}

      {/* Athlete Modal */}
      <AthleteModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingAthlete(null) }}
        onSave={handleSaveAthlete}
        initialData={editingAthlete}
      />

      {/* Detail Drawer */}
      <AthleteDrawer
        athlete={detailDrawer}
        onClose={() => setDetailDrawer(null)}
        onEdit={(a) => { setDetailDrawer(null); setEditingAthlete(a); setModalOpen(true) }}
        onDelete={(uuid) => setDeleteConfirmId(uuid)}
      />

      {/* Delete Confirm */}
      <Dialog open={!!deleteConfirmId} onOpenChange={(o) => !o && setDeleteConfirmId(null)}>
        <DialogContent style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-subtle)' }}>
          <DialogHeader>
            <DialogTitle style={{ color: 'var(--text-primary)' }}>确认删除</DialogTitle>
            <DialogDescription style={{ color: 'var(--text-secondary)' }}>
              此操作不可撤销，确定要删除该运动员吗？
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              onClick={() => setDeleteConfirmId(null)}
              className="rounded-lg px-4 py-2 text-[13px] font-medium transition-colors"
              style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--text-primary)' }}
            >
              取消
            </button>
            <button
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              className="rounded-lg px-4 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: 'var(--accent-red)' }}
            >
              删除
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* ═════════════ Athlete Card ═════════════ */

function AthleteCard({ athlete, onEdit, onView, onDelete }: {
  athlete: Athlete
  onEdit: () => void
  onView: () => void
  onDelete: () => void
}) {
  const status = STATUS_CONFIG[athlete.status]
  const age = getAge(athlete.birthDate)

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
      className="group rounded-xl border p-4 transition-shadow hover:shadow-lg"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderColor: 'var(--border-subtle)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.2)',
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold"
            style={{ backgroundColor: stringToColor(athlete.name), color: '#fff' }}
          >
            {getInitials(athlete.name)}
          </div>
          <div>
            <h3 className="text-[18px] font-semibold" style={{ color: 'var(--text-primary)' }}>{athlete.name}</h3>
            <div className="flex items-center gap-2 text-[12px]" style={{ color: 'var(--text-secondary)' }}>
              <span>{athlete.gender}</span>
              <span>|</span>
              <span>{athlete.birthDate}</span>
              <span>|</span>
              <span>{age}岁</span>
            </div>
          </div>
        </div>
        <div
          className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
          style={{ backgroundColor: status.bg, color: status.color }}
        >
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: status.dot }} />
          {athlete.status}
        </div>
      </div>

      {/* Info */}
      <div className="mt-3 space-y-1.5 border-t pt-3" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="flex items-center gap-2 text-[12px]" style={{ color: 'var(--text-secondary)' }}>
          <Trophy size={13} style={{ color: 'var(--text-muted)' }} />
          <span>专项: {athlete.sport}</span>
        </div>
        <div className="flex items-center gap-2 text-[12px]" style={{ color: 'var(--text-secondary)' }}>
          <Activity size={13} style={{ color: 'var(--text-muted)' }} />
          <span>队伍: {athlete.team} | 位置: {athlete.position}</span>
        </div>
        <div className="flex items-center gap-2 text-[12px]" style={{ color: 'var(--text-secondary)' }}>
          <Stethoscope size={13} style={{ color: 'var(--text-muted)' }} />
          <span>身高: {athlete.height}cm | 体重: {athlete.weight}kg</span>
        </div>
        <div className="flex items-center gap-1 text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>
          <span>UUID: {athlete.uuid.slice(0, 20)}...</span>
          <button
            onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(athlete.uuid) }}
            className="ml-1 rounded p-0.5 transition-colors hover:opacity-70"
            title="复制UUID"
          >
            <Copy size={11} />
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-3 flex gap-2 border-t pt-3" style={{ borderColor: 'var(--border-subtle)' }}>
        <button
          onClick={onEdit}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-[12px] font-medium transition-colors"
          style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--text-primary)' }}
        >
          <Pencil size={12} /> 编辑
        </button>
        <button
          onClick={onView}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-[12px] font-medium transition-colors"
          style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--text-primary)' }}
        >
          <FileText size={12} /> 查看数据
        </button>
        <button
          onClick={onDelete}
          className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
          style={{ color: 'var(--accent-red)' }}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </motion.div>
  )
}

/* ═════════════ Athlete Create/Edit Modal ═════════════ */

function AthleteModal({ open, onClose, onSave, initialData }: {
  open: boolean
  onClose: () => void
  onSave: (a: Athlete) => void
  initialData: Athlete | null
}) {
  const [form, setForm] = useState<Partial<Athlete>>({
    gender: '男', sport: '', team: '', position: '', status: '现役',
    height: 0, weight: 0, birthDate: '', name: '',
  })

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useState(() => {
    if (open) {
      if (initialData) setForm({ ...initialData })
      else setForm({ uuid: generateUUID(), gender: '男', sport: '', team: '', position: '', status: '现役', height: 0, weight: 0, birthDate: '', name: '', createdAt: new Date().toISOString().slice(0, 10) })
    }
  })

  const positionOptions = useMemo(() => {
    return SPORTS_POSITIONS[form.sport || ''] || []
  }, [form.sport])

  const update = (field: string, value: unknown) => setForm((prev) => ({ ...prev, [field]: value }))

  const handleSubmit = useCallback(() => {
    if (!form.name || !form.birthDate || !form.sport || !form.team) return
    const athlete: Athlete = {
      uuid: form.uuid || generateUUID(),
      name: form.name || '',
      gender: (form.gender as '男' | '女') || '男',
      birthDate: form.birthDate || '',
      height: Number(form.height) || 0,
      weight: Number(form.weight) || 0,
      sport: form.sport || '',
      team: form.team || '',
      position: form.position || '',
      status: (form.status as AthleteStatus) || '现役',
      createdAt: form.createdAt || new Date().toISOString().slice(0, 10),
    }
    onSave(athlete)
  }, [form, onSave])

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-[560px] max-h-[90vh] overflow-y-auto" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-subtle)' }}>
        <DialogHeader>
          <DialogTitle style={{ color: 'var(--text-primary)' }}>{initialData ? '编辑运动员' : '新增运动员'}</DialogTitle>
        </DialogHeader>

        <div className="mt-4 flex flex-col gap-4">
          {/* UUID */}
          <div>
            <Label style={{ color: 'var(--text-primary)' }}>UUID (自动生成)</Label>
            <div className="mt-1.5 flex items-center gap-2">
              <Input
                value={form.uuid || ''}
                readOnly
                className="flex-1 font-mono text-[11px]"
                style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}
              />
              <button
                onClick={() => navigator.clipboard.writeText(form.uuid || '')}
                className="flex h-9 w-9 items-center justify-center rounded-md transition-colors"
                style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--text-secondary)' }}
              >
                <Copy size={14} />
              </button>
            </div>
          </div>

          {/* Name */}
          <div>
            <Label style={{ color: 'var(--text-primary)' }}>姓名 *</Label>
            <Input
              value={form.name || ''}
              onChange={(e) => update('name', e.target.value)}
              className="mt-1.5"
              style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
            />
          </div>

          {/* Gender */}
          <div>
            <Label style={{ color: 'var(--text-primary)' }}>性别 *</Label>
            <div className="mt-2 flex gap-6">
              {(['男', '女'] as const).map((g) => (
                <label key={g} className="flex cursor-pointer items-center gap-2 text-[13px]" style={{ color: 'var(--text-primary)' }}>
                  <input
                    type="radio"
                    name="gender"
                    checked={form.gender === g}
                    onChange={() => update('gender', g)}
                    className="h-4 w-4"
                    style={{ accentColor: 'var(--accent-cyan)' }}
                  />
                  {g}
                </label>
              ))}
            </div>
          </div>

          {/* Birth Date */}
          <div>
            <Label style={{ color: 'var(--text-primary)' }}>出生日期 *</Label>
            <Input
              type="date"
              value={form.birthDate || ''}
              onChange={(e) => update('birthDate', e.target.value)}
              className="mt-1.5"
              style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
            />
          </div>

          {/* Height / Weight */}
          <div className="flex gap-4">
            <div className="flex-1">
              <Label style={{ color: 'var(--text-primary)' }}>身高 (cm)</Label>
              <Input
                type="number"
                value={form.height || ''}
                onChange={(e) => update('height', parseFloat(e.target.value))}
                className="mt-1.5"
                style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
              />
            </div>
            <div className="flex-1">
              <Label style={{ color: 'var(--text-primary)' }}>体重 (kg)</Label>
              <Input
                type="number"
                value={form.weight || ''}
                onChange={(e) => update('weight', parseFloat(e.target.value))}
                className="mt-1.5"
                style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
              />
            </div>
          </div>

          {/* Sport */}
          <div>
            <Label style={{ color: 'var(--text-primary)' }}>专项 *</Label>
            <Select value={form.sport} onValueChange={(v) => { update('sport', v); update('position', '') }}>
              <SelectTrigger className="mt-1.5" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}>
                <SelectValue placeholder="选择专项" />
              </SelectTrigger>
              <SelectContent style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-subtle)' }}>
                {Object.keys(SPORTS_POSITIONS).map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Team */}
          <div>
            <Label style={{ color: 'var(--text-primary)' }}>队伍 *</Label>
            <Select value={form.team} onValueChange={(v) => update('team', v)}>
              <SelectTrigger className="mt-1.5" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}>
                <SelectValue placeholder="选择队伍" />
              </SelectTrigger>
              <SelectContent style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-subtle)' }}>
                <SelectItem value="一队">一队</SelectItem>
                <SelectItem value="二队">二队</SelectItem>
                <SelectItem value="青年队">青年队</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Position */}
          <div>
            <Label style={{ color: 'var(--text-primary)' }}>位置</Label>
            <Select value={form.position} onValueChange={(v) => update('position', v)} disabled={!form.sport}>
              <SelectTrigger className="mt-1.5" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}>
                <SelectValue placeholder={form.sport ? '选择位置' : '请先选择专项'} />
              </SelectTrigger>
              <SelectContent style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-subtle)' }}>
                {positionOptions.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div>
            <Label style={{ color: 'var(--text-primary)' }}>当前状态 *</Label>
            <Select value={form.status} onValueChange={(v) => update('status', v as AthleteStatus)}>
              <SelectTrigger className="mt-1.5" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-subtle)' }}>
                {ATHLETE_STATUS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="mt-6">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-[13px] font-medium transition-colors"
            style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--text-primary)' }}
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            className="rounded-lg px-4 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: 'var(--accent-cyan)' }}
          >
            保存
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* ═════════════ Athlete Detail Drawer ═════════════ */

function AthleteDrawer({ athlete, onClose, onEdit, onDelete }: {
  athlete: Athlete | null
  onClose: () => void
  onEdit: (a: Athlete) => void
  onDelete: (uuid: string) => void
}) {
  return (
    <AnimatePresence>
      {athlete && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50"
            onClick={onClose}
          />
          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
            className="fixed right-0 top-0 z-50 h-full overflow-y-auto border-l"
            style={{
              width: 480,
              backgroundColor: 'var(--bg-secondary)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b p-4" style={{ borderColor: 'var(--border-subtle)' }}>
              <h2 className="text-[18px] font-semibold" style={{ color: 'var(--text-primary)' }}>运动员详情</h2>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-md transition-colors"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5">
              {/* Avatar + Name */}
              <div className="flex items-center gap-4">
                <div
                  className="flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold"
                  style={{ backgroundColor: stringToColor(athlete.name), color: '#fff' }}
                >
                  {getInitials(athlete.name)}
                </div>
                <div>
                  <h3 className="text-[22px] font-semibold" style={{ color: 'var(--text-primary)' }}>{athlete.name}</h3>
                  <div
                    className="mt-1 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                    style={{ backgroundColor: STATUS_CONFIG[athlete.status].bg, color: STATUS_CONFIG[athlete.status].color }}
                  >
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: STATUS_CONFIG[athlete.status].dot }} />
                    {athlete.status}
                  </div>
                </div>
              </div>

              {/* Basic Info */}
              <div className="mt-5 rounded-lg border p-4" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-subtle)' }}>
                <h4 className="mb-3 text-[14px] font-semibold" style={{ color: 'var(--text-primary)' }}>基本信息</h4>
                <div className="grid grid-cols-2 gap-3 text-[13px]">
                  {[
                    ['姓名', athlete.name],
                    ['性别', athlete.gender],
                    ['出生日期', athlete.birthDate],
                    ['年龄', `${getAge(athlete.birthDate)}岁`],
                    ['身高', `${athlete.height}cm`],
                    ['体重', `${athlete.weight}kg`],
                    ['专项', athlete.sport],
                    ['队伍', athlete.team],
                    ['位置', athlete.position],
                    ['UUID', athlete.uuid.slice(0, 16) + '...'],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <span style={{ color: 'var(--text-muted)' }}>{label}:</span>
                      <span className="ml-2" style={{ color: 'var(--text-primary)' }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Test History */}
              <div className="mt-4 rounded-lg border p-4" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-subtle)' }}>
                <h4 className="mb-3 text-[14px] font-semibold" style={{ color: 'var(--text-primary)' }}>测试统计</h4>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: '力量测试', count: 12 },
                    { label: '速度测试', count: 8 },
                    { label: '耐力测试', count: 6 },
                    { label: '形态测试', count: 4 },
                    { label: '机能测试', count: 10 },
                    { label: '总测试数', count: 40 },
                  ].map((item) => (
                    <div key={item.label} className="rounded-md p-2 text-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                      <div className="text-[18px] font-semibold" style={{ color: 'var(--accent-cyan)' }}>{item.count}</div>
                      <div className="mt-0.5 text-[11px]" style={{ color: 'var(--text-muted)' }}>{item.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="mt-5 flex gap-3">
                <button
                  onClick={() => onEdit(athlete)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-[13px] font-medium transition-opacity hover:opacity-90"
                  style={{ backgroundColor: 'var(--accent-cyan)', color: '#fff' }}
                >
                  <Pencil size={14} /> 编辑
                </button>
                <button
                  onClick={() => onDelete(athlete.uuid)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-[13px] font-medium transition-opacity hover:opacity-90"
                  style={{ backgroundColor: 'var(--accent-red)', color: '#fff' }}
                >
                  <Trash2 size={14} /> 删除
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

/* ══════════════════ TEST SESSIONS TAB ══════════════════ */

function TestSessions() {
  const [sessions, setSessions] = useState<TestSession[]>(INITIAL_SESSIONS)
  const [searchQuery, setSearchQuery] = useState('')
  const [yearFilter, setYearFilter] = useState('全部')
  const [expandedSession, setExpandedSession] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingSession, setEditingSession] = useState<TestSession | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const years = useMemo(() => {
    const set = new Set(sessions.map((s) => s.date.slice(0, 4)))
    return ['全部', ...Array.from(set).sort().reverse()]
  }, [sessions])

  const filteredSessions = useMemo(() => {
    return sessions
      .filter((s) => {
        const matchSearch = !searchQuery || s.name.includes(searchQuery)
        const matchYear = yearFilter === '全部' || s.date.startsWith(yearFilter)
        return matchSearch && matchYear
      })
      .sort((a, b) => b.date.localeCompare(a.date))
  }, [sessions, searchQuery, yearFilter])

  const handleSave = useCallback((session: TestSession) => {
    setSessions((prev) => {
      const exists = prev.find((s) => s.id === session.id)
      if (exists) return prev.map((s) => (s.id === session.id ? session : s))
      return [session, ...prev]
    })
    setModalOpen(false)
    setEditingSession(null)
  }, [])

  const handleDelete = useCallback((id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id))
    setDeleteConfirmId(null)
  }, [])

  return (
    <div>
      {/* Toolbar */}
      <div
        className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border p-3"
        style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-subtle)' }}
      >
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <Input
            placeholder="搜索批次名称..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)', fontSize: 13 }}
          />
        </div>
        <Select value={yearFilter} onValueChange={setYearFilter}>
          <SelectTrigger className="w-28" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-subtle)' }}>
            {years.map((y) => <SelectItem key={y} value={y}>{y === '全部' ? '全部年份' : y + '年'}</SelectItem>)}
          </SelectContent>
        </Select>
        <button
          onClick={() => { setEditingSession(null); setModalOpen(true) }}
          className="flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: 'var(--accent-cyan)' }}
        >
          <Plus size={16} /> 新建批次
        </button>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Timeline line */}
        <div
          className="absolute left-[76px] top-0 bottom-0 w-0.5"
          style={{ backgroundColor: 'var(--border-subtle)' }}
        />

        {filteredSessions.map((session) => (
          <motion.div
            key={session.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
            className="relative mb-5 flex gap-4"
          >
            {/* Date */}
            <div className="w-[68px] shrink-0 text-right pt-4">
              <div className="text-[13px] font-semibold" style={{ color: 'var(--accent-cyan)' }}>
                {session.date}
              </div>
            </div>

            {/* Dot */}
            <div
              className="z-10 mt-4 h-3 w-3 shrink-0 rounded-full border-2"
              style={{
                backgroundColor: 'var(--bg-primary)',
                borderColor: 'var(--accent-cyan)',
              }}
            />

            {/* Card */}
            <div
              className="group flex-1 rounded-xl border p-4 transition-colors duration-200"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-subtle)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--border-active)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-[15px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                    <FileText size={16} className="mr-1.5 inline" style={{ color: 'var(--accent-cyan)' }} />
                    {session.name}
                  </h3>
                  <div className="mt-1.5 flex flex-wrap items-center gap-4 text-[12px]" style={{ color: 'var(--text-secondary)' }}>
                    <span className="flex items-center gap-1">
                      <MapPin size={12} /> {session.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Thermometer size={12} /> {session.temperature}
                    </span>
                    <span className="flex items-center gap-1">
                      <Droplets size={12} /> {session.humidity}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users size={12} /> {session.athleteCount}人测试
                    </span>
                  </div>
                </div>
              </div>

              {/* Warmup & Notes */}
              <div className="mt-2 text-[12px]" style={{ color: 'var(--text-secondary)' }}>
                <div className="flex items-center gap-1">
                  <Activity size={12} style={{ color: 'var(--text-muted)' }} />
                  <span>{session.warmupMethod}</span>
                </div>
                {session.notes && (
                  <div className="mt-1" style={{ color: 'var(--text-muted)' }}>
                    备注: {session.notes}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="mt-3 flex flex-wrap gap-2 border-t pt-3" style={{ borderColor: 'var(--border-subtle)' }}>
                <button
                  onClick={() => setExpandedSession(expandedSession === session.id ? null : session.id)}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium transition-colors"
                  style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--text-primary)' }}
                >
                  {expandedSession === session.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  查看详细数据
                </button>
                <button
                  onClick={() => { setEditingSession(session); setModalOpen(true) }}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium transition-colors"
                  style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--text-primary)' }}
                >
                  <Pencil size={12} /> 编辑
                </button>
                <button
                  onClick={() => setDeleteConfirmId(session.id)}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium transition-colors"
                  style={{ color: 'var(--accent-red)' }}
                >
                  <Trash2 size={12} /> 删除
                </button>
              </div>

              {/* Expanded Detail */}
              <AnimatePresence>
                {expandedSession === session.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
                    className="overflow-hidden"
                  >
                    <div
                      className="mt-3 rounded-lg border p-3"
                      style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-subtle)' }}
                    >
                      <h4 className="mb-2 text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>测试完成概况</h4>
                      <div className="grid grid-cols-2 gap-2 text-[12px]" style={{ color: 'var(--text-secondary)' }}>
                        <div className="rounded-md p-2" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                          <span style={{ color: 'var(--text-muted)' }}>参与运动员:</span> <span style={{ color: 'var(--text-primary)' }}>{session.athleteCount}人</span>
                        </div>
                        <div className="rounded-md p-2" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                          <span style={{ color: 'var(--text-muted)' }}>测试项目:</span> <span style={{ color: 'var(--text-primary)' }}>8项</span>
                        </div>
                        <div className="rounded-md p-2" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                          <span style={{ color: 'var(--text-muted)' }}>数据记录:</span> <span style={{ color: 'var(--text-primary)' }}>{session.athleteCount * 8}条</span>
                        </div>
                        <div className="rounded-md p-2" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                          <span style={{ color: 'var(--text-muted)' }}>完成率:</span> <span style={{ color: 'var(--accent-green)' }}>98.5%</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        ))}

        {filteredSessions.length === 0 && (
          <div className="py-16 text-center" style={{ color: 'var(--text-muted)' }}>
            <img src={`${import.meta.env.BASE_URL}empty-state-data.svg`} alt="" className="mx-auto mb-3 h-16 w-16 opacity-60" />
            <p className="text-[13px]">暂无测试批次</p>
          </div>
        )}
      </div>

      {/* Session Modal */}
      <SessionModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingSession(null) }}
        onSave={handleSave}
        initialData={editingSession}
      />

      {/* Delete Confirm */}
      <Dialog open={!!deleteConfirmId} onOpenChange={(o) => !o && setDeleteConfirmId(null)}>
        <DialogContent style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-subtle)' }}>
          <DialogHeader>
            <DialogTitle style={{ color: 'var(--text-primary)' }}>确认删除</DialogTitle>
            <DialogDescription style={{ color: 'var(--text-secondary)' }}>
              此操作不可撤销，确定要删除该测试批次吗？
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              onClick={() => setDeleteConfirmId(null)}
              className="rounded-lg px-4 py-2 text-[13px] font-medium transition-colors"
              style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--text-primary)' }}
            >
              取消
            </button>
            <button
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              className="rounded-lg px-4 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: 'var(--accent-red)' }}
            >
              删除
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* ═════════════ Session Create/Edit Modal ═════════════ */

function SessionModal({ open, onClose, onSave, initialData }: {
  open: boolean
  onClose: () => void
  onSave: (s: TestSession) => void
  initialData: TestSession | null
}) {
  const [form, setForm] = useState<Partial<TestSession>>({
    name: '', date: '', location: '', temperature: '', humidity: '', warmupMethod: '', notes: '', athleteCount: 0,
  })

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useState(() => {
    if (open) {
      if (initialData) setForm({ ...initialData })
      else setForm({ name: '', date: '', location: '', temperature: '', humidity: '', warmupMethod: '', notes: '', athleteCount: 0 })
    }
  })

  const update = (field: string, value: unknown) => setForm((prev) => ({ ...prev, [field]: value }))

  const handleSubmit = useCallback(() => {
    if (!form.name || !form.date) return
    onSave({
      id: initialData?.id || 'ses-' + Date.now(),
      name: form.name || '',
      date: form.date || '',
      location: form.location || '',
      temperature: form.temperature || '',
      humidity: form.humidity || '',
      warmupMethod: form.warmupMethod || '',
      notes: form.notes || '',
      athleteCount: Number(form.athleteCount) || 0,
    })
  }, [form, initialData, onSave])

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-[560px] max-h-[90vh] overflow-y-auto" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-subtle)' }}>
        <DialogHeader>
          <DialogTitle style={{ color: 'var(--text-primary)' }}>{initialData ? '编辑测试批次' : '新建测试批次'}</DialogTitle>
        </DialogHeader>

        <div className="mt-4 flex flex-col gap-4">
          <div>
            <Label style={{ color: 'var(--text-primary)' }}>批次名称 *</Label>
            <Input
              value={form.name || ''}
              onChange={(e) => update('name', e.target.value)}
              className="mt-1.5"
              placeholder="如：2024夏训期初测"
              style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
            />
          </div>
          <div>
            <Label style={{ color: 'var(--text-primary)' }}>测试日期 *</Label>
            <Input
              type="date"
              value={form.date || ''}
              onChange={(e) => update('date', e.target.value)}
              className="mt-1.5"
              style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
            />
          </div>
          <div>
            <Label style={{ color: 'var(--text-primary)' }}>测试地点</Label>
            <Input
              value={form.location || ''}
              onChange={(e) => update('location', e.target.value)}
              className="mt-1.5"
              placeholder="如：田径场B"
              style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
            />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label style={{ color: 'var(--text-primary)' }}>温度</Label>
              <Input
                value={form.temperature || ''}
                onChange={(e) => update('temperature', e.target.value)}
                className="mt-1.5"
                placeholder="28°C"
                style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
              />
            </div>
            <div className="flex-1">
              <Label style={{ color: 'var(--text-primary)' }}>湿度</Label>
              <Input
                value={form.humidity || ''}
                onChange={(e) => update('humidity', e.target.value)}
                className="mt-1.5"
                placeholder="65%"
                style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
              />
            </div>
          </div>
          <div>
            <Label style={{ color: 'var(--text-primary)' }}>热身方法</Label>
            <Textarea
              value={form.warmupMethod || ''}
              onChange={(e) => update('warmupMethod', e.target.value)}
              className="mt-1.5"
              placeholder="如：动态拉伸15分钟 + 慢跑800米"
              style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)', fontSize: 13 }}
            />
          </div>
          <div>
            <Label style={{ color: 'var(--text-primary)' }}>预计测试人数</Label>
            <Input
              type="number"
              value={form.athleteCount || ''}
              onChange={(e) => update('athleteCount', parseInt(e.target.value))}
              className="mt-1.5"
              style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
            />
          </div>
          <div>
            <Label style={{ color: 'var(--text-primary)' }}>备注</Label>
            <Textarea
              value={form.notes || ''}
              onChange={(e) => update('notes', e.target.value)}
              className="mt-1.5"
              placeholder="其他备注信息..."
              style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)', fontSize: 13 }}
            />
          </div>
        </div>

        <DialogFooter className="mt-6">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-[13px] font-medium transition-colors"
            style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--text-primary)' }}
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            className="rounded-lg px-4 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: 'var(--accent-cyan)' }}
          >
            保存
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

