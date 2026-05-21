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
import type { ListItem } from '../types'
import { createId } from '../lib/storage'

interface EditableListProps {
  items: ListItem[]
  onChange: (items: ListItem[]) => void
  placeholder?: string
  addLabel?: string
  showJiraId?: boolean
}

function SortableRow({
  item,
  placeholder,
  showJiraId,
  onUpdate,
  onRemove,
}: {
  item: ListItem
  placeholder: string
  showJiraId: boolean
  onUpdate: (patch: Partial<ListItem>) => void
  onRemove: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex gap-2 items-start ${isDragging ? 'opacity-60' : ''}`}
    >
      <button
        type="button"
        className="mt-2.5 shrink-0 cursor-grab touch-none rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 active:cursor-grabbing"
        aria-label="Drag to reorder"
        {...attributes}
        {...listeners}
      >
        <GripIcon />
      </button>
      <div
        className={`grid flex-1 gap-2 ${
          showJiraId ? 'sm:grid-cols-[minmax(0,1fr)_130px]' : 'grid-cols-1'
        }`}
      >
        <input
          type="text"
          value={item.text}
          onChange={(e) => onUpdate({ text: e.target.value })}
          placeholder={placeholder}
          className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm text-slate-800 shadow-inner shadow-slate-900/5 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
        {showJiraId && (
          <input
            type="text"
            value={item.jiraId ?? ''}
            onChange={(e) => onUpdate({ jiraId: e.target.value.toUpperCase() })}
            placeholder="JIRA ID"
            className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm font-semibold uppercase text-slate-800 shadow-inner shadow-slate-900/5 placeholder:font-medium placeholder:normal-case placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        )}
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="mt-1.5 shrink-0 rounded p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
        aria-label="Remove item"
      >
        <TrashIcon />
      </button>
    </div>
  )
}

function GripIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <circle cx="5" cy="4" r="1.25" />
      <circle cx="11" cy="4" r="1.25" />
      <circle cx="5" cy="8" r="1.25" />
      <circle cx="11" cy="8" r="1.25" />
      <circle cx="5" cy="12" r="1.25" />
      <circle cx="11" cy="12" r="1.25" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M2 4h12M5.5 4V2.5h5V4M6 4v9.5M10 4v9.5M4 4l.5 9.5h7L12 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function EditableList({
  items,
  onChange,
  placeholder = 'Enter item…',
  addLabel = 'Add item',
  showJiraId = false,
}: EditableListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = items.findIndex((i) => i.id === active.id)
    const newIndex = items.findIndex((i) => i.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return
    onChange(arrayMove(items, oldIndex, newIndex))
  }

  const addItem = () => {
    onChange([...items, { id: createId(), text: '', jiraId: '' }])
  }

  const updateItem = (id: string, patch: Partial<ListItem>) => {
    onChange(items.map((i) => (i.id === id ? { ...i, ...patch } : i)))
  }

  const removeItem = (id: string) => {
    onChange(items.filter((i) => i.id !== id))
  }

  return (
    <div className="space-y-2">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {items.map((item) => (
              <SortableRow
                key={item.id}
                item={item}
                placeholder={placeholder}
                showJiraId={showJiraId}
                onUpdate={(patch) => updateItem(item.id, patch)}
                onRemove={() => removeItem(item.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      <button
        type="button"
        onClick={addItem}
        className="w-full rounded-xl border border-dashed border-slate-300 px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:border-blue-400 hover:bg-blue-50/80 hover:text-blue-700"
      >
        + {addLabel}
      </button>
    </div>
  )
}
