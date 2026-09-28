import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { carsApi } from '../api/cars'
import { productsApi } from '../api/products'
import { restaurantsApi } from '../api/restaurants'
import { servicesApi } from '../api/services'
import Icon from '../components/Icon'
import ListingCard from '../components/ListingCard'
import ListingImage from '../components/ListingImage'
import { CardSkeletons } from '../components/Loader'
import useAudience from '../hooks/useAudience'
import useSelectedCity from '../hooks/useSelectedCity'
import { PRODUCT_GROUPS, SERVICE_CATEGORIES, TYPES } from '../utils/constants'
import { formatPrice, today } from '../utils/format'
import { Divider, Petals } from '../components/Decor'
import FittingCta from '../components/fitting/FittingCta'

const SEARCH_TARGETS = {
  restaurants: ['Тарабхона ва кохҳо', '/restaurants', {}],
  singer: ['Ҳофизон ва сарояндагон', '/services', { category: 'singer' }],
  bride: ['Либосҳо', '/products', { group: 'clothes' }],
  photo: ['Суратгир ва видеограф', '/services', { category__in: 'photographer,videographer' }],
  decor: ['Ороиши саҳна ва гулҳо', '/services', { category: 'decor' }],
  cars: ['Кортеж ва мошинҳо', '/cars', {}],
}

const GUESTS = [
  ['', 'Ҳар шумора'],
  ['150', '150 – 250 нафар'],
  ['300', '300 – 500 нафар'],
  ['500', '500 – 800 нафар'],
  ['800', '800+ нафар'],
]

const QUICK_TAGS = [
  ['Толорҳои калон', '/restaurants?capacity__gte=500'],
  ['Rolls-Royce', '/cars?search=Rolls'],
  ['Чапони зардӯзӣ', '/products?search=Чапон'],
  ['Шашмақом', '/services?search=Шашмақом'],
  ['Торти тӯй', '/services?category=cake'],
]

function Eyebrow({ icon, children }) {
  return (
    <p className="eyebrow">
      {icon ? <Icon name={icon} className="text-[16px]" /> : <span className="h-2 w-2 rounded-full bg-secondary" />}
      {children}
    </p>
  )
}

function SectionHead({ icon, eyebrow, title, text, action }) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-3 md:flex-row md:items-end">
      <div>
        <Eyebrow icon={icon}>{eyebrow}</Eyebrow>
        <h2 className="mt-1 font-serif text-3xl font-medium tracking-tight">{title}</h2>
        <Divider className="mt-2 justify-start [&>span:first-child]:hidden" />
        {text && <p className="mt-1 max-w-2xl text-sm text-muted">{text}</p>}
      </div>
      {action}
    </div>
  )
}

function MoreLink({ to, children }) {
  return (
    <Link to={to} className="inline-flex items-center gap-1 text-[13px] font-bold uppercase tracking-wider text-secondary hover:text-ink">
      {children} <Icon name="arrow_forward" className="text-[16px]" />
    </Link>
  )
}

function Field({ icon, label, className = '', children }) {
  return (
    <label className={`flex flex-col justify-center rounded bg-mist px-3 py-2 ${className}`}>
      <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted">
        <Icon name={icon} className="text-[14px] text-secondary" /> {label}
      </span>
      {children}
    </label>
  )
}

const control = 'w-full cursor-pointer bg-transparent py-0.5 text-[15px] font-semibold text-ink outline-none'

function Hero() {
  const navigate = useNavigate()
  const { cities, cityId } = useSelectedCity()
  const [form, setForm] = useState({ target: 'restaurants', city: null, date: '', guests: '' })
  const city = form.city ?? cityId
  const change = (name) => (e) => setForm({ ...form, [name]: e.target.value })

  const submit = (e) => {
    e.preventDefault()
    const [, path, extra] = SEARCH_TARGETS[form.target]
    const params = { ...extra, city }
    if (form.target === 'restaurants') Object.assign(params, { date: form.date, capacity__gte: form.guests })
    const query = new URLSearchParams(Object.entries(params).filter(([, v]) => v))
    navigate(`${path}?${query}`)
  }

  return (
    <section data-no-reveal className="relative overflow-hidden bg-ink pb-14 pt-16 text-white sm:pt-24">
      <div data-hero-bg className="absolute inset-0 scale-105 bg-cover bg-center" style={{ backgroundImage: 'url(/hero-hall.jpg)' }} />
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/45 to-black/75" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,.45)_100%)]" />
      <div className="bg-ornament-gold absolute inset-0 opacity-30" />
      <Petals />
      <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-secondary/30 blur-3xl" />

      <div className="container-page relative flex flex-col items-center text-center">
        <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-black/30 px-4 py-1 ring-1 ring-secondary-light/40 backdrop-blur-md">
          <Icon name="workspace_premium" fill className="text-[18px] text-secondary-light" />
          <span className="text-[11px] font-semibold uppercase tracking-widest text-secondary-light">Ҳама барои тӯй дар як платформа</span>
        </span>
        <h1 className="max-w-4xl drop-shadow-lg font-serif text-4xl font-semibold leading-tight tracking-tight sm:text-5xl lg:text-[56px] lg:leading-[64px]">
          Тӯйи орзуҳои худро дар Тоҷикистон ба нақша гиред
        </h1>
        <Divider light className="mt-5" />
        <p className="mb-10 mt-3 max-w-2xl text-base text-white/85 drop-shadow">
          Тарабхонаҳо, ҳофизон, кортеж, суратгирон ва либосҳои миллии арӯсӣ — интихоб кунед, брон кунед ва тӯйро як ҷо ба нақша гиред.
        </p>

        <form onSubmit={submit} className="grid w-full max-w-5xl grid-cols-1 gap-1 rounded-xl bg-white p-2 text-left text-ink shadow-xl md:grid-cols-2 lg:grid-cols-12">
          <Field icon="category" label="Хизматрасонӣ" className="lg:col-span-3">
            <select className={control} value={form.target} onChange={change('target')}>
              {Object.entries(SEARCH_TARGETS).map(([value, [label]]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field icon="location_on" label="Минтақа" className="lg:col-span-2">
            <select className={control} value={city} onChange={change('city')}>
              <option value="">Ҳамаи шаҳрҳо</option>
              {cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field icon="calendar_month" label="Санаи тӯй" className="lg:col-span-3">
            <input type="date" min={today()} className={control} value={form.date} onChange={change('date')} />
          </Field>
          <Field icon="groups" label="Меҳмонон" className="lg:col-span-2">
            <select className={control} value={form.guests} onChange={change('guests')}>
              {GUESTS.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <button className="flex min-h-[52px] items-center justify-center gap-2 rounded bg-primary-dark px-4 text-[13px] font-bold uppercase tracking-wider text-white shadow-md transition-colors hover:bg-primary lg:col-span-2">
            <Icon name="search" className="text-[20px] text-secondary-light" /> Ҷустуҷӯ
          </button>
        </form>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-white/80">Ҷустуҷӯҳои машҳур:</span>
          {QUICK_TAGS.map(([label, to]) => (
            <Link key={label} to={to} className="rounded-full bg-black/30 px-3 py-1 text-xs text-white ring-1 ring-white/20 backdrop-blur transition-colors hover:bg-white/20">
              {label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

// Each tile links to exactly the listings it describes. `cover` picks the listing whose photo
// represents the category best; `span` shapes the mosaic (4 columns × 3 rows on desktop).
const CATEGORY_CARDS = [
  { icon: 'apartment', title: 'Тарабхона ва кохҳо', text: 'Кохҳои бошукӯҳ ва боғҳои сабз', unit: 'толор', api: restaurantsApi, path: '/restaurants', params: {}, span: 'lg:col-span-2 lg:row-span-2' },
  { icon: 'mic', title: 'Ҳофизон', text: 'Эстрада, фолклор ва классика', unit: 'сароянда', api: servicesApi, path: '/services', params: { category: 'singer' } },
  { icon: 'styler', title: 'Либоси арӯсӣ ва домодӣ', text: 'Зардӯзии миллӣ ва муосир', unit: 'либос', api: productsApi, path: '/products', params: { group: 'clothes' }, cover: { search: 'Чапон' },
    groom: { title: 'Либоси домод', text: 'Чапон, тоқӣ ва костюм' }, bride: { title: 'Либоси арӯсӣ ва фата', text: 'Либоси сафед, чакан ва фата', cover: { search: 'Фатаи тӯрии' } } },
  { icon: 'photo_camera', title: 'Суратгир ва видеограф', text: 'Лаҳзаҳои фаромӯшнашаванда', unit: 'студия', api: servicesApi, path: '/services', params: { category__in: 'photographer,videographer' }, cover: { search: 'Суратгири тӯй' } },
  { icon: 'local_florist', title: 'Ороиши толор', text: 'Гулҳо ва фотозона', unit: 'декоратор', api: servicesApi, path: '/services', params: { category: 'decor' } },
  { icon: 'directions_car', title: 'Кортежи тӯёна', text: 'Мошинҳои гулпеч барои домоду арӯс', unit: 'мошин', api: carsApi, path: '/cars', params: {}, cover: { search: 'Mercedes E-Class' }, span: 'lg:col-span-2' },
  { icon: 'face_retouching_natural', title: 'Ороиши арӯс', text: 'Макияж ва ороиши мӯй', unit: 'салон', api: servicesApi, path: '/services', params: { category: 'makeup' }, cover: { search: 'Зарина' },
    groom: { icon: 'checkroom', title: 'Костюм ва шим', text: 'Костюми тӯй ва шими классикӣ', unit: 'мол', api: productsApi, path: '/products', params: { category__in: 'groom_suit,trousers' }, cover: { search: 'Костюми классикии' } } },
  { icon: 'music_note', title: 'Созандагон ва тамада', text: 'Дойра, рубоб ва барандаи ҷашн', unit: 'даста', api: servicesApi, path: '/services', params: { category__in: 'musicians,host' }, cover: { search: 'Шашмақом' } },
]

function CategoryTile({ icon, title, text, unit, api, path, params, cover, span = '' }) {
  const listParams = params.group ? { category__in: PRODUCT_GROUPS[params.group].categories.join(',') } : params
  const key = path.slice(1)
  const list = useQuery({ queryKey: [key, 'card', listParams], queryFn: () => api.list({ ...listParams, ordering: '-rating' }) })
  const coverQuery = useQuery({
    queryKey: [key, 'cover', cover],
    queryFn: () => api.list({ ...listParams, ...cover }),
    enabled: Boolean(cover),
  })
  const image = (coverQuery.data ?? list.data)?.results.find((x) => x.image)?.image
  const query = new URLSearchParams(params).toString()
  const big = span.includes('row-span-2')

  return (
    <Link
      to={query ? `${path}?${query}` : path}
      className={`group relative isolate flex min-h-56 flex-col justify-end overflow-hidden rounded-xl bg-primary shadow-sm ring-1 ring-black/5 transition-shadow hover:shadow-xl ${span}`}
    >
      <div className="absolute inset-0 -z-10">
        {list.data ? (
          <ListingImage src={image} icon={icon} className="transition-transform duration-700 ease-out group-hover:scale-110" />
        ) : (
          <div className="skeleton h-full rounded-none" />
        )}
      </div>
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/85 via-black/35 to-black/5 transition-opacity group-hover:from-primary-dark/90" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/45 via-transparent to-transparent" />

      {list.data?.count > 0 && (
        <span className="absolute right-4 top-4 rounded-full bg-black/35 px-3 py-1 text-[11px] font-semibold text-white ring-1 ring-white/20 backdrop-blur-md">
          {list.data.count} {unit}
        </span>
      )}

      <div className={`flex items-end justify-between gap-3 text-white ${big ? 'p-5 lg:p-7' : 'p-5'}`}>
        <div>
          <span className={`mb-3 flex items-center justify-center rounded-full bg-secondary-bright text-primary shadow-lg ${big ? 'h-9 w-9 lg:h-12 lg:w-12' : 'h-9 w-9'}`}>
            <Icon name={icon} className={big ? 'text-[20px] lg:text-[26px]' : 'text-[20px]'} />
          </span>
          <h3 className={`font-serif font-medium leading-tight drop-shadow ${big ? 'text-2xl lg:text-4xl' : 'text-2xl'}`}>{title}</h3>
          <p className={`mt-1 text-white/80 ${big ? 'text-xs lg:text-base' : 'text-xs'}`}>{text}</p>
          <span className="mt-3 block h-px w-10 bg-secondary-bright transition-all duration-500 group-hover:w-20" />
        </div>
        <span className="flex h-10 w-10 shrink-0 translate-x-2 items-center justify-center rounded-full bg-white/15 opacity-0 ring-1 ring-white/30 backdrop-blur transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
          <Icon name="arrow_forward" className="text-[20px]" />
        </span>
      </div>
    </Link>
  )
}

function Categories() {
  const side = useAudience()
  return (
    <section className="container-page py-12">
      <SectionHead
        eyebrow="Феҳристи хизматҳо"
        title="Хизматрасониро интихоб кунед"
        text="Ҳар он чи барои тӯй лозим аст — аз толор то кортеж — бо фурӯшандагони боэътимод."
        action={<MoreLink to="/services">Ҳамаи хизматҳо</MoreLink>}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:auto-rows-[15rem] lg:grid-cols-4">
        {CATEGORY_CARDS.map(({ groom, bride, ...card }) => {
          const variant = { ...card, ...({ groom, bride }[side] ?? {}) }
          return <CategoryTile key={variant.title} {...variant} />
        })}
      </div>
    </section>
  )
}

function ArrowButton({ icon, ...props }) {
  return (
    <button
      className="flex h-10 w-10 items-center justify-center rounded-full bg-haze text-ink transition-colors hover:bg-primary hover:text-white disabled:opacity-40 disabled:hover:bg-haze disabled:hover:text-ink"
      {...props}
    >
      <Icon name={icon} className="text-[20px]" />
    </button>
  )
}

function badgeFor(item, index) {
  if (index === 0 && item.rating) return 'Интихоби беҳтарин'
  if (item.capacity >= 600) return 'Сиғодати калон'
  return null
}

function venuesTitle(city, mixed) {
  if (!city) return 'Толорҳои шоҳонаи Тоҷикистон'
  return mixed ? `Толорҳои шоҳона дар ${city.name} ва дигар шаҳрҳо` : `Толорҳои шоҳона дар ${city.name}`
}

function Venues({ venues, isLoading, city, mixed }) {
  const [start, setStart] = useState(0)
  const shown = venues.slice(start, start + 3)

  return (
    <section className="bg-mist py-10">
      <div className="container-page">
        <SectionHead
          icon="stars"
          eyebrow="Интихоби муҳаррирон"
          title={venuesTitle(city, mixed)}
          text="Фазои боҳашамат, саҳнаи зебо ва хизматрасонии баландмақом."
          action={
            <div className="flex gap-2">
              <ArrowButton icon="chevron_left" aria-label="Пешина" disabled={start === 0} onClick={() => setStart(start - 3)} />
              <ArrowButton icon="chevron_right" aria-label="Оянда" disabled={start + 3 >= venues.length} onClick={() => setStart(start + 3)} />
            </div>
          }
        />
        {isLoading ? (
          <CardSkeletons count={3} />
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {shown.map((item, i) => (
              <ListingCard key={item.id} item={item} type={TYPES.restaurant} badge={badgeFor(item, start + i)} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function PerformerCard({ item }) {
  return (
    <Link to={`/services/${item.id}`} className="group flex flex-col overflow-hidden rounded-xl bg-white shadow-sm transition-all hover:shadow-lg">
      <div className="relative h-72 overflow-hidden">
        <ListingImage src={item.image} icon="mic" className="transition-transform duration-500 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-primary via-transparent to-transparent opacity-80" />
        <span className="absolute bottom-3 left-3 rounded bg-white/20 px-2 py-0.5 text-[11px] text-white backdrop-blur">
          {SERVICE_CATEGORIES[item.category]}
        </span>
      </div>
      <div className="flex flex-1 flex-col justify-between p-4">
        <div>
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-lg font-semibold transition-colors group-hover:text-primary">{item.name}</h3>
            {item.rating && (
              <span className="flex items-center gap-0.5 text-xs font-bold text-secondary">
                <Icon name="star" fill className="text-[15px]" /> {item.rating.toFixed(1)}
              </span>
            )}
          </div>
          <p className="mt-1 line-clamp-2 text-xs text-muted">{item.description}</p>
        </div>
        <div className="mt-3 flex items-center justify-between pt-2">
          <div>
            <span className="block text-[10px] font-bold uppercase tracking-wider text-muted">Арзиши хизмат</span>
            <span className="font-bold text-primary">{formatPrice(item.price)}</span>
          </div>
          <span className="rounded bg-haze px-3 py-1.5 text-xs font-semibold transition-colors group-hover:bg-primary group-hover:text-white">
            Маълумот
          </span>
        </div>
      </div>
    </Link>
  )
}

function Performers({ city }) {
  const { data, isLoading } = useQuery({
    queryKey: ['services', 'performers', city?.id],
    queryFn: async () => {
      const lists = await Promise.all(
        ['singer', 'musicians', 'host'].map((category) => servicesApi.list({ category, city: city?.id, ordering: '-rating' })),
      )
      return lists.flatMap((l) => l.results).sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)).slice(0, 4)
    },
  })

  if (!isLoading && !data?.length) return null
  return (
    <section className="container-page py-10">
      <SectionHead
        icon="graphic_eq"
        eyebrow="Овози ҷашни шумо"
        title="Ситорагони саҳнаи тӯёна"
        text="Ҳофизони маҳбуб, гурӯҳҳои мусиқии зинда ва барандагони беҳтарини ҷашнҳои миллӣ."
        action={<MoreLink to="/services?category=singer">Ҳамаи сарояндагон</MoreLink>}
      />
      {isLoading ? (
        <CardSkeletons count={4} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {data.map((item) => (
            <PerformerCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </section>
  )
}

function Traditions() {
  const decor = useQuery({ queryKey: ['services', 'decor-top'], queryFn: () => servicesApi.list({ category: 'decor', ordering: '-rating' }) })
  const musicians = useQuery({ queryKey: ['services', 'musicians-top'], queryFn: () => servicesApi.list({ category: 'musicians' }) })
  const side = useAudience()
  const nationalCategory = side === 'groom' ? 'groom_national' : 'bride_national'
  const national = useQuery({ queryKey: ['products', 'national-top', nationalCategory], queryFn: () => productsApi.list({ category: nationalCategory }) })
  const cards = [
    ['Ороиши толор ва гулҳо', 'Гулпардозон ва декораторҳое, ки толорро барои ҷашн ба боғи гул табдил медиҳанд.', decor.data?.results.find((x) => x.image)?.image, 'local_florist', '/services?category=decor'],
    ['Навои дойра ва рубоб', 'Созандагоне, ки тӯйро аз оғоз то охир бо оҳангҳои миллӣ ҳамроҳӣ мекунанд.', musicians.data?.results[0]?.image, 'music_note', '/services?category=musicians'],
    side === 'groom'
      ? ['Чапон ва тоқӣ', 'Чапони зардӯзӣ ва тоқии чакан — либоси миллии домод.', national.data?.results[0]?.image, 'styler', '/products?category=groom_national']
      : ['Либоси миллӣ ва чакан', 'Либосҳои атлас ва чакандӯзӣ барои арӯс.', national.data?.results[0]?.image, 'styler', '/products?category=bride_national'],
  ]

  return (
    <section className="bg-haze py-10">
      <div className="container-page">
        <div className="mb-6 max-w-3xl">
          <Eyebrow icon="history_edu">Оин ва суннатҳои миллӣ</Eyebrow>
          <h2 className="mt-1 font-serif text-3xl font-medium tracking-tight">Русумоти тӯёнаи тоҷиконро бо ифтихор ҷашн гиред</h2>
          <p className="mt-1 text-sm text-muted">Аз ороиши толор то навои дойра ва либоси чакан — мо шуморо бо беҳтарин устодон пайваст мекунем.</p>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {cards.map(([title, text, image, icon, to]) => (
            <Link key={title} to={to} className="group relative flex h-80 flex-col justify-end overflow-hidden rounded-xl shadow-md">
              <div className="absolute inset-0">
                <ListingImage src={image} icon={icon} className="transition-transform duration-700 group-hover:scale-105" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-primary-dark via-primary-dark/50 to-transparent" />
              <div className="relative p-5 text-white">
                <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-secondary-bright text-primary">
                  <Icon name={icon} className="text-[22px]" />
                </span>
                <h3 className="font-serif text-2xl font-medium">{title}</h3>
                <p className="mt-1 text-sm text-white/80">{text}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-secondary-light">
                  Дидан <Icon name="arrow_forward" className="text-[16px]" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

function PlannerCta() {
  const features = [
    ['hourglass_top', 'Ҳисоби рӯзҳо то тӯй'],
    ['account_balance_wallet', 'Буҷа ва харҷҳо'],
    ['diversity_3', 'Меҳмонони ду тараф'],
    ['checklist', 'Рӯйхати вазифаҳо'],
  ]
  return (
    <section className="container-page py-12">
      <div className="relative grid items-center gap-8 overflow-hidden rounded-xl bg-primary p-8 text-white sm:p-12 lg:grid-cols-2">
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-secondary/30 blur-3xl" />
        <div className="relative">
          <p className="eyebrow text-secondary-light">
            <Icon name="event_note" className="text-[16px]" /> Банақшагирӣ ва буҷа
          </p>
          <h2 className="mt-2 font-serif text-4xl font-medium">Меҳмонон, буҷа ва вазифаҳо — ҳама зери назорат</h2>
          <p className="mt-4 text-primary-fixed/90">Рӯйхати меҳмонони тарафи домоду арӯс, харҷҳо ва корҳои то тӯйро дар як ҷо идора кунед.</p>
          <Link to="/wedding" className="btn-secondary mt-8 uppercase tracking-wider">
            Нақшаро оғоз кунед <Icon name="arrow_forward" className="text-[18px]" />
          </Link>
        </div>
        <ul className="relative grid grid-cols-2 gap-4">
          {features.map(([icon, text]) => (
            <li key={text} className="rounded-xl bg-white/5 p-6 text-center ring-1 ring-white/10">
              <Icon name={icon} className="text-3xl text-secondary-bright" />
              <p className="mt-2 text-sm text-white/80">{text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export default function Home() {
  const { city, cityId } = useSelectedCity()
  const { data, isLoading } = useQuery({
    queryKey: ['restaurants', 'top', cityId],
    // Fewer than 3 venues in the chosen city: top it up with the best venues from other cities.
    queryFn: async () => {
      const inCity = (await restaurantsApi.list({ ordering: '-rating', city: cityId })).results
      if (!cityId || inCity.length >= 3) return { venues: inCity, mixed: false }
      const all = (await restaurantsApi.list({ ordering: '-rating' })).results
      return { venues: [...inCity, ...all.filter((v) => String(v.city) !== cityId)], mixed: true }
    },
  })
  const venues = data?.venues ?? []

  return (
    <>
      <Hero />
      <Categories />
      <Venues key={cityId} venues={venues} isLoading={isLoading} city={city} mixed={data?.mixed} />
      <Performers city={city} />
      <Traditions />
      <section className="container-page pt-12">
        <FittingCta />
      </section>
      <PlannerCta />
    </>
  )
}
