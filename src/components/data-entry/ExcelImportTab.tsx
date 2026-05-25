import { useState, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { toast } from 'sonner'
import UploadZone, { type ParsedRow } from './UploadZone'
import ValidationStagingArea from './ValidationStagingArea'
import ImportHistory from './ImportHistory'
import type { ImportHistoryEntry } from '@/data/mockData'
import type { ImportBatch, Measurement } from '@/lib/domain-model'

interface ExcelImportTabProps {
  onMeasurementsCommitted?: (measurements: Measurement[], importBatch?: ImportBatch) => void | Promise<void>
}

export default function ExcelImportTab({ onMeasurementsCommitted }: ExcelImportTabProps) {
  const [parsedRows, setParsedRows] = useState<ParsedRow[] | null>(null)
  const [importHistory, setImportHistory] = useState<ImportHistoryEntry[]>([])
  const [currentFilename, setCurrentFilename] = useState('imported_data.xlsx')

  const handleFileParsed = useCallback((rows: ParsedRow[], filename: string) => {
    setParsedRows(rows)
    setCurrentFilename(filename)
    toast.info(`已解析 ${rows.length} 行数据，请进行校验`, {
      description: '请在暂存校验区核对数据。',
    })
  }, [])

  const handleCommit = useCallback(async (validRows: ParsedRow[], measurements: Measurement[]) => {
    const importedAt = new Date()
    const newEntry: ImportHistoryEntry = {
      id: `ih-${Date.now()}`,
      time: importedAt.toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
      filename: currentFilename,
      totalRows: validRows.length,
      successCount: validRows.length,
      failCount: 0,
      operator: '管理员',
      status: 'success',
    }
    const importBatch: ImportBatch = {
      id: newEntry.id,
      filename: newEntry.filename,
      importedAt: importedAt.toISOString(),
      totalRows: newEntry.totalRows,
      acceptedRows: newEntry.successCount,
      rejectedRows: newEntry.failCount,
      measurementIds: measurements.map((measurement) => measurement.id),
      operator: newEntry.operator,
    }

    await onMeasurementsCommitted?.(measurements, importBatch)
    setParsedRows(null)
    setImportHistory((prev) => [newEntry, ...prev])
    toast.success('数据导入成功', {
      description: `已生成 ${measurements.length} 条测量记录。`,
    })
  }, [currentFilename, onMeasurementsCommitted])

  const handleCancel = useCallback(() => {
    setParsedRows(null)
    toast.info('已取消导入')
  }, [])

  return (
    <div className="space-y-5">
      <UploadZone onFileParsed={handleFileParsed} />

      <AnimatePresence>
        {parsedRows && parsedRows.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
          >
            <ValidationStagingArea
              key={`${currentFilename}-${parsedRows[0]?.id ?? 'empty'}-${parsedRows.length}`}
              parsedRows={parsedRows}
              onCommit={handleCommit}
              onCancel={handleCancel}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <ImportHistory newEntries={importHistory} />
    </div>
  )
}
