import { useCallback, useEffect, useRef, useState } from 'react'
import type { Draft } from '../types'
import {
  clearDraft,
  createEmptyDraft,
  initializeSessionDraft,
  saveDraft,
  saveLastActiveDate,
  todayIsoDate,
} from '../lib/storage'

const SAVE_DEBOUNCE_MS = 300

function getInitialSession() {
  return initializeSessionDraft()
}

export function useDraft() {
  const [initialSession] = useState(getInitialSession)
  const [draft, setDraft] = useState<Draft>(initialSession.draft)
  const [rolledFromDate, setRolledFromDate] = useState<string | null>(
    initialSession.rolledFromDate,
  )
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    const timer = window.setTimeout(() => {
      saveDraft(draft)
      saveLastActiveDate(todayIsoDate())
      setLastSaved(new Date())
    }, SAVE_DEBOUNCE_MS)

    return () => window.clearTimeout(timer)
  }, [draft])

  const updateDraft = useCallback((patch: Partial<Draft> | ((prev: Draft) => Draft)) => {
    setDraft((prev) =>
      typeof patch === 'function' ? patch(prev) : { ...prev, ...patch },
    )
  }, [])

  const resetDraft = useCallback(() => {
    clearDraft()
    const fresh = createEmptyDraft()
    setDraft(fresh)
    saveDraft(fresh)
    saveLastActiveDate(todayIsoDate())
    setLastSaved(new Date())
    setRolledFromDate(null)
  }, [])

  const dismissRolloverNotice = useCallback(() => {
    setRolledFromDate(null)
  }, [])

  return {
    draft,
    setDraft,
    updateDraft,
    resetDraft,
    lastSaved,
    rolledFromDate,
    dismissRolloverNotice,
  }
}
