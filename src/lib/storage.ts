import type { Defect, Draft, ListItem } from '../types'

export const STORAGE_KEY = 'aurora-daily-report-draft-v1'
export const PREVIOUS_STORAGE_KEY = 'aurora-daily-report-previous-v1'
export const LAST_ACTIVE_DATE_KEY = 'aurora-daily-report-last-active-v1'

export function createId(): string {
  return crypto.randomUUID()
}

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10)
}

export function createEmptyDraft(): Draft {
  return {
    reportDate: todayIsoDate(),
    overallStatus: 'On track',
    overallStatusCustom: '',
    jiraBaseUrl: '',
    summary: '',
    tasks: [],
    blockers: [],
    highlights: [],
    defects: [],
  }
}

type StoredDefect = Partial<Defect> & { severity?: unknown }
type StoredListItem = Partial<ListItem>

function normalizeListItems(items: StoredListItem[] | undefined): ListItem[] {
  return (items ?? []).map((item) => ({
    id: item.id ?? createId(),
    text: item.text ?? '',
    jiraId: item.jiraId ?? '',
  }))
}

function normalizeDefects(defects: StoredDefect[] | undefined): Defect[] {
  return (defects ?? []).map((defect) => ({
    id: defect.id ?? createId(),
    title: defect.title ?? '',
    status: defect.status ?? 'Open',
    jiraId: defect.jiraId ?? '',
    link: defect.link ?? '',
    note: defect.note ?? '',
  }))
}

function normalizeDraft(parsed: Partial<Draft>): Draft {
  return {
    ...createEmptyDraft(),
    ...parsed,
    tasks: normalizeListItems(parsed.tasks as StoredListItem[] | undefined),
    blockers: normalizeListItems(parsed.blockers as StoredListItem[] | undefined),
    highlights: normalizeListItems(parsed.highlights as StoredListItem[] | undefined),
    defects: normalizeDefects(parsed.defects as StoredDefect[] | undefined),
  }
}

export function loadDraft(): Draft {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return createEmptyDraft()
    return normalizeDraft(JSON.parse(raw) as Partial<Draft>)
  } catch {
    return createEmptyDraft()
  }
}

export function loadPreviousReport(): Draft | null {
  try {
    const raw = localStorage.getItem(PREVIOUS_STORAGE_KEY)
    if (!raw) return null
    return normalizeDraft(JSON.parse(raw) as Partial<Draft>)
  } catch {
    return null
  }
}

export function saveDraft(draft: Draft): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(draft))
}

export function savePreviousReport(draft: Draft): void {
  localStorage.setItem(PREVIOUS_STORAGE_KEY, JSON.stringify(draft))
}

export function loadLastActiveDate(): string | null {
  return localStorage.getItem(LAST_ACTIVE_DATE_KEY)
}

export function saveLastActiveDate(isoDate: string): void {
  localStorage.setItem(LAST_ACTIVE_DATE_KEY, isoDate)
}

/** Carry content into a new day; updates report date only. */
function carryDraftForward(draft: Draft, newDate: string): Draft {
  return { ...draft, reportDate: newDate }
}

export type SessionInit = {
  draft: Draft
  /** ISO date of the report that was archived as "previous" on this open */
  rolledFromDate: string | null
  previousReport: Draft | null
}

/**
 * On a new calendar day: save the last session's draft as "previous",
 * then open today with that same content ready to edit.
 */
export function initializeSessionDraft(): SessionInit {
  const today = todayIsoDate()
  const lastActive = loadLastActiveDate()
  let draft = loadDraft()
  let rolledFromDate: string | null = null

  const isNewDay = lastActive !== null && lastActive < today
  const isFirstVisitWithStaleDraft =
    lastActive === null && draft.reportDate < today

  if (isNewDay || isFirstVisitWithStaleDraft) {
    const hasContent =
      draft.summary.trim() ||
      draft.tasks.some((t) => t.text.trim()) ||
      draft.blockers.some((b) => b.text.trim()) ||
      draft.highlights.some((h) => h.text.trim()) ||
      draft.defects.some((d) => d.title.trim())

    if (hasContent || isNewDay) {
      savePreviousReport(draft)
      rolledFromDate = lastActive ?? draft.reportDate
    }

    draft = carryDraftForward(draft, today)
    saveDraft(draft)
  }

  saveLastActiveDate(today)
  const previousReport = loadPreviousReport()

  return { draft, rolledFromDate, previousReport }
}

export function clearDraft(): void {
  localStorage.removeItem(STORAGE_KEY)
}
