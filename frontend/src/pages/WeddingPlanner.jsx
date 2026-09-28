import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { weddingsApi } from '../api/weddings'
import { RowSkeletons } from '../components/Loader'
import Modal from '../components/Modal'
import WeddingForm from '../components/wedding/WeddingForm'
import { formatDate, formatPrice } from '../utils/format'
import Icon from '../components/Icon'

function useCreateWedding() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  return useMutation({
    mutationFn: weddingsApi.create,
    onSuccess: (wedding) => {
      toast.success('Тӯй сохта шуд!')
      queryClient.invalidateQueries({ queryKey: ['weddings'] })
      navigate(`/wedding/${wedding.id}`)
    },
  })
}

export default function WeddingPlanner() {
  const [creating, setCreating] = useState(false)
  const create = useCreateWedding()
  const [params] = useSearchParams()
  const { data: weddings, isLoading } = useQuery({ queryKey: ['weddings'], queryFn: () => weddingsApi.listAll() })

  if (isLoading) {
    return (
      <div className="container-page max-w-4xl py-10">
        <RowSkeletons count={2} />
      </div>
    )
  }
  if (weddings.length === 1 && !params.has('all')) return <Navigate to={`/wedding/${weddings[0].id}`} replace />

  if (weddings.length === 0) {
    return (
      <div className="container-page grid max-w-5xl items-center gap-10 py-12 lg:grid-cols-2">
        <div>
          <p className="eyebrow">
            <Icon name="event_note" className="text-[16px]" /> Банақшагирӣ
          </p>
          <h1 className="title mt-2">Тӯйи худро ба нақша гиред</h1>
          <p className="mt-4 text-muted">
            Санаи тӯй ва буҷаро нависед — баъд меҳмонони ду тараф, вазифаҳо ва харҷҳоро дар як ҷо идора мекунед.
          </p>
        </div>
        <div className="card p-6">
          <WeddingForm onSubmit={create} submitLabel="Сохтани нақша" />
        </div>
      </div>
    )
  }

  return (
    <div className="container-page max-w-4xl py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="title">Тӯйҳои ман</h1>
        <button className="btn-primary" onClick={() => setCreating(true)}>
          + Тӯйи нав
        </button>
      </div>
      <ul className="space-y-4">
        {weddings.map((w) => (
          <li key={w.id}>
            <Link to={`/wedding/${w.id}`} className="card flex items-center gap-4 p-5 transition hover:border-secondary hover:shadow-md">
              <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-mist text-primary">
                <Icon name="favorite" className="text-2xl" />
              </span>
              <div className="flex-1">
                <p className="font-serif text-2xl font-semibold">{w.title}</p>
                <p className="text-sm text-muted">{formatDate(w.date)}</p>
              </div>
              <span className="hidden text-sm text-muted sm:block">Буҷа: {formatPrice(w.budget)}</span>
            </Link>
          </li>
        ))}
      </ul>
      <Modal open={creating} onClose={() => setCreating(false)} title="Тӯйи нав">
        <WeddingForm onSubmit={create} submitLabel="Сохтан" />
      </Modal>
    </div>
  )
}
