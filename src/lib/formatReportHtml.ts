import type { Draft, ListItem } from '../types'
import {
  escapeHtml,
  formatOverallLabel,
  overallStatusColors,
  resolveOverallStatus,
  statusColors,
} from './reportTheme'

/** Outlook-safe constants (Word rendering engine) */
const FONT = 'Aptos, Calibri, Segoe UI, sans-serif'
const WIDTH = 760
const BODY_COLOR = '#323130'
const HEADING_COLOR = '#0050B5'
const HEADER_BG = '#0050B5'
const BORDER = '#B4B4B4'
const ALT_ROW = '#F3F2F1'

function formatDateLong(isoDate: string): string {
  const date = new Date(`${isoDate}T12:00:00`)
  if (Number.isNaN(date.getTime())) return isoDate
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
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

/** Outlook-friendly label cell (no border-radius, no inline-block) */
function labelCell(text: string, bg: string, color: string): string {
  return `<span style="font-family:${FONT};font-size:10pt;font-weight:bold;color:${color};background-color:${bg};padding:2px 8px;mso-padding-alt:2px 8px;">${escapeHtml(text)}</span>`
}

function sectionHeading(title: string): string {
  return `
    <tr>
      <td style="padding:18px 0 6px 0;font-family:${FONT};font-size:12pt;font-weight:bold;color:${HEADING_COLOR};border-bottom:2px solid ${HEADING_COLOR};">
        ${escapeHtml(title)}
      </td>
    </tr>`
}

function bulletRows(
  items: ListItem[],
  emptyText: string,
  jiraBaseUrl = '',
  showJiraId = false,
): string {
  const filled = items.filter((i) => i.text.trim())
  if (filled.length === 0) {
    return `
    <tr>
      <td style="padding:4px 0 8px 0;font-family:${FONT};font-size:11pt;color:#605E5C;font-style:italic;">
        ${escapeHtml(emptyText)}
      </td>
    </tr>`
  }
  return filled
    .map((item) => {
      const jiraId = (item.jiraId ?? '').trim().toUpperCase()
      const href = showJiraId ? jiraHref(jiraBaseUrl, jiraId) : ''
      const jiraLabel = showJiraId && jiraId
        ? href
          ? `<a href="${escapeHtml(href)}" style="color:${HEADING_COLOR};font-weight:bold;text-decoration:underline;">${escapeHtml(jiraId)}</a>&nbsp;`
          : `<strong style="color:${HEADING_COLOR};">${escapeHtml(jiraId)}</strong>&nbsp;`
        : ''

      return `
    <tr>
      <td style="padding:3px 0 3px 12px;font-family:${FONT};font-size:11pt;line-height:1.45;color:${BODY_COLOR};">
        <span style="font-family:${FONT};color:${HEADING_COLOR};font-weight:bold;">&#8226;&nbsp;</span>${jiraLabel}${escapeHtml(item.text.trim())}
      </td>
    </tr>`
    })
    .join('')
}

function kpiCell(label: string, valueHtml: string, accent = HEADING_COLOR): string {
  return `
    <td width="33.33%" valign="top" style="padding:4px;">
      <table width="100%" height="86" cellpadding="0" cellspacing="0" border="0" role="presentation" style="border-collapse:collapse;border:1px solid ${BORDER};background-color:#FFFFFF;height:86px;">
        <tr>
          <td width="4" bgcolor="${accent}" style="width:4px;background-color:${accent};font-size:1px;line-height:1px;">&nbsp;</td>
          <td valign="top" style="padding:11px 12px 10px 12px;font-family:${FONT};height:64px;">
            <p style="margin:0 0 7px 0;font-size:8.5pt;line-height:1.2;font-weight:bold;color:#605E5C;text-transform:uppercase;letter-spacing:.3px;">${escapeHtml(label)}</p>
            <div style="font-family:${FONT};font-size:11pt;line-height:1.35;color:${BODY_COLOR};">${valueHtml}</div>
          </td>
        </tr>
      </table>
    </td>`
}

export function formatReportBody(draft: Draft): string {
  const overallLabel = formatOverallLabel(draft)
  const overallKey = resolveOverallStatus(draft)
  const overall = overallStatusColors(overallKey)

  const defects = draft.defects.filter((d) => d.title.trim())

  const openCount = defects.filter(
    (d) => d.status === 'Open' || d.status === 'New' || d.status === 'In progress',
  ).length

  const summaryBlock = draft.summary.trim()
    ? `
    <tr>
      <td style="padding:0 0 4px 0;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="border-collapse:collapse;border:1px solid ${BORDER};background-color:#F8F9FA;">
          <tr>
            <td style="padding:12px 14px;font-family:${FONT};">
              <p style="margin:0 0 6px 0;font-size:10pt;font-weight:bold;color:${HEADING_COLOR};">Summary</p>
              <p style="margin:0;font-size:11pt;line-height:1.5;color:${BODY_COLOR};">${escapeHtml(draft.summary.trim())}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>`
    : ''

  const defectsBlock =
    defects.length === 0
      ? `
    <tr>
      <td style="padding:4px 0 8px 0;font-family:${FONT};font-size:11pt;color:#605E5C;font-style:italic;">None reported</td>
    </tr>`
      : `
    <tr>
      <td style="padding:4px 0 8px 0;">
        <table width="100%" cellpadding="0" cellspacing="0" border="1" role="presentation" style="border-collapse:collapse;border-color:${BORDER};font-family:${FONT};">
          <tr style="background-color:#E8EEF4;">
            <th align="left" style="padding:8px 10px;font-size:10pt;font-weight:bold;color:${HEADING_COLOR};border:1px solid ${BORDER};">Status</th>
            <th align="left" style="padding:8px 10px;font-size:10pt;font-weight:bold;color:${HEADING_COLOR};border:1px solid ${BORDER};">Defect</th>
            <th align="left" style="padding:8px 10px;font-size:10pt;font-weight:bold;color:${HEADING_COLOR};border:1px solid ${BORDER};">Notes</th>
          </tr>
          ${defects
            .map((d, i) => {
              const st = statusColors(d.status)
              const rowBg = i % 2 === 1 ? ALT_ROW : '#FFFFFF'
              const link = normalizeLink(d.link)
              const defectTitle = escapeHtml(d.title.trim())
              const defectCell = link
                ? `<a href="${escapeHtml(link)}" style="color:${HEADING_COLOR};font-weight:bold;text-decoration:underline;">${defectTitle}</a>`
                : defectTitle
              return `
          <tr style="background-color:${rowBg};">
            <td valign="top" style="padding:8px 10px;border:1px solid ${BORDER};white-space:nowrap;">${labelCell(d.status, st.bg, st.text)}</td>
            <td valign="top" style="padding:8px 10px;border:1px solid ${BORDER};font-size:11pt;font-weight:bold;color:${BODY_COLOR};">${defectCell}</td>
            <td valign="top" style="padding:8px 10px;border:1px solid ${BORDER};font-size:10pt;color:#605E5C;">${d.note.trim() ? escapeHtml(d.note.trim()) : '—'}</td>
          </tr>`
            })
            .join('')}
        </table>
      </td>
    </tr>`

  return `
<table width="${WIDTH}" cellpadding="0" cellspacing="0" border="0" role="presentation" align="left" style="border-collapse:collapse;width:${WIDTH}px;max-width:${WIDTH}px;font-family:${FONT};">
  <tr>
    <td bgcolor="${HEADER_BG}" style="background-color:${HEADER_BG};padding:20px 24px;">
      <p style="margin:0 0 4px 0;font-family:${FONT};font-size:9pt;font-weight:bold;color:#B4C7E7;text-transform:uppercase;letter-spacing:1px;">Aurora Mobile</p>
      <p style="margin:0;font-family:${FONT};font-size:16pt;font-weight:bold;color:#FFFFFF;">Daily QA Status Report</p>
    </td>
  </tr>
  <tr>
    <td style="padding:16px 0 0 0;font-family:${FONT};font-size:11pt;line-height:1.5;color:${BODY_COLOR};">
      <p style="margin:0;">Hi team,</p>
      <p style="margin:8px 0 0 0;">Please find below my daily status update for <strong>Aurora Mobile</strong> (${escapeHtml(formatDateLong(draft.reportDate))}).</p>
    </td>
  </tr>
  <tr>
    <td style="padding:14px 0 0 0;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="border-collapse:collapse;">
        <tr>
          ${kpiCell(
            'Report date',
            `<strong style="color:${BODY_COLOR};">${escapeHtml(formatDateLong(draft.reportDate))}</strong>`,
          )}
          ${kpiCell(
            'Overall status',
            labelCell(overallLabel, overall.bg, overall.text),
            overall.text,
          )}
          ${kpiCell(
            'Defects',
            `<strong>${defects.length}</strong> total&nbsp;&nbsp; <span style="color:${HEADING_COLOR};"><strong>${openCount}</strong> open</span>`,
          )}
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding:8px 0 0 0;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="border-collapse:collapse;">
        ${summaryBlock}
        ${sectionHeading('Current tasks')}
        ${bulletRows(draft.tasks, 'No tasks listed for today.', draft.jiraBaseUrl, true)}
        ${sectionHeading('Blockers')}
        ${bulletRows(draft.blockers, 'None reported.', draft.jiraBaseUrl, true)}
        ${sectionHeading('Highlights')}
        ${bulletRows(draft.highlights, 'No highlights listed.')}
        ${sectionHeading('Defects')}
        ${defectsBlock}
      </table>
    </td>
  </tr>
  <tr>
    <td bgcolor="#F3F2F1" style="background-color:#F3F2F1;padding:10px 14px;border-top:1px solid ${BORDER};">
      <p style="margin:0;font-family:${FONT};font-size:9pt;color:#605E5C;text-align:center;">Aurora Mobile</p>
    </td>
  </tr>
</table>`
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
<body style="margin:0;padding:12px;background-color:#FFFFFF;font-family:${FONT};font-size:11pt;color:${BODY_COLOR};">
${body}
</body>
</html>`
}
