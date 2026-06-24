import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Draft } from '../types'
import {
  ARCHIVE_RETENTION_DAYS,
  archiveDraft,
  clearDraft,
  createEmptyDraft,
  getArchivedDraft,
  hasArchivedReport,
  hasReportContent,
  initializeSessionDraft,
  listRecentDates,
  loadArchive,
  saveDraft,
  saveLastActiveDate,
  todayIsoDate,
} from '../lib/storage'

const SAVE_DEBOUNCE_MS = 300

function getInitialSession() {
  return initializeSessionDraft()
}

function draftForViewingDate(date: string, liveDraft: Draft): Draft {
  const today = todayIsoDate()
  if (date === today) return liveDraft

  const archived = getArchivedDraft(date)
  if (archived) return archived

  return { ...createEmptyDraft(), reportDate: date }
}

export function useDraft() {
  const [initialSession] = useState(getInitialSession)
  const today = todayIsoDate()
  const [liveDraft, setLiveDraft] = useState<Draft>(initialSession.draft)
  const [viewingDate, setViewingDate] = useState(today)
  const [archiveVersion, setArchiveVersion] = useState(0)
  const [rolledFromDate, setRolledFromDate] = useState<string | null>(
    initialSession.rolledFromDate,
  )
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const isFirstRender = useRef(true)

  const isViewingToday = viewingDate === today

  const draft = useMemo(
    () => draftForViewingDate(viewingDate, liveDraft),
    [viewingDate, liveDraft, archiveVersion],
  )

  const historyDates = useMemo(() => listRecentDates(today, ARCHIVE_RETENTION_DAYS), [today])

  const hasReportForDate = useCallback(
    (date: string) => {
      if (date === today) return hasReportContent(liveDraft)
      return hasArchivedReport(date)
    },
    [today, liveDraft, archiveVersion],
  )

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    const timer = window.setTimeout(() => {
      saveDraft(liveDraft)
      if (hasReportContent(liveDraft)) {
        archiveDraft(liveDraft)
        setArchiveVersion((version) => version + 1)
      }
      saveLastActiveDate(todayIsoDate())
      setLastSaved(new Date())
    }, SAVE_DEBOUNCE_MS)

    return () => window.clearTimeout(timer)
  }, [liveDraft])

  const updateDraft = useCallback(
    (patch: Partial<Draft> | ((prev: Draft) => Draft)) => {
      if (viewingDate !== todayIsoDate()) return

      setLiveDraft((prev) =>
        typeof patch === 'function' ? patch(prev) : { ...prev, ...patch },
      )
    },
    [viewingDate],
  )

  const selectViewingDate = useCallback(
    (date: string) => {
      setViewingDate(date)
      if (date !== todayIsoDate()) {
        void loadArchive()
        setArchiveVersion((version) => version + 1)
      }
    },
    [],
  )

  const resetDraft = useCallback(() => {
    if (viewingDate !== todayIsoDate()) return

    clearDraft()
    const fresh = createEmptyDraft()
    setLiveDraft(fresh)
    saveDraft(fresh)
    saveLastActiveDate(todayIsoDate())
    setLastSaved(new Date())
    setRolledFromDate(null)
  }, [viewingDate])

  const dismissRolloverNotice = useCallback(() => {
    setRolledFromDate(null)
  }, [])

  return {
    draft,
    updateDraft,
    resetDraft,
    lastSaved,
    rolledFromDate,
    dismissRolloverNotice,
    viewingDate,
    selectViewingDate,
    isViewingToday,
    historyDates,
    hasReportForDate,
  }
}
