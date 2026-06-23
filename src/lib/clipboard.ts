import { formatReport } from './formatReport'
import { formatReportBody } from './formatReportHtml'
import { copyHtmlViaSelection, wrapHtmlForClipboard } from './outlookClipboard'
import type { Draft } from '../types'

export async function copyReportToClipboard(draft: Draft): Promise<boolean> {
  const plain = formatReport(draft)
  const fragment = formatReportBody(draft)
  const htmlDocument = wrapHtmlForClipboard(fragment)

  // 1) Browser Clipboard API expects raw HTML, not CF_HTML headers.
  try {
    if (navigator.clipboard?.write) {
      const htmlBlob = new Blob([htmlDocument], { type: 'text/html' })
      const plainBlob = new Blob([plain], { type: 'text/plain' })
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': htmlBlob,
          'text/plain': plainBlob,
        }),
      ])
      return true
    }
  } catch {
    // continue to fallbacks
  }

  // 2) Selectable HTML fragment — works in Safari / some Outlook web
  if (await copyHtmlViaSelection(fragment)) {
    return true
  }

  // 3) Plain text only
  try {
    await navigator.clipboard.writeText(plain)
    return true
  } catch {
    const textarea = document.createElement('textarea')
    textarea.value = plain
    textarea.style.position = 'fixed'
    textarea.style.left = '-9999px'
    document.body.appendChild(textarea)
    textarea.select()
    try {
      return document.execCommand('copy')
    } catch {
      return false
    } finally {
      document.body.removeChild(textarea)
    }
  }
}
