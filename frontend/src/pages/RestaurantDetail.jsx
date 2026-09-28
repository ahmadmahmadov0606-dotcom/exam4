import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { bookingsApi } from '../api/bookings'
import { restaurantsApi } from '../api/restaurants'
import Calendar from '../components/Calendar'
import Field from '../components/Field'
import VenueHero from '../components/VenueHero'
import { Divider } from '../components/Decor'
import GalleryGrid from '../components/GalleryGrid'
import Icon from '../components/Icon'
import { BookingCard, DetailError, DetailSkeleton, Total, useListing } from '../components/ListingDetail'
import ReviewsSection from '../components/ReviewsSection'
import useForm from '../hooks/useForm'
import { TYPES } from '../utils/constants'
import { showApiError } from '../utils/errors'
import { formatDate, formatPrice } from '../utils/format'

const type = TYPES.restaurant

function BookingForm({ item }) {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { values, set, bind, errors, setErrors } = useForm({ date: params.get('date') || '', guests: '', comment: '' })

  const { data: busy = [] } = useQuery({
    queryKey: [type.slug, item.id, 'busy'],
    queryFn: () => restaurantsApi.busyDates(item.id),
  })

  const mutation = useMutation({
    mutationFn: () => bookingsApi.restaurant.create({ restaurant: item.id, ...values }),
    onSuccess: () => {
      toast.success('Дархости брон фиристода шуд!')
      queryClient.invalidateQueries({ queryKey: [type.slug, item.id, 'busy'] })
      navigate('/my-bookings?tab=restaurant')
    },
    onError: (e) => showApiError(e, setErrors),
  })

  const submit = (e) => {
    e.preventDefault()
    if (!values.date) return setErrors({ date: 'Санаро интихоб кунед.' })
    mutation.mutate()
  }

  const guests = Number(values.guests) || 0

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <Calendar value={values.date} onChange={(d) => set('date', d)} disabledDates={busy} />
        {values.date && <p className="mt-2 text-sm">Санаи интихобшуда: <b>{formatDate(values.date)}</b></p>}
        {errors.date && <p className="mt-1 text-sm text-red-600">{errors.date}</p>}
      </div>
      <Field label={`Шумораи меҳмонон (то ${item.capacity})`} type="number" min="1" max={item.capacity} required {...bind('guests')} />
      <Field label="Изоҳ" as="textarea" rows="2" {...bind('comment')} />
      <Total value={guests * item.price_per_person} note={guests ? `${guests} × ${formatPrice(item.price_per_person)}` : null} />
      <button className="btn-primary w-full" disabled={mutation.isPending}>
        {mutation.isPending ? 'Фиристода истодааст…' : 'Брон кардан'}
      </button>
    </form>
  )
}

function Section({ id, eyebrow, title, children }) {
  return (
    <section id={id} className="scroll-mt-24 py-12">
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="mt-1 font-serif text-3xl font-medium tracking-tight sm:text-4xl">{title}</h2>
      <Divider className="mb-6 mt-2 justify-start [&>span:first-child]:hidden" />
      {children}
    </section>
  )
}

export default function RestaurantDetail() {
  const { id } = useParams()
  const { data: item, isLoading, isError } = useListing(type, id)

  if (isLoading) return <DetailSkeleton />
  if (isError) return <DetailError type={type} />

  const photos = [item.image, ...(item.gallery ?? []).map((g) => g.image)].filter(Boolean)
  const facts = [
    ['groups', 'Ғунҷоиш', `${item.capacity} нафар`],
    ['payments', 'Нарх / нафар', formatPrice(item.price_per_person)],
    ['location_city', 'Шаҳр', item.city_name],
    ['star', 'Рейтинг', item.rating ? item.rating.toFixed(1) : 'Нав'],
  ]
  const mapQuery = encodeURIComponent(`${item.address}, ${item.city_name}, Tajikistan`)

  return (
    <>
      <VenueHero
        item={item}
        type={type}
        secondary={photos.length > 1 ? { id: 'gallery', icon: 'photo_library', label: 'Суратҳо' } : { id: 'reviews', icon: 'reviews', label: 'Шарҳҳо' }}
      />

      <div className="container-page">
        <nav className="pt-8 text-sm text-muted">
          <Link to="/restaurants" className="hover:text-primary">
            Тарабхонаҳо
          </Link>{' '}
          / <span className="text-ink">{item.name}</span>
        </nav>

        <Section id="about" eyebrow="Дар бораи толор" title={item.name}>
          <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {facts.map(([icon, label, value]) => (
              <div key={label} className="card flex items-center gap-3 p-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-mist text-primary">
                  <Icon name={icon} className="text-[22px]" />
                </span>
                <div>
                  <dt className="text-xs text-muted">{label}</dt>
                  <dd className="font-semibold">{value}</dd>
                </div>
              </div>
            ))}
          </dl>
          {item.description && <p className="mt-6 max-w-3xl whitespace-pre-line text-lg leading-relaxed text-ink/80">{item.description}</p>}
          <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
            <span>Фурӯшанда: {item.owner}</span>
            {item.phone && (
              <a href={`tel:${item.phone}`} className="text-primary hover:underline">
                <Icon name="call" className="align-[-3px] text-[16px]" /> {item.phone}
              </a>
            )}
          </p>
        </Section>

        {photos.length > 0 && (
          <Section id="gallery" eyebrow="Галерея" title="Толорро аз наздик бинед">
            <GalleryGrid images={photos} />
          </Section>
        )}

        <Section id="booking" eyebrow="Санаҳои озод ва брон" title="Санаи тӯйро интихоб кунед">
          <div className="max-w-xl">
            <BookingCard type={type} item={item}>
              <BookingForm item={item} />
            </BookingCard>
          </div>
        </Section>

        <section id="reviews" className="scroll-mt-24 py-12">
          <ReviewsSection type={type} id={item.id} />
        </section>

        <Section id="map" eyebrow="Суроға" title={`${item.address}, ${item.city_name}`}>
          <div className="overflow-hidden rounded-xl ring-1 ring-line">
            <iframe
              title={`Харитаи ${item.name}`}
              src={`https://maps.google.com/maps?q=${mapQuery}&z=15&output=embed`}
              className="h-80 w-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
            target="_blank"
            rel="noreferrer"
            className="btn-outline btn-sm mt-3"
          >
            <Icon name="directions" className="text-[16px]" /> Роҳро ёбед
          </a>
        </Section>
      </div>
    </>
  )
}
