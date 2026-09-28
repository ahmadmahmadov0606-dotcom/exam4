import { formatPrice } from '../../utils/format'

export default function BudgetBar({ budget, spent, remaining }) {
  const percent = budget > 0 ? Math.min(100, (spent / budget) * 100) : spent > 0 ? 100 : 0
  const over = Number(remaining) < 0

  return (
    <div className="card p-5 sm:p-6">
      <div className="grid grid-cols-3 gap-4 text-center sm:text-left">
        {[
          ['Буҷа', budget, 'text-ink'],
          ['Сарф шуд', spent, 'text-primary'],
          ['Боқимонда', remaining, over ? 'text-red-600' : 'text-emerald-700'],
        ].map(([label, value, color]) => (
          <div key={label}>
            <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
            <p className={`mt-1 text-base font-semibold sm:text-xl ${color}`}>{formatPrice(value)}</p>
          </div>
        ))}
      </div>
      <div className="mt-5 h-3 overflow-hidden rounded-full bg-ivory ring-1 ring-line">
        <div className={`h-full rounded-full transition-all ${over ? 'bg-red-500' : 'bg-gradient-to-r from-secondary to-primary'}`} style={{ width: `${percent}%` }} />
      </div>
      <p className="mt-2 text-xs text-muted">
        {over ? 'Аз буҷа зиёд харҷ шудааст!' : `${percent.toFixed(0)}% буҷа сарф шудааст`}
      </p>
    </div>
  )
}
