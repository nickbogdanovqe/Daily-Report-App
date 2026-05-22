import { formatDateShort } from '../lib/formatDate'

interface DayRolloverBannerProps {
  rolledFromDate: string
  onDismiss: () => void
}

export function DayRolloverBanner({ rolledFromDate, onDismiss }: DayRolloverBannerProps) {
  return (
    <div
      className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 shadow-sm ring-1 ring-blue-500/10"
      role="status"
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-blue-900">Loaded from your last report</p>
        <p className="mt-0.5 text-sm text-blue-800/90">
          Content from <strong>{formatDateShort(rolledFromDate)}</strong> is ready to edit for
          today. Update highlights and defects, then copy when done.
        </p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100/80"
      >
        Got it
      </button>
    </div>
  )
}
