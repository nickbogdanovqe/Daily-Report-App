import { useState } from 'react'
import { copyReportToClipboard } from '../lib/clipboard'
import type { Draft } from '../types'

interface ToolbarProps {
  draft: Draft
  lastSaved: Date | null
  onReset: () => void
}

export function Toolbar({ draft, lastSaved, onReset }: ToolbarProps) {
  const [copyMessage, setCopyMessage] = useState<string | null>(null)

  const handleCopy = async () => {
    const ok = await copyReportToClipboard(draft)
    setCopyMessage(
      ok
        ? 'Copied — paste into Outlook (Ctrl+V / Cmd+V) and edit as needed'
        : 'Copy failed — try again',
    )
    window.setTimeout(() => setCopyMessage(null), 4000)
  }

  const handleReset = () => {
    if (
      window.confirm(
        'Reset the entire draft? This clears all tasks, blockers, highlights, and defects.',
      )
    ) {
      onReset()
    }
  }

  const savedLabel = lastSaved
    ? `Saved ${lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
    : 'Not saved yet'

  return (
    <div className="sticky bottom-0 z-10 border-t border-slate-200/80 bg-white/90 px-4 py-3 shadow-[0_-4px_24px_rgba(15,23,42,0.06)] backdrop-blur-md sm:px-6">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
        <span className="text-xs text-slate-500">{savedLabel}</span>
        <div className="flex flex-wrap items-center gap-2">
          {copyMessage && (
            <span
              className={`max-w-xs text-xs font-medium ${copyMessage.includes('failed') ? 'text-red-600' : 'text-emerald-700'}`}
              role="status"
            >
              {copyMessage}
            </span>
          )}
          <button
            type="button"
            onClick={handleReset}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
          >
            Reset draft
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="rounded-xl bg-gradient-to-r from-blue-700 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-600/25 transition hover:from-blue-800 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Copy formatted report
          </button>
        </div>
      </div>
    </div>
  )
}
