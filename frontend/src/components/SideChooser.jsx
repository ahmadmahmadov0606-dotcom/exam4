import { AUDIENCES } from '../utils/constants'
import Icon from './Icon'

// Groom / bride picker: decides which products and services the client sees.
export default function SideChooser({ value, onChange, error }) {
  return (
    <div>
      <span className="label">Шумо кистед?</span>
      <div className="grid grid-cols-2 gap-3">
        {Object.entries(AUDIENCES).map(([side, a]) => {
          const active = value === side
          return (
            <button
              type="button"
              key={side}
              onClick={() => onChange(side)}
              className={`relative flex flex-col items-center rounded-xl border p-4 text-center transition ${
                active ? 'border-secondary bg-secondary-light/40 ring-2 ring-secondary-bright' : 'border-line bg-white hover:border-secondary'
              }`}
            >
              {active && <Icon name="check_circle" fill className="absolute right-2 top-2 text-[20px] text-secondary" />}
              <span className={`flex h-12 w-12 items-center justify-center rounded-full ${active ? 'bg-secondary-bright text-primary' : 'bg-mist text-primary'}`}>
                <Icon name={a.icon} className="text-[28px]" />
              </span>
              <span className="mt-2 font-serif text-xl font-medium">{a.label}</span>
              <span className="mt-0.5 text-[11px] leading-snug text-muted">{a.text}</span>
            </button>
          )
        })}
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  )
}
