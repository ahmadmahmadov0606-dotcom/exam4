import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { listingsApi } from '../api/listings'
import EmptyState from '../components/EmptyState'
import Icon from '../components/Icon'
import Filters, { filterKeys } from '../components/Filters'
import ListingCard from '../components/ListingCard'
import { CardSkeletons } from '../components/Loader'
import PageBanner from '../components/PageBanner'
import Pagination from '../components/Pagination'
import useAudience from '../hooks/useAudience'
import { PRODUCT_CATEGORIES, PRODUCT_GROUPS, visibleFor } from '../utils/constants'
import FittingCta from '../components/fitting/FittingCta'
import CarShowcase from '../components/cars/CarShowcase'

function pageTitle(type, { group, category, category__in }) {
  if (category) return type.categories[category]
  if (PRODUCT_GROUPS[group]) return PRODUCT_GROUPS[group].title
  if (category__in) return category__in.split(',').map((c) => type.categories[c]).filter(Boolean).join(' ва ')
  return type.title
}

// Quick sections above the list: product groups, or service categories.
function SectionChips({ type, filters, onPick }) {
  const side = useAudience()
  const groups = Object.entries(PRODUCT_GROUPS).filter(([, g]) => g.categories.some((c) => c in visibleFor(side, PRODUCT_CATEGORIES)))
  const chips =
    type.key === 'product'
      ? groups.map(([key, g]) => [g.title, { group: key }, filters.group === key, g.icon])
      : type.key === 'service'
        ? Object.entries(visibleFor(side, type.categories)).map(([key, label]) => [label, { category: key }, filters.category === key])
        : []
  if (!chips.length) return null
  const none = !filters.group && !filters.category && !filters.category__in
  const cls = (active) =>
    `flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition ${
      active ? 'bg-primary text-white shadow' : 'bg-white text-muted ring-1 ring-line hover:text-primary'
    }`
  return (
    <div className="-mx-4 mb-6 overflow-x-auto px-4">
      <div className="flex w-max gap-2">
        <button className={cls(none)} onClick={() => onPick({})}>
          Ҳама
        </button>
        {chips.map(([label, next, active, icon]) => (
          <button key={label} className={cls(active)} onClick={() => onPick(next)}>
            {icon && <Icon name={icon} className="text-[18px]" />}
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function Listings({ type }) {
  const [params, setParams] = useSearchParams()
  const page = Number(params.get('page') || 1)
  const filters = Object.fromEntries(filterKeys(type).map((k) => [k, params.get(k) ?? '']))
  const date = params.get('date')

  const { group, ...apiFilters } = filters
  if (PRODUCT_GROUPS[group]) apiFilters.category__in = PRODUCT_GROUPS[group].categories.join(',')
  const title = pageTitle(type, filters)

  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: [type.slug, 'list', apiFilters, page],
    queryFn: () => listingsApi[type.key].list({ ...apiFilters, page }),
    placeholderData: keepPreviousData,
  })

  // The banner photo comes from the best-rated listing of this section, so it stays put while filtering.
  const bannerParams = apiFilters.category__in ? { category__in: apiFilters.category__in } : apiFilters.category ? { category: apiFilters.category } : {}
  const { data: top } = useQuery({
    queryKey: [type.slug, 'banner', bannerParams],
    queryFn: () => listingsApi[type.key].list({ ...bannerParams, ordering: '-rating' }),
  })
  const bannerImage = top?.results.find((x) => x.image)?.image

  const update = (next) => {
    const clean = Object.fromEntries(Object.entries(next).filter(([, v]) => v !== '' && v != null))
    setParams(date ? { ...clean, date } : clean)
  }
  const goToPage = (n) => {
    setParams({ ...Object.fromEntries(params), page: n })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <>
      {type.key === 'car' ? (
        <CarShowcase />
      ) : (
      <PageBanner
        icon={type.icon}
        eyebrow={data ? `${data.count} эълон` : 'Каталог'}
        title={title}
        subtitle={title === type.title ? type.tagline : null}
        image={bannerImage}
        crumbs={title === type.title ? [[type.title]] : [[type.title, `/${type.slug}`], [title]]}
      />
      )}
    <div className="container-page py-10">
      {type.key === 'product' && (!filters.group || filters.group === 'clothes') && (
        <div className="mb-8">
          <FittingCta compact />
        </div>
      )}
      <SectionChips type={type} filters={filters} onPick={(next) => update({ ...filters, group: '', category: '', category__in: '', ...next })} />

      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <Filters key={params.toString()} type={type} params={params} onApply={update} />

        <section className={isFetching && !isLoading ? 'opacity-60 transition' : ''}>
          {isLoading ? (
            <CardSkeletons count={6} />
          ) : isError ? (
            <EmptyState icon="error" title="Хатогӣ рух дод" text="Маълумотро бор кардан нашуд. Саҳифаро аз нав кушоед." />
          ) : data.results.length === 0 ? (
            <EmptyState
              icon="search_off"
              title="Ҳеҷ чиз ёфт нашуд"
              text="Филтрҳоро тағйир диҳед ё тоза кунед."
              action={
                <button className="btn-outline" onClick={() => update({})}>
                  Филтрҳоро тоза кардан
                </button>
              }
            />
          ) : (
            <>
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {data.results.map((item) => (
                  <ListingCard key={item.id} item={item} type={type} query={date ? `?date=${date}` : ''} />
                ))}
              </div>
              <Pagination count={data.count} page={page} onChange={goToPage} />
            </>
          )}
        </section>
      </div>
    </div>
    </>
  )
}
