import Icon from './Icon'

export default function EmptyState({ icon = 'favorite', title, text, action }) {
  return (
    <div className="card flex flex-col items-center px-6 py-14 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-mist text-primary">
        <Icon name={icon} className="text-4xl" />
      </div>
      <h3 className="font-serif text-2xl font-semibold">{title}</h3>
      {text && <p className="mt-2 max-w-md text-sm text-muted">{text}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
