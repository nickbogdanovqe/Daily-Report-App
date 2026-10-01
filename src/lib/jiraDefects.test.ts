import { describe, expect, it } from 'vitest'
import type { Defect } from '../types'
import {
  DefectsImportFileSchema,
  buildDefectsJql,
  cleanTitle,
  isProductionIssue,
  mapJiraIssueToImport,
  mapJiraStatus,
  mergeImportedDefects,
  sortDefects,
  type ImportedDefect,
} from './jiraDefects'

function defect(overrides: Partial<Defect>): Defect {
  return {
    id: overrides.id ?? overrides.jiraId ?? 'manual',
    title: '',
    status: 'Open',
    jiraId: '',
    link: '',
    note: '',
    isProduction: false,
    ...overrides,
  }
}

function imported(overrides: Partial<ImportedDefect> & { jiraId: string }): ImportedDefect {
  return {
    title: overrides.jiraId,
    status: 'Open',
    isProduction: false,
    note: '',
    ...overrides,
  }
}

describe('buildDefectsJql', () => {
  it('scopes to Aurora Mobile bugs on the requested release', () => {
    expect(buildDefectsJql('Aurora Gatlinburg')).toBe(
      'project = DIGENG AND issuetype = Bug AND component = "Aurora Mobile" AND fixVersion = "Aurora Gatlinburg" ORDER BY priority DESC, created DESC',
    )
  })
})

describe('isProductionIssue', () => {
  it('detects the production label', () => {
    expect(
      isProductionIssue({ summary: 'Anything', labels: ['AuroraMobile', 'aurora_production_issue'] }),
    ).toBe(true)
  })

  it('detects "| Production |" in the summary', () => {
    expect(
      isProductionIssue({
        summary: 'Mobile | Production | Interest rate not displaying correctly',
        labels: [],
      }),
    ).toBe(true)
  })

  it('treats other issues as non-production', () => {
    expect(
      isProductionIssue({ summary: 'Mobile | Test | Deposit screen errors', labels: ['AuroraMobile'] }),
    ).toBe(false)
  })
})

describe('mapJiraStatus', () => {
  it('maps Jira workflow names onto report statuses', () => {
    expect(mapJiraStatus('Backlog')).toBe('New')
    expect(mapJiraStatus('Ready')).toBe('Open')
    expect(mapJiraStatus('In Progress')).toBe('In progress')
    expect(mapJiraStatus('Peer Review')).toBe('In progress')
    expect(mapJiraStatus('Testing')).toBe('Fixed')
    expect(mapJiraStatus('Done')).toBe('Verified')
    expect(mapJiraStatus('Cancelled')).toBe("Won't fix")
  })

  it('falls back to Open for unknown statuses', () => {
    expect(mapJiraStatus('Something Custom')).toBe('Open')
    expect(mapJiraStatus(undefined)).toBe('Open')
  })
})

describe('cleanTitle', () => {
  it('strips Aurora Mobile and Production lead-ins', () => {
    expect(cleanTitle('Aurora Mobile | Production | Unable to submit an external transfer.')).toBe(
      'Unable to submit an external transfer.',
    )
    expect(cleanTitle('Mobile | Production | Interest rate not displaying correctly')).toBe(
      'Interest rate not displaying correctly',
    )
  })

  it('keeps meaningful feature segments', () => {
    expect(cleanTitle('Mobile | Profile | Send code fails')).toBe('Profile | Send code fails')
    expect(cleanTitle('Not able to save nickname')).toBe('Not able to save nickname')
  })
})

describe('mapJiraIssueToImport', () => {
  it('builds an importable defect from a raw Jira issue', () => {
    expect(
      mapJiraIssueToImport({
        key: 'digeng-32696',
        summary: 'Aurora Mobile | Production | Unable to submit an external transfer in Production.',
        status: { name: 'Backlog' },
        priority: { name: 'Critical' },
        labels: ['AuroraMobile', 'aurora_production_issue'],
      }),
    ).toEqual({
      jiraId: 'DIGENG-32696',
      title: 'Unable to submit an external transfer in Production.',
      status: 'New',
      isProduction: true,
      priority: 'Critical',
      jiraStatus: 'Backlog',
      note: 'Critical',
    })
  })
})

describe('sortDefects', () => {
  it('puts production first, then priority, then newest key, then manual items', () => {
    const sorted = sortDefects([
      defect({ jiraId: 'DIGENG-1', priority: 'Minor', jiraStatus: 'Done' }),
      defect({ id: 'manual-a', title: 'Manual A' }),
      defect({ jiraId: 'DIGENG-5', priority: 'Critical', jiraStatus: 'Backlog' }),
      defect({ jiraId: 'DIGENG-3', priority: 'Major', jiraStatus: 'Ready', isProduction: true }),
      defect({ jiraId: 'DIGENG-9', priority: 'Critical', jiraStatus: 'Ready' }),
      defect({ jiraId: 'DIGENG-7', priority: 'Critical', jiraStatus: 'Ready', isProduction: true }),
      defect({ id: 'manual-prod', title: 'Manual prod', isProduction: true }),
    ])

    expect(sorted.map((d) => d.id)).toEqual([
      'DIGENG-7',
      'DIGENG-3',
      'manual-prod',
      'DIGENG-9',
      'DIGENG-5',
      'DIGENG-1',
      'manual-a',
    ])
  })
})

describe('mergeImportedDefects', () => {
  const createId = (() => {
    let n = 0
    return () => `new-${++n}`
  })()

  it('replace mode discards existing defects', () => {
    const result = mergeImportedDefects(
      [defect({ id: 'old', title: 'Old manual' })],
      [imported({ jiraId: 'DIGENG-1', title: 'Fresh' })],
      'replace',
      createId,
    )
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ jiraId: 'DIGENG-1', title: 'Fresh', link: '' })
  })

  it('merge mode refreshes Jira fields, keeps notes, keeps manual, drops stale', () => {
    const existing = [
      defect({
        id: 'keep-me',
        jiraId: 'DIGENG-1',
        title: 'Old title',
        status: 'Open',
        note: 'Waiting on backend team',
        link: 'https://example.com',
        priority: 'Minor',
        jiraStatus: 'Ready',
      }),
      defect({ id: 'stale', jiraId: 'DIGENG-2', priority: 'Minor', jiraStatus: 'Done' }),
      defect({ id: 'manual', title: 'Found in exploratory testing' }),
      defect({ id: 'manual-with-id', jiraId: 'DIGENG-999', title: 'Typed by hand' }),
    ]

    const result = mergeImportedDefects(
      existing,
      [
        imported({
          jiraId: 'DIGENG-1',
          title: 'New title',
          status: 'In progress',
          priority: 'Critical',
          jiraStatus: 'In Progress',
          note: 'Critical',
        }),
        imported({ jiraId: 'DIGENG-3', title: 'Brand new', isProduction: true, note: 'Major' }),
      ],
      'merge',
      createId,
    )

    const byId = Object.fromEntries(result.map((d) => [d.id, d]))

    expect(byId['keep-me']).toMatchObject({
      title: 'New title',
      status: 'In progress',
      note: 'Waiting on backend team',
      link: 'https://example.com',
      priority: 'Critical',
      jiraStatus: 'In Progress',
    })
    expect(byId['stale']).toBeUndefined()
    expect(byId['manual']).toBeDefined()
    expect(byId['manual-with-id']).toBeDefined()

    const brandNew = result.find((d) => d.jiraId === 'DIGENG-3')
    expect(brandNew).toMatchObject({ title: 'Brand new', isProduction: true, note: 'Major' })
    expect(result[0]?.jiraId).toBe('DIGENG-3')
  })

  it('uses the imported note when the existing note is empty', () => {
    const result = mergeImportedDefects(
      [defect({ id: 'x', jiraId: 'DIGENG-1', note: '   ', jiraStatus: 'Ready' })],
      [imported({ jiraId: 'DIGENG-1', note: 'Major' })],
      'merge',
      createId,
    )
    expect(result[0]?.note).toBe('Major')
  })
})

describe('DefectsImportFileSchema', () => {
  it('accepts a well-formed import file', () => {
    const parsed = DefectsImportFileSchema.safeParse({
      source: 'jira',
      release: 'Aurora Gatlinburg',
      syncedAt: '2026-10-01T20:00:00.000Z',
      jiraBaseUrl: 'https://firsthorizon.atlassian.net',
      defects: [
        {
          jiraId: 'DIGENG-1',
          title: 'Title',
          status: 'Open',
          isProduction: false,
        },
      ],
    })
    expect(parsed.success).toBe(true)
  })

  it('rejects unknown statuses', () => {
    const parsed = DefectsImportFileSchema.safeParse({
      source: 'jira',
      release: 'r',
      syncedAt: 's',
      jiraBaseUrl: 'u',
      defects: [{ jiraId: 'DIGENG-1', title: 't', status: 'Weird', isProduction: false }],
    })
    expect(parsed.success).toBe(false)
  })
})
