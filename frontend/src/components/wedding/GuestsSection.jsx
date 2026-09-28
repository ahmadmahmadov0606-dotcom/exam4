import { guestsApi } from '../../api/weddings'
import useForm from '../../hooks/useForm'
import { showApiError } from '../../utils/errors'
import Field from '../Field'
import Section, { DeleteButton } from './Section'
import useChild from './useChild'
import Icon from '../Icon'

const SIDES = [
  ['groom', 'Тарафи домод', 'man'],
  ['bride', 'Тарафи арӯс', 'woman'],
]
const EMPTY = { name: '', phone: '', side: 'groom', people_count: 1 }
const people = (list) => list.reduce((sum, g) => sum + g.people_count, 0)

function GuestForm({ create }) {
  const { values, setValues, bind, setErrors } = useForm(EMPTY)

  const submit = async (e) => {
    e.preventDefault()
    try {
      await create.mutateAsync(values)
      setValues({ ...EMPTY, side: values.side })
    } catch (error) {
      showApiError(error, setErrors)
    }
  }

  return (
    <form onSubmit={submit} className="mb-6 grid gap-3 sm:grid-cols-[2fr_1.5fr_1.5fr_1fr_auto] sm:items-end">
      <Field label="Ном" required {...bind('name')} />
      <Field label="Телефон" {...bind('phone')} />
      <Field label="Тараф" as="select" {...bind('side')}>
        {SIDES.map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </Field>
      <Field label="Нафар" type="number" min="1" {...bind('people_count')} />
      <button className="btn-primary" disabled={create.isPending}>
        + Илова
      </button>
    </form>
  )
}

export default function GuestsSection({ weddingId }) {
  const { items, isLoading, create, update, remove } = useChild(guestsApi, 'guests', weddingId)
  const confirmed = items.filter((g) => g.is_confirmed)

  return (
    <Section title="Меҳмонон" aside={`${people(items)} нафар · тасдиқ: ${people(confirmed)}`}>
      <GuestForm create={create} />
      {isLoading ? (
        <div className="skeleton h-32" />
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {SIDES.map(([side, label, icon]) => {
            const list = items.filter((g) => g.side === side)
            return (
              <div key={side}>
                <h3 className="mb-3 flex items-center justify-between rounded-xl bg-ivory px-4 py-2 font-semibold">
                  <span className="flex items-center gap-2">
                    <Icon name={icon} className="text-secondary" /> {label}
                  </span>
                  <span className="text-sm font-normal text-muted">{people(list)} нафар</span>
                </h3>
                {list.length === 0 && <p className="px-4 text-sm text-muted">Ҳоло меҳмон нест.</p>}
                <ul className="divide-y divide-line">
                  {list.map((g) => (
                    <li key={g.id} className="flex items-center gap-3 px-2 py-2.5">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">
                          {g.name} {g.people_count > 1 && <span className="text-sm text-muted">+{g.people_count - 1}</span>}
                        </p>
                        {g.phone && <p className="text-xs text-muted">{g.phone}</p>}
                      </div>
                      <button
                        onClick={() => update.mutate({ id: g.id, is_confirmed: !g.is_confirmed })}
                        className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                          g.is_confirmed ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                        }`}
                      >
                        {g.is_confirmed ? 'Меояд' : 'Тасдиқ нашуд'}
                      </button>
                      <DeleteButton onClick={() => confirm(`«${g.name}»-ро нест кунем?`) && remove.mutate(g.id)} />
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      )}
    </Section>
  )
}
