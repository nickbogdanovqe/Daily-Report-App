export function normalizeJiraBaseUrl(jiraBaseUrl: string): string {
  const trimmed = jiraBaseUrl.trim()
  if (!trimmed) return ''
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
  return withProtocol.replace(/\/$/, '')
}

export function formatJiraUrl(jiraBaseUrl: string, jiraId: string): string {
  const base = normalizeJiraBaseUrl(jiraBaseUrl)
  const id = jiraId.trim().toUpperCase()
  if (!base || !id) return ''
  return base.endsWith('/browse')
    ? `${base}/${encodeURIComponent(id)}`
    : `${base}/browse/${encodeURIComponent(id)}`
}

export function hasJiraBaseUrl(jiraBaseUrl: string): boolean {
  return normalizeJiraBaseUrl(jiraBaseUrl).length > 0
}
