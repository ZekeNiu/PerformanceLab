import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { ImportBatch, Measurement } from './domain-model'
import {
  createInitialWorkspace,
  downloadWorkspaceBackup,
  DEFAULT_WORKSPACE_FILENAME,
  pickWorkspaceFile,
  pickWorkspaceSaveFile,
  readWorkspaceFromFile,
  supportsWorkspaceFileAccess,
  writeWorkspaceToHandle,
} from './workspace-file'
import type { PerformanceLabWorkspace, WorkspaceFileHandle, WorkspaceSettings } from './workspace-file'

export type WorkspaceConnectionStatus = 'detached' | 'connected' | 'saving' | 'unsupported' | 'error'

interface WorkspaceUpdateOptions {
  autoSave?: boolean
}

interface WorkspaceStoreContextValue {
  workspace: PerformanceLabWorkspace
  status: WorkspaceConnectionStatus
  isSupported: boolean
  isDirty: boolean
  fileName: string | null
  lastSavedAt: string | null
  errorMessage: string | null
  createWorkspaceFile: () => Promise<void>
  openWorkspaceFile: () => Promise<void>
  saveWorkspaceFile: () => Promise<void>
  saveWorkspaceAs: () => Promise<void>
  exportBackup: () => void
  importWorkspaceFromFile: (file: File) => Promise<void>
  updateWorkspace: (
    updater: (workspace: PerformanceLabWorkspace) => PerformanceLabWorkspace,
    options?: WorkspaceUpdateOptions,
  ) => Promise<void>
  appendMeasurements: (measurements: Measurement[], importBatch?: ImportBatch) => Promise<void>
  updateSettings: (settings: WorkspaceSettings) => Promise<void>
}

const WorkspaceStoreContext = createContext<WorkspaceStoreContextValue | null>(null)

function stampWorkspace(workspace: PerformanceLabWorkspace): PerformanceLabWorkspace {
  return {
    ...workspace,
    updatedAt: new Date().toISOString(),
  }
}

function mergeMeasurements(existing: Measurement[], incoming: Measurement[]) {
  const byId = new Map(existing.map((measurement) => [measurement.id, measurement]))
  incoming.forEach((measurement) => byId.set(measurement.id, measurement))
  return Array.from(byId.values())
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const isSupported = supportsWorkspaceFileAccess()
  const [workspace, setWorkspaceState] = useState<PerformanceLabWorkspace>(() => createInitialWorkspace())
  const [fileHandle, setFileHandleState] = useState<WorkspaceFileHandle | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [status, setStatus] = useState<WorkspaceConnectionStatus>(() => (isSupported ? 'detached' : 'unsupported'))
  const [isDirty, setIsDirty] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const workspaceRef = useRef(workspace)
  const fileHandleRef = useRef<WorkspaceFileHandle | null>(fileHandle)

  const setWorkspace = useCallback((next: PerformanceLabWorkspace) => {
    workspaceRef.current = next
    setWorkspaceState(next)
  }, [])

  const setFileHandle = useCallback((next: WorkspaceFileHandle | null) => {
    fileHandleRef.current = next
    setFileHandleState(next)
  }, [])

  const persistWorkspace = useCallback(
    async (next: PerformanceLabWorkspace, handle: WorkspaceFileHandle | null, clearDirtyWhenSaved = true) => {
      if (!handle) {
        setIsDirty(true)
        setStatus(isSupported ? 'detached' : 'unsupported')
        return
      }

      setStatus('saving')
      try {
        await writeWorkspaceToHandle(handle, next)
        setErrorMessage(null)
        setIsDirty(!clearDirtyWhenSaved)
        setLastSavedAt(new Date().toISOString())
        setStatus('connected')
      } catch (error) {
        const writeError = error instanceof Error ? error : new Error('Failed to write workspace file.')
        setErrorMessage(writeError.message)
        setIsDirty(true)
        setStatus('error')
        throw writeError
      }
    },
    [isSupported],
  )

  const commitWorkspace = useCallback(
    async (next: PerformanceLabWorkspace, options: WorkspaceUpdateOptions = {}) => {
      const stamped = stampWorkspace(next)
      setWorkspace(stamped)
      setIsDirty(true)
      setErrorMessage(null)

      if (options.autoSave ?? true) {
        await persistWorkspace(stamped, fileHandleRef.current)
      }
    },
    [persistWorkspace, setWorkspace],
  )

  const createWorkspaceFile = useCallback(async () => {
    const next = createInitialWorkspace()
    if (!isSupported) {
      setWorkspace(next)
      setFileHandle(null)
      setFileName(null)
      setStatus('unsupported')
      setIsDirty(false)
      downloadWorkspaceBackup(next)
      return
    }

    const handle = await pickWorkspaceSaveFile()
    await writeWorkspaceToHandle(handle, next)
    setWorkspace(next)
    setFileHandle(handle)
    setFileName(handle.name)
    setIsDirty(false)
    setLastSavedAt(new Date().toISOString())
    setStatus('connected')
    setErrorMessage(null)
  }, [isSupported, setFileHandle, setWorkspace])

  const openWorkspaceFile = useCallback(async () => {
    const { handle, workspace: openedWorkspace } = await pickWorkspaceFile()
    setWorkspace(openedWorkspace)
    setFileHandle(handle)
    setFileName(handle.name)
    setIsDirty(false)
    setLastSavedAt(null)
    setStatus('connected')
    setErrorMessage(null)
  }, [setFileHandle, setWorkspace])

  const saveWorkspaceAs = useCallback(async () => {
    const current = stampWorkspace(workspaceRef.current)

    if (!isSupported) {
      downloadWorkspaceBackup(current)
      setWorkspace(current)
      setIsDirty(false)
      setStatus('unsupported')
      return
    }

    const handle = await pickWorkspaceSaveFile()
    await writeWorkspaceToHandle(handle, current)
    setWorkspace(current)
    setFileHandle(handle)
    setFileName(handle.name)
    setIsDirty(false)
    setLastSavedAt(new Date().toISOString())
    setStatus('connected')
    setErrorMessage(null)
  }, [isSupported, setFileHandle, setWorkspace])

  const saveWorkspaceFile = useCallback(async () => {
    if (!fileHandleRef.current) {
      await saveWorkspaceAs()
      return
    }

    const current = stampWorkspace(workspaceRef.current)
    setWorkspace(current)
    await persistWorkspace(current, fileHandleRef.current)
  }, [persistWorkspace, saveWorkspaceAs, setWorkspace])

  const exportBackup = useCallback(() => {
    downloadWorkspaceBackup(workspaceRef.current, DEFAULT_WORKSPACE_FILENAME)
  }, [])

  const importWorkspaceFromFile = useCallback(
    async (file: File) => {
      const importedWorkspace = await readWorkspaceFromFile(file)
      setWorkspace(importedWorkspace)
      setFileHandle(null)
      setFileName(file.name)
      setIsDirty(false)
      setLastSavedAt(null)
      setStatus(isSupported ? 'detached' : 'unsupported')
      setErrorMessage(null)
    },
    [isSupported, setFileHandle, setWorkspace],
  )

  const updateWorkspace = useCallback(
    async (
      updater: (workspace: PerformanceLabWorkspace) => PerformanceLabWorkspace,
      options: WorkspaceUpdateOptions = {},
    ) => {
      await commitWorkspace(updater(workspaceRef.current), options)
    },
    [commitWorkspace],
  )

  const appendMeasurements = useCallback(
    async (measurements: Measurement[], importBatch?: ImportBatch) => {
      if (!measurements.length && !importBatch) return

      await updateWorkspace((current) => {
        const normalizedMeasurements = measurements.map((measurement) => ({
          ...measurement,
          importBatchId: importBatch?.id ?? measurement.importBatchId,
        }))
        const nextImportBatches = importBatch
          ? [
              {
                ...importBatch,
                measurementIds: importBatch.measurementIds ?? measurements.map((measurement) => measurement.id),
              },
              ...current.importBatches.filter((batch) => batch.id !== importBatch.id),
            ]
          : current.importBatches

        return {
          ...current,
          measurements: mergeMeasurements(current.measurements, normalizedMeasurements),
          importBatches: nextImportBatches,
        }
      })
    },
    [updateWorkspace],
  )

  const updateSettings = useCallback(
    async (settings: WorkspaceSettings) => {
      await updateWorkspace((current) => ({
        ...current,
        settings: {
          ...current.settings,
          ...settings,
        },
      }))
    },
    [updateWorkspace],
  )

  const value = useMemo<WorkspaceStoreContextValue>(
    () => ({
      workspace,
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
      updateWorkspace,
      appendMeasurements,
      updateSettings,
    }),
    [
      appendMeasurements,
      createWorkspaceFile,
      errorMessage,
      exportBackup,
      fileName,
      importWorkspaceFromFile,
      isDirty,
      isSupported,
      lastSavedAt,
      openWorkspaceFile,
      saveWorkspaceAs,
      saveWorkspaceFile,
      status,
      updateSettings,
      updateWorkspace,
      workspace,
    ],
  )

  return <WorkspaceStoreContext.Provider value={value}>{children}</WorkspaceStoreContext.Provider>
}

export function useWorkspaceStore() {
  const context = useContext(WorkspaceStoreContext)
  if (!context) {
    throw new Error('useWorkspaceStore must be used inside WorkspaceProvider.')
  }
  return context
}
