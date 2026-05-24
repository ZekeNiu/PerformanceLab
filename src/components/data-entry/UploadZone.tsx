import { useState, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, CheckCircle, Loader2, Download } from 'lucide-react'
import { parseImportFile, type ParsedImportRow } from '@/lib/import-parser'

type UploadState = 'idle' | 'dragover' | 'uploading' | 'uploaded' | 'error'

interface UploadZoneProps {
  onFileParsed: (rows: ParsedRow[], filename: string) => void
}

export type ParsedRow = ParsedImportRow

export default function UploadZone({ onFileParsed }: UploadZoneProps) {
  const [uploadState, setUploadState] = useState<UploadState>('idle')
  const [fileName, setFileName] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const resetInput = useCallback(() => {
    if (inputRef.current) inputRef.current.value = ''
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setUploadState('dragover')
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setUploadState('idle')
  }, [])

  const processFile = useCallback(async (file: File) => {
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      setErrorMessage('仅支持 .xlsx、.xls、.csv 文件')
      setUploadState('error')
      resetInput()
      return
    }

    setFileName(file.name)
    setErrorMessage('')
    setUploadState('uploading')

    try {
      const rows = await parseImportFile(file)
      setUploadState('uploaded')
      onFileParsed(rows, file.name)
    } catch (error) {
      setUploadState('error')
      setErrorMessage(error instanceof Error ? error.message : '文件解析失败')
    } finally {
      resetInput()
    }
  }, [onFileParsed, resetInput])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setUploadState('idle')
    const file = e.dataTransfer.files[0]
    if (file) void processFile(file)
  }, [processFile])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) void processFile(file)
  }, [processFile])

  const borderColor = () => {
    switch (uploadState) {
      case 'dragover': return 'var(--accent-cyan)'
      case 'uploading': return 'var(--accent-blue)'
      case 'uploaded': return 'var(--accent-green)'
      case 'error': return 'var(--accent-red)'
      default: return 'var(--border-subtle)'
    }
  }

  const bgColor = () => {
    switch (uploadState) {
      case 'dragover': return 'rgba(0,212,170,0.05)'
      case 'uploading': return 'rgba(59,130,246,0.05)'
      case 'uploaded': return 'rgba(16,185,129,0.05)'
      case 'error': return 'rgba(239,68,68,0.05)'
      default: return 'var(--bg-secondary)'
    }
  }

  const borderStyle = () => {
    return uploadState === 'idle' || uploadState === 'dragover' ? 'dashed' : 'solid'
  }

  return (
    <div
      className="rounded-xl border-2 border-dashed p-8 text-center transition-all"
      style={{
        borderColor: borderColor(),
        backgroundColor: bgColor(),
        borderStyle: borderStyle(),
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => (uploadState === 'idle' || uploadState === 'error') && inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={handleFileInput}
      />

      <motion.div
        animate={
          uploadState === 'dragover'
            ? { scale: [1, 1.02, 1], transition: { repeat: Infinity, duration: 1 } }
            : { scale: 1 }
        }
      >
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center">
          {uploadState === 'uploading' && (
            <Loader2 size={48} className="animate-spin" style={{ color: 'var(--accent-blue)' }} />
          )}
          {uploadState === 'uploaded' && (
            <CheckCircle size={48} style={{ color: 'var(--accent-green)' }} />
          )}
          {uploadState === 'error' && (
            <AlertTriangle size={48} style={{ color: 'var(--accent-red)' }} />
          )}
          {(uploadState === 'idle' || uploadState === 'dragover') && (
            <img src={`${import.meta.env.BASE_URL}excel-import-illustration.svg`} alt="" className="h-16 w-16 opacity-80" />
          )}
        </div>

        <p className="mb-1 text-sm" style={{ color: 'var(--text-primary)' }}>
          {uploadState === 'uploading' && '正在解析文件...'}
          {uploadState === 'uploaded' && `已解析 ${fileName}`}
          {uploadState === 'error' && `解析失败：${errorMessage}`}
          {(uploadState === 'idle' || uploadState === 'dragover') && (
            <>
              拖拽 Excel/CSV 文件到此处，或{' '}
              <span
                className="cursor-pointer font-medium underline underline-offset-2"
                style={{ color: 'var(--accent-cyan)' }}
              >
                点击浏览
              </span>
            </>
          )}
        </p>

        <p className="mb-4 text-xs" style={{ color: 'var(--text-muted)' }}>
          支持格式: .xlsx, .xls, .csv &nbsp;|&nbsp; 必需列: 姓名、测试日期、测试动作、测试指标、重复1...
        </p>

        {!uploadState.includes('upload') && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              const headers = ['UUID', '姓名', '测试批次', '测试日期', '动作分类', '测试动作', '测试指标', '单位', '重复1', '重复2', '重复3', '重复4', '重复5', '重复6']
              const sample1 = ['ATH-2024-001', '张伟', '2024夏训期初测', '2024-06-15', '爆发力', 'CMJ', '跳跃高度', 'cm', '42.3', '43.1', '41.8', '', '', '']
              const sample2 = ['ATH-2024-002', '李娜', '2024夏训期初测', '2024-06-15', '爆发力', 'CMJ', '峰值力', 'N', '2200', '2250', '2180', '', '', '']
              const csv = [headers, sample1, sample2].map((row) => row.join(',')).join('\n')
              const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = '数据导入模板.csv'
              a.click()
              URL.revokeObjectURL(url)
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border px-4 py-2 text-xs font-medium transition-colors"
            style={{
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-secondary)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-hover)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            <Download size={14} />
            下载模板文件
          </button>
        )}
      </motion.div>
    </div>
  )
}
