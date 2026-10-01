import { describe, expect, it } from 'vitest'
import { normalizeDraft } from './storage'

describe('normalizeDraft', () => {
  it('migrates legacy highlight lists to Markdown bullets', () => {
    const draft = normalizeDraft({
      highlights: [
        { id: 'a', text: 'Completed smoke testing', jiraId: 'digeng-10' },
        { id: 'b', text: 'Regression 80% done' },
        { id: 'c', text: '   ' },
      ],
    })

    expect(draft.highlightsMarkdown).toBe(
      '- DIGENG-10 - Completed smoke testing\n- Regression 80% done',
    )
  })

  it('prefers stored Markdown over the legacy list', () => {
    const draft = normalizeDraft({
      highlightsMarkdown: '- **Kept**',
      highlights: [{ id: 'a', text: 'ignored' }],
    })
    expect(draft.highlightsMarkdown).toBe('- **Kept**')
  })

  it('defaults new defect fields for pre-Jira-import drafts', () => {
    const draft = normalizeDraft({
      defects: [{ id: 'd1', title: 'Old defect', status: 'Open', link: '', note: '' }],
    })

    expect(draft.defects[0]).toMatchObject({
      title: 'Old defect',
      isProduction: false,
      priority: undefined,
      jiraStatus: undefined,
    })
  })
})
