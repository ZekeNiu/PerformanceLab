import { Fragment, useMemo, useState } from 'react'
import { ChevronDown, ChevronUp, CheckCircle, XCircle, Trash2 } from 'lucide-react'
import type { ImportHistoryEntry } from '@/data/mockData'
import type { ImportBatch } from '@/lib/domain-model'
import { useWorkspaceStore } from '@/lib/workspace-store'

function formatImportedAt(importedAt: string) {
  const date = new Date(importedAt)
  if (Number.isNaN(date.getTime())) return importedAt

  return date.toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-')
}

function mapBatchToHistoryEntry(batch: ImportBatch): ImportHistoryEntry {
  const failCount = batch.rejectedRows

  return {
    id: batch.id,
    time: formatImportedAt(batch.importedAt),
    filename: batch.filename,
    totalRows: batch.totalRows,
    successCount: batch.acceptedRows,
    failCount,
    operator: batch.operator ?? '管理员',
    status: failCount === 0 ? 'success' : batch.acceptedRows > 0 ? 'partial' : 'failed',
  }
}

export default function ImportHistory() {
  const { workspace, updateWorkspace } = useWorkspaceStore()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const entries = useMemo(
    () =>
      [...workspace.importBatches]
        .sort((a, b) => new Date(b.importedAt).getTime() - new Date(a.importedAt).getTime())
        .map(mapBatchToHistoryEntry),
    [workspace.importBatches],
  )

  const handleClear = async () => {
    if (window.confirm('确定要清除所有导入记录吗？')) {
      try {
        await updateWorkspace((current) => ({
          ...current,
          importBatches: [],
        }))
        setExpandedId(null)
      } catch (error) {
        window.alert(error instanceof Error ? error.message : '清除导入历史失败，请重试。')
      }
    }
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
          导入历史
        </h3>
        {entries.length > 0 && (
          <button
            onClick={handleClear}
            className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs transition-colors"
            style={{ color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--accent-red)'
              e.currentTarget.style.borderColor = 'var(--accent-red)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-muted)'
              e.currentTarget.style.borderColor = 'var(--border-subtle)'
            }}
          >
            <Trash2 size={12} /> 清除记录
          </button>
        )}
      </div>

      {entries.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            暂无导入记录
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                <th className="px-3 py-2 text-left font-medium" style={{ color: 'var(--text-secondary)' }}>时间</th>
                <th className="px-3 py-2 text-left font-medium" style={{ color: 'var(--text-secondary)' }}>文件名</th>
                <th className="px-3 py-2 text-right font-medium" style={{ color: 'var(--text-secondary)' }}>行数</th>
                <th className="px-3 py-2 text-right font-medium" style={{ color: 'var(--text-secondary)' }}>成功</th>
                <th className="px-3 py-2 text-right font-medium" style={{ color: 'var(--text-secondary)' }}>失败</th>
                <th className="px-3 py-2 text-left font-medium" style={{ color: 'var(--text-secondary)' }}>操作者</th>
                <th className="px-3 py-2 text-center font-medium" style={{ color: 'var(--text-secondary)' }}>状态</th>
                <th className="px-3 py-2 text-center font-medium" style={{ color: 'var(--text-secondary)' }}></th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, idx) => (
                <Fragment key={entry.id}>
                  <tr
                    className="cursor-pointer transition-colors hover:opacity-80"
                    style={{
                      backgroundColor: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
                      borderBottom: expandedId === entry.id ? 'none' : '1px solid var(--border-subtle)',
                    }}
                    onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                  >
                    <td className="px-3 py-2" style={{ color: 'var(--text-primary)' }}>{entry.time}</td>
                    <td className="px-3 py-2" style={{ color: 'var(--text-primary)' }}>{entry.filename}</td>
                    <td className="px-3 py-2 text-right font-mono" style={{ color: 'var(--text-secondary)' }}>{entry.totalRows}</td>
                    <td className="px-3 py-2 text-right font-mono" style={{ color: 'var(--accent-green)' }}>{entry.successCount}</td>
                    <td className="px-3 py-2 text-right font-mono" style={{ color: entry.failCount > 0 ? 'var(--accent-red)' : 'var(--text-secondary)' }}>
                      {entry.failCount}
                    </td>
                    <td className="px-3 py-2" style={{ color: 'var(--text-secondary)' }}>{entry.operator}</td>
                    <td className="px-3 py-2 text-center">
                      {entry.failCount === 0 ? (
                        <CheckCircle size={14} className="mx-auto" style={{ color: 'var(--accent-green)' }} />
                      ) : (
                        <XCircle size={14} className="mx-auto" style={{ color: 'var(--accent-red)' }} />
                      )}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {expandedId === entry.id ? (
                        <ChevronUp size={14} style={{ color: 'var(--text-muted)' }} />
                      ) : (
                        <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
                      )}
                    </td>
                  </tr>
                  {/* Expanded detail for failed rows */}
                  {expandedId === entry.id && entry.failCount > 0 && (
                    <tr style={{ backgroundColor: 'rgba(239,68,68,0.03)' }}>
                      <td colSpan={8} className="px-3 py-2">
                        <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                          <p className="mb-1 font-medium" style={{ color: 'var(--text-secondary)' }}>失败详情:</p>
                          <ul className="list-disc space-y-0.5 pl-4">
                            <li>{entry.failCount} 行未写入 workspace。</li>
                            <li>当前历史记录只保存批次级摘要，行级错误详情仍保留在本次导入校验流程中。</li>
                          </ul>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
