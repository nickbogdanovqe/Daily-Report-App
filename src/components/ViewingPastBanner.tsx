import { formatDateLong } from '../lib/formatDate'

interface ViewingPastBannerProps {
  viewingDate: string
  hasReport: boolean
  onBackToToday: () => void
}

export function ViewingPastBanner({
  viewingDate,
  hasReport,
  onBackToToday,
}: ViewingPastBannerProps) {
  return (
    <div
      className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-3 shadow-sm ring-1 ring-amber-500/10"
      role="status"
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-amber-950">Viewing past report</p>
        <p className="mt-0.5 text-sm text-amber-900/90">
          {hasReport ? (
            <>
              Read-only snapshot from <strong>{formatDateLong(viewingDate)}</strong>. You can
              preview and copy it, but not edit.
            </>
          ) : (
            <>
              No report was saved for <strong>{formatDateLong(viewingDate)}</strong>.
            </>
          )}
        </p>
      </div>
      <button
        type="button"
        onClick={onBackToToday}
        className="shrink-0 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-amber-900 shadow-sm ring-1 ring-amber-200 transition hover:bg-amber-100/80"
      >
        Back to today
      </button>
    </div>
  )
}
