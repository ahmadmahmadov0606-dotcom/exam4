// Small wedding ornaments shared by pages: a gold floral divider and falling petals.

export function Divider({ light = false, className = '' }) {
  const line = light ? 'from-transparent to-secondary-bright' : 'from-transparent to-secondary'
  const color = light ? '#ffd07e' : '#7a580f'
  return (
    <div className={`flex items-center justify-center gap-3 ${className}`} aria-hidden="true">
      <span className={`h-px w-16 bg-gradient-to-r ${line}`} />
      <svg width="34" height="18" viewBox="0 0 34 18" fill="none">
        <path d="M17 1c2.5 3.5 2.5 8.5 0 16-2.5-7.5-2.5-12.5 0-16z" fill={color} />
        <path d="M17 9c3-3.2 7.6-4.6 13-4-3.4 4-7.8 5.4-13 4zM17 9c-3-3.2-7.6-4.6-13-4 3.4 4 7.8 5.4 13 4z" fill={color} opacity=".7" />
        <circle cx="2" cy="9" r="1.4" fill={color} />
        <circle cx="32" cy="9" r="1.4" fill={color} />
      </svg>
      <span className={`h-px w-16 bg-gradient-to-l ${line}`} />
    </div>
  )
}

const PETAL_COLORS = ['#f7c6d2', '#fbe1e7', '#ffd07e', '#ffffff', '#f2b5c4']

// Deterministic layout so the petals don't jump between renders.
const PETALS = Array.from({ length: 16 }, (_, i) => ({
  left: (i * 37) % 100,
  size: 8 + ((i * 7) % 9),
  duration: 11 + ((i * 5) % 9),
  delay: -((i * 13) % 17),
  color: PETAL_COLORS[i % PETAL_COLORS.length],
}))

export function Petals({ count = 16 }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {PETALS.slice(0, count).map((p, i) => (
        <svg
          key={i}
          className="petal"
          width={p.size}
          height={p.size * 1.3}
          viewBox="0 0 10 13"
          style={{ left: `${p.left}%`, animationDuration: `${p.duration}s`, animationDelay: `${p.delay}s` }}
        >
          <path d="M5 0C9 3 10 8 5 13 0 8 1 3 5 0z" fill={p.color} opacity=".85" />
        </svg>
      ))}
    </div>
  )
}
