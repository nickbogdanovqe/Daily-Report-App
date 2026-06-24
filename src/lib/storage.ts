import {
  ARCHIVE_KEY,
  ARCHIVE_RETENTION_DAYS,
  addDays,
  hasReportContent,
  type ReportArchive,
} from './reportArchive'
import type {
  Defect,
  Draft,
  ListItem,
  OverallStatus,
  TestDesignSummaryRow,
  TestExecutionSummaryRow,
} from '../types'

export const STORAGE_KEY = 'aurora-daily-report-draft-v1'
export const LAST_ACTIVE_DATE_KEY = 'aurora-daily-report-last-active-v1'

export function createId(): string {
  return crypto.randomUUID()
}

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10)
}

function createDefaultDesignRows(): TestDesignSummaryRow[] {
  return [
    {
      id: createId(),
      functionality: 'Functional Testing',
      totalPlanned: '0',
      totalCompleted: '0',
      totalInProgress: '0',
      totalNotStarted: '0',
      totalCompletedToday: '0',
      totalAutomated: '0',
      totalManual: '0',
    },
    {
      id: createId(),
      functionality: 'Integration Testing',
      totalPlanned: '0',
      totalCompleted: '0',
      totalInProgress: '0',
      totalNotStarted: '0',
      totalCompletedToday: '0',
      totalAutomated: '0',
      totalManual: '0',
    },
    {
      id: createId(),
      functionality: 'E2E Testing',
      totalPlanned: '0',
      totalCompleted: '0',
      totalInProgress: '0',
      totalNotStarted: '0',
      totalCompletedToday: '0',
      totalAutomated: '0',
      totalManual: '0',
    },
    {
      id: createId(),
      functionality: 'Regression Testing',
      totalPlanned: '0',
      totalCompleted: '0',
      totalInProgress: '0',
      totalNotStarted: '0',
      totalCompletedToday: '0',
      totalAutomated: '0',
      totalManual: '0',
    },
    {
      id: createId(),
      functionality: 'Total',
      totalPlanned: '0',
      totalCompleted: '0',
      totalInProgress: '0',
      totalNotStarted: '0',
      totalCompletedToday: '0',
      totalAutomated: '0',
      totalManual: '0',
    },
  ]
}

function createDefaultExecutionRows(): TestExecutionSummaryRow[] {
  return [
    {
      id: createId(),
      functionality: 'Functional Testing',
      totalPlanned: '0',
      totalExecuted: '0',
      totalPassed: '0',
      totalFailed: '0',
      totalNa: '0',
      totalNotComplete: '0',
      totalBlocked: '0',
      totalNoRun: '0',
    },
    {
      id: createId(),
      functionality: 'Integration Testing',
      totalPlanned: '0',
      totalExecuted: '0',
      totalPassed: '0',
      totalFailed: '0',
      totalNa: '0',
      totalNotComplete: '0',
      totalBlocked: '0',
      totalNoRun: '0',
    },
    {
      id: createId(),
      functionality: 'E2E Testing',
      totalPlanned: '0',
      totalExecuted: '0',
      totalPassed: '0',
      totalFailed: '0',
      totalNa: '0',
      totalNotComplete: '0',
      totalBlocked: '0',
      totalNoRun: '0',
    },
    {
      id: createId(),
      functionality: 'Regression Testing',
      totalPlanned: '0',
      totalExecuted: '0',
      totalPassed: '0',
      totalFailed: '0',
      totalNa: '0',
      totalNotComplete: '0',
      totalBlocked: '0',
      totalNoRun: '0',
    },
    {
      id: createId(),
      functionality: 'Total',
      totalPlanned: '0',
      totalExecuted: '0',
      totalPassed: '0',
      totalFailed: '0',
      totalNa: '0',
      totalNotComplete: '0',
      totalBlocked: '0',
      totalNoRun: '0',
    },
  ]
}

export function createEmptyDraft(): Draft {
  return {
    reportDate: todayIsoDate(),
    reportTitle: '',
    applicationName: '',
    projectQaStartDate: '',
    projectQaSignOffDate: '',
    plannedGoLiveDate: '',
    testingType: '',
    testEnvironment: '',
    qeOwner: '',
    overallStatus: 'Green',
    overallStatusCustom: '',
    anticipatedTrend: 'Green',
    ragReason: '',
    trendReason: '',
    testEvidencePath: '',
    testArtifacts: '',
    environmentDowntime: '',
    inScopeConfirmedDate: '',
    inScopeItems: [],
    outOfScopeItems: [],
    showTestDesignSummary: false,
    testDesignSummaryTitle: '',
    testDesignSummaryRemarks: '',
    testDesignSummaryRows: createDefaultDesignRows(),
    showTestExecutionSummary: false,
    testExecutionSummaryTitle: '',
    testExecutionSummaryRemarks: '',
    testExecutionSummaryRows: createDefaultExecutionRows(),
    jiraBaseUrl: '',
    highlights: [],
    defects: [],
  }
}

type StoredDefect = Partial<Defect> & { severity?: unknown }
type StoredListItem = Partial<ListItem>
type StoredDesignRow = Partial<TestDesignSummaryRow>
type StoredExecutionRow = Partial<TestExecutionSummaryRow>
export type StoredDraft = Partial<Omit<Draft, 'overallStatus' | 'anticipatedTrend'>> & {
  overallStatus?: unknown
  anticipatedTrend?: unknown
}

function normalizeRagStatus(value: unknown): OverallStatus {
  if (typeof value !== 'string') return 'Green'

  const normalized = value.trim().toLowerCase()
  if (normalized === 'red' || normalized === 'blocked' || normalized.includes('block')) {
    return 'Red'
  }
  if (normalized === 'amber' || normalized === 'at risk' || normalized.includes('risk')) {
    return 'Amber'
  }
  return 'Green'
}

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

function normalizeDesignRows(rows: StoredDesignRow[] | undefined): TestDesignSummaryRow[] {
  const source = rows?.length ? rows : createDefaultDesignRows()
  return source.map((row) => ({
    id: row.id ?? createId(),
    functionality: row.functionality ?? '',
    totalPlanned: row.totalPlanned ?? '',
    totalCompleted: row.totalCompleted ?? '',
    totalInProgress: row.totalInProgress ?? '',
    totalNotStarted: row.totalNotStarted ?? '',
    totalCompletedToday: row.totalCompletedToday ?? '',
    totalAutomated: row.totalAutomated ?? '0',
    totalManual: row.totalManual ?? '0',
  }))
}

function normalizeExecutionRows(
  rows: StoredExecutionRow[] | undefined,
): TestExecutionSummaryRow[] {
  const source = rows?.length ? rows : createDefaultExecutionRows()
  return source.map((row) => ({
    id: row.id ?? createId(),
    functionality: row.functionality ?? '',
    totalPlanned: row.totalPlanned ?? '',
    totalExecuted: row.totalExecuted ?? '',
    totalPassed: row.totalPassed ?? '',
    totalFailed: row.totalFailed ?? '',
    totalNa: row.totalNa ?? '',
    totalNotComplete: row.totalNotComplete ?? '',
    totalBlocked: row.totalBlocked ?? '',
    totalNoRun: row.totalNoRun ?? '',
  }))
}

function normalizeLegacyText(value: unknown, legacyValues: readonly string[]): string {
  if (typeof value !== 'string') return ''
  return legacyValues.includes(value) ? '' : value
}

const LEGACY_DESIGN_TITLES = ['Test Design Summary - Project Money Movement'] as const
const LEGACY_EXECUTION_TITLES = ['Test Execution Summary - Money Movement'] as const
const LEGACY_DESIGN_REMARKS = [
  'Test cases will be added based on integration issues are resolved and test data availability',
] as const
const LEGACY_EXECUTION_REMARKS = ['Execution status will be updated after 05/26'] as const

function migrateLegacySummary(parsed: StoredDraft): string {
  const ragReason = typeof parsed.ragReason === 'string' ? parsed.ragReason.trim() : ''
  if (ragReason) return ragReason

  const summary = (parsed as StoredDraft & { summary?: unknown }).summary
  return typeof summary === 'string' ? summary.trim() : ''
}

export function normalizeDraft(parsed: StoredDraft): Draft {
  const { blockers: _legacyBlockers, tasks: _legacyTasks, ...storedDraft } =
    parsed as StoredDraft & {
      blockers?: unknown
      tasks?: unknown
      summary?: unknown
    }

  return {
    ...createEmptyDraft(),
    ...storedDraft,
    ragReason: migrateLegacySummary(parsed),
    testDesignSummaryTitle: normalizeLegacyText(
      parsed.testDesignSummaryTitle,
      LEGACY_DESIGN_TITLES,
    ),
    testExecutionSummaryTitle: normalizeLegacyText(
      parsed.testExecutionSummaryTitle,
      LEGACY_EXECUTION_TITLES,
    ),
    testDesignSummaryRemarks: normalizeLegacyText(
      parsed.testDesignSummaryRemarks,
      LEGACY_DESIGN_REMARKS,
    ),
    testExecutionSummaryRemarks: normalizeLegacyText(
      parsed.testExecutionSummaryRemarks,
      LEGACY_EXECUTION_REMARKS,
    ),
    overallStatus: normalizeRagStatus(parsed.overallStatus),
    anticipatedTrend: normalizeRagStatus(parsed.anticipatedTrend ?? parsed.overallStatus),
    highlights: normalizeListItems(parsed.highlights as StoredListItem[] | undefined),
    inScopeItems: normalizeListItems(parsed.inScopeItems as StoredListItem[] | undefined),
    outOfScopeItems: normalizeListItems(
      parsed.outOfScopeItems as StoredListItem[] | undefined,
    ),
    testDesignSummaryRows: normalizeDesignRows(
      parsed.testDesignSummaryRows as StoredDesignRow[] | undefined,
    ),
    testExecutionSummaryRows: normalizeExecutionRows(
      parsed.testExecutionSummaryRows as StoredExecutionRow[] | undefined,
    ),
    defects: normalizeDefects(parsed.defects as StoredDefect[] | undefined),
  }
}

export function loadDraft(): Draft {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return createEmptyDraft()
    return normalizeDraft(JSON.parse(raw) as StoredDraft)
  } catch {
    return createEmptyDraft()
  }
}

export function saveDraft(draft: Draft): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(draft))
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
  /** ISO date of the report that was carried forward on this open */
  rolledFromDate: string | null
}

/**
 * On a new calendar day: open today with the existing content ready to edit.
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
    if (hasReportContent(draft)) {
      archiveDraft(draft)
      rolledFromDate = lastActive ?? draft.reportDate
    } else if (isNewDay) {
      rolledFromDate = lastActive ?? draft.reportDate
    }

    draft = carryDraftForward(draft, today)
    saveDraft(draft)
  } else if (hasReportContent(draft)) {
    archiveDraft(draft)
  }

  saveLastActiveDate(today)

  return { draft, rolledFromDate }
}

export function clearDraft(): void {
  localStorage.removeItem(STORAGE_KEY)
}

function pruneArchive(archive: ReportArchive, today: string): ReportArchive {
  const keepFrom = addDays(today, -(ARCHIVE_RETENTION_DAYS - 1))
  const pruned: ReportArchive = {}

  for (const [date, draft] of Object.entries(archive)) {
    if (date >= keepFrom && date <= today) {
      pruned[date] = draft
    }
  }

  return pruned
}

export function loadArchive(): ReportArchive {
  try {
    const raw = localStorage.getItem(ARCHIVE_KEY)
    if (!raw) return {}

    const parsed = JSON.parse(raw) as Record<string, StoredDraft>
    const archive: ReportArchive = {}

    for (const [date, storedDraft] of Object.entries(parsed)) {
      archive[date] = normalizeDraft({ ...storedDraft, reportDate: date })
    }

    return archive
  } catch {
    return {}
  }
}

function saveArchive(archive: ReportArchive): void {
  localStorage.setItem(ARCHIVE_KEY, JSON.stringify(archive))
}

export function getArchivedDraft(date: string): Draft | null {
  return loadArchive()[date] ?? null
}

export function hasArchivedReport(date: string): boolean {
  return getArchivedDraft(date) !== null
}

export function archiveDraft(draft: Draft): void {
  const date = draft.reportDate.trim()
  if (!date || !hasReportContent(draft)) return

  const archive = pruneArchive(loadArchive(), todayIsoDate())
  archive[date] = { ...draft, reportDate: date }
  saveArchive(archive)
}

export { ARCHIVE_RETENTION_DAYS, hasReportContent, listRecentDates } from './reportArchive'
