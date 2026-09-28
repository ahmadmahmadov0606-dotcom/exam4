import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { useSearchParams } from 'react-router-dom'
import { bookingsApi } from '../api/bookings'
import BookingList from '../components/BookingList'
import Tabs from '../components/Tabs'
import { useAuth } from '../context/AuthContext'
import { TYPES, TYPE_LIST } from '../utils/constants'
import { showApiError } from '../utils/errors'

export default function MyBookings() {
  const { user } = useAuth()
  const [params, setParams] = useSearchParams()
  const type = TYPES[params.get('tab')] ?? TYPES.restaurant
  const queryClient = useQueryClient()

  const cancel = useMutation({
    mutationFn: (id) => bookingsApi[type.key].cancel(id),
    onSuccess: () => {
      toast.success('Брон бекор карда шуд')
      queryClient.invalidateQueries({ queryKey: ['bookings', type.key] })
      queryClient.invalidateQueries({ queryKey: [type.slug] })
    },
    onError: (e) => showApiError(e),
  })

  return (
    <div className="container-page max-w-5xl py-10">
      <h1 className="title mb-6">Бронҳои ман</h1>
      <Tabs
        tabs={TYPE_LIST.map((t) => [t.key, t.bookingTitle])}
        active={type.key}
        onChange={(tab) => setParams({ tab })}
      />
      <BookingList
        key={type.key}
        type={type}
        filter={(b) => b.user === user.username}
        emptyText={`Шумо ҳоло ${type.key === 'product' ? 'фармоиш' : 'брон'} надоред.`}
        actions={(b) =>
          ['pending', 'confirmed'].includes(b.status) && (
            <button
              className="btn-outline btn-sm hover:border-red-500 hover:text-red-600"
              disabled={cancel.isPending}
              onClick={() => confirm('Бронро бекор кунем?') && cancel.mutate(b.id)}
            >
              Бекор кардан
            </button>
          )
        }
      />
    </div>
  )
}
