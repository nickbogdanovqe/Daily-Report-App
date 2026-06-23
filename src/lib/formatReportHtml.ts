import type { Defect, Draft, ListItem, OverallStatus } from '../types'
import {
  formatAutomationPercent,
  getAutomationTotals,
} from './automationCoverage'
import { buildAutomationPieChartHtml } from './automationPieChartHtml'
import { escapeHtml, resolveOverallStatus } from './reportTheme'

/** Outlook-safe constants (Word rendering engine) */
const FONT = 'Aptos, Calibri, sans-serif'
const HEADER_FONT = 'Aptos, Calibri, sans-serif'
const BODY_FONT = 'Aptos, Calibri, sans-serif'
const HEADER_FONT_SIZE = '12pt'
const BODY_FONT_SIZE = '11pt'
const WIDTH = 980
const BLUE = '#2F5B93'
const GRID = '#2B6EEB'
const LABEL_BG = '#D9E2F3'
const PANEL_BG = '#E8EEF8'
const BODY_COLOR = '#242424'
const SCOPE_FONT = BODY_FONT
const SCOPE_FONT_SIZE = BODY_FONT_SIZE
const SCOPE_HEADING_FONT_SIZE = HEADER_FONT_SIZE
const SCOPE_LINE_HEIGHT = '1.18'
const RAG_GREEN = '#70AD47'
const RAG_AMBER = '#D57132'
const RAG_RED = '#C00000'
const AUTOMATED_COLOR = RAG_GREEN
const MANUAL_COLOR = RAG_RED

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

function normalizeLink(link: string): string {
  const trimmed = link.trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  if (/^(www\.|[^\s/]+\.[^\s]+$)/i.test(trimmed)) return `https://${trimmed}`
  return ''
}

function jiraHref(jiraBaseUrl: string, jiraId: string): string {
  const base = normalizeLink(jiraBaseUrl)
  const id = jiraId.trim().toUpperCase()
  if (!base || !id) return ''
  const cleanBase = base.replace(/\/$/, '')
  return cleanBase.endsWith('/browse')
    ? `${cleanBase}/${encodeURIComponent(id)}`
    : `${cleanBase}/browse/${encodeURIComponent(id)}`
}

function paragraphText(text: string): string {
  const lines = text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length === 0) return '&nbsp;'

  return lines
    .map(
      (line) =>
        `<p style="margin:0 0 8px 0;font-family:${BODY_FONT};font-size:${BODY_FONT_SIZE};line-height:1.32;color:${BODY_COLOR};">${escapeHtml(line)}</p>`,
    )
    .join('')
}

function ragColor(status: OverallStatus): string {
  switch (status) {
    case 'Green':
      return RAG_GREEN
    case 'Amber':
      return RAG_AMBER
    case 'Red':
      return RAG_RED
  }
}

function statusFill(draft: Draft): string {
  return ragColor(resolveOverallStatus(draft))
}

function labelCell(text: string, extra = '', bold = false): string {
  return `style="background-color:${LABEL_BG};border:1px solid ${GRID};padding:7px 8px;font-family:${HEADER_FONT};font-size:${HEADER_FONT_SIZE};line-height:1.15;font-weight:${bold ? '700' : '400'};color:#111111;text-align:right;vertical-align:middle;${extra}">${escapeHtml(text)}`
}

function valueCell(text: string, extra = ''): string {
  return `style="background-color:#FFFFFF;border:1px solid ${GRID};padding:7px 8px;font-family:${BODY_FONT};font-size:${BODY_FONT_SIZE};line-height:1.25;color:${BODY_COLOR};vertical-align:middle;${extra}">${escapeHtml(text) || '&nbsp;'}`
}

function sectionBar(title: string, align: 'left' | 'center' = 'left'): string {
  return `style="background-color:${BLUE};border:1px solid ${GRID};padding:3px 8px;font-family:${HEADER_FONT};font-size:${HEADER_FONT_SIZE};line-height:1.1;font-weight:700;color:#FFFFFF;text-align:${align};vertical-align:middle;">${escapeHtml(title)}`
}

function jiraBadge(item: ListItem, jiraBaseUrl: string): string {
  const jiraId = (item.jiraId ?? '').trim().toUpperCase()
  if (!jiraId) return ''

  const href = jiraHref(jiraBaseUrl, jiraId)
  const label = escapeHtml(jiraId)
  if (!href) {
    return `${label} - `
  }

  return `<a href="${escapeHtml(href)}" style="font-family:${BODY_FONT};font-weight:400;color:#2B49C8;text-decoration:underline;">${label}</a> - `
}

function bulletList(draft: Draft): string {
  const rows = draft.highlights
    .map((item) => ({ item, prefix: '' }))
    .filter(({ item }) => item.text.trim())

  if (rows.length === 0) {
    const summary = draft.summary.trim()
    if (summary) return paragraphText(summary)
    return `<p style="margin:0;font-family:${BODY_FONT};font-size:${BODY_FONT_SIZE};line-height:1.35;color:${BODY_COLOR};font-style:italic;">No key highlights listed.</p>`
  }

  return `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin:0;border-collapse:collapse;font-family:${BODY_FONT};font-size:${BODY_FONT_SIZE};line-height:1.34;color:#000000;">
      ${rows
        .map(
          ({ item, prefix }) =>
            `<tr>
              <td width="18" valign="top" style="width:18px;padding:0 6px 8px 0;font-family:${BODY_FONT};font-size:${BODY_FONT_SIZE};line-height:1.34;color:#000000;text-align:center;">&#8226;</td>
              <td valign="top" style="padding:0 0 8px 0;font-family:${BODY_FONT};font-size:${BODY_FONT_SIZE};line-height:1.34;color:#000000;">${jiraBadge(item, draft.jiraBaseUrl)}${escapeHtml(prefix)}${escapeHtml(item.text.trim())}</td>
            </tr>`,
        )
        .join('')}
    </table>`
}

function automationLegendItem(
  color: string,
  label: string,
  value: number,
  percent: string,
): string {
  return `
          <table cellpadding="0" cellspacing="0" border="0" role="presentation" align="center" style="border-collapse:collapse;margin:0 auto;">
            <tr>
              <td width="10" height="10" bgcolor="${color}" style="width:10px;height:10px;background-color:${color};padding:0;line-height:0;font-size:0;vertical-align:middle;">&nbsp;</td>
              <td style="padding:0 0 0 6px;font-family:${BODY_FONT};font-size:${BODY_FONT_SIZE};line-height:1.35;color:${BODY_COLOR};white-space:nowrap;vertical-align:middle;">${escapeHtml(label)}: ${escapeHtml(String(value))} (${escapeHtml(percent)})</td>
            </tr>
          </table>`
}

function automationCoverageBlock(draft: Draft): string {
  const { automated, manual } = getAutomationTotals(draft.testDesignSummaryRows)
  const total = automated + manual

  if (total <= 0) {
    return `<p style="margin:0;font-family:${BODY_FONT};font-size:${BODY_FONT_SIZE};line-height:1.35;font-weight:400;color:#111111;text-align:center;">Enter automated and manual counts in Test Design Summary</p>`
  }

  const automatedPercent = formatAutomationPercent(automated, total)
  const manualPercent = formatAutomationPercent(manual, total)

  return `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" align="center" style="border-collapse:collapse;font-family:${BODY_FONT};margin:0 auto;">
      <tr>
        <td align="center" style="padding:0 0 12px 0;text-align:center;vertical-align:middle;">
          <table cellpadding="0" cellspacing="0" border="0" role="presentation" align="center" style="margin:0 auto;border-collapse:collapse;">
            <tr>
              <td align="center" style="text-align:center;">
                ${buildAutomationPieChartHtml(automated, manual)}
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td align="center" style="padding:0;text-align:center;vertical-align:middle;">
          <table cellpadding="0" cellspacing="0" border="0" role="presentation" align="center" style="margin:0 auto;border-collapse:collapse;">
            <tr>
              <td align="center" style="padding:0 10px;text-align:center;vertical-align:middle;">${automationLegendItem(AUTOMATED_COLOR, 'Automated', automated, automatedPercent)}</td>
              <td align="center" style="padding:0 10px;text-align:center;vertical-align:middle;">${automationLegendItem(MANUAL_COLOR, 'Manual', manual, manualPercent)}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`
}

function linkedValue(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return '&nbsp;'

  const href = normalizeLink(trimmed)
  if (!href) return escapeHtml(trimmed)

  return `<a href="${escapeHtml(href)}" style="font-family:${BODY_FONT};font-size:${BODY_FONT_SIZE};font-weight:400;color:#8A2BFF;text-decoration:underline;">${escapeHtml(trimmed)}</a>`
}

function defectJiraLink(defect: Defect, jiraBaseUrl: string): string {
  const jiraId = (defect.jiraId ?? '').trim().toUpperCase()
  if (!jiraId) return '&nbsp;'

  const href = jiraHref(jiraBaseUrl, jiraId) || normalizeLink(defect.link)
  const label = escapeHtml(jiraId)
  if (!href) return label

  return `<a href="${escapeHtml(href)}" style="font-family:${BODY_FONT};font-size:${BODY_FONT_SIZE};font-weight:400;color:#2B49C8;text-decoration:underline;">${label}</a>`
}

function titleText(draft: Draft): string {
  const title = draft.reportTitle.trim()
  if (title) return title
  const app = draft.applicationName.trim() || 'Daily QA'
  const date = formatDateShort(draft.reportDate)
  return date ? `QE Status Report - ${app} - ${date}` : `QE Status Report - ${app}`
}

function scopeList(items: ListItem[]): string {
  const filled = items.filter((item) => item.text.trim())
  if (filled.length === 0) return ''

  return `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin:4px 0 30px 38px;border-collapse:collapse;font-family:${SCOPE_FONT};color:#000000;">
      ${filled
        .map(
          (item) =>
            `<tr>
              <td width="22" valign="top" style="width:22px;padding:0 14px 3px 0;font-family:${SCOPE_FONT};font-size:${SCOPE_FONT_SIZE};line-height:${SCOPE_LINE_HEIGHT};color:#000000;text-align:center;">&#8226;</td>
              <td valign="top" style="padding:0 0 3px 0;font-family:${SCOPE_FONT};font-size:${SCOPE_FONT_SIZE};line-height:${SCOPE_LINE_HEIGHT};font-weight:400;color:#000000;">${escapeHtml(item.text.trim())}</td>
            </tr>`,
        )
        .join('')}
    </table>`
}

function scopeBlock(draft: Draft): string {
  const hasInScope = draft.inScopeItems.some((item) => item.text.trim())
  const hasOutOfScope = draft.outOfScopeItems.some((item) => item.text.trim())
  if (!hasInScope && !hasOutOfScope) return ''

  const confirmedDate = formatDateMonthDay(draft.inScopeConfirmedDate)
  const confirmedText = confirmedDate ? ` (Confirmed as of ${escapeHtml(confirmedDate)})` : ''

  return `
<table width="${WIDTH}" cellpadding="0" cellspacing="0" border="0" role="presentation" align="left" style="border-collapse:collapse;width:${WIDTH}px;max-width:${WIDTH}px;font-family:${FONT};clear:both;">
  <tr>
    <td style="padding:24px 14px 0 34px;font-family:${SCOPE_FONT};color:#000000;">
      ${
        hasInScope
          ? `<p style="margin:0;font-family:${SCOPE_FONT};font-size:${SCOPE_HEADING_FONT_SIZE};line-height:${SCOPE_LINE_HEIGHT};font-weight:400;color:#000000;"><span style="font-weight:700;text-decoration:underline;">In scope Items:</span>${confirmedText}</p>${scopeList(draft.inScopeItems)}`
          : ''
      }
      ${
        hasOutOfScope
          ? `<p style="margin:0;font-family:${SCOPE_FONT};font-size:${SCOPE_HEADING_FONT_SIZE};line-height:${SCOPE_LINE_HEIGHT};font-weight:700;color:#000000;text-decoration:underline;">Out Of Scope:</p>${scopeList(draft.outOfScopeItems)}`
          : ''
      }
    </td>
  </tr>
</table>`
}

function isTotalRow(row: { functionality: string }): boolean {
  return row.functionality.trim().toLowerCase() === 'total'
}

function summaryLabel(title: string): string {
  return `
<table width="${WIDTH}" cellpadding="0" cellspacing="0" border="0" role="presentation" align="left" style="border-collapse:collapse;width:${WIDTH}px;max-width:${WIDTH}px;font-family:${FONT};clear:both;">
  <tr>
    <td style="padding:22px 0 3px 8px;font-family:${HEADER_FONT};font-size:${HEADER_FONT_SIZE};line-height:1.15;font-weight:700;color:#000000;text-decoration:underline;">
      ${escapeHtml(title)}
    </td>
  </tr>
</table>`
}

function reportHeaderCell(label: string, extra = ''): string {
  return `style="background-color:${LABEL_BG};border:1px solid ${GRID};padding:5px 8px;font-family:${HEADER_FONT};font-size:${HEADER_FONT_SIZE};line-height:1.2;font-weight:700;color:#000000;text-align:center;vertical-align:middle;${extra}">${escapeHtml(label)}`
}

function reportValueCell(value: string, extra = ''): string {
  return `style="background-color:#FFFFFF;border:1px solid ${GRID};padding:4px 8px;font-family:${BODY_FONT};font-size:${BODY_FONT_SIZE};line-height:1.15;font-weight:400;color:#000000;text-align:center;vertical-align:middle;${extra}">${escapeHtml(value) || '&nbsp;'}`
}

function totalValueCell(value: string, extra = ''): string {
  return `style="background-color:${LABEL_BG};border:1px solid ${GRID};padding:4px 8px;font-family:${BODY_FONT};font-size:${BODY_FONT_SIZE};line-height:1.15;font-weight:400;color:#000000;text-align:center;vertical-align:middle;${extra}">${escapeHtml(value) || '&nbsp;'}`
}

function remarksCell(text: string, rowspan: number): string {
  return `<td rowspan="${rowspan}" style="background-color:#FFFFFF;border:1px solid ${GRID};padding:12px 14px;font-family:${BODY_FONT};font-size:${BODY_FONT_SIZE};line-height:1.28;font-weight:400;color:#000000;text-align:center;vertical-align:middle;">${paragraphText(text)}</td>`
}

function testDesignSummaryBlock(draft: Draft): string {
  if (!draft.showTestDesignSummary) return ''

  const rows = draft.testDesignSummaryRows.filter((row) => row.functionality.trim())
  if (rows.length === 0) return ''

  const normalRows = rows.filter((row) => !isTotalRow(row))
  const totalRows = rows.filter(isTotalRow)
  const title = draft.testDesignSummaryTitle.trim() || 'Test Design Summary'
  const remarks = draft.testDesignSummaryRemarks.trim()

  return `
${summaryLabel('Test Design Summary:')}
<table width="${WIDTH}" cellpadding="0" cellspacing="0" border="0" role="presentation" align="left" style="border-collapse:collapse;width:${WIDTH}px;max-width:${WIDTH}px;table-layout:fixed;font-family:${FONT};clear:both;">
  <colgroup>
    <col style="width:110px;" />
    <col style="width:90px;" />
    <col style="width:105px;" />
    <col style="width:95px;" />
    <col style="width:100px;" />
    <col style="width:145px;" />
    <col style="width:335px;" />
  </colgroup>
  <tr>
    <td colspan="7" style="background-color:${BLUE};border:1px solid ${GRID};padding:4px 8px;font-family:${HEADER_FONT};font-size:${HEADER_FONT_SIZE};line-height:1.1;font-weight:700;color:#FFFFFF;text-align:center;vertical-align:middle;">
      ${escapeHtml(title)}
    </td>
  </tr>
  <tr>
    <td ${reportHeaderCell('Functionality/ Test Cases')}</td>
    <td ${reportHeaderCell('Total Planned')}</td>
    <td ${reportHeaderCell('Total Completed')}</td>
    <td ${reportHeaderCell('Total In Progress')}</td>
    <td ${reportHeaderCell('Total Not Started')}</td>
    <td ${reportHeaderCell('Total Completed today')}</td>
    <td ${reportHeaderCell('Remarks')}</td>
  </tr>
  ${normalRows
    .map(
      (row, index) => `
  <tr>
    <td ${reportValueCell(row.functionality, 'text-align:left;')}</td>
    <td ${reportValueCell(row.totalPlanned)}</td>
    <td ${reportValueCell(row.totalCompleted)}</td>
    <td ${reportValueCell(row.totalInProgress)}</td>
    <td ${reportValueCell(row.totalNotStarted)}</td>
    <td ${reportValueCell(row.totalCompletedToday)}</td>
    ${index === 0 && normalRows.length > 0 ? remarksCell(remarks, normalRows.length) : ''}
  </tr>`,
    )
    .join('')}
  ${totalRows
    .map(
      (row) => `
  <tr>
    <td ${totalValueCell(row.functionality)}</td>
    <td ${totalValueCell(row.totalPlanned)}</td>
    <td ${totalValueCell(row.totalCompleted)}</td>
    <td ${totalValueCell(row.totalInProgress)}</td>
    <td ${totalValueCell(row.totalNotStarted)}</td>
    <td ${totalValueCell(row.totalCompletedToday)}</td>
    <td ${totalValueCell('')}</td>
  </tr>`,
    )
    .join('')}
</table>`
}

function testExecutionSummaryBlock(draft: Draft): string {
  if (!draft.showTestExecutionSummary) return ''

  const rows = draft.testExecutionSummaryRows.filter((row) => row.functionality.trim())
  if (rows.length === 0) return ''

  const normalRows = rows.filter((row) => !isTotalRow(row))
  const totalRows = rows.filter(isTotalRow)
  const title = draft.testExecutionSummaryTitle.trim() || 'Test Execution Summary'
  const remarks = draft.testExecutionSummaryRemarks.trim()

  return `
${summaryLabel('Test Execution Summary:')}
<table width="${WIDTH}" cellpadding="0" cellspacing="0" border="0" role="presentation" align="left" style="border-collapse:collapse;width:${WIDTH}px;max-width:${WIDTH}px;table-layout:fixed;font-family:${FONT};clear:both;">
  <colgroup>
    <col style="width:115px;" />
    <col style="width:70px;" />
    <col style="width:75px;" />
    <col style="width:75px;" />
    <col style="width:70px;" />
    <col style="width:70px;" />
    <col style="width:110px;" />
    <col style="width:90px;" />
    <col style="width:85px;" />
    <col style="width:220px;" />
  </colgroup>
  <tr>
    <td colspan="10" style="background-color:${BLUE};border:1px solid ${GRID};padding:4px 8px;font-family:${HEADER_FONT};font-size:${HEADER_FONT_SIZE};line-height:1.1;font-weight:700;color:#FFFFFF;text-align:center;vertical-align:middle;">
      ${escapeHtml(title)}
    </td>
  </tr>
  <tr>
    <td ${reportHeaderCell('Functionality/ Test Cases')}</td>
    <td ${reportHeaderCell('Total Planned')}</td>
    <td ${reportHeaderCell('Total Executed')}</td>
    <td ${reportHeaderCell('Total Passed')}</td>
    <td ${reportHeaderCell('Total Failed')}</td>
    <td ${reportHeaderCell('Total NA')}</td>
    <td ${reportHeaderCell('Total Not Complete')}</td>
    <td ${reportHeaderCell('Total Blocked')}</td>
    <td ${reportHeaderCell('Total No Run')}</td>
    <td ${reportHeaderCell('Remarks')}</td>
  </tr>
  ${normalRows
    .map(
      (row, index) => `
  <tr>
    <td ${reportValueCell(row.functionality, 'text-align:left;')}</td>
    <td ${reportValueCell(row.totalPlanned)}</td>
    <td ${reportValueCell(row.totalExecuted)}</td>
    <td ${reportValueCell(row.totalPassed)}</td>
    <td ${reportValueCell(row.totalFailed)}</td>
    <td ${reportValueCell(row.totalNa)}</td>
    <td ${reportValueCell(row.totalNotComplete)}</td>
    <td ${reportValueCell(row.totalBlocked)}</td>
    <td ${reportValueCell(row.totalNoRun)}</td>
    ${index === 0 && normalRows.length > 0 ? remarksCell(remarks, normalRows.length) : ''}
  </tr>`,
    )
    .join('')}
  ${totalRows
    .map(
      (row) => `
  <tr>
    <td ${totalValueCell(row.functionality)}</td>
    <td ${totalValueCell(row.totalPlanned)}</td>
    <td ${totalValueCell(row.totalExecuted)}</td>
    <td ${totalValueCell(row.totalPassed)}</td>
    <td ${totalValueCell(row.totalFailed)}</td>
    <td ${totalValueCell(row.totalNa)}</td>
    <td ${totalValueCell(row.totalNotComplete)}</td>
    <td ${totalValueCell(row.totalBlocked)}</td>
    <td ${totalValueCell(row.totalNoRun)}</td>
    <td ${totalValueCell('')}</td>
  </tr>`,
    )
    .join('')}
</table>`
}

function optionalSummaryTablesBlock(draft: Draft): string {
  return `${testDesignSummaryBlock(draft)}${testExecutionSummaryBlock(draft)}`
}

function defectsSummaryTableBlock(draft: Draft): string {
  const defects = draft.defects.filter(
    (defect) =>
      defect.title.trim() ||
      (defect.jiraId ?? '').trim() ||
      defect.note.trim() ||
      defect.link.trim(),
  )

  if (defects.length === 0) return ''

  return `
${summaryLabel('Defects Summary:')}
<table width="${WIDTH}" cellpadding="0" cellspacing="0" border="0" role="presentation" align="left" style="border-collapse:collapse;width:${WIDTH}px;max-width:${WIDTH}px;table-layout:fixed;font-family:${FONT};clear:both;">
  <colgroup>
    <col style="width:140px;" />
    <col style="width:140px;" />
    <col style="width:390px;" />
    <col style="width:310px;" />
  </colgroup>
  <tr>
    <td colspan="4" style="background-color:${BLUE};border:1px solid ${GRID};padding:4px 8px;font-family:${HEADER_FONT};font-size:${HEADER_FONT_SIZE};line-height:1.1;font-weight:700;color:#FFFFFF;text-align:center;vertical-align:middle;">
      Defects Summary
    </td>
  </tr>
  <tr>
    <td ${reportHeaderCell('Defect Status')}</td>
    <td ${reportHeaderCell('JIRA ID')}</td>
    <td ${reportHeaderCell('Description/ Name')}</td>
    <td ${reportHeaderCell('Notes')}</td>
  </tr>
  ${defects
    .map(
      (defect) => `
  <tr>
    <td ${reportValueCell(defect.status)}</td>
    <td style="background-color:#FFFFFF;border:1px solid ${GRID};padding:4px 8px;font-family:${BODY_FONT};font-size:${BODY_FONT_SIZE};line-height:1.15;font-weight:400;color:#000000;text-align:center;vertical-align:middle;">${defectJiraLink(defect, draft.jiraBaseUrl)}</td>
    <td ${reportValueCell(defect.title.trim(), 'text-align:left;')}</td>
    <td ${reportValueCell(defect.note.trim(), 'text-align:left;')}</td>
  </tr>`,
    )
    .join('')}
</table>`
}

export function formatReportBody(draft: Draft): string {
  const ragReason = draft.ragReason.trim() || draft.summary.trim()
  const trendReason = draft.trendReason.trim()
  const ragFill = statusFill(draft)
  const anticipatedFill = ragColor(draft.anticipatedTrend)

  return `
<table width="${WIDTH}" cellpadding="0" cellspacing="0" border="0" role="presentation" align="left" style="border-collapse:collapse;width:${WIDTH}px;max-width:${WIDTH}px;table-layout:fixed;font-family:${FONT};border:1px solid ${GRID};">
  <colgroup>
    <col style="width:195px;" />
    <col style="width:370px;" />
    <col style="width:150px;" />
    <col style="width:265px;" />
  </colgroup>
  <tr>
    <td colspan="4" style="background-color:${BLUE};border:1px solid ${GRID};padding:5px 8px;font-family:${HEADER_FONT};font-size:${HEADER_FONT_SIZE};line-height:1.1;font-weight:700;color:#FFFFFF;text-align:center;vertical-align:middle;">
      ${escapeHtml(titleText(draft))}
    </td>
  </tr>
  <tr>
    <td ${labelCell('Application/ Microservice Name')}</td>
    <td ${valueCell(draft.applicationName)}</td>
    <td ${labelCell("Today's RAG", '', true)}</td>
    <td style="background-color:${ragFill};border:1px solid ${GRID};padding:7px 8px;font-family:${HEADER_FONT};font-size:${HEADER_FONT_SIZE};line-height:1.15;font-weight:400;color:#FFFFFF;text-align:center;vertical-align:middle;">
      &nbsp;
    </td>
  </tr>
  <tr>
    <td ${labelCell('Project QA Start Dt')}</td>
    <td ${valueCell(formatDateShort(draft.projectQaStartDate))}</td>
    <td rowspan="2" ${labelCell('Reason(If other than Green)', 'height:96px;', true)}</td>
    <td rowspan="2" style="background-color:#FFFFFF;border:1px solid ${GRID};padding:13px 8px;font-family:${BODY_FONT};font-size:${BODY_FONT_SIZE};line-height:1.3;color:${BODY_COLOR};vertical-align:middle;">
      ${paragraphText(ragReason)}
    </td>
  </tr>
  <tr>
    <td ${labelCell('Project QA Sign Off Dt', 'height:86px;')}</td>
    <td ${valueCell(formatDateShort(draft.projectQaSignOffDate), 'height:86px;')}</td>
  </tr>
  <tr>
    <td ${labelCell('Planned Go-Live Dt')}</td>
    <td ${valueCell(formatDateShort(draft.plannedGoLiveDate))}</td>
    <td ${labelCell('Anticipated Trend', '', true)}</td>
    <td style="background-color:${anticipatedFill};border:1px solid ${GRID};padding:7px 8px;font-family:${HEADER_FONT};font-size:${HEADER_FONT_SIZE};line-height:1.15;font-weight:400;color:#FFFFFF;text-align:center;vertical-align:middle;">
      &nbsp;
    </td>
  </tr>
  <tr>
    <td ${labelCell('Testing Type')}</td>
    <td ${valueCell(draft.testingType)}</td>
    <td rowspan="3" ${labelCell('Reason(If other than Green)', 'height:106px;', true)}</td>
    <td rowspan="3" style="background-color:#FFFFFF;border:1px solid ${GRID};padding:13px 8px;font-family:${BODY_FONT};font-size:${BODY_FONT_SIZE};line-height:1.3;color:${BODY_COLOR};vertical-align:middle;">
      ${paragraphText(trendReason)}
    </td>
  </tr>
  <tr>
    <td ${labelCell('Test Environment')}</td>
    <td ${valueCell(draft.testEnvironment)}</td>
  </tr>
  <tr>
    <td ${labelCell('QE')}</td>
    <td ${valueCell(draft.qeOwner)}</td>
  </tr>
  <tr>
    <td colspan="2" ${sectionBar('Key Highlights')}</td>
    <td colspan="2" ${sectionBar('Automated vs Manual Coverage', 'center')}</td>
  </tr>
  <tr>
    <td colspan="2" style="background-color:${PANEL_BG};border:1px solid ${GRID};padding:22px 18px 22px 18px;font-family:${BODY_FONT};font-size:${BODY_FONT_SIZE};line-height:1.35;color:#000000;vertical-align:top;height:236px;">
      ${bulletList(draft)}
    </td>
    <td colspan="2" style="background-color:${PANEL_BG};border:1px solid ${GRID};padding:24px;font-family:${BODY_FONT};font-size:${BODY_FONT_SIZE};line-height:1.35;color:#000000;text-align:center;vertical-align:middle;height:236px;">
      ${automationCoverageBlock(draft)}
    </td>
  </tr>
  <tr>
    <td style="background-color:${BLUE};border:1px solid ${GRID};padding:5px 8px;font-family:${HEADER_FONT};font-size:${HEADER_FONT_SIZE};line-height:1.1;font-weight:400;color:#FFFFFF;vertical-align:middle;">Test Evidence/ XRAY Path</td>
    <td colspan="3" style="background-color:#FFFFFF;border:1px solid ${GRID};padding:5px 8px;font-family:${BODY_FONT};font-size:${BODY_FONT_SIZE};line-height:1.15;color:${BODY_COLOR};vertical-align:middle;">${linkedValue(draft.testEvidencePath)}</td>
  </tr>
  <tr>
    <td style="background-color:${BLUE};border:1px solid ${GRID};padding:5px 8px;font-family:${HEADER_FONT};font-size:${HEADER_FONT_SIZE};line-height:1.1;font-weight:400;color:#FFFFFF;vertical-align:middle;">Test Artifacts (Confluence)</td>
    <td colspan="3" style="background-color:#FFFFFF;border:1px solid ${GRID};padding:5px 8px;font-family:${BODY_FONT};font-size:${BODY_FONT_SIZE};line-height:1.15;color:${BODY_COLOR};vertical-align:middle;">${linkedValue(draft.testArtifacts)}</td>
  </tr>
  <tr>
    <td style="background-color:${BLUE};border:1px solid ${GRID};padding:5px 8px;font-family:${HEADER_FONT};font-size:${HEADER_FONT_SIZE};line-height:1.1;font-weight:400;color:#FFFFFF;vertical-align:middle;">Environment Downtime Tracker</td>
    <td colspan="3" style="background-color:#FFFFFF;border:1px solid ${GRID};padding:5px 8px;font-family:${BODY_FONT};font-size:${BODY_FONT_SIZE};line-height:1.15;color:${BODY_COLOR};vertical-align:middle;">${linkedValue(draft.environmentDowntime)}</td>
  </tr>
</table>
${scopeBlock(draft)}
${optionalSummaryTablesBlock(draft)}
${defectsSummaryTableBlock(draft)}`
}

export function formatReportHtml(draft: Draft): string {
  const body = formatReportBody(draft)
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<!--[if mso]>
<noscript>
<xml>
<o:OfficeDocumentSettings>
<o:AllowPNG/>
<o:PixelsPerInch>96</o:PixelsPerInch>
</o:OfficeDocumentSettings>
</xml>
</noscript>
<![endif]-->
</head>
<body style="margin:0;padding:12px;background-color:#FFFFFF;font-family:${BODY_FONT};font-size:${BODY_FONT_SIZE};color:${BODY_COLOR};">
${body}
</body>
</html>`
}
