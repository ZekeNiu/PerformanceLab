import { useRef } from 'react'
import type { ChangeEvent } from 'react'
import { AlertTriangle, Download, FilePlus2, FolderOpen, HardDrive, Save, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { useWorkspaceStore } from '@/lib/workspace-store'

function formatSavedAt(value: string | null) {
  if (!value) return null
  return new Date(value).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

export default function WorkspaceFileBar() {
  const importInputRef = useRef<HTMLInputElement | null>(null)
  const {
    status,
    isSupported,
    isDirty,
    fileName,
    lastSavedAt,
    errorMessage,
    createWorkspaceFile,
    openWorkspaceFile,
    saveWorkspaceFile,
    saveWorkspaceAs,
    exportBackup,
    importWorkspaceFromFile,
  } = useWorkspaceStore()

  const isSaving = status === 'saving'
  const savedAt = formatSavedAt(lastSavedAt)
  const statusLabel = (() => {
    if (!isSupported) return '当前浏览器不支持直接写入本地文件，请使用导入/导出 JSON。'
    if (status === 'saving') return '正在保存到本地 JSON 文件...'
    if (status === 'connected') return `${fileName ?? '本地数据文件'}${isDirty ? ' 有未保存更改' : ' 已连接'}`
    if (status === 'error') return errorMessage ?? '本地文件写入失败，请重新授权或另存为。'
    return '尚未连接本地数据文件。核心数据只会留在当前页面内存中，建议先创建或打开 JSON。'
  })()

  const runAction = async (action: () => Promise<void>, successMessage: string) => {
    try {
      await action()
      toast.success(successMessage)
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      toast.error('本地数据文件操作失败', {
        description: error instanceof Error ? error.message : '请重试或导出备份。',
      })
    }
  }

  const handleImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    await runAction(async () => importWorkspaceFromFile(file), '已导入 JSON 工作区')
  }

  return (
    <div
      className="flex min-h-12 flex-wrap items-center justify-between gap-3 border-b px-4 py-2 md:px-6"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      <div className="flex min-w-0 items-center gap-2">
        {status === 'error' || !isSupported ? (
          <AlertTriangle size={16} strokeWidth={1.8} style={{ color: 'var(--accent-amber)' }} />
        ) : (
          <HardDrive size={16} strokeWidth={1.8} style={{ color: 'var(--accent-cyan)' }} />
        )}
        <div className="min-w-0">
          <div className="truncate text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
            本地数据文件
          </div>
          <div className="truncate text-[11px]" style={{ color: status === 'error' ? 'var(--accent-amber)' : 'var(--text-secondary)' }}>
            {statusLabel}
            {savedAt ? ` · 上次保存 ${savedAt}` : ''}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => runAction(createWorkspaceFile, '已创建本地 JSON 工作区')}
          disabled={isSaving}
          className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[11px] font-medium transition-colors disabled:opacity-50"
          style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
        >
          <FilePlus2 size={14} />
          创建数据文件
        </button>
        <button
          type="button"
          onClick={() => runAction(openWorkspaceFile, '已打开本地 JSON 工作区')}
          disabled={isSaving || !isSupported}
          className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[11px] font-medium transition-colors disabled:opacity-50"
          style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
        >
          <FolderOpen size={14} />
          打开数据文件
        </button>
        <button
          type="button"
          onClick={() => runAction(saveWorkspaceFile, '已保存到本地 JSON 工作区')}
          disabled={isSaving}
          className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-semibold transition-opacity disabled:opacity-50"
          style={{ backgroundColor: 'var(--accent-cyan)', color: 'var(--bg-primary)' }}
        >
          <Save size={14} />
          保存
        </button>
        <button
          type="button"
          onClick={() => runAction(saveWorkspaceAs, '已另存为 JSON 工作区')}
          disabled={isSaving}
          className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[11px] font-medium transition-colors disabled:opacity-50"
          style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
        >
          <Download size={14} />
          另存为
        </button>
        <button
          type="button"
          onClick={exportBackup}
          className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[11px] font-medium transition-colors"
          style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
        >
          <Download size={14} />
          导出备份
        </button>
        <button
          type="button"
          onClick={() => importInputRef.current?.click()}
          disabled={isSaving}
          className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[11px] font-medium transition-colors disabled:opacity-50"
          style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
        >
          <Upload size={14} />
          导入 JSON
        </button>
        <input
          ref={importInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={handleImportFile}
        />
      </div>
    </div>
  )
}
