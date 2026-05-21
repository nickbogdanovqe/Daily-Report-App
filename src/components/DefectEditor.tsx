import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Defect, DefectStatus } from '../types'
import { DEFECT_STATUSES } from '../types'
import { createId } from '../lib/storage'
import { statusColors } from '../lib/reportTheme'

interface DefectEditorProps {
  defects: Defect[]
  onChange: (defects: Defect[]) => void
}

function SortableDefectCard({
  defect,
  onUpdate,
  onRemove,
}: {
  defect: Defect
  onUpdate: (patch: Partial<Defect>) => void
  onRemove: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: defect.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const st = statusColors(defect.status)

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-xl border border-slate-200/80 bg-white p-3 shadow-sm ring-1 ring-slate-900/5 ${isDragging ? 'opacity-60 shadow-md' : ''}`}
    >
      <div className="mb-2 flex items-start gap-2">
        <button
          type="button"
          className="mt-1 shrink-0 cursor-grab touch-none rounded p-1 text-slate-400 hover:bg-white hover:text-slate-600 active:cursor-grabbing"
          aria-label="Drag to reorder"
          {...attributes}
          {...listeners}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
            <circle cx="5" cy="4" r="1.25" />
            <circle cx="11" cy="4" r="1.25" />
            <circle cx="5" cy="8" r="1.25" />
            <circle cx="11" cy="8" r="1.25" />
            <circle cx="5" cy="12" r="1.25" />
            <circle cx="11" cy="12" r="1.25" />
          </svg>
        </button>
        <input
          type="text"
          value={defect.title}
          onChange={(e) => onUpdate({ title: e.target.value })}
          placeholder="Defect title"
          className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
        <button
          type="button"
          onClick={onRemove}
          className="shrink-0 rounded p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
          aria-label="Remove defect"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
            <path d="M2 4h12M5.5 4V2.5h5V4M6 4v9.5M10 4v9.5M4 4l.5 9.5h7L12 4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <label className="block">
          <span className="mb-1 flex items-center gap-2 text-xs font-medium text-slate-500">
            Status
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-bold"
              style={{ backgroundColor: st.bg, color: st.text }}
            >
              {defect.status}
            </span>
          </span>
          <select
            value={defect.status}
            onChange={(e) => onUpdate({ status: e.target.value as DefectStatus })}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-2 py-2 text-sm text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            {DEFECT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-500">JIRA ID</span>
          <input
            type="text"
            value={defect.jiraId ?? ''}
            onChange={(e) => onUpdate({ jiraId: e.target.value.toUpperCase() })}
            placeholder="ABC-123"
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-2 py-2 text-sm font-semibold uppercase text-slate-800 shadow-inner shadow-slate-900/5 placeholder:font-medium placeholder:normal-case placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </label>
        <label className="col-span-2 block sm:col-span-1">
          <span className="mb-1 block text-xs font-medium text-slate-500">Link</span>
          <input
            type="url"
            value={defect.link}
            onChange={(e) => onUpdate({ link: e.target.value })}
            placeholder="https://example.com/defect/123"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </label>
        <label className="block col-span-2 sm:col-span-3">
          <span className="mb-1 block text-xs font-medium text-slate-500">Note</span>
          <input
            type="text"
            value={defect.note}
            onChange={(e) => onUpdate({ note: e.target.value })}
            placeholder="Short note (platform, build, etc.)"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </label>
      </div>
    </div>
  )
}

export function DefectEditor({ defects, onChange }: DefectEditorProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = defects.findIndex((d) => d.id === active.id)
    const newIndex = defects.findIndex((d) => d.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return
    onChange(arrayMove(defects, oldIndex, newIndex))
  }

  const addDefect = () => {
    onChange([
      ...defects,
      {
        id: createId(),
        title: '',
        status: 'Open',
        jiraId: '',
        link: '',
        note: '',
      },
    ])
  }

  const updateDefect = (id: string, patch: Partial<Defect>) => {
    onChange(defects.map((d) => (d.id === id ? { ...d, ...patch } : d)))
  }

  const removeDefect = (id: string) => {
    onChange(defects.filter((d) => d.id !== id))
  }

  return (
    <div className="space-y-3">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={defects.map((d) => d.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {defects.map((defect) => (
              <SortableDefectCard
                key={defect.id}
                defect={defect}
                onUpdate={(patch) => updateDefect(defect.id, patch)}
                onRemove={() => removeDefect(defect.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      <button
        type="button"
        onClick={addDefect}
        className="w-full rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-blue-400 hover:bg-blue-50/50 hover:text-blue-700"
      >
        + Add defect
      </button>
    </div>
  )
}
