export function formatWhen(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

export function localDay(date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function shiftDay(day: string, amount: number): string {
  const [year, month, date] = day.split('-').map(Number)
  const next = new Date(year, (month ?? 1) - 1, date ?? 1)
  next.setDate(next.getDate() + amount)
  return localDay(next)
}
