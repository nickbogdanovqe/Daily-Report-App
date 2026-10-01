import type { Defect } from '../types'
import { hasDefectContent } from './defectGroups'
import { priorityRank } from './jiraDefects'

/**
 * Status x priority counts for the "Defects by Status and Priority" block
 * that sits above the detailed defects table, mirroring Jira's summary view.
 */

export const MATRIX_PRIORITIES = ['Blocker', 'Critical', 'Major', 'Minor', 'Trivial'] as const
export const UNSET_PRIORITY = 'Unset'

export type MatrixPriority = (typeof MATRIX_PRIORITIES)[number] | typeof UNSET_PRIORITY

export interface DefectMatrixRow {
  /** Upper-cased status label, e.g. "BACKLOG". */
  status: string
  counts: Record<MatrixPriority, number>
  total: number
}

export interface DefectMatrix {
  /** Column order; includes "Unset" only when some defect has no priority. */
  priorities: MatrixPriority[]
  rows: DefectMatrixRow[]
  totals: Record<MatrixPriority, number>
  grandTotal: number
}

function emptyCounts(): Record<MatrixPriority, number> {
  return { Blocker: 0, Critical: 0, Major: 0, Minor: 0, Trivial: 0, Unset: 0 }
}

/** Collapse Jira priority names (Highest/High/...) onto the five display columns. */
export function matrixPriority(priority?: string): MatrixPriority {
  if (!priority?.trim()) return UNSET_PRIORITY
  const rank = priorityRank(priority)
  return MATRIX_PRIORITIES[rank] ?? UNSET_PRIORITY
}

function statusLabel(defect: Defect): string {
  const raw = defect.jiraStatus?.trim() || defect.status
  return raw.toUpperCase()
}

export function buildDefectMatrix(defects: Defect[]): DefectMatrix {
  const counted = defects.filter(hasDefectContent)
  const rowsByStatus = new Map<string, DefectMatrixRow>()
  const totals = emptyCounts()

  for (const defect of counted) {
    const status = statusLabel(defect)
    const priority = matrixPriority(defect.priority)

    let row = rowsByStatus.get(status)
    if (!row) {
      row = { status, counts: emptyCounts(), total: 0 }
      rowsByStatus.set(status, row)
    }

    row.counts[priority] += 1
    row.total += 1
    totals[priority] += 1
  }

  const rows = [...rowsByStatus.values()].sort(
    (a, b) => b.total - a.total || a.status.localeCompare(b.status),
  )

  const priorities: MatrixPriority[] = [...MATRIX_PRIORITIES]
  if (totals.Unset > 0) priorities.push(UNSET_PRIORITY)

  return { priorities, rows, totals, grandTotal: counted.length }
}
