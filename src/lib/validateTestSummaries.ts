import type {
  Draft,
  TestDesignSummaryRow,
  TestExecutionSummaryRow,
} from '../types'
import { isTotalRow, parseCount } from './automationCoverage'

export type ValidationSeverity = 'error' | 'warning'

export interface ValidationIssue {
  id: string
  severity: ValidationSeverity
  table: 'design' | 'execution'
  rowId?: string
  field?: keyof TestDesignSummaryRow | keyof TestExecutionSummaryRow
  message: string
}

let issueCounter = 0

function nextIssueId(): string {
  issueCounter += 1
  return `issue-${issueCounter}`
}

function rowLabel(functionality: string): string {
  const trimmed = functionality.trim()
  return trimmed || 'Untitled row'
}

function isBlankRow(
  functionality: string,
  values: number[],
): boolean {
  return !functionality.trim() && values.every((value) => value === 0)
}

type DesignNumericField = Exclude<
  keyof TestDesignSummaryRow,
  'id' | 'functionality'
>

type ExecutionNumericField = Exclude<
  keyof TestExecutionSummaryRow,
  'id' | 'functionality'
>

const DESIGN_ROLLUP_FIELDS: DesignNumericField[] = [
  'totalPlanned',
  'totalCompleted',
  'totalInProgress',
  'totalNotStarted',
  'totalCompletedToday',
  'totalAutomated',
  'totalManual',
]

const EXECUTION_ROLLUP_FIELDS: ExecutionNumericField[] = [
  'totalPlanned',
  'totalExecuted',
  'totalPassed',
  'totalFailed',
  'totalNa',
  'totalNotComplete',
  'totalBlocked',
  'totalNoRun',
]

function validateDesignRollup(rows: TestDesignSummaryRow[]): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const normalRows = rows.filter((row) => !isTotalRow(row))
  const totalRows = rows.filter(isTotalRow)

  if (totalRows.length === 0 || normalRows.length === 0) {
    return issues
  }

  for (const totalRow of totalRows) {
    for (const field of DESIGN_ROLLUP_FIELDS) {
      const expected = normalRows.reduce(
        (sum, row) => sum + parseCount(row[field]),
        0,
      )
      const actual = parseCount(totalRow[field])
      if (actual !== expected) {
        issues.push({
          id: nextIssueId(),
          severity: 'error',
          table: 'design',
          rowId: totalRow.id,
          field,
          message: `Total ${formatDesignField(field)} (${actual}) doesn't match sum of rows (${expected})`,
        })
      }
    }
  }

  return issues
}

function validateExecutionRollup(
  rows: TestExecutionSummaryRow[],
): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const normalRows = rows.filter((row) => !isTotalRow(row))
  const totalRows = rows.filter(isTotalRow)

  if (totalRows.length === 0 || normalRows.length === 0) {
    return issues
  }

  for (const totalRow of totalRows) {
    for (const field of EXECUTION_ROLLUP_FIELDS) {
      const expected = normalRows.reduce(
        (sum, row) => sum + parseCount(row[field]),
        0,
      )
      const actual = parseCount(totalRow[field])
      if (actual !== expected) {
        issues.push({
          id: nextIssueId(),
          severity: 'error',
          table: 'execution',
          rowId: totalRow.id,
          field,
          message: `Total ${formatExecutionField(field)} (${actual}) doesn't match sum of rows (${expected})`,
        })
      }
    }
  }

  return issues
}

function formatDesignField(field: DesignNumericField): string {
  const labels: Record<DesignNumericField, string> = {
    totalPlanned: 'Planned',
    totalCompleted: 'Completed',
    totalInProgress: 'In progress',
    totalNotStarted: 'Not started',
    totalCompletedToday: 'Completed today',
    totalAutomated: 'Automated',
    totalManual: 'Manual',
  }
  return labels[field]
}

function formatExecutionField(field: ExecutionNumericField): string {
  const labels: Record<ExecutionNumericField, string> = {
    totalPlanned: 'Planned',
    totalExecuted: 'Executed',
    totalPassed: 'Passed',
    totalFailed: 'Failed',
    totalNa: 'NA',
    totalNotComplete: 'Not complete',
    totalBlocked: 'Blocked',
    totalNoRun: 'No run',
  }
  return labels[field]
}

export function validateTestDesignSummary(
  rows: TestDesignSummaryRow[],
): ValidationIssue[] {
  const issues: ValidationIssue[] = []

  for (const row of rows) {
    if (isTotalRow(row)) continue

    const planned = parseCount(row.totalPlanned)
    const completed = parseCount(row.totalCompleted)
    const inProgress = parseCount(row.totalInProgress)
    const notStarted = parseCount(row.totalNotStarted)
    const completedToday = parseCount(row.totalCompletedToday)
    const automated = parseCount(row.totalAutomated)
    const manual = parseCount(row.totalManual)

    if (
      isBlankRow(row.functionality, [
        planned,
        completed,
        inProgress,
        notStarted,
        completedToday,
        automated,
        manual,
      ])
    ) {
      continue
    }

    const label = rowLabel(row.functionality)
    const statusSum = completed + inProgress + notStarted

    if (planned !== statusSum) {
      issues.push({
        id: nextIssueId(),
        severity: 'error',
        table: 'design',
        rowId: row.id,
        field: 'totalPlanned',
        message: `${label}: Completed + In progress + Not started = ${statusSum}, but Planned is ${planned} (off by ${planned - statusSum})`,
      })
    }

    if (completedToday > completed) {
      issues.push({
        id: nextIssueId(),
        severity: 'error',
        table: 'design',
        rowId: row.id,
        field: 'totalCompletedToday',
        message: `${label}: Completed today (${completedToday}) exceeds Completed (${completed})`,
      })
    }

    if ((automated > 0 || manual > 0) && automated + manual > planned) {
      issues.push({
        id: nextIssueId(),
        severity: 'warning',
        table: 'design',
        rowId: row.id,
        field: 'totalAutomated',
        message: `${label}: Automated + Manual (${automated + manual}) exceeds Planned (${planned})`,
      })
    }
  }

  return [...issues, ...validateDesignRollup(rows)]
}

export function validateTestExecutionSummary(
  rows: TestExecutionSummaryRow[],
): ValidationIssue[] {
  const issues: ValidationIssue[] = []

  for (const row of rows) {
    if (isTotalRow(row)) continue

    const planned = parseCount(row.totalPlanned)
    const executed = parseCount(row.totalExecuted)
    const passed = parseCount(row.totalPassed)
    const failed = parseCount(row.totalFailed)
    const na = parseCount(row.totalNa)
    const notComplete = parseCount(row.totalNotComplete)
    const blocked = parseCount(row.totalBlocked)
    const noRun = parseCount(row.totalNoRun)

    if (
      isBlankRow(row.functionality, [
        planned,
        executed,
        passed,
        failed,
        na,
        notComplete,
        blocked,
        noRun,
      ])
    ) {
      continue
    }

    const label = rowLabel(row.functionality)
    const outcomes = passed + failed + na
    const statusSum = outcomes + notComplete + blocked + noRun
    const executedBucketSum = executed + notComplete + blocked + noRun

    if (executed !== outcomes) {
      issues.push({
        id: nextIssueId(),
        severity: 'error',
        table: 'execution',
        rowId: row.id,
        field: 'totalExecuted',
        message: `${label}: Total Executed (${executed}) should equal Passed + Failed + NA (${outcomes})`,
      })
    }

    if (planned !== statusSum) {
      issues.push({
        id: nextIssueId(),
        severity: 'error',
        table: 'execution',
        rowId: row.id,
        field: 'totalPlanned',
        message: `${label}: Passed + Failed + NA + Not complete + Blocked + No run = ${statusSum}, but Planned is ${planned} (off by ${planned - statusSum})`,
      })
    } else if (planned !== executedBucketSum) {
      issues.push({
        id: nextIssueId(),
        severity: 'error',
        table: 'execution',
        rowId: row.id,
        field: 'totalPlanned',
        message: `${label}: Executed + Not complete + Blocked + No run = ${executedBucketSum}, but Planned is ${planned} (off by ${planned - executedBucketSum})`,
      })
    }
  }

  return [...issues, ...validateExecutionRollup(rows)]
}

export function validateTestSummaries(draft: Draft): ValidationIssue[] {
  const issues: ValidationIssue[] = []

  if (draft.showTestDesignSummary) {
    issues.push(...validateTestDesignSummary(draft.testDesignSummaryRows))
  }

  if (draft.showTestExecutionSummary) {
    issues.push(...validateTestExecutionSummary(draft.testExecutionSummaryRows))
  }

  return issues
}

/** Reset counter between test runs. */
export function resetValidationIssueCounter(): void {
  issueCounter = 0
}
