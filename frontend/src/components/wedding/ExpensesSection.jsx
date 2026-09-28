import { expensesApi } from '../../api/weddings'
import useForm from '../../hooks/useForm'
import { showApiError } from '../../utils/errors'
import { formatDate, formatPrice } from '../../utils/format'
import Section, { DeleteButton } from './Section'
import useChild from './useChild'

export default function ExpensesSection({ weddingId }) {
  const { items, isLoading, create, remove } = useChild(expensesApi, 'expenses', weddingId)
  const { values, setValues, bind, errors, setErrors } = useForm({ title: '', amount: '' })
  const total = items.reduce((sum, x) => sum + Number(x.amount), 0)

  const submit = async (e) => {
    e.preventDefault()
    try {
      await create.mutateAsync(values)
      setValues({ title: '', amount: '' })
    } catch (error) {
      showApiError(error, setErrors)
    }
  }

  return (
    <Section title="Харҷҳо" aside={`Ҳамагӣ: ${formatPrice(total)}`}>
      <form onSubmit={submit} className="mb-4 flex flex-wrap gap-2">
        <input className="input min-w-40 flex-[2]" placeholder="Номи харҷ" required {...bind('title')} />
        <input className="input min-w-28 flex-1" type="number" min="0" step="0.01" placeholder="Маблағ" required {...bind('amount')} />
        <button className="btn-primary" disabled={create.isPending}>
          +
        </button>
        {(errors.title || errors.amount) && <p className="w-full text-sm text-red-600">{errors.title || errors.amount}</p>}
      </form>
      {isLoading ? (
        <div className="skeleton h-24" />
      ) : items.length === 0 ? (
        <p className="text-sm text-muted">Ҳоло харҷ сабт нашудааст.</p>
      ) : (
        <div className="-mx-2 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-2 py-2 font-medium">Ном</th>
                <th className="px-2 py-2 font-medium">Сана</th>
                <th className="px-2 py-2 text-right font-medium">Маблағ</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.map((x) => (
                <tr key={x.id} className="border-b border-line/60 last:border-0">
                  <td className="px-2 py-2.5">{x.title}</td>
                  <td className="whitespace-nowrap px-2 py-2.5 text-muted">{formatDate(x.created_at)}</td>
                  <td className="whitespace-nowrap px-2 py-2.5 text-right font-semibold">{formatPrice(x.amount)}</td>
                  <td className="w-10 px-2 text-right">
                    <DeleteButton onClick={() => confirm('Харҷро нест кунем?') && remove.mutate(x.id)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Section>
  )
}
