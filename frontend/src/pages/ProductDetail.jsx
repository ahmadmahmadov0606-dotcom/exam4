import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { useNavigate, useParams } from 'react-router-dom'
import { bookingsApi } from '../api/bookings'
import Field from '../components/Field'
import ListingDetail, { BookingCard, DetailError, DetailSkeleton, Total, useListing } from '../components/ListingDetail'
import useForm from '../hooks/useForm'
import { PRODUCT_CATEGORIES, SIDES, TYPES } from '../utils/constants'
import { showApiError } from '../utils/errors'
import { formatPrice } from '../utils/format'

const type = TYPES.product

function OrderForm({ item }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { values, set, bind, errors, setErrors } = useForm({ quantity: 1, address: '' })
  const quantity = values.quantity

  const mutation = useMutation({
    mutationFn: () => bookingsApi.product.create({ product: item.id, ...values }),
    onSuccess: () => {
      toast.success('Фармоиш қабул шуд!')
      queryClient.invalidateQueries({ queryKey: [type.slug] })
      navigate('/my-bookings?tab=product')
    },
    onError: (e) => showApiError(e, setErrors),
  })

  if (item.stock === 0) return <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">Ҳоло дар анбор нест.</p>

  const step = (delta) => set('quantity', Math.min(item.stock, Math.max(1, quantity + delta)))

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        mutation.mutate()
      }}
      className="space-y-4"
    >
      <div>
        <span className="label">Миқдор (дар анбор {item.stock})</span>
        <div className="flex items-center gap-3">
          <button type="button" className="btn-outline h-11 w-11 p-0 text-lg" onClick={() => step(-1)} disabled={quantity <= 1}>
            −
          </button>
          <span className="w-10 text-center text-lg font-semibold">{quantity}</span>
          <button type="button" className="btn-outline h-11 w-11 p-0 text-lg" onClick={() => step(1)} disabled={quantity >= item.stock}>
            +
          </button>
        </div>
        {errors.quantity && <p className="mt-1 text-sm text-red-600">{errors.quantity}</p>}
      </div>
      <Field label="Суроғаи расонидан" required placeholder="Шаҳр, кӯча, хона" {...bind('address')} />
      <Total value={quantity * item.price} note={`${quantity} × ${formatPrice(item.price)}`} />
      <button className="btn-primary w-full" disabled={mutation.isPending}>
        {mutation.isPending ? 'Фиристода истодааст…' : 'Фармоиш додан'}
      </button>
    </form>
  )
}

export default function ProductDetail() {
  const { id } = useParams()
  const { data: item, isLoading, isError } = useListing(type, id)

  if (isLoading) return <DetailSkeleton />
  if (isError) return <DetailError type={type} />

  return (
    <ListingDetail
      type={type}
      item={item}
      facts={[
        ['Категория', PRODUCT_CATEGORIES[item.category]],
        ['Тараф', SIDES[item.side]],
        ['Дар анбор', `${item.stock} дона`],
        ['Шаҳр', item.city_name],
      ]}
      sidebar={
        <BookingCard type={type} item={item} title="Фармоиш додан">
          <OrderForm item={item} />
        </BookingCard>
      }
    />
  )
}
