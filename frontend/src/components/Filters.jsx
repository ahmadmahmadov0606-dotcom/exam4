import { useState } from 'react'
import useCities from '../hooks/useCities'
import { PRODUCT_GROUPS, visibleFor } from '../utils/constants'
import useAudience from '../hooks/useAudience'
import Icon from './Icon'

export function filterKeys(type) {
  const keys = ['search', 'city', `${type.priceField}__gte`, `${type.priceField}__lte`, 'ordering']
  if (type.categories) keys.push('category', 'category__in')
  if (type.key === 'product') keys.push('group')
  if (type.sides) keys.push('side')
  if (type.key === 'restaurant') keys.push('capacity__gte')
  if (type.key === 'car') keys.push('brand__iexact', 'with_driver')
  return keys
}

function orderingOptions(type) {
  return {
    '-created_at': 'Навтарин',
    '-rating': 'Рейтинги баланд',
    [type.priceField]: 'Аввал арзон',
    [`-${type.priceField}`]: 'Аввал гарон',
  }
}

function Options({ options, empty = 'Ҳама' }) {
  return (
    <>
      <option value="">{empty}</option>
      {Object.entries(options).map(([value, label]) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </>
  )
}

// Inside a group (or a category__in link) only that group's categories make sense.
function visibleCategories(type, values, side) {
  const own = visibleFor(side, type.categories)
  const allowed = values.group ? PRODUCT_GROUPS[values.group]?.categories : values.category__in?.split(',').filter(Boolean)
  if (!allowed?.length) return own
  return Object.fromEntries(Object.entries(own).filter(([key]) => allowed.includes(key)))
}

// Parent should remount this with key={location.search} so local state follows the URL.
export default function Filters({ type, params, onApply }) {
  const cities = useCities()
  const side = useAudience()
  const keys = filterKeys(type)
  const [values, setValues] = useState(() => Object.fromEntries(keys.map((k) => [k, params.get(k) ?? ''])))
  const [open, setOpen] = useState(false)

  const change = (name, apply) => (e) => {
    const next = { ...values, [name]: e.target.value }
    setValues(next)
    if (apply) onApply(next)
  }
  const reset = () => onApply({})
  const price = type.priceField
  const select = (name, label, options, empty) => (
    <label className="block">
      <span className="label">{label}</span>
      <select className="input" value={values[name]} onChange={change(name, true)}>
        <Options options={options} empty={empty} />
      </select>
    </label>
  )

  return (
    <aside data-no-reveal className="lg:sticky lg:top-24">
      <button className="btn-outline mb-4 w-full lg:hidden" onClick={() => setOpen(!open)}>
        <Icon name="tune" className="text-[18px]" /> Филтрҳо <Icon name={open ? 'expand_less' : 'expand_more'} className="text-[18px]" />
      </button>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          onApply(values)
        }}
        className={`card relative space-y-4 overflow-hidden p-5 pt-6 ${open ? 'block' : 'hidden'} lg:block`}
      >
        <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-secondary via-secondary-bright to-secondary" />
        <div className="flex items-center gap-2 border-b border-line pb-3">
          <Icon name="tune" className="text-[20px] text-secondary" />
          <span className="font-serif text-lg font-medium">Филтрҳо</span>
        </div>
        <label className="block">
          <span className="label">Ҷустуҷӯ</span>
          <input className="input" placeholder="Ном ё тавсиф…" value={values.search} onChange={change('search')} />
        </label>
        {select('city', 'Шаҳр', Object.fromEntries(cities.map((c) => [c.id, c.name])), 'Ҳамаи шаҳрҳо')}
        {type.categories && select('category', 'Категория', visibleCategories(type, values, side))}
        {type.sides && !side && select('side', 'Тараф', type.sides)}
        {type.key === 'car' && select('with_driver', 'Ронанда', { true: 'Бо ронанда', false: 'Бе ронанда' })}
        {type.key === 'car' && (
          <label className="block">
            <span className="label">Бренд</span>
            <input className="input" placeholder="Mercedes, Toyota…" value={values.brand__iexact} onChange={change('brand__iexact')} />
          </label>
        )}
        {type.key === 'restaurant' && (
          <label className="block">
            <span className="label">Шумораи меҳмонон</span>
            <input className="input" type="number" min="1" value={values.capacity__gte} onChange={change('capacity__gte')} />
          </label>
        )}
        <div>
          <span className="label">Нарх (сомонӣ)</span>
          <div className="grid grid-cols-2 gap-2">
            <input className="input" type="number" min="0" placeholder="аз" value={values[`${price}__gte`]} onChange={change(`${price}__gte`)} />
            <input className="input" type="number" min="0" placeholder="то" value={values[`${price}__lte`]} onChange={change(`${price}__lte`)} />
          </div>
        </div>
        {select('ordering', 'Тартиб', orderingOptions(type), 'Бе тартиб')}
        <div className="flex gap-2 pt-1">
          <button className="btn-primary flex-1">Ҷустуҷӯ</button>
          <button type="button" className="btn-outline" onClick={reset}>
            Тоза
          </button>
        </div>
      </form>
    </aside>
  )
}
