import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { productsApi } from '../../api/products'
import { Petals } from '../Decor'
import Icon from '../Icon'
import ListingImage from '../ListingImage'

// Invitation to the AI fitting room, illustrated with real garments from the marketplace.
export default function FittingCta({ compact = false }) {
  const { data } = useQuery({
    queryKey: ['products', 'fitting-cta'],
    queryFn: () => productsApi.list({ category__in: 'groom_national,groom_suit,bride_dress,bride_national', ordering: '-rating' }),
  })
  const photos = (data?.results ?? []).filter((p) => p.image).slice(0, 3)

  return (
    <Link
      to="/fitting"
      className={`group relative isolate grid items-center overflow-hidden rounded-3xl bg-primary-dark text-white shadow-lg ring-1 ring-black/10 transition hover:shadow-2xl sm:grid-cols-[auto_1fr] ${compact ? 'gap-5 p-5' : 'gap-8 p-8 sm:p-10'}`}
    >
      <div className="bg-ornament-gold absolute inset-0 -z-10 opacity-40" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_15%_50%,rgba(255,222,168,.3),transparent_55%)]" />
      <Petals count={8} />

      <div className={`relative mx-auto ${compact ? 'h-40 w-48' : 'h-64 w-72'}`}>
        {photos.map((p, i) => (
          <div
            key={p.id}
            className={`absolute top-1/2 overflow-hidden rounded-xl shadow-2xl ring-2 ring-white/80 transition-transform duration-500 ${compact ? 'h-32 w-24' : 'h-52 w-36'} ${
              ['left-0 -translate-y-1/2 -rotate-6 group-hover:-rotate-12', 'left-1/2 z-10 -translate-x-1/2 -translate-y-1/2 group-hover:scale-105', 'right-0 -translate-y-1/2 rotate-6 group-hover:rotate-12'][i]
            }`}
          >
            <ListingImage src={p.image} icon="styler" />
          </div>
        ))}
        <span className="absolute -bottom-1 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1 rounded-full bg-secondary-bright px-3 py-1 text-xs font-bold text-primary shadow-lg">
          <Icon name="auto_awesome" fill className="text-[16px]" /> AI
        </span>
      </div>

      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-secondary-light">Нав · Ороишгоҳи AI</p>
        <h3 className={`mt-1 font-serif font-medium ${compact ? 'text-2xl' : 'text-4xl'}`}>Либосро дар тани худ бинед</h3>
        <p className="mt-2 max-w-md text-sm text-white/80">
          Сурати худро бор кунед, либоси воқеиро аз бозор интихоб кунед — AI онро дар тани шумо мепӯшонад. Маъқул нашуд? Дигарашро интихоб кунед.
        </p>
        <span className="btn-secondary mt-5 uppercase tracking-wider">
          Ба ороишгоҳ <Icon name="arrow_forward" className="text-[18px] transition-transform group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  )
}
