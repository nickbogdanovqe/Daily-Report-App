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
  it('counts defects by card status and priority with totals', () => {
    const matrix = buildDefectMatrix([
      defect({ jiraId: 'D-1', status: 'New', priority: 'Critical' }),
      defect({ jiraId: 'D-2', status: 'New', priority: 'Minor' }),
      defect({ jiraId: 'D-3', status: 'New', priority: 'Minor' }),
      defect({ jiraId: 'D-4', status: 'In progress', priority: 'Blocker' }),
      defect({ jiraId: 'D-5', status: 'Verified', priority: 'Major' }),
    ])

    expect(matrix.priorities).toEqual(['Blocker', 'Critical', 'Major', 'Minor', 'Trivial'])
    expect(matrix.rows.map((row) => [row.status, row.total])).toEqual([
      ['NEW', 3],
      ['IN PROGRESS', 1],
      ['VERIFIED', 1],
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

  it('uses the edited card status rather than the imported Jira status', () => {
    const matrix = buildDefectMatrix([
      defect({ jiraId: 'D-1', status: 'Verified', jiraStatus: 'Acceptance', priority: 'Critical' }),
      defect({ jiraId: 'D-2', status: 'Fixed', jiraStatus: 'Acceptance', priority: 'Major' }),
    ])

    expect(matrix.rows.map((row) => [row.status, row.total])).toEqual([
      ['FIXED', 1],
      ['VERIFIED', 1],
    ])
    expect(matrix.rows.find((row) => row.status === 'VERIFIED')?.counts.Critical).toBe(1)
  })

  it('adds an Unset column for defects without a priority', () => {
    const matrix = buildDefectMatrix([
      defect({ status: 'In progress' }),
      defect({ jiraId: 'D-1', status: 'Fixed', priority: 'Minor' }),
    ])

    expect(matrix.priorities).toContain('Unset')
    expect(matrix.rows.map((row) => row.status)).toEqual(['FIXED', 'IN PROGRESS'])
    expect(matrix.totals.Unset).toBe(1)
  })

  it('ignores empty defect cards', () => {
    const matrix = buildDefectMatrix([defect({ title: '', jiraId: '' })])
    expect(matrix.rows).toEqual([])
    expect(matrix.grandTotal).toBe(0)
  })
})
