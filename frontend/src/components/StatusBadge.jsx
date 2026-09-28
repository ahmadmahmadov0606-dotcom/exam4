import { STATUSES } from '../utils/constants'

export default function StatusBadge({ status }) {
  const { label, className } = STATUSES[status] ?? { label: status, className: 'bg-stone-100' }
  return <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${className}`}>{label}</span>
}
