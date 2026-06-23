/**
 * CF_HTML clipboard format — required for reliable rich paste into Outlook (Windows)
 * and editable HTML in the compose window.
 * @see https://learn.microsoft.com/en-us/windows/win32/dataexchange/html-clipboard-format
 */

const START_FRAGMENT = '<!--StartFragment-->'
const END_FRAGMENT = '<!--EndFragment-->'

export function wrapHtmlForClipboard(fragmentHtml: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>${START_FRAGMENT}${fragmentHtml}${END_FRAGMENT}</body></html>`
}

function padOffset(n: number): string {
  return String(n).padStart(10, '0')
}

export function buildCfHtmlClipboard(fragmentHtml: string): string {
  const doc = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>${START_FRAGMENT}${fragmentHtml}${END_FRAGMENT}</body></html>`

  const headerPlaceholder =
    'Version:0.9\r\n' +
    'StartHTML:0000000000\r\n' +
    'EndHTML:0000000000\r\n' +
    'StartFragment:0000000000\r\n' +
    'EndFragment:0000000000\r\n'

  const build = (header: string) => header + doc

  let header = headerPlaceholder
  let payload = build(header)

  const computeHeader = () => {
    const startHTML = header.length
    const endHTML = payload.length
    const startFragment = payload.indexOf(START_FRAGMENT) + START_FRAGMENT.length
    const endFragment = payload.indexOf(END_FRAGMENT)
    return (
      'Version:0.9\r\n' +
      `StartHTML:${padOffset(startHTML)}\r\n` +
      `EndHTML:${padOffset(endHTML)}\r\n` +
      `StartFragment:${padOffset(startFragment)}\r\n` +
      `EndFragment:${padOffset(endFragment)}\r\n`
    )
  }

  header = computeHeader()
  payload = build(header)
  header = computeHeader()
  payload = build(header)

  return payload
}

export async function copyHtmlViaSelection(html: string): Promise<boolean> {
  const host = document.createElement('div')
  host.contentEditable = 'true'
  host.innerHTML = html
  host.style.position = 'fixed'
  host.style.left = '-9999px'
  host.style.top = '0'
  document.body.appendChild(host)

  const range = document.createRange()
  range.selectNodeContents(host)
  const selection = window.getSelection()
  selection?.removeAllRanges()
  selection?.addRange(range)

  let copied: boolean
  try {
    copied = document.execCommand('copy')
  } catch {
    copied = false
  }

  selection?.removeAllRanges()
  document.body.removeChild(host)
  return copied
}
