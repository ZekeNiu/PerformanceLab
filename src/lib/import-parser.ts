import type { WorkBook } from 'xlsx'
import { resolveMetricDefinition } from './metric-registry'

export interface ParsedImportRow {
  id: string
  rowNum: number
  athleteName: string
  athleteUUID?: string
  date: string
  action: string
  indicator: string
  metricId?: string
  unit?: string
  repeats: (number | null)[]
}

const FIELD_HEADERS = {
  athleteUUID: ['uuid', 'athlete uuid', 'athleteuuid', '运动员编号', '编号', '球员编号'],
  athleteName: ['姓名', '运动员', '运动员姓名', '球员', '球员姓名', 'athlete', 'athlete name', 'name'],
  date: ['日期', '测试日期', 'date', 'test date'],
  action: ['动作', '测试动作', '动作分类', '测试项目', 'action', 'test action', 'test'],
  indicator: ['指标', '测试指标', 'metric', 'indicator', 'measurement'],
  unit: ['单位', 'unit'],
}

const REPEAT_HEADER_PATTERN = /^(重复|测试值|数值|成绩|trial|repeat|value)\s*\d*$/i

function normalizeHeader(value: unknown) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[()（）_-]/g, '')
}

function findHeaderIndex(headers: unknown[], aliases: string[]) {
  const normalizedAliases = aliases.map(normalizeHeader)
  return headers.findIndex((header) => normalizedAliases.includes(normalizeHeader(header)))
}

function cellToString(value: unknown) {
  return String(value ?? '').trim()
}

function parseNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const normalized = String(value).replace(/,/g, '').trim()
  if (!normalized) return null
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

type XlsxModule = typeof import('xlsx')

function toRows(XLSX: XlsxModule, workbook: WorkBook): unknown[][] {
  const sheetName = workbook.SheetNames[0]
  if (!sheetName) return []
  const sheet = workbook.Sheets[sheetName]
  return XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    blankrows: false,
    raw: false,
    defval: '',
  })
}

async function readWorkbook(file: File): Promise<{ XLSX: XlsxModule; workbook: WorkBook }> {
  const buffer = await file.arrayBuffer()
  const XLSX = await import('xlsx')
  const workbook = XLSX.read(buffer, {
    type: 'array',
    cellDates: true,
  })
  return { XLSX, workbook }
}

export async function parseImportFile(file: File): Promise<ParsedImportRow[]> {
  const { XLSX, workbook } = await readWorkbook(file)
  const rows = toRows(XLSX, workbook)
  if (rows.length < 2) {
    throw new Error('文件中没有可导入的数据行')
  }

  const headers = rows[0]
  const athleteNameIndex = findHeaderIndex(headers, FIELD_HEADERS.athleteName)
  const dateIndex = findHeaderIndex(headers, FIELD_HEADERS.date)
  const actionIndex = findHeaderIndex(headers, FIELD_HEADERS.action)
  const indicatorIndex = findHeaderIndex(headers, FIELD_HEADERS.indicator)

  if (athleteNameIndex < 0 || dateIndex < 0 || actionIndex < 0 || indicatorIndex < 0) {
    throw new Error('缺少必要列：姓名、测试日期、测试动作、测试指标')
  }

  const uuidIndex = findHeaderIndex(headers, FIELD_HEADERS.athleteUUID)
  const unitIndex = findHeaderIndex(headers, FIELD_HEADERS.unit)
  const usedIndexes = new Set([athleteNameIndex, dateIndex, actionIndex, indicatorIndex, uuidIndex, unitIndex])
  const repeatIndexes = headers
    .map((header, index) => ({ header, index }))
    .filter(({ header, index }) => !usedIndexes.has(index) && REPEAT_HEADER_PATTERN.test(cellToString(header)))
    .map(({ index }) => index)

  if (repeatIndexes.length === 0) {
    throw new Error('缺少重复测试值列，例如：重复1、重复2、重复3')
  }

  return rows
    .slice(1)
    .map((row, rowIndex) => {
      const rawIndicator = cellToString(row[indicatorIndex])
      const metric = resolveMetricDefinition(rawIndicator)
      return {
        id: `row-${Date.now()}-${rowIndex + 1}`,
        rowNum: rowIndex + 2,
        athleteName: cellToString(row[athleteNameIndex]),
        athleteUUID: uuidIndex >= 0 ? cellToString(row[uuidIndex]) || undefined : undefined,
        date: cellToString(row[dateIndex]),
        action: cellToString(row[actionIndex]),
        indicator: metric?.name ?? rawIndicator,
        metricId: metric?.id,
        unit: unitIndex >= 0 ? cellToString(row[unitIndex]) || metric?.unit : metric?.unit,
        repeats: repeatIndexes.map((index) => parseNumber(row[index])),
      }
    })
    .filter((row) => row.athleteName || row.athleteUUID || row.date || row.action || row.indicator || row.repeats.some((value) => value !== null))
}
