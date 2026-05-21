import { formatReportBody } from '../lib/formatReportHtml'
import type { Draft } from '../types'

interface ReportPreviewProps {
  draft: Draft
}

export function ReportPreview({ draft }: ReportPreviewProps) {
  const html = formatReportBody(draft)

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white shadow-2xl shadow-slate-300/40 ring-1 ring-slate-900/5">
      <div className="shrink-0 border-b border-slate-200/70 bg-gradient-to-r from-white via-slate-50 to-blue-50 px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-600/20"
              aria-hidden
            >
              <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
                <path d="M3 4.75A2.75 2.75 0 015.75 2h8.5A2.75 2.75 0 0117 4.75v10.5A2.75 2.75 0 0114.25 18h-8.5A2.75 2.75 0 013 15.25V4.75zM5.75 3.5c-.69 0-1.25.56-1.25 1.25v.5l5.5 3.438 5.5-3.438v-.5c0-.69-.56-1.25-1.25-1.25h-8.5zm9.75 3.52l-5.102 3.189a.75.75 0 01-.796 0L4.5 7.019v8.231c0 .69.56 1.25 1.25 1.25h8.5c.69 0 1.25-.56 1.25-1.25V7.019z" />
              </svg>
            </span>
            <div>
              <h2 className="text-sm font-semibold text-slate-950">Outlook preview</h2>
              <p className="text-xs text-slate-500">
                Wider compose-style view, ready to paste and edit
              </p>
            </div>
          </div>
          <div>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              Rich copy enabled
            </span>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-auto bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.08),transparent_24rem),#e5e7eb] p-4 sm:p-6">
        <div
          className="mx-auto min-w-[760px] max-w-[920px] overflow-hidden rounded-xl bg-white p-5 shadow-xl shadow-slate-400/30 ring-1 ring-slate-300/70"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </div>
  )
}
