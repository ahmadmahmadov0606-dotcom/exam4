import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { weddingsApi } from '../api/weddings'
import EmptyState from '../components/EmptyState'
import { PageLoader } from '../components/Loader'
import Modal from '../components/Modal'
import BudgetBar from '../components/wedding/BudgetBar'
import Countdown from '../components/wedding/Countdown'
import ExpensesSection from '../components/wedding/ExpensesSection'
import GuestsSection from '../components/wedding/GuestsSection'
import TasksSection from '../components/wedding/TasksSection'
import WeddingForm from '../components/wedding/WeddingForm'
import useCities from '../hooks/useCities'
import { showApiError } from '../utils/errors'
import { formatDate } from '../utils/format'

export default function WeddingDashboard() {
  const { id } = useParams()
  const weddingId = Number(id)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const cities = useCities()
  const [editing, setEditing] = useState(false)

  const { data: wedding, isLoading, isError } = useQuery({
    queryKey: ['weddings', weddingId],
    queryFn: () => weddingsApi.get(weddingId),
  })

  const update = useMutation({
    mutationFn: (body) => weddingsApi.update(weddingId, body),
    onSuccess: () => {
      toast.success('Нигоҳ дошта шуд')
      setEditing(false)
      queryClient.invalidateQueries({ queryKey: ['weddings'] })
    },
  })
  const remove = useMutation({
    mutationFn: () => weddingsApi.remove(weddingId),
    onSuccess: () => {
      toast.success('Тӯй нест карда шуд')
      queryClient.removeQueries({ queryKey: ['wedding', weddingId] })
      queryClient.invalidateQueries({ queryKey: ['weddings'] })
      navigate('/wedding')
    },
    onError: (e) => showApiError(e),
  })

  if (isLoading) return <PageLoader />
  if (isError) {
    return (
      <div className="container-page py-16">
        <EmptyState title="Тӯй ёфт нашуд" action={<Link to="/wedding" className="btn-primary">Ба нақшаҳо</Link>} />
      </div>
    )
  }

  const city = cities.find((c) => c.id === wedding.city)

  return (
    <div className="container-page space-y-6 py-8">
      <header className="relative overflow-hidden rounded-3xl bg-primary p-6 text-white sm:p-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_90%_0%,rgba(237,192,111,.45),transparent_50%)]" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link to="/wedding?all=1" className="text-sm text-white/70 hover:text-white">
              ← Тӯйҳои ман
            </Link>
            <h1 className="mt-2 font-serif text-4xl font-semibold sm:text-5xl">{wedding.title}</h1>
            <p className="mt-2 text-white/80">
              {formatDate(wedding.date)}
              {city && ` · ${city.name}`}
            </p>
            <div className="mt-4 flex gap-2">
              <button className="btn btn-sm bg-white/15 text-white hover:bg-white/25" onClick={() => setEditing(true)}>
                Таҳрир
              </button>
              <button
                className="btn btn-sm bg-white/15 text-white hover:bg-red-500"
                disabled={remove.isPending}
                onClick={() => confirm('Ин тӯй ва ҳамаи маълумоти он нест карда мешавад. Розӣ ҳастед?') && remove.mutate()}
              >
                Нест кардан
              </button>
            </div>
          </div>
          <Countdown date={wedding.date} />
        </div>
      </header>

      <BudgetBar budget={wedding.budget} spent={wedding.spent} remaining={wedding.remaining} />
      <GuestsSection weddingId={weddingId} />
      <div className="grid gap-6 lg:grid-cols-2">
        <TasksSection weddingId={weddingId} />
        <ExpensesSection weddingId={weddingId} />
      </div>

      <Modal open={editing} onClose={() => setEditing(false)} title="Таҳрири тӯй">
        <WeddingForm
          initial={{ title: wedding.title, date: wedding.date, city: wedding.city ?? '', budget: wedding.budget }}
          onSubmit={update}
        />
      </Modal>
    </div>
  )
}
