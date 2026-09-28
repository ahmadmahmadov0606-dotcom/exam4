import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { flushSync } from 'react-dom'
import { Link, useNavigate } from 'react-router-dom'
import { formatPrice } from '../utils/format'
import Icon from './Icon'
import ListingImage from './ListingImage'

function Rating({ value }) {
  if (!value) return <span className="text-xs text-muted">Нав</span>
  return (
    <span className="flex items-center gap-1 text-xs font-bold">
      <Icon name="star" fill className="text-[16px] text-secondary-bright" />
      {value.toFixed(1)}
    </span>
  )
}

function chips(type, item) {
  if (type.key === 'restaurant') return [['group', `то ${item.capacity} нафар`]]
  if (type.key === 'car') return [['event_seat', `${item.seats} ҷой`], ['person', item.with_driver ? 'бо ронанда' : 'бе ронанда']]
  if (type.key === 'service') return [['workspace_premium', `таҷриба ${item.experience_years} сол`]]
  return [['inventory_2', item.stock ? `${item.stock} дона дар анбор` : 'тамом шуд']]
}

const canHover = () => window.matchMedia?.('(hover: hover) and (pointer: fine)').matches
const quietMotion = () =>
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || Boolean(navigator.connection?.saveData)

// Venue-style card from the design: image with badges, eyebrow + rating, chips, price band.
export default function ListingCard({ item, type, query = '', badge }) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [hovered, setHovered] = useState(false)
  const where = type.key === 'restaurant' ? item.address : item.city_name
  const isVenue = type.key === 'restaurant'
  const playVideo = isVenue && item.video && hovered

  // Hand the card's data to the detail page so its hero renders at once and the photo can morph into it;
  // updatedAt 0 keeps it stale, so the full detail (gallery…) is still fetched right after.
  const prefill = () => {
    const key = [type.slug, String(item.id)]
    if (!queryClient.getQueryData(key)) queryClient.setQueryData(key, item, { updatedAt: 0 })
  }
  const to = `/${type.slug}/${item.id}${query}`

  // "Entering" the restaurant: the card photo grows into the hero. Browsers without the
  // View Transitions API (or with reduced motion) simply follow the link.
  const enter = (e) => {
    prefill()
    if (!document.startViewTransition || quietMotion() || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
    e.preventDefault()
    document.startViewTransition(() => flushSync(() => navigate(to)))
  }

  return (
    <Link
      to={to}
      onClick={isVenue ? enter : undefined}
      onMouseEnter={() => isVenue && item.video && canHover() && !quietMotion() && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group flex flex-col overflow-hidden rounded-xl bg-white shadow-md ring-1 ring-transparent transition-all hover:-translate-y-1 hover:shadow-xl hover:ring-secondary-bright">
      <div className="relative h-56 overflow-hidden" style={isVenue ? { viewTransitionName: `restaurant-${item.id}` } : undefined}>
        <ListingImage src={item.image} icon={type.icon} className="transition-transform duration-500 group-hover:scale-105" />
        {playVideo && <video className="absolute inset-0 h-full w-full object-cover" src={item.video} poster={item.image ?? undefined} autoPlay muted loop playsInline />}
        {badge && (
          <span className="absolute left-3 top-3 rounded bg-primary px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-secondary-bright shadow-sm">
            {badge}
          </span>
        )}
        <span className="absolute bottom-3 left-3 flex max-w-[85%] items-center gap-1 truncate rounded bg-primary/80 px-2 py-0.5 text-[11px] text-white backdrop-blur">
          <Icon name="pin_drop" className="text-[14px]" /> {where}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-[10px] font-bold uppercase tracking-wider text-secondary">{type.key === 'restaurant' ? item.city_name : type.subtitle(item)}</span>
          <Rating value={item.rating} />
        </div>
        <h3 className="mt-1 font-serif text-xl font-medium leading-snug transition-colors group-hover:text-primary">{item.name}</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {chips(type, item).map(([icon, text]) => (
            <span key={icon} className="flex items-center gap-1 rounded bg-mist px-2 py-1 text-[11px] font-semibold text-muted">
              <Icon name={icon} className="text-[14px]" /> {text}
            </span>
          ))}
        </div>
        <div className="mt-auto pt-4" />
        <div className="-mx-4 -mb-4 flex items-center justify-between bg-mist px-4 py-3">
          <div>
            <span className="block text-[10px] font-bold uppercase tracking-wider text-muted">Нарх</span>
            <span className="text-lg font-bold text-primary">
              {formatPrice(item[type.priceField])} <span className="text-xs font-normal text-muted">{type.priceSuffix}</span>
            </span>
          </div>
          <span className="rounded bg-primary px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-white transition-colors group-hover:bg-primary-dark">
            {type.key === 'product' ? 'Харидан' : 'Бандкунӣ'}
          </span>
        </div>
      </div>
    </Link>
  )
}
