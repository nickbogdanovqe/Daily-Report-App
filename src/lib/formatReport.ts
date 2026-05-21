import type { Draft, ListItem } from '../types'

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

function formatOverall(draft: Draft): string {
  const custom = draft.overallStatusCustom.trim()
  if (custom) return custom
  return draft.overallStatus
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

function formatBulletList(
  items: ListItem[],
  emptyLabel: string,
  jiraBaseUrl = '',
  showJiraId = false,
): string {
  const filled = items.map((i) => i.text.trim()).filter(Boolean)
  if (filled.length === 0) return emptyLabel
  return items
    .filter((i) => i.text.trim())
    .map((item) => {
      const jiraId = (item.jiraId ?? '').trim().toUpperCase()
      const jiraUrl = showJiraId ? formatJiraUrl(jiraBaseUrl, jiraId) : ''
      const jiraText = showJiraId && jiraId
        ? jiraUrl
          ? `[${jiraId}] ${jiraUrl} — `
          : `[${jiraId}] `
        : ''
      return `• ${jiraText}${item.text.trim()}`
    })
    .join('\n')
}

function formatDefectLink(link: string): string {
  const trimmed = link.trim()
  if (!trimmed) return ''
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}

export function formatReport(draft: Draft): string {
  const lines: string[] = [
    'Hi team,',
    '',
    `Please find below my daily status update for Aurora Mobile (${formatDateLong(draft.reportDate)}).`,
    '',
    `Overall status: ${formatOverall(draft)}`,
    '',
  ]

  const summary = draft.summary.trim()
  if (summary) {
    lines.push('Summary', summary, '')
  }

  lines.push(
    'Current tasks',
    formatBulletList(draft.tasks, '(none listed)', draft.jiraBaseUrl, true),
    '',
    'Blockers',
    formatBulletList(draft.blockers, 'None reported', draft.jiraBaseUrl, true),
    '',
    'Highlights',
    formatBulletList(draft.highlights, '(none listed)'),
    '',
    'Defects',
  )

  const defects = draft.defects.filter((d) => d.title.trim())
  if (defects.length === 0) {
    lines.push('None reported')
  } else {
    for (const d of defects) {
      const jiraId = (d.jiraId ?? '').trim().toUpperCase()
      const jiraUrl = formatJiraUrl(draft.jiraBaseUrl, jiraId)
      const jiraText = jiraId
        ? jiraUrl
          ? `[${jiraId}] ${jiraUrl} — `
          : `[${jiraId}] `
        : ''
      const note = d.note.trim()
      const link = formatDefectLink(d.link)
      const linkText = link ? ` — ${link}` : ''
      const noteText = note ? ` — ${note}` : ''
      lines.push(`[${d.status}] ${jiraText}${d.title.trim()}${linkText}${noteText}`)
    }
  }

  return lines.join('\n')
}
