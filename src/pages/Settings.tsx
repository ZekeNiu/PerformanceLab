import { useState, useCallback, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  Settings as SettingsIcon,
  Palette,
  Map,
  BarChart3,
  Bell,
  Info,
  Moon,
  Sun,
  Upload,
  RotateCcw,
  Plus,
  Save,
  Trash2,
  CalendarDays,
  HardDrive,
  Download,
  ZoomIn,
  ZoomOut,
  Monitor,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { useAppTheme } from '@/lib/theme'
import { useWorkspaceStore } from '@/lib/workspace-store'

/* ─────────────────────── Types ─────────────────────── */

interface Joint {
  id: number
  name: string
  x: number
  y: number
  side: 'left' | 'right' | 'center'
}

interface NotificationRule {
  id: string
  label: string
  enabled: boolean
  threshold?: number
  days?: number
}

interface ColorScheme {
  name: string
  colors: string[]
}

type DataDensity = '标准' | '紧凑' | '舒适'

interface AppearancePreferences {
  chartColors: string[]
  accentColor: string
  selectedScheme: number
  density: DataDensity
}

interface BodyMapSettings {
  frontJoints: Joint[]
  backJoints: Joint[]
  customFrontImage: string | null
  customBackImage: string | null
}

interface NotificationSettings {
  enabled: boolean
  rules: NotificationRule[]
  maxDisplay: number
}

const DEFAULT_DISPLAY_THRESHOLDS = {
  hrvDeviation: 1.5,
  rhrDeviation: 1.5,
  subjectiveDeviation: 1.0,
  acwrWarning: 1.3,
  acwrDanger: 1.5,
  acwrBaselineDays: 28,
}

type DisplayThresholds = typeof DEFAULT_DISPLAY_THRESHOLDS

function readWorkspaceThresholds(value: unknown): DisplayThresholds {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return DEFAULT_DISPLAY_THRESHOLDS

  const thresholds = { ...DEFAULT_DISPLAY_THRESHOLDS }
  ;(Object.keys(DEFAULT_DISPLAY_THRESHOLDS) as Array<keyof DisplayThresholds>).forEach((key) => {
    const candidate = (value as Record<string, unknown>)[key]
    thresholds[key] = typeof candidate === 'number' && Number.isFinite(candidate) ? candidate : DEFAULT_DISPLAY_THRESHOLDS[key]
  })
  return thresholds
}

/* ─────────────────────── Constants ─────────────────────── */

const DEFAULT_FRONT_JOINTS: Joint[] = [
  { id: 1, name: '头部', x: 50.0, y: 8.0, side: 'center' },
  { id: 2, name: '颈部', x: 50.0, y: 15.0, side: 'center' },
  { id: 3, name: '左肩', x: 30.0, y: 22.0, side: 'left' },
  { id: 4, name: '右肩', x: 70.0, y: 22.0, side: 'right' },
  { id: 5, name: '左肘', x: 20.0, y: 35.0, side: 'left' },
  { id: 6, name: '右肘', x: 80.0, y: 35.0, side: 'right' },
  { id: 7, name: '左手腕', x: 15.0, y: 48.0, side: 'left' },
  { id: 8, name: '右手腕', x: 85.0, y: 48.0, side: 'right' },
  { id: 9, name: '胸部', x: 50.0, y: 28.0, side: 'center' },
  { id: 10, name: '腰部', x: 50.0, y: 40.0, side: 'center' },
  { id: 11, name: '左髋', x: 35.0, y: 50.0, side: 'left' },
  { id: 12, name: '右髋', x: 65.0, y: 50.0, side: 'right' },
  { id: 13, name: '左膝', x: 32.0, y: 68.0, side: 'left' },
  { id: 14, name: '右膝', x: 68.0, y: 68.0, side: 'right' },
  { id: 15, name: '左踝', x: 30.0, y: 85.0, side: 'left' },
  { id: 16, name: '右踝', x: 70.0, y: 85.0, side: 'right' },
]

const DEFAULT_BACK_JOINTS: Joint[] = DEFAULT_FRONT_JOINTS.map((j) => ({ ...j }))

const CHART_SCHEMES: ColorScheme[] = [
  {
    name: '默认',
    colors: ['#00D4AA', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316', '#14B8A6', '#A855F7'],
  },
  {
    name: '海洋',
    colors: ['#0EA5E9', '#06B6D4', '#14B8A6', '#10B981', '#3B82F6', '#6366F1', '#8B5CF6', '#A78BFA', '#22D3EE', '#2DD4BF'],
  },
  {
    name: '热力',
    colors: ['#DC2626', '#EA580C', '#D97706', '#CA8A04', '#EF4444', '#F97316', '#F59E0B', '#FBBF24', '#FCA5A5', '#FDBA74'],
  },
  {
    name: '森林',
    colors: ['#10B981', '#22C55E', '#4ADE80', '#059669', '#16A34A', '#15803D', '#84CC16', '#A3E635', '#14B8A6', '#2DD4BF'],
  },
]

const JOINT_COLORS = [
  '#00D4AA', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899',
  '#06B6D4', '#F97316', '#14B8A6', '#A855F7', '#10B981', '#6366F1',
  '#D97706', '#DC2626', '#2563EB', '#059669',
]

const DEFAULT_NOTIFICATION_RULES: NotificationRule[] = [
  { id: 'hrv-severe', label: 'HRV 偏离阈值且连续', enabled: true, threshold: 1.5, days: 2 },
  { id: 'rhr-severe', label: 'RHR 偏离阈值且连续', enabled: true, threshold: 1.5, days: 2 },
  { id: 'injury-severe', label: '伤病评分 ≥', enabled: true, threshold: 6 },
  { id: 'acwr-danger', label: 'ACWR 进入危险区 (>', enabled: true, threshold: 1.5 },
  { id: 'hrv-caution', label: 'HRV 偏离 > 阈值 单日', enabled: true, threshold: 1.0 },
  { id: 'rhr-caution', label: 'RHR 偏离 > 阈值 单日', enabled: true, threshold: 1.0 },
  { id: 'injury-caution', label: '伤病评分 1-5', enabled: true },
  { id: 'acwr-caution', label: 'ACWR 进入警戒区 (1.3 - 1.5)', enabled: true },
  { id: 'recovery', label: '之前异常指标连续恢复正常', enabled: true, days: 3 },
]

const DEFAULT_APPEARANCE_PREFERENCES: AppearancePreferences = {
  chartColors: CHART_SCHEMES[0].colors,
  accentColor: '#00D4AA',
  selectedScheme: 0,
  density: '标准',
}

const DEFAULT_BODY_MAP_SETTINGS: BodyMapSettings = {
  frontJoints: DEFAULT_FRONT_JOINTS,
  backJoints: DEFAULT_BACK_JOINTS,
  customFrontImage: null,
  customBackImage: null,
}

const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: true,
  rules: DEFAULT_NOTIFICATION_RULES,
  maxDisplay: 10,
}

function cloneJoints(joints: Joint[]): Joint[] {
  return joints.map((joint) => ({ ...joint }))
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function isValidColorArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.length > 0 && value.every((item) => typeof item === 'string')
}

function isDataDensity(value: unknown): value is DataDensity {
  return value === '标准' || value === '紧凑' || value === '舒适'
}

function readWorkspaceAppearancePreferences(
  value: unknown,
  fallback: AppearancePreferences = DEFAULT_APPEARANCE_PREFERENCES,
): AppearancePreferences {
  if (!isRecord(value)) return { ...fallback, chartColors: [...fallback.chartColors] }

  const selectedScheme = value.selectedScheme
  return {
    chartColors: isValidColorArray(value.chartColors) ? [...value.chartColors] : [...fallback.chartColors],
    accentColor: typeof value.accentColor === 'string' ? value.accentColor : fallback.accentColor,
    selectedScheme:
      typeof selectedScheme === 'number' &&
      Number.isInteger(selectedScheme) &&
      selectedScheme >= 0 &&
      selectedScheme < CHART_SCHEMES.length
        ? selectedScheme
        : fallback.selectedScheme,
    density: isDataDensity(value.density) ? value.density : fallback.density,
  }
}

function readWorkspaceJoints(value: unknown, fallback: Joint[]): Joint[] {
  if (!Array.isArray(value)) return cloneJoints(fallback)

  const joints = value
    .filter(isRecord)
    .map((joint): Joint => {
      const side: Joint['side'] =
        joint.side === 'left' || joint.side === 'right' || joint.side === 'center'
          ? joint.side
          : 'center'

      return {
        id: typeof joint.id === 'number' ? joint.id : 0,
        name: typeof joint.name === 'string' ? joint.name : '',
        x: typeof joint.x === 'number' && Number.isFinite(joint.x) ? joint.x : 50,
        y: typeof joint.y === 'number' && Number.isFinite(joint.y) ? joint.y : 50,
        side,
      }
    })
    .filter((joint) => joint.id > 0 && joint.name)

  return joints.length ? joints : cloneJoints(fallback)
}

function readWorkspaceBodyMapSettings(value: unknown): BodyMapSettings {
  if (!isRecord(value)) {
    return {
      frontJoints: cloneJoints(DEFAULT_BODY_MAP_SETTINGS.frontJoints),
      backJoints: cloneJoints(DEFAULT_BODY_MAP_SETTINGS.backJoints),
      customFrontImage: null,
      customBackImage: null,
    }
  }

  return {
    frontJoints: readWorkspaceJoints(value.frontJoints, DEFAULT_FRONT_JOINTS),
    backJoints: readWorkspaceJoints(value.backJoints, DEFAULT_BACK_JOINTS),
    customFrontImage: typeof value.customFrontImage === 'string' ? value.customFrontImage : null,
    customBackImage: typeof value.customBackImage === 'string' ? value.customBackImage : null,
  }
}

function readWorkspaceNotificationSettings(value: unknown): NotificationSettings {
  if (!isRecord(value)) {
    return {
      enabled: DEFAULT_NOTIFICATION_SETTINGS.enabled,
      rules: DEFAULT_NOTIFICATION_RULES.map((rule) => ({ ...rule })),
      maxDisplay: DEFAULT_NOTIFICATION_SETTINGS.maxDisplay,
    }
  }

  const rules = Array.isArray(value.rules)
    ? value.rules.filter(isRecord).map((rule) => ({
        id: typeof rule.id === 'string' ? rule.id : '',
        label: typeof rule.label === 'string' ? rule.label : '',
        enabled: typeof rule.enabled === 'boolean' ? rule.enabled : true,
        threshold: typeof rule.threshold === 'number' ? rule.threshold : undefined,
        days: typeof rule.days === 'number' ? rule.days : undefined,
      })).filter((rule) => rule.id && rule.label)
    : DEFAULT_NOTIFICATION_RULES.map((rule) => ({ ...rule }))

  return {
    enabled: typeof value.enabled === 'boolean' ? value.enabled : DEFAULT_NOTIFICATION_SETTINGS.enabled,
    rules: rules.length ? rules : DEFAULT_NOTIFICATION_RULES.map((rule) => ({ ...rule })),
    maxDisplay:
      typeof value.maxDisplay === 'number' && Number.isFinite(value.maxDisplay)
        ? value.maxDisplay
        : DEFAULT_NOTIFICATION_SETTINGS.maxDisplay,
  }
}

function readStoredChartColors() {
  const stored = localStorage.getItem('sportpulse-chart-colors')
  if (!stored) return CHART_SCHEMES[0].colors

  try {
    const parsed = JSON.parse(stored)
    return Array.isArray(parsed) && parsed.every((item) => typeof item === 'string')
      ? parsed
      : CHART_SCHEMES[0].colors
  } catch {
    localStorage.removeItem('sportpulse-chart-colors')
    return CHART_SCHEMES[0].colors
  }
}

/* ─────────────────────── Zustand-like local store ─────────────────────── */

function useThemeStore(initialAppearance: AppearancePreferences) {
  const { isDark, setTheme } = useAppTheme()

  const [chartColors, setChartColors] = useState(() => {
    return initialAppearance.chartColors
  })

  const [accentColor, setAccentColor] = useState(() => {
    return initialAppearance.accentColor
  })

  useEffect(() => {
    localStorage.setItem('sportpulse-chart-colors', JSON.stringify(chartColors))
    localStorage.setItem('sportpulse-accent', accentColor)
  }, [chartColors, accentColor])

  const setIsDark = useCallback((value: boolean) => {
    setTheme(value ? 'dark' : 'light')
  }, [setTheme])

  return { isDark, setIsDark, chartColors, setChartColors, accentColor, setAccentColor }
}

const sectionEase = [0.16, 1, 0.3, 1] as [number, number, number, number]

/* ─════════════════════════ SETTINGS PAGE ═══════════════════════─ */

export default function Settings() {
  const { workspace } = useWorkspaceStore()
  const initialAppearance = readWorkspaceAppearancePreferences(workspace.settings.chartPreferences, {
    chartColors: readStoredChartColors(),
    accentColor: localStorage.getItem('sportpulse-accent') || DEFAULT_APPEARANCE_PREFERENCES.accentColor,
    selectedScheme: DEFAULT_APPEARANCE_PREFERENCES.selectedScheme,
    density: DEFAULT_APPEARANCE_PREFERENCES.density,
  })
  const { isDark, setIsDark, chartColors, setChartColors, accentColor, setAccentColor } =
    useThemeStore(initialAppearance)

  return (
    <div className="flex min-h-full flex-col" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Page Header */}
      <div
        className="flex h-14 shrink-0 items-center border-b px-6"
        style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-subtle)' }}
      >
        <div className="flex items-center gap-3">
          <SettingsIcon size={24} style={{ color: 'var(--accent-cyan)' }} />
          <h1 className="text-[22px] font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            系统设置
          </h1>
        </div>
      </div>

      {/* Settings Sections */}
      <div className="flex-1 space-y-5 overflow-auto p-6">
        <AppearanceSection
          isDark={isDark}
          setIsDark={setIsDark}
          chartColors={chartColors}
          setChartColors={setChartColors}
          accentColor={accentColor}
          setAccentColor={setAccentColor}
          initialDensity={initialAppearance.density}
          initialSelectedScheme={initialAppearance.selectedScheme}
        />
        <BodyMapSection />
        <DisplayPreferencesSection />
        <NotificationSection />
        <SystemInfoSection />
      </div>
    </div>
  )
}

/* ═══════════════ Section 1: Appearance ═══════════════ */

function AppearanceSection({
  isDark,
  setIsDark,
  chartColors,
  setChartColors,
  accentColor,
  setAccentColor,
  initialDensity,
  initialSelectedScheme,
}: {
  isDark: boolean
  setIsDark: (v: boolean) => void
  chartColors: string[]
  setChartColors: (v: string[]) => void
  accentColor: string
  setAccentColor: (v: string) => void
  initialDensity: DataDensity
  initialSelectedScheme: number
}) {
  const { updateSettings } = useWorkspaceStore()
  const [selectedScheme, setSelectedScheme] = useState(initialSelectedScheme)
  const [density, setDensity] = useState<DataDensity>(initialDensity)

  const applyScheme = useCallback((index: number) => {
    setSelectedScheme(index)
    setChartColors(CHART_SCHEMES[index].colors)
  }, [setChartColors])

  const saveAppearancePreferences = async () => {
    try {
      await updateSettings({
        chartPreferences: {
          chartColors,
          accentColor,
          selectedScheme,
          density,
        },
      })
      toast.success('外观设置已保存到本地工作区')
    } catch (error) {
      toast.error('外观设置保存失败', {
        description: error instanceof Error ? error.message : '请重新授权本地文件或导出备份。',
      })
    }
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: sectionEase }}
      className="rounded-xl border p-6"
      style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-subtle)' }}
    >
      <div className="mb-5 flex items-center gap-2">
        <Palette size={20} style={{ color: 'var(--accent-cyan)' }} />
        <h2 className="text-[18px] font-semibold" style={{ color: 'var(--text-primary)' }}>外观设置</h2>
      </div>

      {/* Theme Toggle */}
      <div className="mb-6">
        <Label className="mb-3 block text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>主题模式</Label>
        <div className="flex gap-4">
          {/* Dark card */}
          <button
            onClick={() => setIsDark(true)}
            className="relative flex-1 max-w-[240px] rounded-lg border-2 p-4 transition-all duration-200"
            style={{
              borderColor: isDark ? 'var(--accent-cyan)' : 'var(--border-subtle)',
              backgroundColor: '#141821',
              boxShadow: isDark ? '0 0 0 1px var(--accent-cyan), 0 0 12px rgba(0,212,170,0.15)' : 'none',
            }}
          >
            <div className="mb-3 rounded-md p-3" style={{ backgroundColor: '#1C2130' }}>
              <div className="mb-2 h-2 w-16 rounded" style={{ backgroundColor: 'var(--accent-cyan)' }} />
              <div className="h-1.5 w-full rounded" style={{ backgroundColor: '#2A3348' }} />
              <div className="mt-1 h-1.5 w-3/4 rounded" style={{ backgroundColor: '#2A3348' }} />
            </div>
            <div className="flex items-center gap-2">
              <Moon size={16} style={{ color: '#E8ECF1' }} />
              <span className="text-[13px] font-medium" style={{ color: '#E8ECF1' }}>深色模式</span>
            </div>
            {isDark && (
              <div className="absolute top-2 right-2 h-4 w-4 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--accent-cyan)' }}>
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="#0B0E14" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
            )}
          </button>

          {/* Light card */}
          <button
            onClick={() => setIsDark(false)}
            className="relative flex-1 max-w-[240px] rounded-lg border-2 p-4 transition-all duration-200"
            style={{
              borderColor: !isDark ? 'var(--accent-cyan)' : 'var(--border-subtle)',
              backgroundColor: '#FFFFFF',
              boxShadow: !isDark ? '0 0 0 1px var(--accent-cyan), 0 0 12px rgba(0,212,170,0.15)' : 'none',
            }}
          >
            <div className="mb-3 rounded-md p-3" style={{ backgroundColor: '#F5F6F8' }}>
              <div className="mb-2 h-2 w-16 rounded" style={{ backgroundColor: '#00D4AA' }} />
              <div className="h-1.5 w-full rounded" style={{ backgroundColor: '#D8DCE4' }} />
              <div className="mt-1 h-1.5 w-3/4 rounded" style={{ backgroundColor: '#D8DCE4' }} />
            </div>
            <div className="flex items-center gap-2">
              <Sun size={16} style={{ color: '#1A1E2E' }} />
              <span className="text-[13px] font-medium" style={{ color: '#1A1E2E' }}>浅色模式</span>
            </div>
            {!isDark && (
              <div className="absolute top-2 right-2 h-4 w-4 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--accent-cyan)' }}>
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Chart Color Scheme */}
      <div className="mb-6">
        <Label className="mb-3 block text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>图表强调色序列</Label>
        <div className="mb-3 text-[12px]" style={{ color: 'var(--text-muted)' }}>预设方案</div>
        <div className="flex flex-wrap gap-3">
          {CHART_SCHEMES.map((scheme, idx) => (
            <button
              key={scheme.name}
              onClick={() => applyScheme(idx)}
              className="relative rounded-lg border p-3 transition-all duration-200"
              style={{
                borderColor: selectedScheme === idx ? 'var(--accent-cyan)' : 'var(--border-subtle)',
                backgroundColor: 'var(--bg-primary)',
              }}
            >
              <div className="mb-2 flex gap-1">
                {scheme.colors.slice(0, 5).map((c, i) => (
                  <div key={i} className="h-4 w-4 rounded-sm" style={{ backgroundColor: c }} />
                ))}
              </div>
              <div className="text-center text-[12px] font-medium" style={{ color: 'var(--text-primary)' }}>{scheme.name}</div>
              {selectedScheme === idx && (
                <div className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--accent-cyan)' }}>
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="var(--bg-primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Custom colors */}
        <div className="mt-4">
          <div className="mb-2 text-[12px]" style={{ color: 'var(--text-muted)' }}>自定义序列</div>
          <div className="flex flex-wrap gap-2">
            {chartColors.map((color, idx) => (
              <label key={idx} className="relative cursor-pointer">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => {
                    const newColors = [...chartColors]
                    newColors[idx] = e.target.value
                    setChartColors(newColors)
                  }}
                  className="sr-only"
                />
                <div
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border transition-transform hover:scale-110"
                  style={{ backgroundColor: color, borderColor: 'var(--border-subtle)' }}
                >
                  <span className="text-[10px] font-bold" style={{ color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                    {idx + 1}
                  </span>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Accent Color */}
      <div className="mb-6">
        <Label className="mb-3 block text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>强调色</Label>
        <div className="flex items-center gap-3">
          {['#00D4AA', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#10B981', '#F97316'].map((color) => (
            <button
              key={color}
              onClick={() => setAccentColor(color)}
              className="relative h-8 w-8 rounded-full transition-transform hover:scale-110"
              style={{
                backgroundColor: color,
                boxShadow: accentColor === color ? `0 0 0 2px var(--bg-secondary), 0 0 0 4px ${color}` : 'none',
              }}
            />
          ))}
          <label className="relative cursor-pointer">
            <input
              type="color"
              value={accentColor}
              onChange={(e) => setAccentColor(e.target.value)}
              className="sr-only"
            />
            <div
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-2 border-dashed transition-colors hover:opacity-80"
              style={{ borderColor: 'var(--border-active)' }}
            >
              <Plus size={14} style={{ color: 'var(--text-secondary)' }} />
            </div>
          </label>
        </div>
      </div>

      {/* Data Density */}
      <div>
        <Label className="mb-3 block text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>数据密度</Label>
        <div className="flex flex-col gap-2">
          {(['标准', '紧凑', '舒适'] as DataDensity[]).map((d) => (
            <label key={d} className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors" style={{ borderColor: density === d ? 'var(--accent-cyan)' : 'var(--border-subtle)', backgroundColor: density === d ? 'var(--bg-primary)' : 'transparent' }}>
              <input
                type="radio"
                name="density"
                checked={density === d}
                onChange={() => setDensity(d)}
                className="h-4 w-4"
                style={{ accentColor: 'var(--accent-cyan)' }}
              />
              <div>
                <div className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>{d}</div>
                <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  {d === '标准' && '平衡的信息密度和可读性'}
                  {d === '紧凑' && '更多数据可见，适合大屏'}
                  {d === '舒适' && '更大间距，适合快速浏览'}
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="mt-5 flex gap-3">
        <button
          onClick={saveAppearancePreferences}
          className="flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: 'var(--accent-cyan)' }}
        >
          <Save size={14} /> 保存外观设置
        </button>
      </div>
    </motion.section>
  )
}

/* ═══════════════ Section 2: Body Map Configuration ═══════════════ */

function BodyMapSection() {
  const { workspace, updateSettings } = useWorkspaceStore()
  const bodyMapSettings = readWorkspaceBodyMapSettings(workspace.settings.bodyMap)
  const [activeView, setActiveView] = useState<'front' | 'back'>('front')
  const [editMode, setEditMode] = useState<'drag' | 'table'>('drag')
  const [zoom, setZoom] = useState(100)
  const [frontJoints, setFrontJoints] = useState<Joint[]>(bodyMapSettings.frontJoints)
  const [backJoints, setBackJoints] = useState<Joint[]>(bodyMapSettings.backJoints)
  const [draggingId, setDraggingId] = useState<number | null>(null)
  const [customFrontImage, setCustomFrontImage] = useState<string | null>(bodyMapSettings.customFrontImage)
  const [customBackImage, setCustomBackImage] = useState<string | null>(bodyMapSettings.customBackImage)
  const imageRef = useRef<HTMLDivElement>(null)

  const joints = activeView === 'front' ? frontJoints : backJoints
  const setJoints = activeView === 'front' ? setFrontJoints : setBackJoints
  const bodyImage = activeView === 'front'
    ? (customFrontImage || `${import.meta.env.BASE_URL}body-map-front.png`)
    : (customBackImage || `${import.meta.env.BASE_URL}body-map-back.png`)

  const handleDragStart = useCallback((id: number) => {
    setDraggingId(id)
  }, [])

  const handleDragEnd = useCallback(() => {
    setDraggingId(null)
  }, [])

  const handleImageMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (draggingId === null || !imageRef.current) return
    const rect = imageRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    const clampedX = Math.max(0, Math.min(100, Math.round(x * 2) / 2))
    const clampedY = Math.max(0, Math.min(100, Math.round(y * 2) / 2))
    setJoints((prev) => prev.map((j) => j.id === draggingId ? { ...j, x: clampedX, y: clampedY } : j))
  }, [draggingId, setJoints])

  const updateJointCoord = useCallback((id: number, field: 'x' | 'y', value: number) => {
    setJoints((prev) => prev.map((j) => j.id === id ? { ...j, [field]: Math.max(0, Math.min(100, Math.round(value * 2) / 2)) } : j))
  }, [setJoints])

  const addCustomJoint = useCallback(() => {
    setJoints((prev) => {
      const newId = Math.max(...prev.map((j) => j.id), 0) + 1
      return [...prev, { id: newId, name: `自定义${newId}`, x: 50, y: 50, side: 'center' as const }]
    })
  }, [setJoints])

  const removeJoint = useCallback((id: number) => {
    setJoints((prev) => prev.filter((j) => j.id !== id))
  }, [setJoints])

  const resetJoints = useCallback(() => {
    if (activeView === 'front') setFrontJoints(DEFAULT_FRONT_JOINTS.map((j) => ({ ...j })))
    else setBackJoints(DEFAULT_BACK_JOINTS.map((j) => ({ ...j })))
  }, [activeView])

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>, view: 'front' | 'back') => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { alert('图片大小不能超过2MB'); return }
    const reader = new FileReader()
    reader.onload = (ev) => {
      if (view === 'front') setCustomFrontImage(ev.target?.result as string)
      else setCustomBackImage(ev.target?.result as string)
    }
    reader.readAsDataURL(file)
  }, [])

  const saveBodyMapSettings = async () => {
    try {
      await updateSettings({
        bodyMap: {
          frontJoints,
          backJoints,
          customFrontImage,
          customBackImage,
        },
      })
      toast.success('人体图配置已保存到本地工作区')
    } catch (error) {
      toast.error('人体图配置保存失败', {
        description: error instanceof Error ? error.message : '请重新授权本地文件或导出备份。',
      })
    }
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: sectionEase, delay: 0.05 }}
      className="rounded-xl border p-6"
      style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-subtle)' }}
    >
      <div className="mb-2 flex items-center gap-2">
        <Map size={20} style={{ color: 'var(--accent-cyan)' }} />
        <h2 className="text-[18px] font-semibold" style={{ color: 'var(--text-primary)' }}>伤病状态图配置</h2>
      </div>
      <p className="mb-5 text-[12px]" style={{ color: 'var(--text-secondary)' }}>
        上传自定义人体图片并调整关节坐标位置，以匹配您的伤病评估体系。
      </p>

      {/* Image Upload Area */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Front View Upload */}
        <div>
          <div className="mb-2 text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>前视图</div>
          <div
            className="relative flex aspect-[2/3] items-center justify-center rounded-lg border-2 border-dashed"
            style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-primary)' }}
          >
            {customFrontImage ? (
              <img src={customFrontImage} alt="Front" className="h-full w-full rounded-lg object-contain" />
            ) : (
              <label className="flex cursor-pointer flex-col items-center gap-2 p-6">
                <Upload size={24} style={{ color: 'var(--text-muted)' }} />
                <span className="text-center text-[12px]" style={{ color: 'var(--text-muted)' }}>
                  点击上传或拖拽<br />建议尺寸: 600×900<br />透明背景 PNG
                </span>
                <input type="file" accept="image/png,image/jpeg" className="sr-only" onChange={(e) => handleImageUpload(e, 'front')} />
              </label>
            )}
            {customFrontImage && (
              <button
                onClick={() => setCustomFrontImage(null)}
                className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-md transition-colors"
                style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-muted)' }}
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Back View Upload */}
        <div>
          <div className="mb-2 text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>后视图</div>
          <div
            className="relative flex aspect-[2/3] items-center justify-center rounded-lg border-2 border-dashed"
            style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-primary)' }}
          >
            {customBackImage ? (
              <img src={customBackImage} alt="Back" className="h-full w-full rounded-lg object-contain" />
            ) : (
              <label className="flex cursor-pointer flex-col items-center gap-2 p-6">
                <Upload size={24} style={{ color: 'var(--text-muted)' }} />
                <span className="text-center text-[12px]" style={{ color: 'var(--text-muted)' }}>
                  点击上传或拖拽<br />建议尺寸: 600×900<br />透明背景 PNG
                </span>
                <input type="file" accept="image/png,image/jpeg" className="sr-only" onChange={(e) => handleImageUpload(e, 'back')} />
              </label>
            )}
            {customBackImage && (
              <button
                onClick={() => setCustomBackImage(null)}
                className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-md transition-colors"
                style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-muted)' }}
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Joint Position Editor */}
      <div
        className="rounded-lg border p-4"
        style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-subtle)' }}
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>视图:</span>
            <div className="flex rounded-md border" style={{ borderColor: 'var(--border-subtle)' }}>
              <button
                onClick={() => setActiveView('front')}
                className="px-3 py-1 text-[12px] font-medium transition-colors"
                style={{
                  backgroundColor: activeView === 'front' ? 'var(--accent-cyan)' : 'transparent',
                  color: activeView === 'front' ? '#fff' : 'var(--text-secondary)',
                }}
              >
                前视
              </button>
              <button
                onClick={() => setActiveView('back')}
                className="px-3 py-1 text-[12px] font-medium transition-colors"
                style={{
                  backgroundColor: activeView === 'back' ? 'var(--accent-cyan)' : 'transparent',
                  color: activeView === 'back' ? '#fff' : 'var(--text-secondary)',
                }}
              >
                后视
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>编辑模式:</span>
            <div className="flex rounded-md border" style={{ borderColor: 'var(--border-subtle)' }}>
              <button
                onClick={() => setEditMode('drag')}
                className="px-3 py-1 text-[12px] font-medium transition-colors"
                style={{
                  backgroundColor: editMode === 'drag' ? 'var(--accent-cyan)' : 'transparent',
                  color: editMode === 'drag' ? '#fff' : 'var(--text-secondary)',
                }}
              >
                拖动调整
              </button>
              <button
                onClick={() => setEditMode('table')}
                className="px-3 py-1 text-[12px] font-medium transition-colors"
                style={{
                  backgroundColor: editMode === 'table' ? 'var(--accent-cyan)' : 'transparent',
                  color: editMode === 'table' ? '#fff' : 'var(--text-secondary)',
                }}
              >
                表格编辑
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 lg:flex-row">
          {/* Interactive Image */}
          <div className="flex-1">
            <div
              ref={imageRef}
              className="relative mx-auto overflow-hidden rounded-lg border select-none"
              style={{
                borderColor: 'var(--border-subtle)',
                width: `${Math.min(100, zoom)}%`,
                maxWidth: 400,
                cursor: editMode === 'drag' ? (draggingId !== null ? 'grabbing' : 'grab') : 'default',
              }}
              onMouseMove={editMode === 'drag' ? handleImageMouseMove : undefined}
              onMouseUp={handleDragEnd}
              onMouseLeave={handleDragEnd}
            >
              <img
                src={bodyImage}
                alt="Body map"
                className="pointer-events-none w-full select-none"
                draggable={false}
              />
              {joints.map((joint, idx) => (
                <div
                  key={joint.id}
                  className="absolute flex flex-col items-center"
                  style={{
                    left: `${joint.x}%`,
                    top: `${joint.y}%`,
                    transform: 'translate(-50%, -50%)',
                    zIndex: draggingId === joint.id ? 20 : 10,
                  }}
                  onMouseDown={editMode === 'drag' ? (e) => { e.preventDefault(); e.stopPropagation(); handleDragStart(joint.id); } : undefined}
                >
                  <div
                    className="flex items-center justify-center rounded-full transition-transform"
                    style={{
                      width: draggingId === joint.id ? 20 : 16,
                      height: draggingId === joint.id ? 20 : 16,
                      backgroundColor: JOINT_COLORS[idx % JOINT_COLORS.length],
                      boxShadow: `0 0 0 2px var(--bg-primary), 0 0 6px ${JOINT_COLORS[idx % JOINT_COLORS.length]}`,
                      transitionDuration: draggingId === joint.id ? '50ms' : '200ms',
                    }}
                  >
                    <span className="text-[9px] font-bold" style={{ color: '#fff' }}>{joint.id}</span>
                  </div>
                  <span className="mt-0.5 whitespace-nowrap text-[9px] font-medium" style={{ color: 'var(--text-primary)', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
                    {joint.name}
                  </span>
                </div>
              ))}
            </div>

            {/* Zoom Controls */}
            <div className="mt-3 flex items-center justify-center gap-3">
              <button
                onClick={() => setZoom((z) => Math.max(50, z - 10))}
                className="flex h-7 w-7 items-center justify-center rounded-md transition-colors"
                style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
              >
                <ZoomOut size={14} />
              </button>
              <Slider
                value={[zoom]}
                onValueChange={(v) => setZoom(v[0])}
                min={50}
                max={200}
                step={10}
                className="w-32"
              />
              <button
                onClick={() => setZoom((z) => Math.min(200, z + 10))}
                className="flex h-7 w-7 items-center justify-center rounded-md transition-colors"
                style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
              >
                <ZoomIn size={14} />
              </button>
              <span className="w-12 text-right text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>{zoom}%</span>
            </div>
          </div>

          {/* Coordinate Table */}
          <div className="lg:w-64">
            <div
              className="max-h-[400px] overflow-y-auto rounded-lg border"
              style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-subtle)' }}
            >
              <table className="w-full text-[12px]">
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                    <th className="px-2 py-2 text-left font-medium" style={{ color: 'var(--text-secondary)' }}>#</th>
                    <th className="px-2 py-2 text-left font-medium" style={{ color: 'var(--text-secondary)' }}>部位</th>
                    <th className="px-2 py-2 text-left font-medium" style={{ color: 'var(--text-secondary)' }}>X</th>
                    <th className="px-2 py-2 text-left font-medium" style={{ color: 'var(--text-secondary)' }}>Y</th>
                    <th className="px-1 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {joints.map((joint) => (
                    <tr key={joint.id} className="border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                      <td className="px-2 py-1.5 font-mono" style={{ color: 'var(--text-muted)' }}>{joint.id}</td>
                      <td className="px-2 py-1.5" style={{ color: 'var(--text-primary)' }}>{joint.name}</td>
                      <td className="px-1 py-1.5">
                        <Input
                          type="number"
                          value={joint.x}
                          onChange={(e) => updateJointCoord(joint.id, 'x', parseFloat(e.target.value))}
                          className="h-6 w-14 px-1 py-0 text-[11px]"
                          style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
                          min={0}
                          max={100}
                          step={0.5}
                        />
                      </td>
                      <td className="px-1 py-1.5">
                        <Input
                          type="number"
                          value={joint.y}
                          onChange={(e) => updateJointCoord(joint.id, 'y', parseFloat(e.target.value))}
                          className="h-6 w-14 px-1 py-0 text-[11px]"
                          style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
                          min={0}
                          max={100}
                          step={0.5}
                        />
                      </td>
                      <td className="px-1 py-1.5">
                        <button
                          onClick={() => removeJoint(joint.id)}
                          className="flex h-5 w-5 items-center justify-center rounded transition-colors"
                          style={{ color: 'var(--accent-red)' }}
                        >
                          <Trash2 size={10} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              onClick={addCustomJoint}
              className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border py-1.5 text-[12px] font-medium transition-colors"
              style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
            >
              <Plus size={12} /> 添加自定义部位
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 flex gap-3">
          <button
            onClick={resetJoints}
            className="flex items-center gap-2 rounded-lg border px-4 py-2 text-[13px] font-medium transition-colors"
            style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
          >
            <RotateCcw size={14} /> 恢复默认坐标
          </button>
          <button
            onClick={saveBodyMapSettings}
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: 'var(--accent-cyan)' }}
          >
            <Save size={14} /> 保存配置
          </button>
        </div>

        <div className="mt-2 text-[11px]" style={{ color: 'var(--text-muted)' }}>
          坐标系: 左上角 (0, 0) 到 右下角 (100, 100)
        </div>
      </div>
    </motion.section>
  )
}

/* ═══════════════ Section 3: Display Preferences ═══════════════ */

function DisplayPreferencesSection() {
  const { workspace, updateSettings } = useWorkspaceStore()
  const [thresholds, setThresholds] = useState<DisplayThresholds>(() =>
    readWorkspaceThresholds(workspace.settings.thresholds),
  )

  const update = (field: string, value: number) => {
    setThresholds((prev) => ({ ...prev, [field]: value }))
  }

  const saveThresholds = async () => {
    try {
      await updateSettings({ thresholds })
      toast.success('阈值设置已保存到本地工作区')
    } catch (error) {
      toast.error('阈值设置保存失败', {
        description: error instanceof Error ? error.message : '请重新授权本地文件或导出备份。',
      })
    }
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: sectionEase, delay: 0.1 }}
      className="rounded-xl border p-6"
      style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-subtle)' }}
    >
      <div className="mb-5 flex items-center gap-2">
        <BarChart3 size={20} style={{ color: 'var(--accent-cyan)' }} />
        <h2 className="text-[18px] font-semibold" style={{ color: 'var(--text-primary)' }}>数据展示偏好</h2>
      </div>

      <div className="mb-2 text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>异常检测阈值</div>
      <div className="space-y-4">
        {[
          { label: 'HRV 偏离阈值', field: 'hrvDeviation', min: 1, max: 3, step: 0.1, suffix: '× 标准差', tooltip: '心率变异性异常检测倍数' },
          { label: 'RHR 偏离阈值', field: 'rhrDeviation', min: 1, max: 3, step: 0.1, suffix: '× 标准差', tooltip: '静息心率异常检测倍数' },
          { label: '主观评分偏离阈值', field: 'subjectiveDeviation', min: 0.5, max: 2, step: 0.1, suffix: '× 标准差', tooltip: '主观评分异常检测倍数' },
          { label: 'ACWR 警告线', field: 'acwrWarning', min: 1, max: 2, step: 0.1, suffix: '', tooltip: '急性:慢性负荷比警告阈值' },
          { label: 'ACWR 危险线', field: 'acwrDanger', min: 1, max: 2.5, step: 0.1, suffix: '', tooltip: '急性:慢性负荷比危险阈值' },
          { label: 'ACWR 基线积累天数', field: 'acwrBaselineDays', min: 7, max: 42, step: 1, suffix: '天', tooltip: 'ACWR计算使用的积累天数' },
        ].map((item) => (
          <div key={item.field} className="flex items-center gap-4">
            <div className="w-40 shrink-0">
              <div className="text-[13px]" style={{ color: 'var(--text-primary)' }}>{item.label}</div>
              <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{item.tooltip}</div>
            </div>
            <Slider
              value={[thresholds[item.field as keyof typeof thresholds]]}
              onValueChange={(v) => update(item.field, v[0])}
              min={item.min}
              max={item.max}
              step={item.step}
              className="flex-1"
            />
            <div className="flex w-24 items-center gap-1">
              <Input
                type="number"
                value={thresholds[item.field as keyof typeof thresholds]}
                onChange={(e) => update(item.field, parseFloat(e.target.value))}
                className="h-8 w-16 text-[12px]"
                style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
                min={item.min}
                max={item.max}
                step={item.step}
              />
              <span className="whitespace-nowrap text-[11px]" style={{ color: 'var(--text-muted)' }}>{item.suffix}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 flex gap-3">
        <button
          onClick={() => setThresholds(DEFAULT_DISPLAY_THRESHOLDS)}
          className="flex items-center gap-2 rounded-lg border px-4 py-2 text-[13px] font-medium transition-colors"
          style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
        >
          <RotateCcw size={14} /> 恢复默认
        </button>
        <button
          onClick={saveThresholds}
          className="flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: 'var(--accent-cyan)' }}
        >
          <Save size={14} /> 保存
        </button>
      </div>
    </motion.section>
  )
}

/* ═══════════════ Section 4: Notification Settings ═══════════════ */

function NotificationSection() {
  const { workspace, updateSettings } = useWorkspaceStore()
  const notificationSettings = readWorkspaceNotificationSettings(workspace.settings.notificationRules)
  const [enabled, setEnabled] = useState(notificationSettings.enabled)
  const [rules, setRules] = useState<NotificationRule[]>(notificationSettings.rules)
  const [maxDisplay, setMaxDisplay] = useState(notificationSettings.maxDisplay)

  const toggleRule = (id: string) => {
    setRules((prev) => prev.map((r) => r.id === id ? { ...r, enabled: !r.enabled } : r))
  }

  const saveNotificationRules = async () => {
    try {
      await updateSettings({
        notificationRules: {
          enabled,
          rules,
          maxDisplay,
        },
      })
      toast.success('通知设置已保存到本地工作区')
    } catch (error) {
      toast.error('通知设置保存失败', {
        description: error instanceof Error ? error.message : '请重新授权本地文件或导出备份。',
      })
    }
  }

  const severeRules = rules.filter((r) => r.id.includes('severe') || r.id === 'acwr-danger')
  const cautionRules = rules.filter((r) => r.id.includes('caution') || r.id === 'injury-caution')
  const recoveryRules = rules.filter((r) => r.id === 'recovery')

  const renderRuleGroup = ({ title, items }: { title: string; items: NotificationRule[] }) => (
    <div className="mb-4">
      <div className="mb-2 text-[12px] font-medium" style={{ color: 'var(--text-muted)' }}>{title}</div>
      {items.map((rule) => (
        <div key={rule.id} className="flex items-center justify-between py-2 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="flex items-center gap-3">
            <Switch checked={rule.enabled} onCheckedChange={() => toggleRule(rule.id)} />
            <span className="text-[13px]" style={{ color: 'var(--text-primary)' }}>
              {rule.label}
              {rule.threshold !== undefined && (
                <span className="ml-1 font-mono" style={{ color: 'var(--accent-cyan)' }}>{rule.threshold}</span>
              )}
              {rule.days !== undefined && rule.threshold !== undefined && (
                <span style={{ color: 'var(--text-secondary)' }}> )</span>
              )}
              {rule.days !== undefined && (
                <>
                  {' '}{rule.days} 天
                </>
              )}
              {rule.id === 'injury-caution' && ' (1-5)'}
              {rule.id === 'acwr-caution' && ' (1.3 - 1.5)'}
            </span>
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: sectionEase, delay: 0.15 }}
      className="rounded-xl border p-6"
      style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-subtle)' }}
    >
      <div className="mb-5 flex items-center gap-2">
        <Bell size={20} style={{ color: 'var(--accent-cyan)' }} />
        <h2 className="text-[18px] font-semibold" style={{ color: 'var(--text-primary)' }}>通知设置</h2>
      </div>

      {/* Enable Toggle */}
      <div className="mb-5 flex items-center gap-3 rounded-lg border p-3" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-primary)' }}>
        <Switch checked={enabled} onCheckedChange={setEnabled} />
        <span className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>启用快速概览警报</span>
      </div>

      {enabled && (
        <>
          {renderRuleGroup({ title: '严重异常条件 (需同时满足)', items: severeRules })}
          {renderRuleGroup({ title: '注意条件', items: cautionRules })}
          {renderRuleGroup({ title: '恢复条件', items: recoveryRules })}

          {/* Max Display */}
          <div className="mt-4 flex items-center gap-4">
            <span className="text-[13px]" style={{ color: 'var(--text-primary)' }}>最大显示数量:</span>
            <Input
              type="number"
              value={maxDisplay}
              onChange={(e) => setMaxDisplay(parseInt(e.target.value) || 0)}
              className="h-8 w-20 text-[12px]"
              style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
              min={1}
              max={50}
            />
            <span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>名运动员 (超出时优先显示最严重)</span>
          </div>

          <div className="mt-5 flex gap-3">
            <button
              onClick={() => setRules((prev) => prev.map((r) => ({ ...r, enabled: true })))}
              className="flex items-center gap-2 rounded-lg border px-4 py-2 text-[13px] font-medium transition-colors"
              style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
            >
              <RotateCcw size={14} /> 恢复默认
            </button>
            <button
              onClick={saveNotificationRules}
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: 'var(--accent-cyan)' }}
            >
              <Save size={14} /> 保存
            </button>
          </div>
        </>
      )}
    </motion.section>
  )
}

/* ═══════════════ Section 5: System Info ═══════════════ */

function SystemInfoSection() {
  const { workspace, exportBackup } = useWorkspaceStore()
  const [clearCacheOpen, setClearCacheOpen] = useState(false)

  const stats = [
    { label: '运动员总数', value: `${workspace.athletes.length} 人` },
    { label: '测试批次总数', value: `${workspace.testSessions.length} 次` },
    { label: '数据记录总数', value: `${workspace.measurements.length.toLocaleString()} 条` },
    { label: '定义指标总数', value: `${workspace.metricDefinitions.length} 个` },
  ]

  const localCacheSizeKb = Math.round(
    Object.keys(localStorage)
      .filter((key) => key.startsWith('sportpulse-'))
      .reduce((total, key) => total + key.length + (localStorage.getItem(key)?.length ?? 0), 0) / 1024,
  )

  const handleClearCache = () => {
    const keys = Object.keys(localStorage).filter((k) => k.startsWith('sportpulse-'))
    keys.forEach((k) => localStorage.removeItem(k))
    setClearCacheOpen(false)
    alert('本地缓存已清除')
    window.location.reload()
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: sectionEase, delay: 0.2 }}
      className="rounded-xl border p-6"
      style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-subtle)' }}
    >
      <div className="mb-5 flex items-center gap-2">
        <Info size={20} style={{ color: 'var(--accent-cyan)' }} />
        <h2 className="text-[18px] font-semibold" style={{ color: 'var(--text-primary)' }}>系统信息</h2>
      </div>

      <div className="space-y-4">
        {/* Version */}
        <div className="flex items-center gap-2 text-[13px]">
          <Monitor size={14} style={{ color: 'var(--text-muted)' }} />
          <span style={{ color: 'var(--text-secondary)' }}>SportPulse 版本:</span>
          <span className="font-mono font-medium" style={{ color: 'var(--text-primary)' }}>v2.1.0</span>
        </div>
        <div className="flex items-center gap-2 text-[13px]">
          <CalendarDays size={14} style={{ color: 'var(--text-muted)' }} />
          <span style={{ color: 'var(--text-secondary)' }}>工作区更新时间:</span>
          <span style={{ color: 'var(--text-primary)' }}>{new Date(workspace.updatedAt).toLocaleString()}</span>
        </div>

        {/* Data Stats */}
        <div className="rounded-lg border p-4" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-subtle)' }}>
          <div className="mb-3 text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>数据统计</div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="rounded-md p-3 text-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                <div className="text-[18px] font-semibold" style={{ color: 'var(--accent-cyan)' }}>{s.value}</div>
                <div className="mt-1 text-[11px]" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Cache Management */}
        <div className="rounded-lg border p-4" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-subtle)' }}>
          <div className="mb-3 text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>缓存管理</div>
          <div className="flex items-center gap-3">
            <HardDrive size={14} style={{ color: 'var(--text-muted)' }} />
            <span className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>本地缓存大小:</span>
            <span className="font-mono text-[13px]" style={{ color: 'var(--text-primary)' }}>{localCacheSizeKb} KB</span>
            <button
              onClick={() => setClearCacheOpen(true)}
              className="ml-auto flex items-center gap-2 rounded-lg border px-4 py-2 text-[12px] font-medium transition-colors"
              style={{ borderColor: 'var(--accent-red)', color: 'var(--accent-red)' }}
            >
              <Trash2 size={12} /> 清除本地缓存
            </button>
          </div>
          <p className="mt-2 text-[11px]" style={{ color: 'var(--text-muted)' }}>
            将重置浏览器内的主题和短期偏好；核心数据请以本地 JSON 工作区文件为准。
          </p>
        </div>

        {/* Data Export */}
        <div className="rounded-lg border p-4" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-subtle)' }}>
          <div className="mb-3 text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>数据管理</div>
          <div className="flex gap-3">
            <button
              onClick={exportBackup}
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-[12px] font-medium text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: 'var(--accent-blue)' }}
            >
              <Download size={12} /> 导出全部数据
            </button>
          </div>
          <p className="mt-2 text-[11px]" style={{ color: 'var(--text-muted)' }}>
            下载当前活动工作区的完整 JSON 备份。
          </p>
        </div>
      </div>

      {/* Clear Cache Confirmation */}
      <Dialog open={clearCacheOpen} onOpenChange={setClearCacheOpen}>
        <DialogContent style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-subtle)' }}>
          <DialogHeader>
            <DialogTitle style={{ color: 'var(--text-primary)' }}>确认清除缓存</DialogTitle>
            <DialogDescription style={{ color: 'var(--text-secondary)' }}>
              此操作会删除浏览器内的主题和短期偏好。重新载入后，请通过顶部文件栏重新打开同一个 JSON 工作区文件恢复核心数据。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              onClick={() => setClearCacheOpen(false)}
              className="rounded-lg px-4 py-2 text-[13px] font-medium transition-colors"
              style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--text-primary)' }}
            >
              取消
            </button>
            <button
              onClick={handleClearCache}
              className="rounded-lg px-4 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: 'var(--accent-red)' }}
            >
              清除
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.section>
  )
}
