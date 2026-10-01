import { describe, expect, it } from 'vitest'
import {
  parseInlines,
  parseMarkdown,
  renderMarkdownHtml,
  renderMarkdownText,
} from './markdownLite'

const JIRA = 'https://firsthorizon.atlassian.net'

describe('parseInlines', () => {
  it('parses bold, italic and links', () => {
    expect(parseInlines('**done** and _soon_ via [docs](https://x.y/z)', { jiraBaseUrl: '' })).toEqual(
      [
        { type: 'bold', children: [{ type: 'text', text: 'done' }] },
        { type: 'text', text: ' and ' },
        { type: 'italic', children: [{ type: 'text', text: 'soon' }] },
        { type: 'text', text: ' via ' },
        { type: 'link', href: 'https://x.y/z', children: [{ type: 'text', text: 'docs' }] },
      ],
    )
  })

  it('links Jira keys when a base URL is set and leaves them as text otherwise', () => {
    expect(parseInlines('Fixed DIGENG-123 today', { jiraBaseUrl: JIRA })).toEqual([
      { type: 'text', text: 'Fixed ' },
      {
        type: 'link',
        href: `${JIRA}/browse/DIGENG-123`,
        children: [{ type: 'text', text: 'DIGENG-123' }],
      },
      { type: 'text', text: ' today' },
    ])
    expect(parseInlines('DIGENG-123', { jiraBaseUrl: '' })).toEqual([
      { type: 'text', text: 'DIGENG-123' },
    ])
  })

  it('does not treat snake_case or a Jira key inside a URL as markup', () => {
    expect(parseInlines('aurora_production_issue label', { jiraBaseUrl: JIRA })).toEqual([
      { type: 'text', text: 'aurora_production_issue label' },
    ])
    expect(parseInlines(`see ${JIRA}/browse/DIGENG-5.`, { jiraBaseUrl: JIRA })).toEqual([
      { type: 'text', text: 'see ' },
      {
        type: 'link',
        href: `${JIRA}/browse/DIGENG-5`,
        children: [{ type: 'text', text: `${JIRA}/browse/DIGENG-5` }],
      },
      { type: 'text', text: '.' },
    ])
  })
})

describe('parseMarkdown', () => {
  it('builds nested bullet and numbered lists with markers', () => {
    const blocks = parseMarkdown(
      ['Intro line', '- top', '  - nested', '\t- tab nested', '- back', '', '1. one', '2. two'].join(
        '\n',
      ),
      { jiraBaseUrl: '' },
    )

    expect(blocks).toHaveLength(3)
    expect(blocks[0]).toEqual({ type: 'paragraph', children: [{ type: 'text', text: 'Intro line' }] })

    const list = blocks[1]
    if (list?.type !== 'list') throw new Error('expected list')
    expect(list.items.map((item) => [item.depth, item.marker])).toEqual([
      [0, '\u2022'],
      [1, '\u25E6'],
      [1, '\u25E6'],
      [0, '\u2022'],
    ])

    const ordered = blocks[2]
    if (ordered?.type !== 'list') throw new Error('expected list')
    expect(ordered.items.map((item) => item.marker)).toEqual(['1.', '2.'])
  })
})

describe('renderMarkdownHtml', () => {
  it('escapes HTML and emits Outlook-safe tables for lists', () => {
    const html = renderMarkdownHtml('- **Smoke** passed <b>x</b>\n  - DIGENG-7 verified', JIRA)
    expect(html).toContain('<table')
    expect(html).toContain('<b>Smoke</b>')
    expect(html).toContain('&lt;b&gt;x&lt;/b&gt;')
    expect(html).not.toContain('<b>x</b>')
    expect(html).toContain(`href="${JIRA}/browse/DIGENG-7"`)
    expect(html).toContain('padding:0 6px 6px 18px')
  })

  it('renders paragraphs for plain lines', () => {
    expect(renderMarkdownHtml('Just text', '')).toMatch(/^<p [^>]*>Just text<\/p>$/)
  })

  it('returns an empty string for empty input', () => {
    expect(renderMarkdownHtml('   \n', '')).toBe('')
  })
})

describe('renderMarkdownText', () => {
  it('strips markup and indents nested items', () => {
    expect(
      renderMarkdownText('- **Smoke** passed\n  - DIGENG-7 verified\n1. [Plan](https://p.q)', JIRA),
    ).toBe(
      [
        '\u2022 Smoke passed',
        `  \u25E6 DIGENG-7 (${JIRA}/browse/DIGENG-7) verified`,
        '1. Plan (https://p.q)',
      ].join('\n'),
    )
  })
})
