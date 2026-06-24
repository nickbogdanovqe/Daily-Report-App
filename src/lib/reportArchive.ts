import type { Draft } from '../types'

export const ARCHIVE_KEY = 'daily-report-archive-v1'
export const ARCHIVE_RETENTION_DAYS = 14

export type ReportArchive = Record<string, Draft>

export function hasReportContent(draft: Draft): boolean {
  return Boolean(
    draft.reportTitle.trim() ||
      draft.applicationName.trim() ||
      draft.ragReason.trim() ||
      draft.trendReason.trim() ||
      draft.testingType.trim() ||
      draft.testEnvironment.trim() ||
      draft.qeOwner.trim() ||
      draft.testEvidencePath.trim() ||
      draft.testArtifacts.trim() ||
      draft.environmentDowntime.trim() ||
      draft.highlights.some((item) => item.text.trim()) ||
      draft.inScopeItems.some((item) => item.text.trim()) ||
      draft.outOfScopeItems.some((item) => item.text.trim()) ||
      draft.showTestDesignSummary ||
      draft.showTestExecutionSummary ||
      draft.defects.some(
        (defect) =>
          defect.title.trim() ||
          (defect.jiraId ?? '').trim() ||
          defect.note.trim() ||
          defect.link.trim(),
      ),
  )
}

export function addDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T12:00:00`)
  if (Number.isNaN(date.getTime())) return isoDate
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

export function listRecentDates(endDate: string, days: number): string[] {
  return Array.from({ length: days }, (_, index) => addDays(endDate, -index))
}
