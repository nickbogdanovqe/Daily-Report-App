import { formatJiraUrl } from './jiraUrl'
import { escapeHtml } from './reportTheme'

/**
 * A deliberately small Markdown subset for the Key Highlights box:
 *
 *   - bullet                       (also `*`)
 *     - nested bullet              (2 spaces or a tab per level)
 *   1. numbered item
 *   **bold**, _italic_ / *italic*, [label](https://url), bare https:// URLs
 *   Jira keys such as DIGENG-123 are linked automatically when a Jira base URL is set.
 *
 * Everything else is treated as plain paragraph text. Output is Outlook-safe
 * (table-based lists, inline styles) because the report is pasted into email.
 */

// ---------------------------------------------------------------------------
// AST
// ---------------------------------------------------------------------------

export type Inline =
  | { type: 'text'; text: string }
  | { type: 'bold'; children: Inline[] }
  | { type: 'italic'; children: Inline[] }
  | { type: 'link'; href: string; children: Inline[] }

export interface MarkdownListItem {
  depth: number
  ordered: boolean
  /** Visible marker: "•", "◦", "▪" or "1." */
  marker: string
  children: Inline[]
}

export type Block =
  | { type: 'paragraph'; children: Inline[] }
  | { type: 'list'; items: MarkdownListItem[] }

// ---------------------------------------------------------------------------
// Inline parsing
// ---------------------------------------------------------------------------

// Built from strings (not regex literals) because the backreferences only make
// sense once the alternatives are combined into a single pattern.
const INLINE_PATTERN = new RegExp(
  [
    String.raw`(\*\*|__)(?=\S)([\s\S]+?)(?<=\S)\1`, // 1,2 bold
    String.raw`(?<![\w*])(\*|_)(?=\S)([^*_\n]+?)(?<=\S)\3(?![\w*])`, // 3,4 italic
    String.raw`\[([^\]\n]+)\]\(([^)\s]+)\)`, // 5,6 link
    String.raw`(https?:\/\/[^\s<>()]+?)(?=[.,;:!?'")\]]*(?:\s|$))`, // 7 bare URL
    String.raw`(?<![\w/-])([A-Z][A-Z0-9]+-\d+)(?![\w-])`, // 8 Jira key
  ].join('|'),
  'g',
)

export interface InlineContext {
  jiraBaseUrl: string
}

export function parseInlines(text: string, context: InlineContext): Inline[] {
  const nodes: Inline[] = []
  let lastIndex = 0

  // matchAll clones the regex, so recursive calls cannot clobber `lastIndex`.
  for (const match of text.matchAll(INLINE_PATTERN)) {
    if (match.index > lastIndex) {
      nodes.push({ type: 'text', text: text.slice(lastIndex, match.index) })
    }

    const [, , boldInner, , italicInner, linkLabel, linkHref, bareUrl, jiraKey] = match

    if (boldInner !== undefined) {
      nodes.push({ type: 'bold', children: parseInlines(boldInner, context) })
    } else if (italicInner !== undefined) {
      nodes.push({ type: 'italic', children: parseInlines(italicInner, context) })
    } else if (linkLabel !== undefined && linkHref !== undefined) {
      nodes.push({
        type: 'link',
        href: linkHref,
        children: parseInlines(linkLabel, context),
      })
    } else if (bareUrl !== undefined) {
      nodes.push({ type: 'link', href: bareUrl, children: [{ type: 'text', text: bareUrl }] })
    } else if (jiraKey !== undefined) {
      const href = formatJiraUrl(context.jiraBaseUrl, jiraKey)
      nodes.push(
        href
          ? { type: 'link', href, children: [{ type: 'text', text: jiraKey }] }
          : { type: 'text', text: jiraKey },
      )
    }

    lastIndex = match.index + match[0].length
  }

  if (lastIndex < text.length) {
    nodes.push({ type: 'text', text: text.slice(lastIndex) })
  }

  return nodes
}

// ---------------------------------------------------------------------------
// Block parsing
// ---------------------------------------------------------------------------

const LIST_ITEM_PATTERN = /^([ \t]*)(?:([-*\u2022])|(\d+)[.)])[ \t]+(.*)$/
const BULLET_GLYPHS = ['\u2022', '\u25E6', '\u25AA'] as const

function bulletGlyph(depth: number): string {
  return BULLET_GLYPHS[Math.min(depth, BULLET_GLYPHS.length - 1)]
}

function indentDepth(indent: string): number {
  let columns = 0
  for (const char of indent) {
    columns += char === '\t' ? 2 : 1
  }
  return Math.floor(columns / 2)
}

export function parseMarkdown(markdown: string, context: InlineContext): Block[] {
  const blocks: Block[] = []
  let currentList: MarkdownListItem[] | null = null
  const orderedCounters: number[] = []

  const flushList = () => {
    if (currentList && currentList.length > 0) {
      blocks.push({ type: 'list', items: currentList })
    }
    currentList = null
    orderedCounters.length = 0
  }

  for (const rawLine of markdown.replace(/\r\n?/g, '\n').split('\n')) {
    if (!rawLine.trim()) {
      flushList()
      continue
    }

    const listMatch = LIST_ITEM_PATTERN.exec(rawLine)
    if (listMatch) {
      const [, indent, , orderedNumber, content] = listMatch
      const depth = indentDepth(indent)
      const ordered = orderedNumber !== undefined

      orderedCounters.length = depth + 1
      if (ordered) {
        orderedCounters[depth] = (orderedCounters[depth] ?? 0) + 1
      } else {
        orderedCounters[depth] = 0
      }

      currentList ??= []
      currentList.push({
        depth,
        ordered,
        marker: ordered ? `${orderedCounters[depth]}.` : bulletGlyph(depth),
        children: parseInlines(content.trim(), context),
      })
      continue
    }

    flushList()
    blocks.push({ type: 'paragraph', children: parseInlines(rawLine.trim(), context) })
  }

  flushList()
  return blocks
}

export function isMarkdownEmpty(markdown: string): boolean {
  return !markdown.trim()
}

// ---------------------------------------------------------------------------
// HTML rendering (Outlook-safe)
// ---------------------------------------------------------------------------

export interface MarkdownHtmlStyle {
  fontFamily: string
  fontSize: string
  lineHeight: string
  color: string
  linkColor: string
}

const DEFAULT_HTML_STYLE: MarkdownHtmlStyle = {
  fontFamily: 'Aptos, Calibri, sans-serif',
  fontSize: '11pt',
  lineHeight: '1.34',
  color: '#000000',
  linkColor: '#2B49C8',
}

const LIST_INDENT_PX = 18
const LIST_MARKER_WIDTH_PX = 18

function textStyle(style: MarkdownHtmlStyle): string {
  return `font-family:${style.fontFamily};font-size:${style.fontSize};line-height:${style.lineHeight};color:${style.color};`
}

function renderInlinesHtml(nodes: Inline[], style: MarkdownHtmlStyle): string {
  return nodes
    .map((node) => {
      switch (node.type) {
        case 'text':
          return escapeHtml(node.text)
        case 'bold':
          return `<b>${renderInlinesHtml(node.children, style)}</b>`
        case 'italic':
          return `<i>${renderInlinesHtml(node.children, style)}</i>`
        case 'link':
          return `<a href="${escapeHtml(node.href)}" style="font-family:${style.fontFamily};font-size:${style.fontSize};color:${style.linkColor};text-decoration:underline;">${renderInlinesHtml(node.children, style)}</a>`
      }
    })
    .join('')
}

function renderListHtml(items: MarkdownListItem[], style: MarkdownHtmlStyle): string {
  const rows = items
    .map((item) => {
      const indent = item.depth * LIST_INDENT_PX
      const markerWidth = LIST_MARKER_WIDTH_PX + indent
      return `<tr>
          <td width="${markerWidth}" valign="top" style="width:${markerWidth}px;padding:0 6px 6px ${indent}px;${textStyle(style)}text-align:${item.ordered ? 'right' : 'center'};">${escapeHtml(item.marker)}</td>
          <td valign="top" style="padding:0 0 6px 0;${textStyle(style)}">${renderInlinesHtml(item.children, style)}</td>
        </tr>`
    })
    .join('')

  return `<table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin:0 0 2px 0;border-collapse:collapse;${textStyle(style)}">${rows}</table>`
}

export function renderMarkdownHtml(
  markdown: string,
  jiraBaseUrl: string,
  styleOverrides: Partial<MarkdownHtmlStyle> = {},
): string {
  const style = { ...DEFAULT_HTML_STYLE, ...styleOverrides }
  const blocks = parseMarkdown(markdown, { jiraBaseUrl })

  return blocks
    .map((block) => {
      switch (block.type) {
        case 'paragraph':
          return `<p style="margin:0 0 8px 0;${textStyle(style)}">${renderInlinesHtml(block.children, style)}</p>`
        case 'list':
          return renderListHtml(block.items, style)
      }
    })
    .join('')
}

// ---------------------------------------------------------------------------
// Plain-text rendering
// ---------------------------------------------------------------------------

function inlinesToText(nodes: Inline[]): string {
  return nodes
    .map((node) => {
      switch (node.type) {
        case 'text':
          return node.text
        case 'bold':
        case 'italic':
          return inlinesToText(node.children)
        case 'link': {
          const label = inlinesToText(node.children)
          return label === node.href ? node.href : `${label} (${node.href})`
        }
      }
    })
    .join('')
}

export function renderMarkdownText(markdown: string, jiraBaseUrl: string): string {
  const blocks = parseMarkdown(markdown, { jiraBaseUrl })
  const lines: string[] = []

  for (const block of blocks) {
    if (block.type === 'paragraph') {
      lines.push(inlinesToText(block.children))
      continue
    }
    for (const item of block.items) {
      lines.push(`${'  '.repeat(item.depth)}${item.marker} ${inlinesToText(item.children)}`)
    }
  }

  return lines.join('\n')
}
