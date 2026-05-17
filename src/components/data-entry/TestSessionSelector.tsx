import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Calendar,
  MapPin,
  Thermometer,
  Droplets,
  Activity,
  Plus,
  Check,
  X,
} from 'lucide-react'
import type { TestSession } from '@/data/mockData'
import { mockTestSessions } from '@/data/mockData'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface TestSessionSelectorProps {
  selectedSession: TestSession | null
  onSelectSession: (session: TestSession | null) => void
}

const today = () => new Date().toISOString().split('T')[0]

export default function TestSessionSelector({
  selectedSession,
  onSelectSession,
}: TestSessionSelectorProps) {
  const [sessions, setSessions] = useState<TestSession[]>(mockTestSessions)
  const [showNewForm, setShowNewForm] = useState(false)
  const [formData, setFormData] = useState<Partial<TestSession>>({
    date: today(),
  })

  const handleCreate = () => {
    if (!formData.name || !formData.date) return
    const newSession: TestSession = {
      id: `ts-${Date.now()}`,
      name: formData.name,
      date: formData.date,
      location: formData.location || '',
      temperature: formData.temperature,
      humidity: formData.humidity,
      warmUpMethod: formData.warmUpMethod || '',
      notes: formData.notes || '',
    }
    setSessions((prev) => [newSession, ...prev])
    onSelectSession(newSession)
    setShowNewForm(false)
    setFormData({ date: today() })
  }

  const handleSelectExisting = (id: string) => {
    const found = sessions.find((s) => s.id === id)
    onSelectSession(found || null)
  }

  return (
    <div
      className="rounded-xl border p-5"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-h3 font-semibold" style={{ color: 'var(--text-primary)' }}>
          测试批次
        </h3>
        <button
          onClick={() => {
            setShowNewForm(!showNewForm)
            onSelectSession(null)
          }}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
          style={{
            backgroundColor: showNewForm ? 'var(--bg-hover)' : 'transparent',
            color: 'var(--accent-cyan)',
            border: '1px solid var(--accent-cyan)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--accent-cyan)'
            e.currentTarget.style.color = 'var(--bg-primary)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = showNewForm ? 'var(--bg-hover)' : 'transparent'
            e.currentTarget.style.color = 'var(--accent-cyan)'
          }}
        >
          {showNewForm ? <X size={14} /> : <Plus size={14} />}
          {showNewForm ? '取消' : '新建批次'}
        </button>
      </div>

      {/* Existing Session Selector */}
      {!showNewForm && (
        <div className="space-y-4">
          <div>
            <Label className="mb-2 block text-xs" style={{ color: 'var(--text-secondary)' }}>
              选择现有批次
            </Label>
            <select
              className="w-full rounded-md border px-3 py-2 text-sm outline-none transition-colors"
              style={{
                backgroundColor: 'var(--bg-tertiary)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-primary)',
              }}
              onChange={(e) => handleSelectExisting(e.target.value)}
              value={selectedSession?.id || ''}
            >
              <option value="" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                — 请选择测试批次 —
              </option>
              {sessions.map((s) => (
                <option key={s.id} value={s.id} style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  {s.name} ({s.date})
                </option>
              ))}
            </select>
          </div>

          {/* Session Metadata Display */}
          <AnimatePresence>
            {selectedSession && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
                className="overflow-hidden"
              >
                <div
                  className="rounded-lg p-4"
                  style={{ backgroundColor: 'var(--bg-tertiary)' }}
                >
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    <Calendar size={15} style={{ color: 'var(--accent-cyan)' }} />
                    {selectedSession.name}
                  </div>
                  <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
                    <span className="flex items-center gap-1">
                      <Calendar size={12} /> {selectedSession.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin size={12} /> {selectedSession.location || '—'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Thermometer size={12} /> {selectedSession.temperature != null ? `${selectedSession.temperature}°C` : '—'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Droplets size={12} /> {selectedSession.humidity != null ? `${selectedSession.humidity}%` : '—'}
                    </span>
                  </div>
                  {selectedSession.warmUpMethod && (
                    <div className="mt-1.5 flex items-center gap-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
                      <Activity size={12} /> {selectedSession.warmUpMethod}
                    </div>
                  )}
                  {selectedSession.notes && (
                    <div className="mt-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                      备注: {selectedSession.notes}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* New Session Form */}
      <AnimatePresence>
        {showNewForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
            className="overflow-hidden"
          >
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <Label className="mb-1.5 block text-xs" style={{ color: 'var(--text-secondary)' }}>
                    批次名称 *
                  </Label>
                  <Input
                    placeholder="例如：2024夏训期初测"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
                  />
                </div>
                <div>
                  <Label className="mb-1.5 block text-xs" style={{ color: 'var(--text-secondary)' }}>
                    测试日期 *
                  </Label>
                  <Input
                    type="date"
                    value={formData.date || today()}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
                  />
                </div>
                <div>
                  <Label className="mb-1.5 block text-xs" style={{ color: 'var(--text-secondary)' }}>
                    场地
                  </Label>
                  <Input
                    placeholder="例如：田径场B"
                    value={formData.location || ''}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="mb-1.5 block text-xs" style={{ color: 'var(--text-secondary)' }}>
                      温度 (°C)
                    </Label>
                    <Input
                      type="number"
                      placeholder="28"
                      value={formData.temperature || ''}
                      onChange={(e) => setFormData({ ...formData, temperature: Number(e.target.value) })}
                      style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
                    />
                  </div>
                  <div>
                    <Label className="mb-1.5 block text-xs" style={{ color: 'var(--text-secondary)' }}>
                      湿度 (%)
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      placeholder="65"
                      value={formData.humidity || ''}
                      onChange={(e) => setFormData({ ...formData, humidity: Number(e.target.value) })}
                      style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
                    />
                  </div>
                </div>
              </div>
              <div>
                <Label className="mb-1.5 block text-xs" style={{ color: 'var(--text-secondary)' }}>
                  热身方式
                </Label>
                <Input
                  placeholder="例如：动态拉伸15分钟 + 慢跑800米"
                  value={formData.warmUpMethod || ''}
                  onChange={(e) => setFormData({ ...formData, warmUpMethod: e.target.value })}
                  style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <Label className="mb-1.5 block text-xs" style={{ color: 'var(--text-secondary)' }}>
                  备注
                </Label>
                <Textarea
                  rows={3}
                  placeholder="补充信息..."
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setShowNewForm(false)
                    setFormData({ date: today() })
                  }}
                  className="rounded-lg border px-4 py-2 text-xs font-medium transition-colors"
                  style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
                >
                  取消
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!formData.name || !formData.date}
                  className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-medium transition-colors disabled:opacity-50"
                  style={{ backgroundColor: 'var(--accent-cyan)', color: 'var(--bg-primary)' }}
                >
                  <Check size={14} /> 创建批次
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
