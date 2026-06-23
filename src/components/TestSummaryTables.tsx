import type {
  Draft,
  TestDesignSummaryRow,
  TestExecutionSummaryRow,
} from '../types'
import {
  resolveTestDesignSummaryTitle,
  resolveTestExecutionSummaryTitle,
} from '../lib/reportLabels'
import { createId } from '../lib/storage'

interface TestSummaryTablesProps {
  draft: Draft
  onChange: (patch: Partial<Draft>) => void
}

const inputClass =
  'w-full min-w-0 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-800 shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20'

const numberInputClass = `${inputClass} text-center`

function Toggle({
  checked,
  label,
  onChange,
}: {
  checked: boolean
  label: string
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2">
      <span className="text-sm font-semibold text-slate-800">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
      />
    </label>
  )
}

function removeRow<T extends { id: string }>(rows: T[], id: string): T[] {
  return rows.length <= 1 ? rows : rows.filter((row) => row.id !== id)
}

export function TestSummaryTables({ draft, onChange }: TestSummaryTablesProps) {
  const updateDesignRow = (
    id: string,
    field: keyof TestDesignSummaryRow,
    value: string,
  ) => {
    onChange({
      testDesignSummaryRows: draft.testDesignSummaryRows.map((row) =>
        row.id === id ? { ...row, [field]: value } : row,
      ),
    })
  }

  const updateExecutionRow = (
    id: string,
    field: keyof TestExecutionSummaryRow,
    value: string,
  ) => {
    onChange({
      testExecutionSummaryRows: draft.testExecutionSummaryRows.map((row) =>
        row.id === id ? { ...row, [field]: value } : row,
      ),
    })
  }

  const addDesignRow = () => {
    onChange({
      testDesignSummaryRows: [
        ...draft.testDesignSummaryRows,
        {
          id: createId(),
          functionality: '',
          totalPlanned: '0',
          totalCompleted: '0',
          totalInProgress: '0',
          totalNotStarted: '0',
          totalCompletedToday: '0',
          totalAutomated: '0',
          totalManual: '0',
        },
      ],
    })
  }

  const addExecutionRow = () => {
    onChange({
      testExecutionSummaryRows: [
        ...draft.testExecutionSummaryRows,
        {
          id: createId(),
          functionality: '',
          totalPlanned: '0',
          totalExecuted: '0',
          totalPassed: '0',
          totalFailed: '0',
          totalNa: '0',
          totalNotComplete: '0',
          totalBlocked: '0',
          totalNoRun: '0',
        },
      ],
    })
  }

  const designTitlePlaceholder = resolveTestDesignSummaryTitle(draft)
  const executionTitlePlaceholder = resolveTestExecutionSummaryTitle(draft)

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <Toggle
          checked={draft.showTestDesignSummary}
          label="Show test design summary"
          onChange={(showTestDesignSummary) => onChange({ showTestDesignSummary })}
        />
        <Toggle
          checked={draft.showTestExecutionSummary}
          label="Show test execution summary"
          onChange={(showTestExecutionSummary) => onChange({ showTestExecutionSummary })}
        />
      </div>

      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
              Design title
            </span>
            <input
              type="text"
              value={draft.testDesignSummaryTitle}
              onChange={(e) => onChange({ testDesignSummaryTitle: e.target.value })}
              placeholder={designTitlePlaceholder}
              className={inputClass}
            />
            <span className="mt-1 block text-xs text-slate-500">
              Leave blank to use the application name from report details.
            </span>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
              Design remarks
            </span>
            <input
              type="text"
              value={draft.testDesignSummaryRemarks}
              onChange={(e) => onChange({ testDesignSummaryRemarks: e.target.value })}
              placeholder="Optional remarks for the design summary table"
              className={inputClass}
            />
          </label>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="min-w-[880px] w-full border-collapse bg-white text-sm">
            <thead className="bg-slate-100 text-xs font-bold uppercase tracking-wide text-slate-600">
              <tr>
                <th className="border border-slate-200 px-2 py-2 text-left">Functionality</th>
                <th className="border border-slate-200 px-2 py-2">Planned</th>
                <th className="border border-slate-200 px-2 py-2">Completed</th>
                <th className="border border-slate-200 px-2 py-2">In progress</th>
                <th className="border border-slate-200 px-2 py-2">Not started</th>
                <th className="border border-slate-200 px-2 py-2">Completed today</th>
                <th className="w-12 border border-slate-200 px-2 py-2" aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {draft.testDesignSummaryRows.map((row) => (
                <tr key={row.id}>
                  <td className="border border-slate-200 p-1">
                    <input
                      type="text"
                      value={row.functionality}
                      onChange={(e) => updateDesignRow(row.id, 'functionality', e.target.value)}
                      className={inputClass}
                    />
                  </td>
                  {(
                    [
                      'totalPlanned',
                      'totalCompleted',
                      'totalInProgress',
                      'totalNotStarted',
                      'totalCompletedToday',
                    ] as const
                  ).map((field) => (
                    <td key={field} className="border border-slate-200 p-1">
                      <input
                        type="text"
                        value={row[field]}
                        onChange={(e) => updateDesignRow(row.id, field, e.target.value)}
                        className={numberInputClass}
                      />
                    </td>
                  ))}
                  <td className="border border-slate-200 p-1 text-center">
                    <button
                      type="button"
                      onClick={() =>
                        onChange({
                          testDesignSummaryRows: removeRow(
                            draft.testDesignSummaryRows,
                            row.id,
                          ),
                        })
                      }
                      className="rounded px-2 py-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                      aria-label="Remove design row"
                    >
                      x
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button
          type="button"
          onClick={addDesignRow}
          className="w-full rounded-xl border border-dashed border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-blue-400 hover:bg-blue-50/80 hover:text-blue-700"
        >
          + Add design row
        </button>

        <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/70 p-3">
          <div>
            <p className="text-sm font-semibold text-slate-800">Automation breakdown</p>
            <p className="text-xs text-slate-500">
              Used for the Automated vs Manual Coverage chart. Not shown in the Test Design Summary
              table.
            </p>
          </div>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-[480px] w-full border-collapse bg-white text-sm">
              <thead className="bg-slate-100 text-xs font-bold uppercase tracking-wide text-slate-600">
                <tr>
                  <th className="border border-slate-200 px-2 py-2 text-left">Functionality</th>
                  <th className="border border-slate-200 px-2 py-2">Automated</th>
                  <th className="border border-slate-200 px-2 py-2">Manual</th>
                </tr>
              </thead>
              <tbody>
                {draft.testDesignSummaryRows.map((row) => (
                  <tr key={`automation-${row.id}`}>
                    <td className="border border-slate-200 px-2 py-2 text-slate-700">
                      {row.functionality.trim() || 'Untitled'}
                    </td>
                    {(['totalAutomated', 'totalManual'] as const).map((field) => (
                      <td key={field} className="border border-slate-200 p-1">
                        <input
                          type="text"
                          value={row[field]}
                          onChange={(e) => updateDesignRow(row.id, field, e.target.value)}
                          className={numberInputClass}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
              Execution title
            </span>
            <input
              type="text"
              value={draft.testExecutionSummaryTitle}
              onChange={(e) => onChange({ testExecutionSummaryTitle: e.target.value })}
              placeholder={executionTitlePlaceholder}
              className={inputClass}
            />
            <span className="mt-1 block text-xs text-slate-500">
              Leave blank to use the application name from report details.
            </span>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
              Execution remarks
            </span>
            <input
              type="text"
              value={draft.testExecutionSummaryRemarks}
              onChange={(e) => onChange({ testExecutionSummaryRemarks: e.target.value })}
              placeholder="Optional remarks for the execution summary table"
              className={inputClass}
            />
          </label>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="min-w-[1180px] w-full border-collapse bg-white text-sm">
            <thead className="bg-slate-100 text-xs font-bold uppercase tracking-wide text-slate-600">
              <tr>
                <th className="border border-slate-200 px-2 py-2 text-left">Functionality</th>
                <th className="border border-slate-200 px-2 py-2">Planned</th>
                <th className="border border-slate-200 px-2 py-2">Executed</th>
                <th className="border border-slate-200 px-2 py-2">Passed</th>
                <th className="border border-slate-200 px-2 py-2">Failed</th>
                <th className="border border-slate-200 px-2 py-2">NA</th>
                <th className="border border-slate-200 px-2 py-2">Not complete</th>
                <th className="border border-slate-200 px-2 py-2">Blocked</th>
                <th className="border border-slate-200 px-2 py-2">No run</th>
                <th className="w-12 border border-slate-200 px-2 py-2" aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {draft.testExecutionSummaryRows.map((row) => (
                <tr key={row.id}>
                  <td className="border border-slate-200 p-1">
                    <input
                      type="text"
                      value={row.functionality}
                      onChange={(e) =>
                        updateExecutionRow(row.id, 'functionality', e.target.value)
                      }
                      className={inputClass}
                    />
                  </td>
                  {(
                    [
                      'totalPlanned',
                      'totalExecuted',
                      'totalPassed',
                      'totalFailed',
                      'totalNa',
                      'totalNotComplete',
                      'totalBlocked',
                      'totalNoRun',
                    ] as const
                  ).map((field) => (
                    <td key={field} className="border border-slate-200 p-1">
                      <input
                        type="text"
                        value={row[field]}
                        onChange={(e) => updateExecutionRow(row.id, field, e.target.value)}
                        className={numberInputClass}
                      />
                    </td>
                  ))}
                  <td className="border border-slate-200 p-1 text-center">
                    <button
                      type="button"
                      onClick={() =>
                        onChange({
                          testExecutionSummaryRows: removeRow(
                            draft.testExecutionSummaryRows,
                            row.id,
                          ),
                        })
                      }
                      className="rounded px-2 py-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                      aria-label="Remove execution row"
                    >
                      x
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button
          type="button"
          onClick={addExecutionRow}
          className="w-full rounded-xl border border-dashed border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-blue-400 hover:bg-blue-50/80 hover:text-blue-700"
        >
          + Add execution row
        </button>
      </div>
    </div>
  )
}
