import { useState, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, Loader2, Download } from 'lucide-react'

type UploadState = 'idle' | 'dragover' | 'uploading' | 'uploaded'

interface UploadZoneProps {
  onFileParsed: (rows: ParsedRow[]) => void
}

export interface ParsedRow {
  id: string
  rowNum: number
  athleteName: string
  athleteUUID?: string
  date: string
  action: string
  indicator: string
  repeats: (number | null)[]
}

export default function UploadZone({ onFileParsed }: UploadZoneProps) {
  const [uploadState, setUploadState] = useState<UploadState>('idle')
  const [fileName, setFileName] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setUploadState('dragover')
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setUploadState('idle')
  }, [])

  const generateMockParsedRows = (_fname: string): ParsedRow[] => {
    // Generate mock rows that include various validation issues
    return [
      { id: `row-${Date.now()}-1`, rowNum: 2, athleteName: '张伟', athleteUUID: 'ATH-2024-001', date: '2024-06-15', action: 'CMJ', indicator: '跳跃高度', repeats: [42.3, 43.1, 41.8] },
      { id: `row-${Date.now()}-2`, rowNum: 3, athleteName: '李娜', athleteUUID: 'ATH-2024-002', date: '2024-06-15', action: 'CMJ', indicator: '跳跃高度', repeats: [38.5, 39.2, 38.9] },
      { id: `row-${Date.now()}-3`, rowNum: 4, athleteName: '王强', athleteUUID: 'ATH-2024-003', date: '2024-06-15', action: 'CMJ', indicator: '峰值力', repeats: [142.3, 143.1, 141.8] },
      { id: `row-${Date.now()}-4`, rowNum: 5, athleteName: '陈明', athleteUUID: 'ATH-2024-004', date: '2024-06-15', action: 'CMJ', indicator: '跳跃高度', repeats: [45.1, 44.8, null] },
      { id: `row-${Date.now()}-5`, rowNum: 6, athleteName: '赵未知', date: '2024-06-15', action: 'CMJ', indicator: '跳跃高度', repeats: [40.1, 41.2, 39.8] },
      { id: `row-${Date.now()}-6`, rowNum: 7, athleteName: '刘芳', athleteUUID: 'ATH-2024-005', date: '2024-06-15', action: 'CMJ', indicator: '腾空时间', repeats: [null, 0.52, 0.51] },
      { id: `row-${Date.now()}-7`, rowNum: 8, athleteName: '周杰', athleteUUID: 'ATH-2024-008', date: '2024-06-15', action: 'CMJ', indicator: '跳跃高度', repeats: [35.2, 36.1, 34.9] },
      { id: `row-${Date.now()}-8`, rowNum: 9, athleteName: '孙丽', athleteUUID: 'ATH-2024-007', date: '2024-06-15', action: 'SJ', indicator: '跳跃高度', repeats: [32.5, 33.0, 31.8] },
      { id: `row-${Date.now()}-9`, rowNum: 10, athleteName: '赵雷', athleteUUID: 'ATH-2024-006', date: '2024-06-15', action: 'CMJ', indicator: '离心利用率', repeats: [65.2, 66.1, 64.8] },
      { id: `row-${Date.now()}-10`, rowNum: 11, athleteName: '张伟', athleteUUID: 'ATH-2024-001', date: '2024-06-15', action: 'CMJ', indicator: '峰值力', repeats: [2200, 2250, 2180] },
    ]
  }

  const processFile = (file: File) => {
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) return
    setFileName(file.name)
    setUploadState('uploading')

    // Simulate parsing delay
    setTimeout(() => {
      setUploadState('uploaded')
      const rows = generateMockParsedRows(file.name)
      onFileParsed(rows)
    }, 1500)
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setUploadState('idle')
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }, [])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  const borderColor = () => {
    switch (uploadState) {
      case 'dragover': return 'var(--accent-cyan)'
      case 'uploading': return 'var(--accent-blue)'
      case 'uploaded': return 'var(--accent-green)'
      default: return 'var(--border-subtle)'
    }
  }

  const bgColor = () => {
    switch (uploadState) {
      case 'dragover': return 'rgba(0,212,170,0.05)'
      case 'uploading': return 'rgba(59,130,246,0.05)'
      case 'uploaded': return 'rgba(16,185,129,0.05)'
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
      onClick={() => uploadState === 'idle' && inputRef.current?.click()}
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
        {/* Icon */}
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center">
          {uploadState === 'uploading' && (
            <Loader2 size={48} className="animate-spin" style={{ color: 'var(--accent-blue)' }} />
          )}
          {uploadState === 'uploaded' && (
            <CheckCircle size={48} style={{ color: 'var(--accent-green)' }} />
          )}
          {(uploadState === 'idle' || uploadState === 'dragover') && (
            <img src={`${import.meta.env.BASE_URL}excel-import-illustration.svg`} alt="" className="h-16 w-16 opacity-80" />
          )}
        </div>

        {/* Text */}
        <p className="mb-1 text-sm" style={{ color: 'var(--text-primary)' }}>
          {uploadState === 'uploading' && '正在解析文件...'}
          {uploadState === 'uploaded' && `✓ ${fileName}`}
          {(uploadState === 'idle' || uploadState === 'dragover') && (
            <>
              拖拽 Excel 文件到此处，或
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
          支持格式: .xlsx, .xls, .csv &nbsp;|&nbsp; 文件大小限制: 10MB
        </p>

        {/* Download Template Button */}
        {!uploadState.includes('upload') && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              // Generate a simple CSV template
              const headers = ['UUID', '姓名', '测试批次', '测试日期', '动作分类', '测试动作', '测试指标', '单位', '重复1', '重复2', '重复3', '重复4', '重复5', '重复6']
              const sample1 = ['ATH-2024-001', '张伟', '2024夏训期初测', '2024-06-15', '爆发力', '下蹲跳CMJ', '跳跃高度', 'cm', '42.3', '43.1', '41.8', '', '', '']
              const sample2 = ['ATH-2024-002', '李娜', '2024夏训期初测', '2024-06-15', '爆发力', '下蹲跳CMJ', '峰值力', 'N', '2200', '2250', '2180', '', '', '']
              const csv = [headers, sample1, sample2].map((r) => r.join(',')).join('\n')
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
