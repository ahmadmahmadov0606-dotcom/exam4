import Icon from './Icon'

export default function Tabs({ tabs, active, onChange }) {
  return (
    <div className="-mx-4 mb-6 overflow-x-auto px-4">
      <div className="flex w-max gap-1 rounded-lg bg-mist p-1 ring-1 ring-line">
        {tabs.map(([value, label, icon]) => (
          <button
            key={value}
            onClick={() => onChange(value)}
            className={`flex items-center gap-1.5 whitespace-nowrap rounded px-4 py-2 text-sm font-semibold transition ${
              active === value ? 'bg-primary text-white shadow' : 'text-muted hover:bg-white hover:text-ink'
            }`}
          >
            {icon && <Icon name={icon} className="text-[18px]" />}
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
