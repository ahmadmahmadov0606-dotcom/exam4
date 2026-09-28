const MONTHS = ['январ', 'феврал', 'март', 'апрел', 'май', 'июн', 'июл', 'август', 'сентябр', 'октябр', 'ноябр', 'декабр']

export function formatPrice(value) {
  const number = Number(value || 0)
  return `${number.toLocaleString('ru-RU', { maximumFractionDigits: 2 })} сомонӣ`
}

function toDate(value) {
  if (value instanceof Date) return value
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split('-').map(Number)
    return new Date(y, m - 1, d)
  }
  return new Date(value)
}

export function formatDate(value, withTime = false) {
  if (!value) return ''
  const date = toDate(value)
  const text = `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`
  if (!withTime) return text
  return `${text}, ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

export function formatTime(value) {
  return value ? value.slice(0, 5) : ''
}

export function monthName(index) {
  return MONTHS[index]
}

export function toISODate(date) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function today() {
  return toISODate(new Date())
}
