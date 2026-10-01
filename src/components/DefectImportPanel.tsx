import { useMemo, useState, type ChangeEvent } from 'react'
import {
  DefectsImportFileSchema,
  mergeImportedDefects,
  summarizeImport,
  type DefectsImportFile,
  type ImportMode,
} from '../lib/jiraDefects'
import type { Defect } from '../types'

interface DefectImportPanelProps {
  defects: Defect[]
  jiraBaseUrl: string
  onImport: (defects: Defect[], jiraBaseUrl: string) => void
  onClose: () => void
}

type ParseResult =
  | { kind: 'empty' }
  | { kind: 'error'; message: string }
  | { kind: 'ok'; file: DefectsImportFile }

function parseImportText(text: string): ParseResult {
  if (!text.trim()) return { kind: 'empty' }

  let json: unknown
  try {
    json = JSON.parse(text)
  } catch {
    return { kind: 'error', message: 'Not valid JSON. Paste the full contents of jira-defects.json.' }
  }

  const parsed = DefectsImportFileSchema.safeParse(json)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    const where = first?.path.length ? ` at ${first.path.join('.')}` : ''
    return {
      kind: 'error',
      message: `Unexpected file shape${where}: ${first?.message ?? 'validation failed'}`,
    }
  }

  return { kind: 'ok', file: parsed.data }
}

function formatSyncedAt(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function DefectImportPanel({
  defects,
  jiraBaseUrl,
  onImport,
  onClose,
}: DefectImportPanelProps) {
  const [text, setText] = useState('')
  const [mode, setMode] = useState<ImportMode>('merge')
  const [fileError, setFileError] = useState<string | null>(null)

  const parsed = useMemo(() => parseImportText(text), [text])

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setFileError(null)
    file
      .text()
      .then((contents) => setText(contents))
      .catch(() => setFileError('Could not read that file.'))
    event.target.value = ''
  }

  const handleImport = () => {
    if (parsed.kind !== 'ok') return
    const merged = mergeImportedDefects(defects, parsed.file.defects, mode)
    const nextBaseUrl = jiraBaseUrl.trim() ? jiraBaseUrl : parsed.file.jiraBaseUrl
    onImport(merged, nextBaseUrl)
    onClose()
  }

  const summary = parsed.kind === 'ok' ? summarizeImport(parsed.file.defects) : null

  return (
    <div className="space-y-3 rounded-xl border border-violet-200 bg-violet-50/60 p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-slate-900">Import defects from Jira</p>
          <p className="text-xs text-slate-600">
            Run <code className="rounded bg-white px-1 py-0.5 font-mono text-[11px]">npm run sync:jira</code>{' '}
            in the project folder, then paste the JSON (it is also copied to your clipboard) or
            choose the generated <code className="font-mono text-[11px]">jira-defects.json</code>.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded p-1 text-slate-400 hover:bg-white hover:text-slate-600"
          aria-label="Close import panel"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
            <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder='{"source":"jira","release":"Aurora Gatlinburg", ...}'
        rows={5}
        spellCheck={false}
        className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-slate-800 shadow-inner shadow-slate-900/5 placeholder:text-slate-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
      />

      <div className="flex flex-wrap items-center gap-3">
        <label className="cursor-pointer rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:border-violet-400 hover:text-violet-700">
          Choose file
          <input type="file" accept="application/json,.json" onChange={handleFile} className="sr-only" />
        </label>

        <fieldset className="flex items-center gap-3 text-xs text-slate-700">
          <legend className="sr-only">Import mode</legend>
          <label className="flex items-center gap-1.5">
            <input
              type="radio"
              name="defect-import-mode"
              checked={mode === 'merge'}
              onChange={() => setMode('merge')}
            />
            Merge (keep my notes)
          </label>
          <label className="flex items-center gap-1.5">
            <input
              type="radio"
              name="defect-import-mode"
              checked={mode === 'replace'}
              onChange={() => setMode('replace')}
            />
            Replace all
          </label>
        </fieldset>
      </div>

      {fileError && <p className="text-xs text-red-700">{fileError}</p>}
      {parsed.kind === 'error' && <p className="text-xs text-red-700">{parsed.message}</p>}
      {parsed.kind === 'ok' && summary && (
        <p className="text-xs text-emerald-800">
          {summary.total} {summary.total === 1 ? 'defect' : 'defects'} ({summary.production}{' '}
          Production) from <span className="font-semibold">{parsed.file.release}</span>, synced{' '}
          {formatSyncedAt(parsed.file.syncedAt)}.
          {mode === 'merge'
            ? ' Existing notes are kept; Jira-sourced defects not in this file are removed.'
            : ' All current defects will be replaced.'}
        </p>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleImport}
          disabled={parsed.kind !== 'ok'}
          className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Import defects
        </button>
      </div>
    </div>
  )
}
