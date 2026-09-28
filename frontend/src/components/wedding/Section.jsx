import Icon from '../Icon'

export default function Section({ title, aside, children }) {
  return (
    <section className="card p-5 sm:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-serif text-2xl font-semibold">{title}</h2>
        {aside && <span className="text-sm text-muted">{aside}</span>}
      </div>
      {children}
    </section>
  )
}

export function DeleteButton({ onClick, disabled }) {
  return (
    <button className="rounded-full p-1.5 text-muted transition hover:bg-red-50 hover:text-red-600" onClick={onClick} disabled={disabled} aria-label="Нест кардан">
      <Icon name="delete" className="text-[20px]" />
    </button>
  )
}
