import type { Draft, ListItem } from '../types'
import { formatAutomationCoverageText, getAutomationTotals } from './automationCoverage'
import { formatOverallLabel } from './reportTheme'

function formatDateShort(isoDate: string): string {
  if (!isoDate.trim()) return ''
  const date = new Date(`${isoDate}T12:00:00`)
  if (Number.isNaN(date.getTime())) return isoDate
  return date.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: '2-digit',
  })
}

function formatDateMonthDay(isoDate: string): string {
  if (!isoDate.trim()) return ''
  const date = new Date(`${isoDate}T12:00:00`)
  if (Number.isNaN(date.getTime())) return isoDate
  return date.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
  })
}

function normalizeJiraBaseUrl(jiraBaseUrl: string): string {
  const trimmed = jiraBaseUrl.trim()
  if (!trimmed) return ''
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
  return withProtocol.replace(/\/$/, '')
}

function formatJiraUrl(jiraBaseUrl: string, jiraId: string): string {
  const base = normalizeJiraBaseUrl(jiraBaseUrl)
  const id = jiraId.trim().toUpperCase()
  if (!base || !id) return ''
  return base.endsWith('/browse')
    ? `${base}/${encodeURIComponent(id)}`
    : `${base}/browse/${encodeURIComponent(id)}`
}

function titleText(draft: Draft): string {
  const title = draft.reportTitle.trim()
  if (title) return title
  const app = draft.applicationName.trim() || 'Daily QA'
  const date = formatDateShort(draft.reportDate)
  return date ? `QE Status Report - ${app} - ${date}` : `QE Status Report - ${app}`
}

function formatBulletList(
  items: ListItem[],
  emptyLabel: string,
  jiraBaseUrl = '',
  prefix = '',
): string {
  const filled = items.filter((i) => i.text.trim())
  if (filled.length === 0) return emptyLabel
  return filled
    .map((item) => {
      const jiraId = (item.jiraId ?? '').trim().toUpperCase()
      const jiraUrl = formatJiraUrl(jiraBaseUrl, jiraId)
      const jiraText = jiraId
        ? jiraUrl
          ? `[${jiraId}] ${jiraUrl} - `
          : `[${jiraId}] `
        : ''
      return `• ${jiraText}${prefix}${item.text.trim()}`
    })
    .join('\n')
}

function formatAutomationCoverage(draft: Draft): string {
  const { automated, manual } = getAutomationTotals(draft.testDesignSummaryRows)
  return formatAutomationCoverageText(automated, manual)
}

function appendScopeLines(draft: Draft, lines: string[]): void {
  const inScope = draft.inScopeItems.filter((item) => item.text.trim())
  const outOfScope = draft.outOfScopeItems.filter((item) => item.text.trim())
  if (inScope.length === 0 && outOfScope.length === 0) return

  const confirmedDate = formatDateMonthDay(draft.inScopeConfirmedDate)
  lines.push('')

  if (inScope.length > 0) {
    lines.push(`In scope Items:${confirmedDate ? ` (Confirmed as of ${confirmedDate})` : ''}`)
    lines.push(...inScope.map((item) => `• ${item.text.trim()}`), '')
  }

  if (outOfScope.length > 0) {
    lines.push('Out Of Scope:')
    lines.push(...outOfScope.map((item) => `• ${item.text.trim()}`))
  }
}

function appendOptionalSummaryTables(draft: Draft, lines: string[]): void {
  if (draft.showTestDesignSummary && draft.testDesignSummaryRows.length > 0) {
    lines.push('', 'Test Design Summary:', draft.testDesignSummaryTitle.trim())
    for (const row of draft.testDesignSummaryRows.filter((r) => r.functionality.trim())) {
      lines.push(
        `${row.functionality.trim()}: planned ${row.totalPlanned || '0'}, completed ${row.totalCompleted || '0'}, in progress ${row.totalInProgress || '0'}, not started ${row.totalNotStarted || '0'}, completed today ${row.totalCompletedToday || '0'}`,
      )
    }
    if (draft.testDesignSummaryRemarks.trim()) {
      lines.push(`Remarks: ${draft.testDesignSummaryRemarks.trim()}`)
    }
  }

  if (draft.showTestExecutionSummary && draft.testExecutionSummaryRows.length > 0) {
    lines.push('', 'Test Execution Summary:', draft.testExecutionSummaryTitle.trim())
    for (const row of draft.testExecutionSummaryRows.filter((r) => r.functionality.trim())) {
      lines.push(
        `${row.functionality.trim()}: planned ${row.totalPlanned || '0'}, executed ${row.totalExecuted || '0'}, passed ${row.totalPassed || '0'}, failed ${row.totalFailed || '0'}, NA ${row.totalNa || '0'}, not complete ${row.totalNotComplete || '0'}, blocked ${row.totalBlocked || '0'}, no run ${row.totalNoRun || '0'}`,
      )
    }
    if (draft.testExecutionSummaryRemarks.trim()) {
      lines.push(`Remarks: ${draft.testExecutionSummaryRemarks.trim()}`)
    }
  }
}

function appendDefectsSummary(draft: Draft, lines: string[]): void {
  const defects = draft.defects.filter(
    (defect) =>
      defect.title.trim() ||
      (defect.jiraId ?? '').trim() ||
      defect.note.trim() ||
      defect.link.trim(),
  )
  if (defects.length === 0) return

  lines.push('', 'Defects Summary:')
  for (const defect of defects) {
    const jiraId = (defect.jiraId ?? '').trim().toUpperCase()
    const jiraUrl = formatJiraUrl(draft.jiraBaseUrl, jiraId) || defect.link.trim()
    const jiraText = jiraId ? (jiraUrl ? `${jiraId} (${jiraUrl})` : jiraId) : 'N/A'
    const title = defect.title.trim() || 'N/A'
    const note = defect.note.trim() || 'N/A'
    lines.push(`${defect.status} | ${jiraText} | ${title} | ${note}`)
  }
}

export function formatReport(draft: Draft): string {
  const overall = formatOverallLabel(draft)
  const ragReason = draft.ragReason.trim() || draft.summary.trim() || 'N/A'
  const trend = draft.anticipatedTrend.trim() || overall
  const trendReason = draft.trendReason.trim() || 'N/A'

  const lines: string[] = [
    titleText(draft),
    '',
    `Application / Microservice Name: ${draft.applicationName.trim() || 'N/A'}`,
    `Project QA Start Dt: ${formatDateShort(draft.projectQaStartDate) || 'N/A'}`,
    `Project QA Sign Off Dt: ${formatDateShort(draft.projectQaSignOffDate) || 'N/A'}`,
    `Planned Go-Live Dt: ${formatDateShort(draft.plannedGoLiveDate) || 'N/A'}`,
    `Testing Type: ${draft.testingType.trim() || 'N/A'}`,
    `Test Environment: ${draft.testEnvironment.trim() || 'N/A'}`,
    `QE: ${draft.qeOwner.trim() || 'N/A'}`,
    '',
    `Today's RAG: ${overall}`,
    `Reason (if other than Green): ${ragReason}`,
    '',
    `Anticipated Trend: ${trend}`,
    `Reason (if other than Green): ${trendReason}`,
    '',
    'Key Highlights',
  ]

  const highlightText = formatBulletList(draft.highlights, '', draft.jiraBaseUrl)
  lines.push(highlightText || 'No key highlights listed.')

  lines.push(
    '',
    'Automated vs Manual Coverage',
    formatAutomationCoverage(draft),
    '',
    `Test Evidence / XRAY Path: ${draft.testEvidencePath.trim() || 'N/A'}`,
    `Test Artifacts (Confluence): ${draft.testArtifacts.trim() || 'N/A'}`,
    `Environment Downtime Tracker: ${draft.environmentDowntime.trim() || 'N/A'}`,
  )

  appendScopeLines(draft, lines)
  appendOptionalSummaryTables(draft, lines)
  appendDefectsSummary(draft, lines)

  return lines.join('\n')
}
