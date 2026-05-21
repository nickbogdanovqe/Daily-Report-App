import { useState } from 'react'
import { formatReportBody } from '../lib/formatReportHtml'
import { formatDateShort } from '../lib/formatDate'
import type { Draft } from '../types'

interface PreviousReportPanelProps {
  previousReport: Draft
}

export function PreviousReportPanel({ previousReport }: PreviousReportPanelProps) {
  const [open, setOpen] = useState(false)
  const html = formatReportBody(previousReport)

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm ring-1 ring-slate-900/5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left transition hover:bg-slate-50/80"
      >
        <span>
          <span className="block text-sm font-semibold text-slate-800">Previous day&apos;s report</span>
          <span className="text-xs text-slate-500">
            {formatDateShort(previousReport.reportDate)} — reference only
          </span>
        </span>
        <span className="text-slate-400" aria-hidden>
          {open ? '−' : '+'}
        </span>
      </button>
      {open && (
        <div className="border-t border-slate-100 bg-slate-50/50 p-3">
          <p className="mb-2 text-xs text-slate-500">
            This is what you filed last session. Your editor above is for today&apos;s report.
          </p>
          <div
            className="max-h-64 overflow-auto rounded-lg border border-slate-200 bg-white shadow-inner"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      )}
    </section>
  )
}
