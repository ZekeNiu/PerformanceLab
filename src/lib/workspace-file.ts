import { dataEntryActionCategories } from './data-entry-config'
import type {
  Athlete,
  DerivedMetricDefinition,
  DisplayPreset,
  ImportBatch,
  Measurement,
  MetricDefinition,
  SessionBatteryAssignment,
  Team,
  TestAction,
  TestBattery,
  TestSession,
} from './domain-model'
import { METRIC_DEFINITIONS } from './metric-registry'
import { mockMeasurementStore } from './measurement-store'

export const WORKSPACE_SCHEMA_VERSION = 1
export const DEFAULT_WORKSPACE_FILENAME = 'performancelab.workspace.json'

export interface TestActionCategory {
  id: string
  name: string
}

export interface WorkspaceSettings {
  thresholds?: Record<string, unknown>
  notificationRules?: Record<string, unknown>
  chartPreferences?: Record<string, unknown>
  [key: string]: unknown
}

export interface PerformanceLabWorkspace {
  schemaVersion: number
  updatedAt: string
  teams: Team[]
  athletes: Athlete[]
  testSessions: TestSession[]
  testBatteries: TestBattery[]
  sessionBatteryAssignments: SessionBatteryAssignment[]
  testActionCategories: TestActionCategory[]
  testActions: TestAction[]
  metricDefinitions: MetricDefinition[]
  derivedMetricDefinitions: DerivedMetricDefinition[]
  measurements: Measurement[]
  importBatches: ImportBatch[]
  settings: WorkspaceSettings
  displayPresets: DisplayPreset[]
}

interface WorkspaceFileWritable {
  write: (data: string | Blob) => Promise<void>
  close: () => Promise<void>
}

export interface WorkspaceFileHandle {
  name: string
  kind?: 'file'
  getFile: () => Promise<File>
  createWritable: () => Promise<WorkspaceFileWritable>
  queryPermission?: (descriptor?: { mode?: 'read' | 'readwrite' }) => Promise<PermissionState>
  requestPermission?: (descriptor?: { mode?: 'read' | 'readwrite' }) => Promise<PermissionState>
}

type WorkspaceFilePickerWindow = Window &
  typeof globalThis & {
    showOpenFilePicker?: (options?: unknown) => Promise<WorkspaceFileHandle[]>
    showSaveFilePicker?: (options?: unknown) => Promise<WorkspaceFileHandle>
  }

const workspaceFileTypes = [
  {
    description: 'PerformanceLab workspace JSON',
    accept: {
      'application/json': ['.json'],
    },
  },
]

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function arrayOr<T>(value: unknown, fallback: T[]): T[] {
  return Array.isArray(value) ? (value as T[]) : fallback
}

function buildInitialTestActions(): TestAction[] {
  return dataEntryActionCategories.flatMap((category) =>
    category.actions.map((action) => ({
      id: action.id,
      categoryId: category.id,
      name: action.name,
      description: action.description,
      equipment: action.equipment,
      metricIds: [...action.metricIds],
    })),
  )
}

function buildInitialTestBatteries(): TestBattery[] {
  return dataEntryActionCategories.map((category) => {
    const actionIds = category.actions.map((action) => action.id)
    const metricIds = Array.from(new Set(category.actions.flatMap((action) => action.metricIds)))
    return {
      id: `battery-${category.id}`,
      name: category.name,
      metricIds,
      testActionIds: actionIds,
      description: `${category.name} default battery`,
    }
  })
}

function buildInitialSessionBatteryAssignments(): SessionBatteryAssignment[] {
  return mockMeasurementStore.sessions.map((session) => ({
    id: `assignment-${session.id}`,
    sessionId: session.id,
    batteryId: 'battery-cat-1',
    teamId: session.teamId,
  }))
}

export function createInitialWorkspace(): PerformanceLabWorkspace {
  const now = new Date().toISOString()

  return {
    schemaVersion: WORKSPACE_SCHEMA_VERSION,
    updatedAt: now,
    teams: cloneJson(mockMeasurementStore.teams),
    athletes: cloneJson(mockMeasurementStore.athletes),
    testSessions: cloneJson(mockMeasurementStore.sessions),
    testBatteries: buildInitialTestBatteries(),
    sessionBatteryAssignments: buildInitialSessionBatteryAssignments(),
    testActionCategories: dataEntryActionCategories.map((category) => ({
      id: category.id,
      name: category.name,
    })),
    testActions: buildInitialTestActions(),
    metricDefinitions: cloneJson(METRIC_DEFINITIONS).map((metric) => ({
      ...metric,
      kind: metric.kind ?? 'raw',
    })),
    derivedMetricDefinitions: [],
    measurements: cloneJson(mockMeasurementStore.measurements),
    importBatches: [],
    settings: {},
    displayPresets: [],
  }
}

export function normalizeWorkspaceDocument(value: unknown): PerformanceLabWorkspace {
  const fallback = createInitialWorkspace()
  if (!isRecord(value)) return fallback

  return {
    schemaVersion:
      typeof value.schemaVersion === 'number' ? value.schemaVersion : WORKSPACE_SCHEMA_VERSION,
    updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : new Date().toISOString(),
    teams: arrayOr<Team>(value.teams, fallback.teams),
    athletes: arrayOr<Athlete>(value.athletes, fallback.athletes),
    testSessions: arrayOr<TestSession>(value.testSessions, fallback.testSessions),
    testBatteries: arrayOr<TestBattery>(value.testBatteries, fallback.testBatteries),
    sessionBatteryAssignments: arrayOr<SessionBatteryAssignment>(
      value.sessionBatteryAssignments,
      fallback.sessionBatteryAssignments,
    ),
    testActionCategories: arrayOr<TestActionCategory>(value.testActionCategories, fallback.testActionCategories),
    testActions: arrayOr<TestAction>(value.testActions, fallback.testActions),
    metricDefinitions: arrayOr<MetricDefinition>(value.metricDefinitions, fallback.metricDefinitions),
    derivedMetricDefinitions: arrayOr<DerivedMetricDefinition>(
      value.derivedMetricDefinitions,
      fallback.derivedMetricDefinitions,
    ),
    measurements: arrayOr<Measurement>(value.measurements, fallback.measurements),
    importBatches: arrayOr<ImportBatch>(value.importBatches, fallback.importBatches),
    settings: isRecord(value.settings) ? (value.settings as WorkspaceSettings) : fallback.settings,
    displayPresets: arrayOr<DisplayPreset>(value.displayPresets, fallback.displayPresets),
  }
}

export function serializeWorkspace(workspace: PerformanceLabWorkspace): string {
  return `${JSON.stringify(
    {
      ...workspace,
      updatedAt: new Date().toISOString(),
    },
    null,
    2,
  )}\n`
}

export function supportsWorkspaceFileAccess(): boolean {
  if (typeof window === 'undefined') return false
  const pickerWindow = window as WorkspaceFilePickerWindow
  return Boolean(pickerWindow.showOpenFilePicker && pickerWindow.showSaveFilePicker)
}

async function ensureWritePermission(handle: WorkspaceFileHandle): Promise<boolean> {
  if (!handle.queryPermission || !handle.requestPermission) return true
  const current = await handle.queryPermission({ mode: 'readwrite' })
  if (current === 'granted') return true
  const requested = await handle.requestPermission({ mode: 'readwrite' })
  return requested === 'granted'
}

export async function readWorkspaceFromFile(file: File): Promise<PerformanceLabWorkspace> {
  const raw = await file.text()
  return normalizeWorkspaceDocument(JSON.parse(raw))
}

export async function readWorkspaceFromHandle(handle: WorkspaceFileHandle): Promise<PerformanceLabWorkspace> {
  const file = await handle.getFile()
  return readWorkspaceFromFile(file)
}

export async function writeWorkspaceToHandle(
  handle: WorkspaceFileHandle,
  workspace: PerformanceLabWorkspace,
): Promise<void> {
  const canWrite = await ensureWritePermission(handle)
  if (!canWrite) {
    throw new Error('Write permission was not granted for the workspace file.')
  }

  const writable = await handle.createWritable()
  await writable.write(serializeWorkspace(workspace))
  await writable.close()
}

export async function pickWorkspaceFile(): Promise<{
  handle: WorkspaceFileHandle
  workspace: PerformanceLabWorkspace
}> {
  const pickerWindow = window as WorkspaceFilePickerWindow
  if (!pickerWindow.showOpenFilePicker) {
    throw new Error('File System Access API is not available in this browser.')
  }

  const [handle] = await pickerWindow.showOpenFilePicker({
    multiple: false,
    types: workspaceFileTypes,
  })
  if (!handle) throw new Error('No workspace file was selected.')

  return {
    handle,
    workspace: await readWorkspaceFromHandle(handle),
  }
}

export async function pickWorkspaceSaveFile(): Promise<WorkspaceFileHandle> {
  const pickerWindow = window as WorkspaceFilePickerWindow
  if (!pickerWindow.showSaveFilePicker) {
    throw new Error('File System Access API is not available in this browser.')
  }

  return pickerWindow.showSaveFilePicker({
    suggestedName: DEFAULT_WORKSPACE_FILENAME,
    types: workspaceFileTypes,
  })
}

export function downloadWorkspaceBackup(
  workspace: PerformanceLabWorkspace,
  filename = DEFAULT_WORKSPACE_FILENAME,
): void {
  const blob = new Blob([serializeWorkspace(workspace)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}
