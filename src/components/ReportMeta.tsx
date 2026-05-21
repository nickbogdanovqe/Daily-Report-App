import type { Draft } from '../types'
import { OVERALL_STATUSES } from '../types'
import { formatOverallLabel, overallStatusColors, resolveOverallStatus } from '../lib/reportTheme'

interface ReportMetaProps {
  draft: Draft
  onChange: (patch: Partial<Draft>) => void
}

export function ReportMeta({ draft, onChange }: ReportMetaProps) {
  const overallKey = resolveOverallStatus(draft)
  const colors = overallStatusColors(overallKey)
  const label = formatOverallLabel(draft)

  return (
    <div className="space-y-5 rounded-[1.5rem] border border-slate-200/80 bg-white/95 p-5 shadow-xl shadow-slate-200/60 ring-1 ring-slate-900/5 backdrop-blur">
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-base font-bold text-slate-950">Report details</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Date, status, and executive summary for the email
          </p>
        </div>
        <span
          className="shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold shadow-sm"
          style={{
            backgroundColor: colors.bg,
            color: colors.text,
            border: `1px solid ${colors.border}`,
          }}
        >
          {label}
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Report date
          </span>
          <input
            type="date"
            value={draft.reportDate}
            onChange={(e) => onChange({ reportDate: e.target.value })}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-3.5 py-3 text-sm text-slate-800 shadow-inner shadow-slate-900/5 transition focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/15"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Overall status
          </span>
          <select
            value={draft.overallStatus}
            onChange={(e) =>
              onChange({ overallStatus: e.target.value as Draft['overallStatus'] })
            }
            className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-3.5 py-3 text-sm text-slate-800 shadow-inner shadow-slate-900/5 transition focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/15"
          >
            {OVERALL_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="block">
        <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
          Custom status label <span className="font-normal normal-case text-slate-400">(optional)</span>
        </span>
        <input
          type="text"
          value={draft.overallStatusCustom}
          onChange={(e) => onChange({ overallStatusCustom: e.target.value })}
          placeholder="Overrides dropdown when filled"
          className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-3.5 py-3 text-sm text-slate-800 shadow-inner shadow-slate-900/5 placeholder:text-slate-400 transition focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/15"
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
          JIRA base URL <span className="font-normal normal-case text-slate-400">(for clickable IDs)</span>
        </span>
        <input
          type="url"
          value={draft.jiraBaseUrl}
          onChange={(e) => onChange({ jiraBaseUrl: e.target.value })}
          placeholder="https://your-company.atlassian.net/browse"
          className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-3.5 py-3 text-sm text-slate-800 shadow-inner shadow-slate-900/5 placeholder:text-slate-400 transition focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/15"
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
          Executive summary <span className="font-normal normal-case text-slate-400">(optional)</span>
        </span>
        <textarea
          value={draft.summary}
          onChange={(e) => onChange({ summary: e.target.value })}
          rows={3}
          placeholder="One short paragraph for management — today's focus, build under test, risk level…"
          className="w-full resize-y rounded-2xl border border-slate-200 bg-slate-50/70 px-3.5 py-3 text-sm leading-relaxed text-slate-800 shadow-inner shadow-slate-900/5 placeholder:text-slate-400 transition focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/15"
        />
      </label>
    </div>
  )
}
