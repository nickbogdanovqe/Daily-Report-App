import type { Draft } from '../types'

export function resolveApplicationName(draft: Draft): string {
  return draft.applicationName.trim()
}

export function resolveTestDesignSummaryTitle(draft: Draft): string {
  const custom = draft.testDesignSummaryTitle.trim()
  if (custom) return custom

  const app = resolveApplicationName(draft)
  return app ? `Test Design Summary - ${app}` : 'Test Design Summary'
}

export function resolveTestExecutionSummaryTitle(draft: Draft): string {
  const custom = draft.testExecutionSummaryTitle.trim()
  if (custom) return custom

  const app = resolveApplicationName(draft)
  return app ? `Test Execution Summary - ${app}` : 'Test Execution Summary'
}

export function resolveReportTitle(
  draft: Draft,
  formatDateShort: (isoDate: string) => string,
): string {
  const title = draft.reportTitle.trim()
  if (title) return title

  const app = resolveApplicationName(draft)
  const date = formatDateShort(draft.reportDate)

  if (app && date) return `QE Status Report - ${app} - ${date}`
  if (app) return `QE Status Report - ${app}`
  if (date) return `QE Status Report - ${date}`
  return 'QE Status Report'
}
