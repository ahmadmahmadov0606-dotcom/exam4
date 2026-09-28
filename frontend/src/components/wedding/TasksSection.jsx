import { tasksApi } from '../../api/weddings'
import useForm from '../../hooks/useForm'
import { showApiError } from '../../utils/errors'
import { formatDate, today } from '../../utils/format'
import Section, { DeleteButton } from './Section'
import useChild from './useChild'

export default function TasksSection({ weddingId }) {
  const { items, isLoading, create, update, remove } = useChild(tasksApi, 'tasks', weddingId)
  const { values, setValues, bind, errors, setErrors } = useForm({ title: '', deadline: '' })
  const done = items.filter((t) => t.is_done).length
  const sorted = [...items].sort((a, b) => a.is_done - b.is_done || (a.deadline ?? '9').localeCompare(b.deadline ?? '9'))

  const submit = async (e) => {
    e.preventDefault()
    try {
      await create.mutateAsync({ ...values, deadline: values.deadline || null })
      setValues({ title: '', deadline: '' })
    } catch (error) {
      showApiError(error, setErrors)
    }
  }

  return (
    <Section title="Вазифаҳо" aside={`${done} аз ${items.length} иҷро шуд`}>
      <form onSubmit={submit} className="mb-4 flex flex-wrap gap-2">
        <input className="input min-w-40 flex-[2]" placeholder="Вазифаи нав…" required {...bind('title')} />
        <input className="input min-w-36 flex-1" type="date" {...bind('deadline')} />
        <button className="btn-primary" disabled={create.isPending}>
          +
        </button>
        {(errors.title || errors.deadline) && <p className="w-full text-sm text-red-600">{errors.title || errors.deadline}</p>}
      </form>
      {items.length > 0 && (
        <div className="mb-4 h-2 overflow-hidden rounded-full bg-ivory">
          <div className="h-full bg-emerald-500 transition-all" style={{ width: `${(done / items.length) * 100}%` }} />
        </div>
      )}
      {isLoading ? (
        <div className="skeleton h-24" />
      ) : items.length === 0 ? (
        <p className="text-sm text-muted">Рӯйхати корҳо холӣ аст.</p>
      ) : (
        <ul className="space-y-1">
          {sorted.map((t) => {
            const overdue = !t.is_done && t.deadline && t.deadline < today()
            return (
              <li key={t.id} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-ivory">
                <input
                  type="checkbox"
                  className="h-5 w-5 accent-primary"
                  checked={t.is_done}
                  onChange={() => update.mutate({ id: t.id, is_done: !t.is_done })}
                />
                <span className={`flex-1 ${t.is_done ? 'text-muted line-through' : ''}`}>{t.title}</span>
                {t.deadline && (
                  <span className={`text-xs ${overdue ? 'font-semibold text-red-600' : 'text-muted'}`}>{formatDate(t.deadline)}</span>
                )}
                <DeleteButton onClick={() => remove.mutate(t.id)} />
              </li>
            )
          })}
        </ul>
      )}
    </Section>
  )
}
