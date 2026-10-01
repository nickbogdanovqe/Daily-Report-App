import { useLayoutEffect, useRef, type KeyboardEvent } from 'react'

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  minRows?: number
}

type ToolbarAction = 'bold' | 'italic' | 'bullet' | 'numbered' | 'indent' | 'outdent'

const TOOLBAR: { action: ToolbarAction; label: string; title: string; className?: string }[] = [
  { action: 'bold', label: 'B', title: 'Bold (**text**)', className: 'font-bold' },
  { action: 'italic', label: 'I', title: 'Italic (_text_)', className: 'italic' },
  { action: 'bullet', label: '\u2022', title: 'Bullet list (- item)' },
  { action: 'numbered', label: '1.', title: 'Numbered list (1. item)' },
  { action: 'indent', label: '\u2192', title: 'Indent line (Tab)' },
  { action: 'outdent', label: '\u2190', title: 'Outdent line (Shift+Tab)' },
]

interface Edit {
  value: string
  selectionStart: number
  selectionEnd: number
}

function wrapSelection(value: string, start: number, end: number, marker: string): Edit {
  const selected = value.slice(start, end) || 'text'
  const next = `${value.slice(0, start)}${marker}${selected}${marker}${value.slice(end)}`
  return {
    value: next,
    selectionStart: start + marker.length,
    selectionEnd: start + marker.length + selected.length,
  }
}

function lineBounds(value: string, start: number, end: number): { from: number; to: number } {
  const from = value.lastIndexOf('\n', start - 1) + 1
  const nextBreak = value.indexOf('\n', Math.max(end - 1, from))
  const to = nextBreak === -1 ? value.length : nextBreak
  return { from, to }
}

function transformLines(
  value: string,
  start: number,
  end: number,
  transform: (line: string, index: number) => string,
): Edit {
  const { from, to } = lineBounds(value, start, end)
  const lines = value.slice(from, to).split('\n')
  const replaced = lines.map(transform).join('\n')
  const delta = replaced.length - (to - from)
  return {
    value: `${value.slice(0, from)}${replaced}${value.slice(to)}`,
    selectionStart: from,
    selectionEnd: to + delta,
  }
}

const LIST_PREFIX = /^(\s*)(?:[-*\u2022]|\d+[.)])\s+/

function applyAction(action: ToolbarAction, value: string, start: number, end: number): Edit {
  switch (action) {
    case 'bold':
      return wrapSelection(value, start, end, '**')
    case 'italic':
      return wrapSelection(value, start, end, '_')
    case 'bullet':
      return transformLines(value, start, end, (line) =>
        LIST_PREFIX.test(line) ? line.replace(LIST_PREFIX, '$1- ') : `- ${line}`,
      )
    case 'numbered':
      return transformLines(value, start, end, (line, index) =>
        LIST_PREFIX.test(line) ? line.replace(LIST_PREFIX, `$1${index + 1}. `) : `${index + 1}. ${line}`,
      )
    case 'indent':
      return transformLines(value, start, end, (line) => `  ${line}`)
    case 'outdent':
      return transformLines(value, start, end, (line) => line.replace(/^(\t| {1,2})/, ''))
  }
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder = '- Completed smoke testing on the release candidate',
  minRows = 6,
}: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const pendingSelection = useRef<{ start: number; end: number } | null>(null)

  useLayoutEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    textarea.style.height = 'auto'
    textarea.style.height = `${textarea.scrollHeight}px`

    if (pendingSelection.current) {
      textarea.setSelectionRange(pendingSelection.current.start, pendingSelection.current.end)
      pendingSelection.current = null
    }
  }, [value])

  const runAction = (action: ToolbarAction) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const edit = applyAction(action, value, textarea.selectionStart, textarea.selectionEnd)
    pendingSelection.current = { start: edit.selectionStart, end: edit.selectionEnd }
    onChange(edit.value)
    textarea.focus()
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Tab') {
      event.preventDefault()
      runAction(event.shiftKey ? 'outdent' : 'indent')
      return
    }

    if (event.key === 'Enter' && !event.shiftKey) {
      const textarea = event.currentTarget
      const { from } = lineBounds(value, textarea.selectionStart, textarea.selectionStart)
      const currentLine = value.slice(from, textarea.selectionStart)
      const match = LIST_PREFIX.exec(currentLine)
      if (!match) return

      event.preventDefault()
      const contentAfterMarker = currentLine.slice(match[0].length)
      if (!contentAfterMarker.trim()) {
        // Enter on an empty list item ends the list.
        const next = `${value.slice(0, from)}${value.slice(textarea.selectionStart)}`
        pendingSelection.current = { start: from, end: from }
        onChange(next)
        return
      }

      const prefix = match[0].replace(/\d+/, (n) => String(Number(n) + 1))
      const insertion = `\n${prefix}`
      const next = `${value.slice(0, textarea.selectionStart)}${insertion}${value.slice(textarea.selectionEnd)}`
      const caret = textarea.selectionStart + insertion.length
      pendingSelection.current = { start: caret, end: caret }
      onChange(next)
      return
    }

    if ((event.metaKey || event.ctrlKey) && !event.altKey) {
      if (event.key === 'b') {
        event.preventDefault()
        runAction('bold')
      } else if (event.key === 'i') {
        event.preventDefault()
        runAction('italic')
      }
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1" role="toolbar" aria-label="Formatting">
        {TOOLBAR.map((tool) => (
          <button
            key={tool.action}
            type="button"
            title={tool.title}
            aria-label={tool.title}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => runAction(tool.action)}
            className={`flex h-7 min-w-7 items-center justify-center rounded-md border border-slate-200 bg-white px-1.5 text-xs text-slate-700 shadow-sm transition hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 ${tool.className ?? ''}`}
          >
            {tool.label}
          </button>
        ))}
        <span className="ml-auto text-[11px] text-slate-400">
          Markdown: <code>- bullet</code>, <code>  - sub-bullet</code>, <code>**bold**</code>,{' '}
          <code>_italic_</code>, Jira keys auto-link
        </span>
      </div>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={minRows}
        spellCheck
        className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 font-mono text-sm leading-relaxed text-slate-800 shadow-inner shadow-slate-900/5 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
      />
    </div>
  )
}
