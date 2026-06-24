import { describe, expect, it } from 'vitest'
import { formatJiraUrl, normalizeJiraBaseUrl } from './jiraUrl'

describe('jiraUrl', () => {
  it('normalizes base URL without protocol or trailing slash', () => {
    expect(normalizeJiraBaseUrl('firsthorizon.atlassian.net/browse')).toBe(
      'https://firsthorizon.atlassian.net/browse',
    )
  })

  it('builds browse URLs from base and ticket ID', () => {
    expect(
      formatJiraUrl(
        'https://firsthorizon.atlassian.net/browse',
        'digeng-21078',
      ),
    ).toBe('https://firsthorizon.atlassian.net/browse/DIGENG-21078')
  })

  it('appends browse segment when base URL omits it', () => {
    expect(
      formatJiraUrl('https://firsthorizon.atlassian.net', 'DIGENG-21078'),
    ).toBe('https://firsthorizon.atlassian.net/browse/DIGENG-21078')
  })
})
