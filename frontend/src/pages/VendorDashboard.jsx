import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { Link, useSearchParams } from 'react-router-dom'
import { bookingsApi } from '../api/bookings'
import { listingsApi } from '../api/listings'
import BookingList from '../components/BookingList'
import EmptyState from '../components/EmptyState'
import ListingImage from '../components/ListingImage'
import { RowSkeletons } from '../components/Loader'
import Modal from '../components/Modal'
import Pagination from '../components/Pagination'
import Tabs from '../components/Tabs'
import GalleryManager from '../components/vendor/GalleryManager'
import ListingForm from '../components/vendor/ListingForm'
import { useAuth } from '../context/AuthContext'
import { STATUSES, TYPES, TYPE_LIST } from '../utils/constants'
import { showApiError } from '../utils/errors'
import { formatPrice } from '../utils/format'
import Icon from '../components/Icon'

function MyListings({ type }) {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [modal, setModal] = useState(null)
  const close = () => setModal(null)

  const { data, isLoading } = useQuery({
    queryKey: [type.slug, 'mine', page],
    queryFn: () => listingsApi[type.key].mine({ page }),
    placeholderData: keepPreviousData,
  })
  const remove = useMutation({
    mutationFn: listingsApi[type.key].remove,
    onSuccess: () => {
      toast.success('Эълон нест карда шуд')
      queryClient.invalidateQueries({ queryKey: [type.slug] })
    },
    onError: (e) => showApiError(e),
  })

  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-4">
        <p className="text-sm text-muted">{data ? `${data.count} эълон` : ''}</p>
        <button className="btn-primary" onClick={() => setModal({ kind: 'form' })}>
          + {type.single}и нав
        </button>
      </div>

      {isLoading ? (
        <RowSkeletons />
      ) : data.results.length === 0 ? (
        <EmptyState icon={type.icon} title="Ҳоло эълон нест" text="Аввалин эълони худро илова кунед, то мизоҷон шуморо ёбанд." />
      ) : (
        <ul className="space-y-3">
          {data.results.map((item) => (
            <li key={item.id} className="card flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
              <div className="h-20 w-full shrink-0 overflow-hidden rounded-xl sm:w-28">
                <ListingImage src={item.image} icon={type.icon} />
              </div>
              <div className="min-w-0 flex-1">
                <Link to={`/${type.slug}/${item.id}`} className="font-serif text-xl font-semibold hover:text-primary">
                  {item.name}
                </Link>
                <p className="truncate text-sm text-muted">
                  {item.city_name} · {type.subtitle(item)}
                </p>
                <p className="mt-1 text-sm font-semibold text-primary">
                  {formatPrice(item[type.priceField])} {type.priceSuffix}
                  {item.rating && <span className="ml-3 font-normal text-muted">
                      <Icon name="star" fill className="align-[-2px] text-[14px] text-secondary" /> {item.rating.toFixed(1)}
                    </span>}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {type.key === 'restaurant' && (
                  <button className="btn-outline btn-sm" onClick={() => setModal({ kind: 'gallery', item })}>
                    <Icon name="photo_library" className="text-[16px]" /> Галерея
                  </button>
                )}
                <button className="btn-outline btn-sm" onClick={() => setModal({ kind: 'form', item })}>
                  Таҳрир
                </button>
                <button
                  className="btn-outline btn-sm hover:border-red-500 hover:text-red-600"
                  disabled={remove.isPending}
                  onClick={() => confirm(`«${item.name}»-ро нест кунем?`) && remove.mutate(item.id)}
                >
                  Нест
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {data && <Pagination count={data.count} page={page} onChange={setPage} />}

      <Modal open={modal?.kind === 'gallery'} onClose={close} title={`Галерея — ${modal?.item?.name ?? ''}`}>
        {modal?.kind === 'gallery' && <GalleryManager restaurant={modal.item} />}
      </Modal>
      <Modal open={modal?.kind === 'form'} onClose={close} wide title={modal?.item ? 'Таҳрири эълон' : `${type.single}и нав`}>
        {modal?.kind === 'form' && <ListingForm type={type} item={modal.item} onDone={close} />}
      </Modal>
    </div>
  )
}

function IncomingBookings({ type }) {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const setStatus = useMutation({
    mutationFn: ({ id, status }) => bookingsApi[type.key].setStatus(id, status),
    onSuccess: (booking) => {
      toast.success(`Ҳолат: ${STATUSES[booking.status].label}`)
      queryClient.invalidateQueries({ queryKey: ['bookings', type.key] })
      queryClient.invalidateQueries({ queryKey: [type.slug] })
    },
    onError: (e) => showApiError(e),
  })
  const button = (b, status, label, className) => (
    <button
      className={`btn btn-sm ${className}`}
      disabled={setStatus.isPending}
      onClick={() => setStatus.mutate({ id: b.id, status })}
    >
      {label}
    </button>
  )

  return (
    <BookingList
      key={type.key}
      type={type}
      showUser
      filter={(b) => b.user !== user.username}
      emptyText="Ҳоло дархост нест."
      actions={(b) =>
        b.status === 'pending' ? (
          <>
            {button(b, 'confirmed', 'Тасдиқ', 'bg-emerald-600 text-white hover:bg-emerald-700')}
            {button(b, 'rejected', 'Рад', 'border border-red-300 bg-white text-red-600 hover:bg-red-50')}
          </>
        ) : (
          b.status === 'confirmed' && button(b, 'completed', 'Анҷом ёфт', 'bg-sky-600 text-white hover:bg-sky-700')
        )
      }
    />
  )
}

export default function VendorDashboard() {
  const [params, setParams] = useSearchParams()
  const section = params.get('section') === 'bookings' ? 'bookings' : 'listings'
  const type = TYPES[params.get('type')] ?? TYPES.restaurant
  const go = (next) => setParams({ section, type: type.key, ...next })

  return (
    <div className="container-page max-w-5xl py-10">
      <p className="eyebrow">
        <Icon name="storefront" className="text-[16px]" /> Барои бизнес
      </p>
      <h1 className="title mb-6 mt-1">{section === 'listings' ? 'Эълонҳои ман' : 'Дархостҳои воридшуда'}</h1>

      <div className="mb-4 flex gap-2">
        {[
          ['listings', 'Эълонҳо', 'storefront'],
          ['bookings', 'Бронҳо ва фармоишҳо', 'inbox'],
        ].map(([value, label, icon]) => (
          <button key={value} onClick={() => go({ section: value })} className={section === value ? 'btn-primary' : 'btn-outline'}>
            <Icon name={icon} className="text-[18px]" /> {label}
          </button>
        ))}
      </div>

      <Tabs
        tabs={TYPE_LIST.map((t) => [t.key, section === 'listings' ? t.title : t.bookingTitle, t.icon])}
        active={type.key}
        onChange={(key) => go({ type: key })}
      />

      {section === 'listings' ? <MyListings key={type.key} type={type} /> : <IncomingBookings type={type} />}
    </div>
  )
}
