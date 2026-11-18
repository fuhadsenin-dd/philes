export function toISODate(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function todayISO() {
  return toISODate(new Date())
}

function shiftDays(iso: string, days: number) {
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  date.setDate(date.getDate() + days)
  return toISODate(date)
}

export function dateLabel(iso: string) {
  const today = todayISO()
  if (iso === today) return 'Today'
  if (iso === shiftDays(today, -1)) return 'Yesterday'
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: y !== new Date().getFullYear() ? 'numeric' : undefined,
  })
}

export function currentStreak(dates: Iterable<string>) {
  const logged = new Set(dates)
  let cursor = todayISO()
  if (!logged.has(cursor)) cursor = shiftDays(cursor, -1)
  let streak = 0
  while (logged.has(cursor)) {
    streak += 1
    cursor = shiftDays(cursor, -1)
  }
  return streak
}
