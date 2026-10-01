import { describe, expect, it } from 'vitest'
import type { Defect } from '../types'
import { buildDefectMatrix, matrixPriority } from './defectMatrix'

function defect(overrides: Partial<Defect>): Defect {
  return {
    id: overrides.jiraId ?? 'manual',
    title: 'Something broke',
    status: 'Open',
    jiraId: '',
    link: '',
    note: '',
    isProduction: false,
    ...overrides,
  }
}

describe('matrixPriority', () => {
  it('maps Jira priority names onto the five display columns', () => {
    expect(matrixPriority('Blocker')).toBe('Blocker')
    expect(matrixPriority('Highest')).toBe('Blocker')
    expect(matrixPriority('High')).toBe('Critical')
    expect(matrixPriority('Medium')).toBe('Major')
    expect(matrixPriority('Low')).toBe('Minor')
    expect(matrixPriority('Lowest')).toBe('Trivial')
  })

  it('treats missing or unknown priorities as Unset', () => {
    expect(matrixPriority(undefined)).toBe('Unset')
    expect(matrixPriority('  ')).toBe('Unset')
    expect(matrixPriority('Weird')).toBe('Unset')
  })
})

describe('buildDefectMatrix', () => {
  it('counts defects by Jira status and priority with totals', () => {
    const matrix = buildDefectMatrix([
      defect({ jiraId: 'D-1', jiraStatus: 'Backlog', priority: 'Critical' }),
      defect({ jiraId: 'D-2', jiraStatus: 'Backlog', priority: 'Minor' }),
      defect({ jiraId: 'D-3', jiraStatus: 'Backlog', priority: 'Minor' }),
      defect({ jiraId: 'D-4', jiraStatus: 'In Progress', priority: 'Blocker' }),
      defect({ jiraId: 'D-5', jiraStatus: 'Done', priority: 'Major' }),
    ])

    expect(matrix.priorities).toEqual(['Blocker', 'Critical', 'Major', 'Minor', 'Trivial'])
    expect(matrix.rows.map((row) => [row.status, row.total])).toEqual([
      ['BACKLOG', 3],
      ['DONE', 1],
      ['IN PROGRESS', 1],
    ])
    expect(matrix.rows[0]?.counts).toEqual({
      Blocker: 0,
      Critical: 1,
      Major: 0,
      Minor: 2,
      Trivial: 0,
      Unset: 0,
    })
    expect(matrix.totals).toEqual({
      Blocker: 1,
      Critical: 1,
      Major: 1,
      Minor: 2,
      Trivial: 0,
      Unset: 0,
    })
    expect(matrix.grandTotal).toBe(5)
  })

  it('falls back to the report status for manual defects and adds an Unset column', () => {
    const matrix = buildDefectMatrix([
      defect({ status: 'In progress' }),
      defect({ jiraId: 'D-1', jiraStatus: 'Testing', priority: 'Minor' }),
    ])

    expect(matrix.priorities).toContain('Unset')
    expect(matrix.rows.map((row) => row.status)).toEqual(['IN PROGRESS', 'TESTING'])
    expect(matrix.totals.Unset).toBe(1)
  })

  it('ignores empty defect cards', () => {
    const matrix = buildDefectMatrix([defect({ title: '', jiraId: '' })])
    expect(matrix.rows).toEqual([])
    expect(matrix.grandTotal).toBe(0)
  })
})
