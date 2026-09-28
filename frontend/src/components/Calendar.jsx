import { useState } from 'react'
import { monthName, toISODate, today } from '../utils/format'

const WEEKDAYS = ['Дш', 'Сш', 'Чш', 'Пш', 'Ҷм', 'Шб', 'Яш']

export default function Calendar({ value, onChange, disabledDates = [] }) {
  const initial = value ? new Date(`${value}T00:00`) : new Date()
  const [view, setView] = useState({ year: initial.getFullYear(), month: initial.getMonth() })
  const busy = new Set(disabledDates)
  const min = today()

  const first = new Date(view.year, view.month, 1)
  const offset = (first.getDay() + 6) % 7
  const days = new Date(view.year, view.month + 1, 0).getDate()
  const cells = [...Array(offset).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)]

  const shift = (delta) => {
    const d = new Date(view.year, view.month + delta, 1)
    setView({ year: d.getFullYear(), month: d.getMonth() })
  }
  const isCurrentMonth = view.year === new Date().getFullYear() && view.month === new Date().getMonth()

  return (
    <div className="rounded-2xl border border-line bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <button type="button" className="btn-ghost" onClick={() => shift(-1)} disabled={isCurrentMonth}>
          ‹
        </button>
        <span className="font-semibold capitalize">
          {monthName(view.month)} {view.year}
        </span>
        <button type="button" className="btn-ghost" onClick={() => shift(1)}>
          ›
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {WEEKDAYS.map((d) => (
          <span key={d} className="py-1 font-medium text-muted">
            {d}
          </span>
        ))}
        {cells.map((day, i) => {
          if (!day) return <span key={`e${i}`} />
          const iso = toISODate(new Date(view.year, view.month, day))
          const isBusy = busy.has(iso)
          const disabled = iso < min || isBusy
          const selected = iso === value
          return (
            <button
              key={iso}
              type="button"
              disabled={disabled}
              onClick={() => onChange(iso)}
              title={isBusy ? 'Брон шудааст' : undefined}
              className={`aspect-square rounded-lg text-sm transition ${
                selected
                  ? 'bg-primary font-semibold text-white'
                  : isBusy
                    ? 'cursor-not-allowed bg-red-50 text-red-300 line-through'
                    : disabled
                      ? 'cursor-not-allowed text-line'
                      : 'hover:bg-secondary-light'
              }`}
            >
              {day}
            </button>
          )
        })}
      </div>
      {disabledDates.length > 0 && (
        <p className="mt-3 flex items-center gap-2 text-xs text-muted">
          <span className="h-3 w-3 rounded bg-red-50 ring-1 ring-red-200" /> Санаҳои бандшуда
        </p>
      )}
    </div>
  )
}
