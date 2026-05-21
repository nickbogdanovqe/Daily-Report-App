export function formatDateLong(isoDate: string): string {
  const date = new Date(`${isoDate}T12:00:00`)
  if (Number.isNaN(date.getTime())) return isoDate
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function formatDateShort(isoDate: string): string {
  const date = new Date(`${isoDate}T12:00:00`)
  if (Number.isNaN(date.getTime())) return isoDate
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}
