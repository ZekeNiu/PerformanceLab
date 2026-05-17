import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Edit3,
  UserPlus,
  Link2,
  SkipForward,
  Trash2,
} from 'lucide-react'
import type { ParsedRow } from './UploadZone'
import type { ValidationStatus } from '@/data/mockData'
import { mockAthletes } from '@/data/mockData'
import { Input } from '@/components/ui/input'

interface ValidationItem {
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
  errorMessage?: string
  isResolved: boolean
  isEditing: boolean
}

interface ValidationStagingAreaProps {
  parsedRows: ParsedRow[]
  onCommit: (validRows: ParsedRow[]) => void
  onCancel: () => void
}

type FilterType = 'all' | 'error' | 'warning'

function StatusIcon({ status }: { status: ValidationStatus }) {
  if (status === 'ok') return <CheckCircle size={14} style={{ color: 'var(--accent-green)' }} />
  if (status === 'warning') return <AlertTriangle size={14} style={{ color: 'var(--accent-amber)' }} />
  return <XCircle size={14} style={{ color: 'var(--accent-red)' }} />
}

function StatusBadge({ status, text }: { status: ValidationStatus; text: string }) {
  const bgColor =
    status === 'ok'
      ? 'rgba(16,185,129,0.12)'
      : status === 'warning'
        ? 'rgba(245,158,11,0.12)'
        : 'rgba(239,68,68,0.12)'
  const textColor =
    status === 'ok'
      ? 'var(--accent-green)'
      : status === 'warning'
        ? 'var(--accent-amber)'
        : 'var(--accent-red)'

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
      style={{ backgroundColor: bgColor, color: textColor }}
    >
      <StatusIcon status={status} />
      {text}
    </span>
  )
}

export default function ValidationStagingArea({
  parsedRows,
  onCommit,
  onCancel,
}: ValidationStagingAreaProps) {
  const [filter, setFilter] = useState<FilterType>('all')
  const [items, setItems] = useState<ValidationItem[]>(() => {
    // Initial validation logic
    return parsedRows.map((row) => {
      let status: ValidationStatus = 'ok'
      let statusType = '正常'
      let errorMessage = ''
      let isResolved = true

      // Check 1: Unknown athlete
      const knownAthlete = mockAthletes.find(
        (a) => a.name === row.athleteName || a.uuid === row.athleteUUID
      )
      if (!knownAthlete) {
        status = 'error'
        statusType = '未知姓名'
        errorMessage = `运动员 "${row.athleteName}" 不在数据库中`
        isResolved = false
      }

      // Check 2: Too few repeats
      const filledRepeats = row.repeats.filter((r) => r != null && !isNaN(r))
      if (filledRepeats.length < 3) {
        status = filledRepeats.length === 0 ? 'error' : 'warning'
        statusType = filledRepeats.length === 0 ? '格式错误' : '数据不足'
        errorMessage = `仅 ${filledRepeats.length} 次有效数据，至少需要3次`
        if (filledRepeats.length === 0) isResolved = false
      }

      // Check 3: Outlier detection (mock: values > 100 for height in cm)
      if (
        row.indicator === '跳跃高度' &&
        filledRepeats.some((r) => r != null && r > 100)
      ) {
        status = 'warning'
        statusType = '异常极值'
        errorMessage = '跳跃高度超过100cm，请确认数据正确'
        isResolved = true // Warnings can be acknowledged
      }

      // Check 4: Null/invalid values
      if (filledRepeats.some((r) => r == null || isNaN(r))) {
        const validCount = filledRepeats.length
        if (validCount >= 3) {
          // Just nulls in extra columns, ok
        } else {
          status = validCount < 2 ? 'error' : 'warning'
          statusType = validCount < 2 ? '格式错误' : '数据不足'
          isResolved = validCount >= 2
        }
      }

      return {
        ...row,
        status,
        statusType,
        errorMessage,
        isResolved,
        isEditing: false,
      }
    })
  })

  const [confirmOpen, setConfirmOpen] = useState(false)

  const summary = useMemo(() => {
    const ok = items.filter((i) => i.status === 'ok').length
    const warning = items.filter((i) => i.status === 'warning' && !i.isResolved).length
    const resolvedWarning = items.filter((i) => i.status === 'warning' && i.isResolved).length
    const error = items.filter((i) => i.status === 'error' && !i.isResolved).length
    return { total: items.length, ok, warning, resolvedWarning, error }
  }, [items])

  const allErrorsResolved = summary.error === 0

  const filteredItems = useMemo(() => {
    if (filter === 'error') return items.filter((i) => i.status === 'error' && !i.isResolved)
    if (filter === 'warning') return items.filter((i) => i.status === 'warning')
    return items
  }, [items, filter])

  const resolveItem = (id: string) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, isResolved: true, status: 'ok' as ValidationStatus, statusType: '已确认' } : i))
    )
  }

  const deleteItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  const handleEdit = (id: string, field: string, value: string) => {
    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== id) return i
        const updated = { ...i, isEditing: false }
        if (field === 'athleteName') {
          updated.athleteName = value
          // Re-validate
          const known = mockAthletes.find((a) => a.name === value)
          if (known) {
            updated.athleteUUID = known.uuid
            updated.status = 'ok'
            updated.statusType = '正常'
            updated.errorMessage = ''
            updated.isResolved = true
          }
        }
        if (field === 'repeats') {
          updated.repeats = value.split(',').map((v) => {
            const n = parseFloat(v.trim())
            return isNaN(n) ? null : n
          })
        }
        return updated
      })
    )
  }

  const handleCommit = () => {
    const validRows = items
      .filter((i) => i.isResolved || i.status === 'ok')
      .map((i) => ({
        id: i.id,
        rowNum: i.rowNum,
        athleteName: i.athleteName,
        athleteUUID: i.athleteUUID,
        date: i.date,
        action: i.action,
        indicator: i.indicator,
        repeats: i.repeats,
      }))
    onCommit(validRows)
    setConfirmOpen(false)
  }

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div
        className="rounded-xl border p-4"
        style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-subtle)' }}
      >
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} style={{ color: 'var(--accent-amber)' }} />
            <h3 className="text-h3 font-semibold" style={{ color: 'var(--text-primary)' }}>
              暂存校验区
            </h3>
          </div>
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            发现 {summary.warning + summary.error} 个问题
          </span>
        </div>
        <p className="mb-3 text-xs" style={{ color: 'var(--text-muted)' }}>
          请核对以下高亮数据，确认无误后方可入库。
        </p>
        <div className="flex flex-wrap gap-3">
          <span className="text-xs" style={{ color: 'var(--text-primary)' }}>
            总行数: <strong>{summary.total}</strong>
          </span>
          <span className="text-xs" style={{ color: 'var(--accent-green)' }}>
            ✓ 正常: <strong>{summary.ok + summary.resolvedWarning}</strong>
          </span>
          <span className="text-xs" style={{ color: 'var(--accent-amber)' }}>
            ⚠️ 警告: <strong>{summary.warning}</strong>
          </span>
          <span className="text-xs" style={{ color: 'var(--accent-red)' }}>
            ✗ 异常: <strong>{summary.error}</strong>
          </span>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex items-center gap-2">
        {(['all', 'error', 'warning'] as FilterType[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
            style={{
              backgroundColor: filter === f ? 'var(--bg-tertiary)' : 'transparent',
              color: filter === f ? 'var(--text-primary)' : 'var(--text-muted)',
              border: `1px solid ${filter === f ? 'var(--border-active)' : 'var(--border-subtle)'}`,
            }}
          >
            {f === 'all' ? '显示全部' : f === 'error' ? '仅显示异常' : '仅显示警告'}
          </button>
        ))}
      </div>

      {/* Validation Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr style={{ backgroundColor: 'var(--bg-tertiary)' }}>
              <th className="px-3 py-2 text-left font-medium" style={{ color: 'var(--text-secondary)' }}>行</th>
              <th className="px-3 py-2 text-left font-medium" style={{ color: 'var(--text-secondary)' }}>姓名</th>
              <th className="px-3 py-2 text-left font-medium" style={{ color: 'var(--text-secondary)' }}>日期</th>
              <th className="px-3 py-2 text-left font-medium" style={{ color: 'var(--text-secondary)' }}>动作</th>
              <th className="px-3 py-2 text-left font-medium" style={{ color: 'var(--text-secondary)' }}>指标</th>
              <th className="px-3 py-2 text-left font-medium" style={{ color: 'var(--text-secondary)' }}>重复1</th>
              <th className="px-3 py-2 text-left font-medium" style={{ color: 'var(--text-secondary)' }}>重复2</th>
              <th className="px-3 py-2 text-left font-medium" style={{ color: 'var(--text-secondary)' }}>重复3</th>
              <th className="px-3 py-2 text-left font-medium" style={{ color: 'var(--text-secondary)' }}>状态</th>
              <th className="px-3 py-2 text-left font-medium" style={{ color: 'var(--text-secondary)' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((item, idx) => {
              const rowBg =
                item.status === 'error' && !item.isResolved
                  ? 'rgba(239,68,68,0.06)'
                  : item.status === 'warning'
                    ? 'rgba(245,158,11,0.04)'
                    : idx % 2 === 0
                      ? 'transparent'
                      : 'rgba(255,255,255,0.02)'
              const leftBorder =
                item.status === 'error' && !item.isResolved
                  ? '3px solid var(--accent-red)'
                  : item.status === 'warning'
                    ? '3px solid var(--accent-amber)'
                    : '3px solid transparent'

              return (
                <motion.tr
                  key={item.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  style={{
                    backgroundColor: rowBg,
                    borderLeft: leftBorder,
                  }}
                  className="transition-colors hover:opacity-80"
                >
                  <td className="px-3 py-2 font-mono" style={{ color: 'var(--text-muted)' }}>
                    {item.rowNum}
                  </td>
                  <td className="px-3 py-2">
                    {item.isEditing ? (
                      <Input
                        defaultValue={item.athleteName}
                        className="h-7 w-24 text-xs"
                        onBlur={(e) => handleEdit(item.id, 'athleteName', e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleEdit(item.id, 'athleteName', e.currentTarget.value)
                        }}
                        autoFocus
                        style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
                      />
                    ) : (
                      <span style={{ color: 'var(--text-primary)' }}>{item.athleteName}</span>
                    )}
                    {item.athleteUUID && (
                      <div className="font-mono text-[10px]" style={{ color: 'var(--text-muted)' }}>
                        {item.athleteUUID}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2" style={{ color: 'var(--text-secondary)' }}>{item.date}</td>
                  <td className="px-3 py-2" style={{ color: 'var(--text-secondary)' }}>{item.action}</td>
                  <td className="px-3 py-2" style={{ color: 'var(--text-secondary)' }}>{item.indicator}</td>
                  <td className="px-3 py-2 font-mono" style={{ color: item.repeats[0] == null ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                    {item.repeats[0] ?? '—'}
                  </td>
                  <td className="px-3 py-2 font-mono" style={{ color: item.repeats[1] == null ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                    {item.repeats[1] ?? '—'}
                  </td>
                  <td className="px-3 py-2 font-mono" style={{ color: item.repeats[2] == null ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                    {item.repeats[2] ?? '—'}
                  </td>
                  <td className="px-3 py-2">
                    <StatusBadge status={item.status} text={item.statusType} />
                    {item.errorMessage && (
                      <div className="mt-1 max-w-[160px] truncate text-[10px]" style={{ color: 'var(--text-muted)' }} title={item.errorMessage}>
                        {item.errorMessage}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1">
                      {/* For unknown name errors */}
                      {item.status === 'error' && item.statusType === '未知姓名' && !item.isResolved && (
                        <div className="group relative">
                          <button
                            className="rounded p-1 transition-colors"
                            style={{ color: 'var(--accent-amber)' }}
                            title="处理"
                          >
                            <UserPlus size={13} />
                          </button>
                          {/* Dropdown */}
                          <div
                            className="absolute right-0 z-10 hidden min-w-[140px] rounded-lg border py-1 group-hover:block"
                            style={{
                              backgroundColor: 'var(--bg-tertiary)',
                              borderColor: 'var(--border-subtle)',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                            }}
                          >
                            <button
                              onClick={() => resolveItem(item.id)}
                              className="flex w-full items-center gap-1.5 px-3 py-1.5 text-left text-[11px] transition-colors hover:opacity-80"
                              style={{ color: 'var(--text-primary)' }}
                            >
                              <UserPlus size={11} /> 添加为新运动员
                            </button>
                            <button
                              onClick={() => resolveItem(item.id)}
                              className="flex w-full items-center gap-1.5 px-3 py-1.5 text-left text-[11px] transition-colors hover:opacity-80"
                              style={{ color: 'var(--text-primary)' }}
                            >
                              <Link2 size={11} /> 关联现有运动员
                            </button>
                            <button
                              onClick={() => deleteItem(item.id)}
                              className="flex w-full items-center gap-1.5 px-3 py-1.5 text-left text-[11px] transition-colors hover:opacity-80"
                              style={{ color: 'var(--accent-red)' }}
                            >
                              <SkipForward size={11} /> 跳过此行
                            </button>
                          </div>
                        </div>
                      )}

                      {/* For warnings - acknowledge */}
                      {item.status === 'warning' && !item.isResolved && (
                        <button
                          onClick={() => resolveItem(item.id)}
                          className="rounded p-1 text-[10px] transition-colors"
                          style={{ color: 'var(--accent-amber)', border: '1px solid var(--accent-amber)' }}
                          title="确认数据正确"
                        >
                          确认
                        </button>
                      )}

                      {/* Edit button */}
                      <button
                        onClick={() =>
                          setItems((prev) =>
                            prev.map((i) => (i.id === item.id ? { ...i, isEditing: !i.isEditing } : i))
                          )
                        }
                        className="rounded p-1 transition-colors"
                        style={{ color: 'var(--text-secondary)' }}
                        title="编辑"
                      >
                        <Edit3 size={13} />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="rounded p-1 transition-colors"
                        style={{ color: 'var(--text-muted)' }}
                        title="删除"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Action Bar */}
      <div
        className="rounded-xl border p-4"
        style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-subtle)' }}
      >
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-3 text-xs">
            <span style={{ color: 'var(--text-secondary)' }}>
              <CheckCircle size={12} className="mr-1 inline" style={{ color: 'var(--accent-green)' }} />
              {summary.ok + summary.resolvedWarning} 正常
            </span>
            <span style={{ color: 'var(--text-secondary)' }}>
              <AlertTriangle size={12} className="mr-1 inline" style={{ color: 'var(--accent-amber)' }} />
              {summary.warning} 需确认
            </span>
            <span style={{ color: 'var(--text-secondary)' }}>
              <XCircle size={12} className="mr-1 inline" style={{ color: 'var(--accent-red)' }} />
              {summary.error} 必须修复
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onCancel}
              className="rounded-lg border px-4 py-2 text-xs font-medium transition-colors"
              style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--bg-hover)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              取消导入
            </button>
            <button
              disabled={!allErrorsResolved}
              onClick={() => setConfirmOpen(true)}
              className="rounded-lg px-4 py-2 text-xs font-medium transition-all disabled:opacity-40"
              style={{
                backgroundColor: allErrorsResolved ? 'var(--accent-cyan)' : 'var(--bg-tertiary)',
                color: allErrorsResolved ? 'var(--bg-primary)' : 'var(--text-muted)',
                boxShadow: allErrorsResolved ? '0 0 12px rgba(0,212,170,0.3)' : 'none',
              }}
            >
              确认入库
            </button>
          </div>
        </div>

        {!allErrorsResolved && (
          <p className="text-center text-xs" style={{ color: 'var(--accent-red)' }}>
            还有 {summary.error} 个错误未修复，无法入库。请先处理所有错误。
          </p>
        )}
      </div>

      {/* Confirmation Modal */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="mx-4 w-full max-w-md rounded-xl border p-6"
            style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-subtle)' }}
          >
            <h4 className="mb-2 text-h3 font-semibold" style={{ color: 'var(--text-primary)' }}>
              确认导入
            </h4>
            <p className="mb-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
              确认将 {items.filter((i) => i.isResolved || i.status === 'ok').length} 条数据导入系统？此操作不可撤销。
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmOpen(false)}
                className="rounded-lg border px-4 py-2 text-xs font-medium transition-colors"
                style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
              >
                取消
              </button>
              <button
                onClick={handleCommit}
                className="rounded-lg px-4 py-2 text-xs font-medium transition-colors"
                style={{ backgroundColor: 'var(--accent-cyan)', color: 'var(--bg-primary)' }}
              >
                确认导入
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
