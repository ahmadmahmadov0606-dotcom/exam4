import useCities from '../../hooks/useCities'
import useForm from '../../hooks/useForm'
import { showApiError } from '../../utils/errors'
import { today } from '../../utils/format'
import Field from '../Field'

export default function WeddingForm({ initial, onSubmit, submitLabel = 'Нигоҳ доштан' }) {
  const cities = useCities()
  const { values, bind, setErrors } = useForm(initial ?? { title: '', date: '', city: '', budget: '' })

  const submit = async (e) => {
    e.preventDefault()
    try {
      await onSubmit.mutateAsync({ ...values, city: values.city || null, budget: values.budget || 0 })
    } catch (error) {
      showApiError(error, setErrors)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Номи тӯй" placeholder="Тӯйи Фирдавс ва Мадина" required {...bind('title')} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Сана" type="date" min={initial ? undefined : today()} required {...bind('date')} />
        <Field label="Шаҳр" as="select" {...bind('city')}>
          <option value="">—</option>
          {cities.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Field>
      </div>
      <Field label="Буҷа (сомонӣ)" type="number" min="0" step="0.01" {...bind('budget')} />
      <button className="btn-primary w-full" disabled={onSubmit.isPending}>
        {onSubmit.isPending ? 'Интизор шавед…' : submitLabel}
      </button>
    </form>
  )
}
