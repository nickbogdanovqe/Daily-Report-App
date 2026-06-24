import { formatDateShort } from '../lib/formatDate'
import { todayIsoDate } from '../lib/storage'

interface ReportHistoryPickerProps {
  viewingDate: string
  historyDates: string[]
  hasReportForDate: (date: string) => boolean
  onSelectDate: (date: string) => void
}

function dateChipLabel(isoDate: string, isToday: boolean): string {
  if (isToday) return 'Today'
  return formatDateShort(isoDate)
}

export function ReportHistoryPicker({
  viewingDate,
  historyDates,
  hasReportForDate,
  onSelectDate,
}: ReportHistoryPickerProps) {
  const today = todayIsoDate()

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-4 shadow-lg shadow-slate-200/50 ring-1 ring-slate-900/5">
      <div className="mb-3">
        <h2 className="text-sm font-bold text-slate-950">Report history</h2>
        <p className="mt-0.5 text-xs text-slate-500">
          Browse reports from the last {historyDates.length} days. Past reports are read-only;
          copy still works.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {historyDates.map((date) => {
          const isToday = date === today
          const isSelected = date === viewingDate
          const hasReport = hasReportForDate(date)
          const canSelect = isToday || hasReport

          return (
            <button
              key={date}
              type="button"
              disabled={!canSelect}
              onClick={() => onSelectDate(date)}
              className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                isSelected
                  ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                  : canSelect
                    ? 'border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50'
                    : 'cursor-not-allowed border-slate-100 bg-slate-50 text-slate-400'
              }`}
              aria-pressed={isSelected}
              aria-label={
                canSelect
                  ? `View report for ${dateChipLabel(date, isToday)}`
                  : `No report saved for ${dateChipLabel(date, isToday)}`
              }
            >
              {dateChipLabel(date, isToday)}
              {!isToday && !hasReport ? ' · empty' : ''}
            </button>
          )
        })}
      </div>
    </div>
  )
}
