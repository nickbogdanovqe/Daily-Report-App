import { useEffect, useRef, useState } from 'react'
import { formatReportBody } from '../lib/formatReportHtml'
import type { Draft } from '../types'

interface ReportPreviewProps {
  draft: Draft
  isReadOnly?: boolean
  hasReport?: boolean
}

// The report tables are authored at a fixed 980px width, so the page never
// needs to be wider than this.
const REPORT_WIDTH = 980

export function ReportPreview({
  draft,
  isReadOnly = false,
  hasReport = true,
}: ReportPreviewProps) {
  const html = formatReportBody(draft)
  const viewportRef = useRef<HTMLDivElement>(null)
  const pageRef = useRef<HTMLDivElement>(null)
  const [preview, setPreview] = useState({ scale: 1, width: REPORT_WIDTH, height: 0 })

  useEffect(() => {
    const updatePreviewSize = () => {
      const viewport = viewportRef.current
      const page = pageRef.current
      if (!viewport || !page) return

      // clientWidth includes the viewport's own padding, so subtract it to get
      // the width actually available to the page.
      const styles = getComputedStyle(viewport)
      const paddingX =
        parseFloat(styles.paddingLeft || '0') + parseFloat(styles.paddingRight || '0')
      const availableWidth = Math.max(viewport.clientWidth - paddingX, 320)

      // Scale the whole page down to fit the available width. A CSS transform
      // shrinks the page visually but NOT its layout box, so the scaled
      // dimensions are mirrored onto the wrapper (with overflow hidden) to keep
      // the footprint correct and avoid any horizontal scrolling.
      const scale = Math.min(1, availableWidth / REPORT_WIDTH)
      setPreview({
        scale,
        width: Math.ceil(REPORT_WIDTH * scale),
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
                {isReadOnly
                  ? hasReport
                    ? 'Read-only snapshot — copy still works'
                    : 'No saved report for this date'
                  : 'Spreadsheet-style layout for formatted paste'}
              </p>
            </div>
          </div>
          <div>
            <span
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                isReadOnly
                  ? 'border-amber-200 bg-amber-50 text-amber-800'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-700'
              }`}
            >
              {isReadOnly ? 'Read-only view' : 'Rich copy enabled'}
            </span>
          </div>
        </div>
      </div>
      <div
        ref={viewportRef}
        className="flex-1 overflow-y-auto overflow-x-hidden bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.08),transparent_24rem),#e5e7eb] p-4 sm:p-6"
      >
        <div
          className="mx-auto overflow-hidden"
          style={{
            width: preview.width,
            height: preview.height || undefined,
          }}
        >
          <div
            ref={pageRef}
            className="origin-top-left rounded-sm bg-white p-0 shadow-xl shadow-slate-400/30 ring-1 ring-slate-300/70"
            style={{
              width: REPORT_WIDTH,
              transform: `scale(${preview.scale})`,
            }}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </div>
    </div>
  )
}
