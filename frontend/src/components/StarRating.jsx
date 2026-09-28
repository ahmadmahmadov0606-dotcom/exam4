import { useState } from 'react'

export default function StarRating({ value = 0, onChange, size = 'text-base' }) {
  const [hover, setHover] = useState(0)
  const shown = hover || Math.round(value || 0)

  return (
    <span className={`inline-flex ${size}`} onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) =>
        onChange ? (
          <button
            key={n}
            type="button"
            className={`px-0.5 transition hover:scale-110 ${n <= shown ? 'text-secondary' : 'text-line'}`}
            onMouseEnter={() => setHover(n)}
            onClick={() => onChange(n)}
            aria-label={`${n} ситора`}
          >
            ★
          </button>
        ) : (
          <span key={n} className={n <= shown ? 'text-secondary' : 'text-line'}>
            ★
          </span>
        ),
      )}
    </span>
  )
}
