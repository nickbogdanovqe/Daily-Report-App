import type { ReactNode } from 'react'
import type { Draft } from '../types'
import { OVERALL_STATUSES } from '../types'
import { formatOverallLabel, overallStatusColors, resolveOverallStatus } from '../lib/reportTheme'

interface ReportMetaProps {
  draft: Draft
  onChange: (patch: Partial<Draft>) => void
}

const inputClass =
  'w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-3.5 py-3 text-sm text-slate-800 shadow-inner shadow-slate-900/5 placeholder:text-slate-400 transition focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/15'

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
      {children}
    </span>
  )
}

export function ReportMeta({ draft, onChange }: ReportMetaProps) {
  const overallKey = resolveOverallStatus(draft)
  const colors = overallStatusColors(overallKey)
  const label = formatOverallLabel(draft)
  const updateText = (field: keyof Draft, value: string) => {
    onChange({ [field]: value } as Partial<Draft>)
  }

  return (
    <div className="space-y-5 rounded-[1.5rem] border border-slate-200/80 bg-white/95 p-5 shadow-xl shadow-slate-200/60 ring-1 ring-slate-900/5 backdrop-blur">
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-base font-bold text-slate-950">Report details</h2>
          <p className="mt-0.5 text-xs text-slate-500">QE status report metadata</p>
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
        <label className="block sm:col-span-2">
          <FieldLabel>Report title</FieldLabel>
          <input
            type="text"
            value={draft.reportTitle}
            onChange={(e) => updateText('reportTitle', e.target.value)}
            placeholder="QE Status Report - Application - MM/DD"
            className={inputClass}
          />
        </label>
        <label className="block sm:col-span-2">
          <FieldLabel>Application / Microservice Name</FieldLabel>
          <input
            type="text"
            value={draft.applicationName}
            onChange={(e) => updateText('applicationName', e.target.value)}
            placeholder="Application, microservices, and service scope"
            className={inputClass}
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <FieldLabel>Report date</FieldLabel>
          <input
            type="date"
            value={draft.reportDate}
            onChange={(e) => onChange({ reportDate: e.target.value })}
            className={inputClass}
          />
        </label>
        <label className="block">
          <FieldLabel>Today's RAG</FieldLabel>
          <select
            value={draft.overallStatus}
            onChange={(e) =>
              onChange({
                overallStatus: e.target.value as Draft['overallStatus'],
                overallStatusCustom: '',
              })
            }
            className={inputClass}
          >
            {OVERALL_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block">
          <FieldLabel>Project QA Start Dt</FieldLabel>
          <input
            type="date"
            value={draft.projectQaStartDate}
            onChange={(e) => updateText('projectQaStartDate', e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="block">
          <FieldLabel>Project QA Sign Off Dt</FieldLabel>
          <input
            type="date"
            value={draft.projectQaSignOffDate}
            onChange={(e) => updateText('projectQaSignOffDate', e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="block">
          <FieldLabel>Planned Go-Live Dt</FieldLabel>
          <input
            type="date"
            value={draft.plannedGoLiveDate}
            onChange={(e) => updateText('plannedGoLiveDate', e.target.value)}
            className={inputClass}
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block sm:col-span-2">
          <FieldLabel>Testing Type</FieldLabel>
          <input
            type="text"
            value={draft.testingType}
            onChange={(e) => updateText('testingType', e.target.value)}
            placeholder="Functional, Integration, E2E and Regression"
            className={inputClass}
          />
        </label>
        <label className="block">
          <FieldLabel>Test Environment</FieldLabel>
          <input
            type="text"
            value={draft.testEnvironment}
            onChange={(e) => updateText('testEnvironment', e.target.value)}
            placeholder="TST"
            className={inputClass}
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block sm:col-span-2">
          <FieldLabel>QE</FieldLabel>
          <input
            type="text"
            value={draft.qeOwner}
            onChange={(e) => updateText('qeOwner', e.target.value)}
            placeholder="QE owner"
            className={inputClass}
          />
        </label>
        <label className="block">
          <FieldLabel>Anticipated Trend</FieldLabel>
          <select
            value={draft.anticipatedTrend}
            onChange={(e) =>
              onChange({ anticipatedTrend: e.target.value as Draft['anticipatedTrend'] })
            }
            className={inputClass}
          >
            {OVERALL_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <FieldLabel>Reason (Today's RAG)</FieldLabel>
          <textarea
            value={draft.ragReason}
            onChange={(e) => updateText('ragReason', e.target.value)}
            rows={4}
            placeholder="Reason for the current RAG status"
            className={`${inputClass} resize-y leading-relaxed`}
          />
        </label>
        <label className="block">
          <FieldLabel>Reason (Anticipated Trend)</FieldLabel>
          <textarea
            value={draft.trendReason}
            onChange={(e) => updateText('trendReason', e.target.value)}
            rows={4}
            placeholder="Reason for the anticipated trend"
            className={`${inputClass} resize-y leading-relaxed`}
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-1">
        <label className="block">
          <FieldLabel>Executive Summary</FieldLabel>
          <textarea
            value={draft.summary}
            onChange={(e) => updateText('summary', e.target.value)}
            rows={3}
            placeholder="Optional summary"
            className={`${inputClass} resize-y leading-relaxed`}
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <FieldLabel>Test Evidence / XRAY Path</FieldLabel>
          <input
            type="url"
            value={draft.testEvidencePath}
            onChange={(e) => updateText('testEvidencePath', e.target.value)}
            placeholder="https://your-company.atlassian.net/browse/KEY-123"
            className={inputClass}
          />
        </label>
        <label className="block">
          <FieldLabel>JIRA base URL</FieldLabel>
          <input
            type="url"
            value={draft.jiraBaseUrl}
            onChange={(e) => updateText('jiraBaseUrl', e.target.value)}
            placeholder="https://your-company.atlassian.net/browse"
            className={inputClass}
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <FieldLabel>Test Artifacts (Confluence)</FieldLabel>
          <input
            type="text"
            value={draft.testArtifacts}
            onChange={(e) => updateText('testArtifacts', e.target.value)}
            placeholder="Not Available Yet."
            className={inputClass}
          />
        </label>
        <label className="block">
          <FieldLabel>Environment Downtime Tracker</FieldLabel>
          <input
            type="text"
            value={draft.environmentDowntime}
            onChange={(e) => updateText('environmentDowntime', e.target.value)}
            placeholder="NA"
            className={inputClass}
          />
        </label>
        <label className="block">
          <FieldLabel>In Scope Confirmed As Of</FieldLabel>
          <input
            type="date"
            value={draft.inScopeConfirmedDate}
            onChange={(e) => updateText('inScopeConfirmedDate', e.target.value)}
            className={inputClass}
          />
        </label>
      </div>
    </div>
  )
}
