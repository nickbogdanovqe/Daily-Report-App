const AUTOMATED_COLOR = '#70AD47'
const MANUAL_COLOR = '#C00000'
const DISPLAY_SIZE = 140
const RENDER_SCALE = 3

function renderAutomationPieChartDataUri(automated: number, manual: number): string {
  if (typeof document === 'undefined') return ''

  const total = automated + manual
  if (total <= 0) return ''

  const canvas = document.createElement('canvas')
  const pixelSize = DISPLAY_SIZE * RENDER_SCALE
  canvas.width = pixelSize
  canvas.height = pixelSize

  const ctx = canvas.getContext('2d')
  if (!ctx) return ''

  ctx.scale(RENDER_SCALE, RENDER_SCALE)
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'

  const cx = DISPLAY_SIZE / 2
  const cy = DISPLAY_SIZE / 2
  const radius = DISPLAY_SIZE / 2 - 3

  const slices: { value: number; color: string }[] = []
  if (automated > 0) slices.push({ value: automated, color: AUTOMATED_COLOR })
  if (manual > 0) slices.push({ value: manual, color: MANUAL_COLOR })

  if (slices.length === 1) {
    ctx.beginPath()
    ctx.arc(cx, cy, radius, 0, Math.PI * 2)
    ctx.fillStyle = slices[0].color
    ctx.fill()
  } else {
    let startAngle = -Math.PI / 2

    for (const slice of slices) {
      const sweep = (slice.value / total) * Math.PI * 2
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.arc(cx, cy, radius, startAngle, startAngle + sweep)
      ctx.closePath()
      ctx.fillStyle = slice.color
      ctx.fill()
      startAngle += sweep
    }

    startAngle = -Math.PI / 2
    ctx.strokeStyle = '#FFFFFF'
    ctx.lineWidth = 1.25
    ctx.lineCap = 'round'
    for (const slice of slices) {
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.lineTo(
        cx + radius * Math.cos(startAngle),
        cy + radius * Math.sin(startAngle),
      )
      ctx.stroke()
      startAngle += (slice.value / total) * Math.PI * 2
    }
  }

  return canvas.toDataURL('image/png')
}

export function buildAutomationPieChartHtml(automated: number, manual: number): string {
  const dataUri = renderAutomationPieChartDataUri(automated, manual)
  if (!dataUri) return ''

  return `<img src="${dataUri}" width="${DISPLAY_SIZE}" height="${DISPLAY_SIZE}" alt="Automated vs manual test coverage pie chart" style="display:block;width:${DISPLAY_SIZE}px;height:${DISPLAY_SIZE}px;margin:0 auto;border:0;" />`
}
