export default function Field({ label, error, as: Tag = 'input', children, className = '', ...props }) {
  return (
    <label className={`block ${className}`}>
      {label && <span className="label">{label}</span>}
      <Tag className="input" {...props}>
        {Tag === 'input' ? undefined : children}
      </Tag>
      {error && <span className="mt-1 block text-sm text-red-600">{error}</span>}
    </label>
  )
}
