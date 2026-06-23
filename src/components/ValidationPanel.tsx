import type { ValidationIssue } from '../lib/validateTestSummaries'

interface ValidationPanelProps {
  issues: ValidationIssue[]
}

function groupLabel(table: ValidationIssue['table']): string {
  return table === 'design' ? 'Test Design Summary' : 'Test Execution Summary'
}

export function ValidationPanel({ issues }: ValidationPanelProps) {
  if (issues.length === 0) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 px-3 py-2.5 text-sm text-emerald-800">
        All numbers look good.
      </div>
    )
  }

  const designIssues = issues.filter((issue) => issue.table === 'design')
  const executionIssues = issues.filter((issue) => issue.table === 'execution')

  return (
    <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50/80 px-3 py-2.5">
      <p className="text-sm font-semibold text-amber-900">
        {issues.length} number {issues.length === 1 ? 'issue' : 'issues'} found
      </p>
      {[designIssues, executionIssues].map((group) => {
        if (group.length === 0) return null
        return (
          <div key={group[0].table}>
            <p className="text-xs font-bold uppercase tracking-wide text-amber-800">
              {groupLabel(group[0].table)}
            </p>
            <ul className="mt-1 space-y-1">
              {group.map((issue) => (
                <li
                  key={issue.id}
                  className={`text-sm ${
                    issue.severity === 'error' ? 'text-red-800' : 'text-amber-900'
                  }`}
                >
                  {issue.severity === 'warning' ? 'Warning: ' : ''}
                  {issue.message}
                </li>
              ))}
            </ul>
          </div>
        )
      })}
    </div>
  )
}

export function isFieldHighlighted(
  issues: ValidationIssue[],
  table: ValidationIssue['table'],
  rowId: string,
  field: string,
): boolean {
  return issues.some(
    (issue) =>
      issue.table === table &&
      issue.rowId === rowId &&
      issue.field === field,
  )
}
