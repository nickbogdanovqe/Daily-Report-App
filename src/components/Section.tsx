import { useState, type ReactNode } from 'react'

type SectionVariant = 'scope' | 'highlights' | 'defects'

const VARIANT_STYLES: Record<
  SectionVariant,
  {
    accent: string
    iconBg: string
    iconColor: string
    label: string
    cardBg: string
    hoverBg: string
    divider: string
  }
> = {
  scope: {
    accent: 'border-l-red-600',
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    label: 'Scope',
    cardBg: 'bg-red-50/80',
    hoverBg: 'hover:bg-red-50',
    divider: 'border-red-100',
  },
  highlights: {
    accent: 'border-l-emerald-500',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    label: 'Wins',
    cardBg: 'bg-white/95',
    hoverBg: 'hover:bg-slate-50/80',
    divider: 'border-slate-100',
  },
  defects: {
    accent: 'border-l-violet-500',
    iconBg: 'bg-violet-100',
    iconColor: 'text-violet-600',
    label: 'QA',
    cardBg: 'bg-white/95',
    hoverBg: 'hover:bg-slate-50/80',
    divider: 'border-slate-100',
  },
}

interface SectionProps {
  title: string
  count: number
  variant: SectionVariant
  children: ReactNode
  defaultOpen?: boolean
}

function SectionIcon({ variant }: { variant: SectionVariant }) {
  const cls = `h-4 w-4 ${VARIANT_STYLES[variant].iconColor}`
  switch (variant) {
    case 'scope':
      return (
        <svg className={cls} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
          <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
        </svg>
      )
    case 'highlights':
      return (
        <svg className={cls} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      )
    case 'defects':
      return (
        <svg className={cls} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
        </svg>
      )
  }
}

export function Section({
  title,
  count,
  variant,
  children,
  defaultOpen = true,
}: SectionProps) {
  const [open, setOpen] = useState(defaultOpen)
  const style = VARIANT_STYLES[variant]

  return (
    <section
      className={`overflow-hidden rounded-[1.5rem] border border-slate-200/80 shadow-lg shadow-slate-200/50 ring-1 ring-slate-900/5 backdrop-blur border-l-4 ${style.accent} ${style.cardBg}`}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition ${style.hoverBg}`}
      >
        <span className="flex items-center gap-3">
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${style.iconBg} shadow-sm`}
          >
            <SectionIcon variant={variant} />
          </span>
          <span>
            <span className="block text-sm font-bold text-slate-950">{title}</span>
            <span className="text-xs font-medium text-slate-400">
              {count} {count === 1 ? 'item' : 'items'}
            </span>
          </span>
        </span>
        <span
          className={`flex h-7 w-7 items-center justify-center rounded-lg text-sm font-medium transition ${open ? 'bg-slate-100 text-slate-600' : 'text-slate-400'}`}
          aria-hidden
        >
          {open ? '−' : '+'}
        </span>
      </button>
      {open && <div className={`border-t px-5 pb-5 pt-4 ${style.divider}`}>{children}</div>}
    </section>
  )
}
