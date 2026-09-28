import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { listingsApi } from '../api/listings'
import { useAuth } from '../context/AuthContext'
import { formatPrice } from '../utils/format'
import EmptyState from './EmptyState'
import ListingImage from './ListingImage'
import ReviewsSection from './ReviewsSection'
import StarRating from './StarRating'
import Icon from './Icon'

export function useListing(type, id) {
  return useQuery({ queryKey: [type.slug, id], queryFn: () => listingsApi[type.key].get(id) })
}

export function DetailSkeleton() {
  return (
    <div className="container-page grid gap-8 py-10 lg:grid-cols-[1fr_380px]">
      <div className="space-y-4">
        <div className="skeleton aspect-[16/9]" />
        <div className="skeleton h-10 w-2/3" />
        <div className="skeleton h-24" />
      </div>
      <div className="skeleton h-96" />
    </div>
  )
}

export function DetailError({ type }) {
  return (
    <div className="container-page py-16">
      <EmptyState
        icon="search_off"
        title={`${type.single} ёфт нашуд`}
        action={
          <Link to={`/${type.slug}`} className="btn-primary">
            Ба рӯйхат
          </Link>
        }
      />
    </div>
  )
}

function Gallery({ images, icon }) {
  const [active, setActive] = useState(0)
  const current = images[active]
  return (
    <div>
      <div className="aspect-[16/9] overflow-hidden rounded-3xl">
        <ListingImage src={current} icon={icon} />
      </div>
      {images.length > 1 && (
        <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
          {images.map((src, i) => (
            <button
              key={src}
              onClick={() => setActive(i)}
              className={`h-16 w-24 shrink-0 overflow-hidden rounded-xl ring-2 transition ${i === active ? 'ring-primary' : 'ring-transparent opacity-70 hover:opacity-100'}`}
            >
              <img src={src} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function ListingDetail({ type, item, facts, extraImages = [], children, sidebar }) {
  const images = [item.image, ...extraImages].filter(Boolean)
  return (
    <div className="container-page py-8">
      <nav className="mb-4 text-sm text-muted">
        <Link to={`/${type.slug}`} className="hover:text-primary">
          {type.title}
        </Link>{' '}
        / <span className="text-ink">{item.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="min-w-0 space-y-8">
          <Gallery images={images.length ? images : [null]} icon={type.icon} />

          <div>
            <p className="eyebrow">
              <Icon name="location_on" className="text-[16px]" /> {item.city_name}
            </p>
            <h1 className="title mt-1">{item.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted">
              <StarRating value={item.rating} />
              <span>{item.rating ? item.rating.toFixed(1) : 'Ҳоло баҳо нест'}</span>
              <span>·</span>
              <span>Фурӯшанда: {item.owner}</span>
              {item.phone && (
                <a href={`tel:${item.phone}`} className="text-primary hover:underline">
                  <Icon name="call" className="align-[-3px] text-[16px]" /> {item.phone}
                </a>
              )}
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {facts.map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-line bg-white p-4">
                <dt className="text-xs text-muted">{label}</dt>
                <dd className="mt-1 font-semibold">{value}</dd>
              </div>
            ))}
          </dl>

          {item.description && (
            <section>
              <h2 className="mb-2 font-serif text-2xl font-semibold">Тавсиф</h2>
              <p className="whitespace-pre-line leading-relaxed text-ink/80">{item.description}</p>
            </section>
          )}

          {children}

          <ReviewsSection type={type} id={item.id} />
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">{sidebar}</aside>
      </div>
    </div>
  )
}

export function BookingCard({ type, item, title = 'Брон кардан', children }) {
  const { user } = useAuth()
  const location = useLocation()
  const isOwner = user?.username === item.owner

  return (
    <div className="card p-6">
      <p className="text-2xl font-semibold text-primary">
        {formatPrice(item[type.priceField])} <span className="text-base font-normal text-muted">{type.priceSuffix}</span>
      </p>
      <h2 className="mb-4 mt-1 font-serif text-xl font-semibold">{title}</h2>
      {!user ? (
        <Link to="/login" state={{ from: location }} className="btn-primary w-full">
          Барои брон ворид шавед
        </Link>
      ) : isOwner ? (
        <p className="rounded-xl bg-secondary-light/60 p-4 text-sm">Ин эълони шумост. Бронҳоро дар панели фурӯшанда бинед.</p>
      ) : (
        children
      )}
    </div>
  )
}

export function Total({ value, note }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-ivory px-4 py-3">
      <span className="text-sm text-muted">Ҳамагӣ{note && <span className="block text-xs">{note}</span>}</span>
      <span className="text-lg font-semibold text-primary">{formatPrice(value)}</span>
    </div>
  )
}
