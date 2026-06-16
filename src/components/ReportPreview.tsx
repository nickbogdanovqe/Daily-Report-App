import { useEffect, useRef, useState } from 'react'
import { formatReportBody } from '../lib/formatReportHtml'
import type { Draft } from '../types'

interface ReportPreviewProps {
  draft: Draft
}

const MIN_REPORT_WIDTH = 980

export function ReportPreview({ draft }: ReportPreviewProps) {
  const html = formatReportBody(draft)
  const viewportRef = useRef<HTMLDivElement>(null)
  const pageRef = useRef<HTMLDivElement>(null)
  const [preview, setPreview] = useState({ scale: 1, width: MIN_REPORT_WIDTH, height: 0 })

  useEffect(() => {
    const updatePreviewSize = () => {
      const viewport = viewportRef.current
      const page = pageRef.current
      if (!viewport || !page) return

      // Measure the report's natural width (unaffected by the CSS transform)
      // so a table wider than the page still scales to fit instead of
      // overflowing into a horizontal scroll.
      const reportWidth = Math.max(page.scrollWidth, MIN_REPORT_WIDTH)
      const availableWidth = Math.max(viewport.clientWidth, 320)
      const scale = Math.min(1, availableWidth / reportWidth)
      setPreview({
        scale,
        width: reportWidth,
        height: Math.ceil(page.scrollHeight * scale),
      })
    }

    updatePreviewSize()

    const resizeObserver = new ResizeObserver(updatePreviewSize)
    if (viewportRef.current) resizeObserver.observe(viewportRef.current)
    if (pageRef.current) resizeObserver.observe(pageRef.current)

    return () => resizeObserver.disconnect()
  }, [html])

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-slate-200/80 bg-white shadow-2xl shadow-slate-300/40 ring-1 ring-slate-900/5">
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
              <h2 className="text-sm font-semibold text-slate-950">QE status report preview</h2>
              <p className="text-xs text-slate-500">
                Spreadsheet-style layout for formatted paste
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
      <div
        ref={viewportRef}
        className="flex-1 overflow-auto bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.08),transparent_24rem),#e5e7eb] p-4 sm:p-6"
      >
        <div
          className="mx-auto"
          style={{
            height: preview.height || undefined,
            width: preview.width * preview.scale,
          }}
        >
          <div
            ref={pageRef}
            className="origin-top-left rounded-sm bg-white p-0 shadow-xl shadow-slate-400/30 ring-1 ring-slate-300/70"
            style={{
              width: 'max-content',
              minWidth: MIN_REPORT_WIDTH,
              transform: `scale(${preview.scale})`,
            }}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </div>
    </div>
  )
}
