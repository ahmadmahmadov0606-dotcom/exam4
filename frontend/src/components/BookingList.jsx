import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { bookingsApi } from '../api/bookings'
import { useListing } from './ListingDetail'
import { STATUSES } from '../utils/constants'
import { formatDate, formatPrice, formatTime } from '../utils/format'
import EmptyState from './EmptyState'
import Icon from './Icon'
import { RowSkeletons } from './Loader'
import Pagination from './Pagination'
import StatusBadge from './StatusBadge'

function ItemLink({ type, id }) {
  const { data } = useListing(type, id)
  return (
    <Link to={`/${type.slug}/${id}`} className="font-serif text-xl font-semibold hover:text-primary">
      {data?.name ?? '…'}
    </Link>
  )
}

function details(type, b) {
  if (type.key === 'product') return [['inventory_2', `${b.quantity} дона`], ['location_on', b.address]]
  if (type.key === 'restaurant') return [['calendar_month', formatDate(b.date)], ['groups', `${b.guests} нафар`]]
  return [['calendar_month', formatDate(b.date)], ['schedule', `${formatTime(b.start_time)} – ${formatTime(b.end_time)}`]]
}

export function BookingRow({ type, booking, showUser, actions }) {
  return (
    <li className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-mist text-primary">
        <Icon name={type.icon} className="text-3xl" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-3">
          <ItemLink type={type} id={booking[type.key]} />
          <StatusBadge status={booking.status} />
        </div>
        <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
          {[...details(type, booking), ...(showUser ? [['person', booking.user]] : [])].map(([icon, text]) => (
            <span key={icon} className="inline-flex items-center gap-1">
              <Icon name={icon} className="text-[16px] text-secondary" /> {text}
            </span>
          ))}
        </p>
        {booking.comment && <p className="mt-1 text-sm italic text-ink/70">“{booking.comment}”</p>}
        <p className="mt-1 text-xs text-muted">Фиристода шуд: {formatDate(booking.created_at, true)}</p>
      </div>
      <div className="flex flex-col items-start gap-3 sm:items-end">
        <span className="text-lg font-semibold text-primary">{formatPrice(booking.total_price)}</span>
        {actions && <div className="flex gap-2">{actions(booking)}</div>}
      </div>
    </li>
  )
}

// The backend returns both the user's own bookings and bookings of their listings; `filter` separates them.
export default function BookingList({ type, filter, showUser, actions, emptyText }) {
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')

  const { data, isLoading, isError } = useQuery({
    queryKey: ['bookings', type.key, status, page],
    queryFn: () => bookingsApi[type.key].list({ status, page }),
    placeholderData: keepPreviousData,
  })
  const items = data?.results.filter(filter) ?? []

  return (
    <div>
      <div className="mb-5 flex flex-wrap gap-2">
        {[['', 'Ҳама'], ...Object.entries(STATUSES).map(([k, v]) => [k, v.label])].map(([value, label]) => (
          <button
            key={value}
            onClick={() => {
              setStatus(value)
              setPage(1)
            }}
            className={`rounded-full px-4 py-1.5 text-sm transition ${status === value ? 'bg-ink text-white' : 'border border-line bg-white hover:border-secondary'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <RowSkeletons />
      ) : isError ? (
        <EmptyState icon="error" title="Хатогӣ рух дод" text="Бронҳоро бор кардан нашуд." />
      ) : items.length === 0 ? (
        <EmptyState icon={type.icon} title="Ҳоло холӣ аст" text={emptyText} />
      ) : (
        <ul className="space-y-4">
          {items.map((b) => (
            <BookingRow key={b.id} type={type} booking={b} showUser={showUser} actions={actions} />
          ))}
        </ul>
      )}
      {data && <Pagination count={data.count} page={page} onChange={setPage} />}
    </div>
  )
}
