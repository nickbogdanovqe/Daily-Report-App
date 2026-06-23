import type { TestDesignSummaryRow } from '../types'

function isTotalRow(row: { functionality: string }): boolean {
  return row.functionality.trim().toLowerCase() === 'total'
}

export function parseCount(value: string): number {
  const match = value.trim().match(/^(\d+(?:\.\d+)?)/)
  if (!match) return 0
  const parsed = Number.parseFloat(match[1])
  return Number.isFinite(parsed) ? parsed : 0
}

export function getAutomationTotals(
  rows: TestDesignSummaryRow[],
): { automated: number; manual: number } {
  return rows
    .filter((row) => !isTotalRow(row))
    .reduce(
      (totals, row) => ({
        automated: totals.automated + parseCount(row.totalAutomated),
        manual: totals.manual + parseCount(row.totalManual),
      }),
      { automated: 0, manual: 0 },
    )
}

export function formatAutomationPercent(part: number, total: number): string {
  if (total <= 0) return '0%'
  return `${Math.round((part / total) * 100)}%`
}

export function formatAutomationCoverageText(automated: number, manual: number): string {
  const total = automated + manual
  if (total <= 0) {
    return 'Enter automated and manual counts in Test Design Summary'
  }

  const automatedPercent = formatAutomationPercent(automated, total)
  const manualPercent = formatAutomationPercent(manual, total)
  return `Automated: ${automated} (${automatedPercent}) | Manual: ${manual} (${manualPercent})`
}
