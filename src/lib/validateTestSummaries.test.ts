import { describe, expect, it, beforeEach } from 'vitest'
import type {
  Draft,
  TestDesignSummaryRow,
  TestExecutionSummaryRow,
} from '../types'
import { createEmptyDraft } from './storage'
import {
  resetValidationIssueCounter,
  validateTestDesignSummary,
  validateTestExecutionSummary,
  validateTestSummaries,
} from './validateTestSummaries'

function designRow(
  overrides: Partial<TestDesignSummaryRow> = {},
): TestDesignSummaryRow {
  return {
    id: overrides.id ?? 'design-1',
    functionality: overrides.functionality ?? 'E2E Testing',
    totalPlanned: overrides.totalPlanned ?? '0',
    totalCompleted: overrides.totalCompleted ?? '0',
    totalInProgress: overrides.totalInProgress ?? '0',
    totalNotStarted: overrides.totalNotStarted ?? '0',
    totalCompletedToday: overrides.totalCompletedToday ?? '0',
    totalAutomated: overrides.totalAutomated ?? '0',
    totalManual: overrides.totalManual ?? '0',
  }
}

function executionRow(
  overrides: Partial<TestExecutionSummaryRow> = {},
): TestExecutionSummaryRow {
  return {
    id: overrides.id ?? 'exec-1',
    functionality: overrides.functionality ?? 'E2E Testing',
    totalPlanned: overrides.totalPlanned ?? '0',
    totalExecuted: overrides.totalExecuted ?? '0',
    totalPassed: overrides.totalPassed ?? '0',
    totalFailed: overrides.totalFailed ?? '0',
    totalNa: overrides.totalNa ?? '0',
    totalNotComplete: overrides.totalNotComplete ?? '0',
    totalBlocked: overrides.totalBlocked ?? '0',
    totalNoRun: overrides.totalNoRun ?? '0',
  }
}

describe('validateTestExecutionSummary', () => {
  beforeEach(() => {
    resetValidationIssueCounter()
  })

  it('flags passed exceeding executed and partition mismatch from real-world data', () => {
    const rows = [
      executionRow({
        id: 'e2e',
        functionality: 'E2E Testing',
        totalPlanned: '120',
        totalExecuted: '10',
        totalPassed: '16',
        totalFailed: '0',
        totalNa: '0',
        totalNotComplete: '89',
        totalBlocked: '0',
        totalNoRun: '15',
      }),
      executionRow({
        id: 'total',
        functionality: 'Total',
        totalPlanned: '120',
        totalExecuted: '10',
        totalPassed: '16',
        totalFailed: '0',
        totalNa: '0',
        totalNotComplete: '99',
        totalBlocked: '0',
        totalNoRun: '5',
      }),
    ]

    const issues = validateTestExecutionSummary(rows)
    const messages = issues.map((issue) => issue.message)

    expect(messages.some((message) => message.includes('Passed (16) exceeds Executed (10)'))).toBe(
      true,
    )
    expect(
      messages.some((message) =>
        message.includes("Total Not complete (99) doesn't match sum of rows (89)"),
      ),
    ).toBe(true)
    expect(
      messages.some((message) =>
        message.includes("Total No run (5) doesn't match sum of rows (15)"),
      ),
    ).toBe(true)
  })

  it('passes when row partition and total rollup are balanced', () => {
    const rows = [
      executionRow({
        id: 'e2e',
        totalPlanned: '120',
        totalExecuted: '16',
        totalPassed: '16',
        totalNotComplete: '89',
        totalNoRun: '15',
      }),
      executionRow({
        id: 'total',
        functionality: 'Total',
        totalPlanned: '120',
        totalExecuted: '16',
        totalPassed: '16',
        totalNotComplete: '89',
        totalNoRun: '15',
      }),
    ]

    expect(validateTestExecutionSummary(rows)).toEqual([])
  })

  it('ignores blank zero rows', () => {
    const rows = [
      executionRow({
        id: 'blank',
        functionality: '',
      }),
      executionRow({
        id: 'total',
        functionality: 'Total',
      }),
    ]

    expect(validateTestExecutionSummary(rows)).toEqual([])
  })
})

describe('validateTestDesignSummary', () => {
  beforeEach(() => {
    resetValidationIssueCounter()
  })

  it('flags partition mismatch from real-world design data', () => {
    const rows = [
      designRow({
        totalPlanned: '120',
        totalCompleted: '30',
        totalInProgress: '0',
        totalNotStarted: '80',
        totalCompletedToday: '10',
      }),
    ]

    const issues = validateTestDesignSummary(rows)

    expect(
      issues.some((issue) =>
        issue.message.includes('Completed + In progress + Not started = 110, but Planned is 120'),
      ),
    ).toBe(true)
  })

  it('flags completed today exceeding completed', () => {
    const rows = [
      designRow({
        totalPlanned: '10',
        totalCompleted: '10',
        totalNotStarted: '0',
        totalCompletedToday: '15',
      }),
    ]

    const issues = validateTestDesignSummary(rows)
    expect(
      issues.some((issue) =>
        issue.message.includes('Completed today (15) exceeds Completed (10)'),
      ),
    ).toBe(true)
  })

  it('warns when automated plus manual exceeds planned', () => {
    const rows = [
      designRow({
        totalPlanned: '100',
        totalCompleted: '100',
        totalAutomated: '70',
        totalManual: '40',
      }),
    ]

    const issues = validateTestDesignSummary(rows)
    expect(issues.some((issue) => issue.severity === 'warning')).toBe(true)
    expect(
      issues.some((issue) =>
        issue.message.includes('Automated + Manual (110) exceeds Planned (100)'),
      ),
    ).toBe(true)
  })
})

describe('validateTestSummaries', () => {
  beforeEach(() => {
    resetValidationIssueCounter()
  })

  it('respects summary table visibility toggles', () => {
    const draft: Draft = {
      ...createEmptyDraft(),
      showTestDesignSummary: false,
      showTestExecutionSummary: true,
      testExecutionSummaryRows: [
        executionRow({
          totalPlanned: '10',
          totalExecuted: '5',
          totalPassed: '8',
        }),
      ],
    }

    const issues = validateTestSummaries(draft)
    expect(issues.every((issue) => issue.table === 'execution')).toBe(true)
    expect(issues.length).toBeGreaterThan(0)
  })
})
