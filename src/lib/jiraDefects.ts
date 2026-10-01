import { z } from 'zod'
// Explicit `.ts` extensions so Node (`--experimental-strip-types`) can run the
// sync script against this module without a bundler.
import type { Defect, DefectStatus } from '../types.ts'
import { DEFECT_STATUSES } from '../types.ts'

/**
 * Shared, side-effect-free logic for turning Jira issues into report defects.
 * Used by both `scripts/sync-jira-defects.ts` (Node) and the browser import
 * panel, so it must not touch the DOM, `localStorage`, or Node APIs.
 */

export const JIRA_SITE = 'https://firsthorizon.atlassian.net'
export const JIRA_PROJECT = 'DIGENG'
export const JIRA_COMPONENT = 'Aurora Mobile'
export const DEFAULT_RELEASE = 'Aurora Gatlinburg'
export const PRODUCTION_LABEL = 'aurora_production_issue'

export function buildDefectsJql(release: string = DEFAULT_RELEASE): string {
  const escapedRelease = release.replace(/"/g, '\\"')
  return [
    `project = ${JIRA_PROJECT}`,
    'issuetype = Bug',
    `component = "${JIRA_COMPONENT}"`,
    `fixVersion = "${escapedRelease}"`,
  ].join(' AND ') + ' ORDER BY priority DESC, created DESC'
}

// ---------------------------------------------------------------------------
// Raw Jira issue (as returned by `twg jira workitem query -o json`)
// ---------------------------------------------------------------------------

const NamedSchema = z.object({ name: z.string() }).nullish()

export const JiraIssueSchema = z.object({
  key: z.string().min(1),
  summary: z.string().default(''),
  status: NamedSchema,
  priority: NamedSchema,
  labels: z.array(z.string()).default([]),
})

export type JiraIssue = z.infer<typeof JiraIssueSchema>

export const JiraQueryResponseSchema = z.object({
  data: z.object({
    issues: z.array(JiraIssueSchema),
  }),
  pageInfo: z
    .object({
      hasNextPage: z.boolean().optional(),
      nextCursor: z.string().optional(),
    })
    .optional(),
})

// ---------------------------------------------------------------------------
// Import file written by the sync script and consumed by the app
// ---------------------------------------------------------------------------

export const ImportedDefectSchema = z.object({
  jiraId: z.string().min(1),
  title: z.string(),
  status: z.enum(DEFECT_STATUSES),
  isProduction: z.boolean(),
  priority: z.string().optional(),
  jiraStatus: z.string().optional(),
  note: z.string().default(''),
})

export const DefectsImportFileSchema = z.object({
  source: z.literal('jira'),
  release: z.string(),
  syncedAt: z.string(),
  jiraBaseUrl: z.string(),
  defects: z.array(ImportedDefectSchema),
})

export type ImportedDefect = z.infer<typeof ImportedDefectSchema>
export type DefectsImportFile = z.infer<typeof DefectsImportFileSchema>
export type ImportMode = 'merge' | 'replace'

// ---------------------------------------------------------------------------
// Mapping
// ---------------------------------------------------------------------------

const PRODUCTION_SUMMARY_PATTERN = /\|\s*prod(uction)?\s*\|/i

export function isProductionIssue(issue: Pick<JiraIssue, 'summary' | 'labels'>): boolean {
  if (issue.labels.some((label) => label.toLowerCase() === PRODUCTION_LABEL)) return true
  return PRODUCTION_SUMMARY_PATTERN.test(issue.summary)
}

const STATUS_MAP: Record<string, DefectStatus> = {
  backlog: 'New',
  'to do': 'New',
  open: 'New',
  new: 'New',
  ready: 'Open',
  'selected for development': 'Open',
  'in progress': 'In progress',
  'peer review': 'In progress',
  'code review': 'In progress',
  'in review': 'In progress',
  testing: 'Fixed',
  acceptance: 'Fixed',
  'ready for qa': 'Fixed',
  qa: 'Fixed',
  done: 'Verified',
  closed: 'Verified',
  resolved: 'Verified',
  cancelled: "Won't fix",
  canceled: "Won't fix",
  "won't do": "Won't fix",
  rejected: "Won't fix",
}

export function mapJiraStatus(name: string | null | undefined): DefectStatus {
  if (!name) return 'Open'
  return STATUS_MAP[name.trim().toLowerCase()] ?? 'Open'
}

/** Statuses that mean the defect is no longer actionable. */
export function isClosedStatus(status: DefectStatus): boolean {
  return status === 'Verified' || status === "Won't fix"
}

const TITLE_PREFIX_PATTERN = /^(aurora\s+mobile|mobile|production|prod)\s*\|\s*/i

/** Strip "Aurora Mobile |", "Mobile |" and "Production |" lead-ins; grouping conveys them. */
export function cleanTitle(summary: string): string {
  let title = summary.trim()
  while (TITLE_PREFIX_PATTERN.test(title)) {
    title = title.replace(TITLE_PREFIX_PATTERN, '').trim()
  }
  return title || summary.trim()
}

export function mapJiraIssueToImport(issue: JiraIssue): ImportedDefect {
  const priority = issue.priority?.name?.trim() || undefined
  const jiraStatus = issue.status?.name?.trim() || undefined
  return {
    jiraId: issue.key.toUpperCase(),
    title: cleanTitle(issue.summary),
    status: mapJiraStatus(jiraStatus),
    isProduction: isProductionIssue(issue),
    priority,
    jiraStatus,
    note: priority ?? '',
  }
}

// ---------------------------------------------------------------------------
// Ordering and merging
// ---------------------------------------------------------------------------

const PRIORITY_RANK: Record<string, number> = {
  blocker: 0,
  highest: 0,
  critical: 1,
  high: 1,
  major: 2,
  medium: 2,
  minor: 3,
  low: 3,
  trivial: 4,
  lowest: 4,
}

export function priorityRank(priority?: string): number {
  if (!priority) return 5
  return PRIORITY_RANK[priority.trim().toLowerCase()] ?? 5
}

function jiraKeyNumber(jiraId?: string): number {
  const match = /-(\d+)$/.exec((jiraId ?? '').trim())
  return match ? Number(match[1]) : -1
}

function isJiraSourced(defect: Defect): boolean {
  return Boolean((defect.jiraId ?? '').trim()) && defect.jiraStatus !== undefined
}

/**
 * Production first, then Jira-sourced defects by priority and newest key,
 * then manual defects in their existing order.
 */
export function sortDefects(defects: Defect[]): Defect[] {
  return defects
    .map((defect, index) => ({ defect, index }))
    .sort((a, b) => {
      const groupDiff = Number(!a.defect.isProduction) - Number(!b.defect.isProduction)
      if (groupDiff !== 0) return groupDiff

      const aJira = isJiraSourced(a.defect)
      const bJira = isJiraSourced(b.defect)
      if (aJira !== bJira) return aJira ? -1 : 1
      if (!aJira) return a.index - b.index

      const rankDiff = priorityRank(a.defect.priority) - priorityRank(b.defect.priority)
      if (rankDiff !== 0) return rankDiff

      const keyDiff = jiraKeyNumber(b.defect.jiraId) - jiraKeyNumber(a.defect.jiraId)
      if (keyDiff !== 0) return keyDiff

      return a.index - b.index
    })
    .map(({ defect }) => defect)
}

function toDefect(imported: ImportedDefect, id: string): Defect {
  return {
    id,
    title: imported.title,
    status: imported.status,
    jiraId: imported.jiraId,
    link: '',
    note: imported.note,
    isProduction: imported.isProduction,
    priority: imported.priority,
    jiraStatus: imported.jiraStatus,
  }
}

function defaultCreateId(): string {
  return crypto.randomUUID()
}

/**
 * `merge` refreshes Jira fields on matching defects (by Jira ID) while keeping
 * the user's note, link and card id; drops Jira-sourced defects that are no
 * longer returned; keeps manual defects. `replace` discards everything.
 */
export function mergeImportedDefects(
  existing: Defect[],
  imported: ImportedDefect[],
  mode: ImportMode,
  createId: () => string = defaultCreateId,
): Defect[] {
  const importedById = new Map(imported.map((item) => [item.jiraId, item]))

  if (mode === 'replace') {
    return sortDefects(imported.map((item) => toDefect(item, createId())))
  }

  const matchedIds = new Set<string>()
  const kept: Defect[] = []

  for (const defect of existing) {
    const jiraId = (defect.jiraId ?? '').trim().toUpperCase()
    const match = jiraId ? importedById.get(jiraId) : undefined

    if (match) {
      matchedIds.add(jiraId)
      kept.push({
        ...defect,
        jiraId,
        title: match.title,
        status: match.status,
        isProduction: match.isProduction,
        priority: match.priority,
        jiraStatus: match.jiraStatus,
        note: defect.note.trim() ? defect.note : match.note,
      })
      continue
    }

    if (!isJiraSourced(defect)) {
      kept.push(defect)
    }
  }

  for (const item of imported) {
    if (!matchedIds.has(item.jiraId)) {
      kept.push(toDefect(item, createId()))
    }
  }

  return sortDefects(kept)
}

export function summarizeImport(defects: ReadonlyArray<Pick<Defect, 'isProduction'>>): {
  total: number
  production: number
} {
  const production = defects.filter((defect) => defect.isProduction).length
  return { total: defects.length, production }
}
