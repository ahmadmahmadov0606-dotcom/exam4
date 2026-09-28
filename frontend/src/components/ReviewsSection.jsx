import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { reviewsApi } from '../api/reviews'
import { useAuth } from '../context/AuthContext'
import useForm from '../hooks/useForm'
import { showApiError } from '../utils/errors'
import { formatDate } from '../utils/format'
import Pagination from './Pagination'
import StarRating from './StarRating'

function ReviewForm({ initial = { rating: 0, text: '' }, onSubmit, onCancel, pending }) {
  const { values, set, bind, errors, setErrors } = useForm(initial)

  const submit = (e) => {
    e.preventDefault()
    if (!values.rating) return setErrors({ rating: 'Баҳоро интихоб кунед.' })
    onSubmit(values, setErrors)
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-2xl border border-line bg-white p-5">
      <div>
        <span className="label">Баҳои шумо</span>
        <StarRating value={values.rating} onChange={(n) => set('rating', n)} size="text-3xl" />
        {errors.rating && <p className="text-sm text-red-600">{errors.rating}</p>}
      </div>
      <textarea className="input min-h-24" placeholder="Таассуроти худро нависед…" {...bind('text')} />
      {errors.text && <p className="text-sm text-red-600">{errors.text}</p>}
      <div className="flex gap-2">
        <button className="btn-primary" disabled={pending}>
          {pending ? 'Интизор шавед…' : 'Фиристодан'}
        </button>
        {onCancel && (
          <button type="button" className="btn-outline" onClick={onCancel}>
            Бекор
          </button>
        )}
      </div>
    </form>
  )
}

export default function ReviewsSection({ type, id }) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState(null)
  const key = ['reviews', type.key, id, page]

  const { data, isLoading } = useQuery({ queryKey: key, queryFn: () => reviewsApi.list({ [type.key]: id, page }) })

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['reviews', type.key, id] })
    queryClient.invalidateQueries({ queryKey: [type.slug] })
  }
  const withErrors = (fn, message) => ({
    mutationFn: ({ values }) => fn(values),
    onSuccess: () => {
      toast.success(message)
      setEditing(null)
      refresh()
    },
    onError: (e, { setErrors }) => showApiError(e, setErrors),
  })
  const create = useMutation(withErrors((v) => reviewsApi.create({ ...v, [type.key]: id }), 'Шарҳ илова шуд'))
  const update = useMutation(withErrors((v) => reviewsApi.update(v.id, { rating: v.rating, text: v.text }), 'Шарҳ таҳрир шуд'))
  const remove = useMutation({
    mutationFn: reviewsApi.remove,
    onSuccess: () => {
      toast.success('Шарҳ нест карда шуд')
      refresh()
    },
    onError: (e) => showApiError(e),
  })

  const reviews = data?.results ?? []
  const hasOwn = reviews.some((r) => r.user === user?.username)
  const canReview = user && !hasOwn

  return (
    <section>
      <h2 className="mb-4 font-serif text-2xl font-semibold">
        Шарҳҳо {data?.count > 0 && <span className="text-muted">({data.count})</span>}
      </h2>

      {canReview && (
        <div className="mb-6">
          <ReviewForm pending={create.isPending} onSubmit={(values, setErrors) => create.mutate({ values, setErrors })} />
        </div>
      )}

      {isLoading ? (
        <div className="skeleton h-24" />
      ) : reviews.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line p-6 text-center text-sm text-muted">
          Ҳоло шарҳ нест. Аввалин шуда баҳо диҳед!
        </p>
      ) : (
        <ul className="space-y-4">
          {reviews.map((r) =>
            editing === r.id ? (
              <li key={r.id}>
                <ReviewForm
                  initial={{ id: r.id, rating: r.rating, text: r.text }}
                  pending={update.isPending}
                  onCancel={() => setEditing(null)}
                  onSubmit={(values, setErrors) => update.mutate({ values, setErrors })}
                />
              </li>
            ) : (
              <li key={r.id} className="rounded-2xl border border-line bg-white p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary-light font-semibold text-primary">
                      {r.user[0].toUpperCase()}
                    </span>
                    <div>
                      <p className="font-medium">{r.user}</p>
                      <p className="text-xs text-muted">{formatDate(r.created_at)}</p>
                    </div>
                  </div>
                  <StarRating value={r.rating} />
                </div>
                {r.text && <p className="mt-3 text-ink/80">{r.text}</p>}
                {r.user === user?.username && (
                  <div className="mt-3 flex gap-3 text-sm">
                    <button className="font-medium text-primary hover:underline" onClick={() => setEditing(r.id)}>
                      Таҳрир
                    </button>
                    <button
                      className="font-medium text-muted hover:text-red-600"
                      disabled={remove.isPending}
                      onClick={() => confirm('Шарҳро нест кунем?') && remove.mutate(r.id)}
                    >
                      Нест кардан
                    </button>
                  </div>
                )}
              </li>
            ),
          )}
        </ul>
      )}
      {data && <Pagination count={data.count} page={page} onChange={setPage} />}
    </section>
  )
}
