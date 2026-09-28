import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { useNavigate, useParams } from 'react-router-dom'
import { bookingsApi } from '../api/bookings'
import Calendar from '../components/Calendar'
import Field from '../components/Field'
import ListingDetail, { BookingCard, DetailError, DetailSkeleton, Total, useListing } from '../components/ListingDetail'
import useForm from '../hooks/useForm'
import { SERVICE_CATEGORIES } from '../utils/constants'
import { showApiError } from '../utils/errors'
import { formatPrice } from '../utils/format'

function hoursBetween(start, end) {
  if (!start || !end) return 0
  const minutes = (s) => Number(s.slice(0, 2)) * 60 + Number(s.slice(3, 5))
  return Math.max(0, (minutes(end) - minutes(start)) / 60)
}

function facts(type, item) {
  if (type.key === 'car') {
    return [
      ['Бренд', `${item.brand} ${item.model}`],
      ['Сол', item.year],
      ['Ранг', item.color],
      ['Ҷойҳо', `${item.seats} · ${item.with_driver ? 'бо ронанда' : 'бе ронанда'}`],
    ]
  }
  return [
    ['Категория', SERVICE_CATEGORIES[item.category]],
    ['Таҷриба', `${item.experience_years} сол`],
    ['Нарх', formatPrice(item.price)],
    ['Шаҳр', item.city_name],
  ]
}

function BookingForm({ type, item }) {
  const navigate = useNavigate()
  const { values, set, bind, errors, setErrors } = useForm({ date: '', start_time: '', end_time: '', comment: '' })
  const hours = hoursBetween(values.start_time, values.end_time)
  const total = type.key === 'car' ? hours * item.price_per_hour : item.price

  const mutation = useMutation({
    mutationFn: () => bookingsApi[type.key].create({ [type.key]: item.id, ...values }),
    onSuccess: () => {
      toast.success('Дархости брон фиристода шуд!')
      navigate(`/my-bookings?tab=${type.key}`)
    },
    onError: (e) => showApiError(e, setErrors),
  })

  const submit = (e) => {
    e.preventDefault()
    if (!values.date) return setErrors({ date: 'Санаро интихоб кунед.' })
    mutation.mutate()
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <Calendar value={values.date} onChange={(d) => set('date', d)} />
        {errors.date && <p className="mt-1 text-sm text-red-600">{errors.date}</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Аз соати" type="time" required {...bind('start_time')} />
        <Field label="То соати" type="time" required {...bind('end_time')} />
      </div>
      <Field label="Изоҳ" as="textarea" rows="2" {...bind('comment')} />
      <Total value={total} note={type.key === 'car' && hours ? `${hours.toFixed(1)} соат × ${formatPrice(item.price_per_hour)}` : null} />
      <button className="btn-primary w-full" disabled={mutation.isPending}>
        {mutation.isPending ? 'Фиристода истодааст…' : 'Брон кардан'}
      </button>
    </form>
  )
}

export default function BookableDetail({ type }) {
  const { id } = useParams()
  const { data: item, isLoading, isError } = useListing(type, id)

  if (isLoading) return <DetailSkeleton />
  if (isError) return <DetailError type={type} />

  return (
    <ListingDetail
      type={type}
      item={item}
      facts={facts(type, item)}
      sidebar={
        <BookingCard type={type} item={item}>
          <BookingForm type={type} item={item} />
        </BookingCard>
      }
    />
  )
}
