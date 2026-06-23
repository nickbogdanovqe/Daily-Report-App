const AUTOMATED_COLOR = '#70AD47'
const MANUAL_COLOR = '#C00000'
const GRID_SIZE = 28
const CELL_SIZE = 5
const CHART_SIZE = GRID_SIZE * CELL_SIZE

function pieSliceFraction(x: number, y: number, center: number, radius: number): number | null {
  const dx = x - center
  const dy = y - center
  if (Math.sqrt(dx * dx + dy * dy) > radius) return null

  return ((Math.atan2(dy, dx) + Math.PI / 2 + Math.PI * 2) % (Math.PI * 2)) / (Math.PI * 2)
}

function pieCellColor(fraction: number, automatedFraction: number): string {
  return fraction < automatedFraction ? AUTOMATED_COLOR : MANUAL_COLOR
}

function pieCellHtml(color: string | null): string {
  if (!color) {
    return `<td width="${CELL_SIZE}" height="${CELL_SIZE}" bgcolor="#E8EEF8" style="width:${CELL_SIZE}px;height:${CELL_SIZE}px;padding:0;margin:0;line-height:0;font-size:0;background-color:#E8EEF8;border:0;">&nbsp;</td>`
  }

  return `<td width="${CELL_SIZE}" height="${CELL_SIZE}" bgcolor="${color}" style="width:${CELL_SIZE}px;height:${CELL_SIZE}px;padding:0;margin:0;line-height:0;font-size:0;background-color:${color};border:0;">&nbsp;</td>`
}

export function buildAutomationPieChartHtml(automated: number, manual: number): string {
  const total = automated + manual
  if (total <= 0) return ''

  const automatedFraction = automated / total
  const center = (GRID_SIZE - 1) / 2
  const radius = GRID_SIZE / 2 - 0.5

  const rows: string[] = []
  for (let y = 0; y < GRID_SIZE; y += 1) {
    const cells: string[] = []
    for (let x = 0; x < GRID_SIZE; x += 1) {
      const fraction = pieSliceFraction(x, y, center, radius)
      cells.push(
        pieCellHtml(fraction === null ? null : pieCellColor(fraction, automatedFraction)),
      )
    }
    rows.push(`<tr>${cells.join('')}</tr>`)
  }

  return `<table cellpadding="0" cellspacing="0" border="0" role="presentation" align="center" width="${CHART_SIZE}" height="${CHART_SIZE}" style="width:${CHART_SIZE}px;height:${CHART_SIZE}px;border-collapse:collapse;margin:0 auto;">${rows.join('')}</table>`
}
