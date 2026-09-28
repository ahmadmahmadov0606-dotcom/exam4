import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import Field from '../components/Field'
import { useAuth } from '../context/AuthContext'
import useForm from '../hooks/useForm'
import { showApiError } from '../utils/errors'
import SideChooser from '../components/SideChooser'

const ROLES = [
  { value: 'client', title: 'Мизоҷ', text: 'Брон мекунам ва тӯй ташкил медиҳам' },
  { value: 'vendor', title: 'Фурӯшанда', text: 'Хизмат ё мол пешниҳод мекунам' },
]

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { values, set, bind, errors, setErrors } = useForm({
    username: '',
    email: '',
    phone: '',
    role: params.get('role') === 'vendor' ? 'vendor' : 'client',
    side: '',
    password: '',
    password2: '',
  })

  const mutation = useMutation({
    mutationFn: register,
    onSuccess: (user) => {
      toast.success('Бақайдгирӣ бомуваффақият анҷом ёфт!')
      navigate(user.role === 'vendor' ? '/vendor' : '/')
    },
    onError: (e) => showApiError(e, setErrors),
  })

  const submit = (e) => {
    e.preventDefault()
    if (values.role === 'client' && !values.side) return setErrors({ side: 'Интихоб кунед: домод ё арӯс.' })
    mutation.mutate(values.role === 'client' ? values : { ...values, side: '' })
  }

  return (
    <AuthLayout title="Бақайдгирӣ" subtitle="Ҳисоби нав созед">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {ROLES.map((r) => (
            <button
              type="button"
              key={r.value}
              onClick={() => set('role', r.value)}
              className={`rounded-xl border p-4 text-left transition ${
                values.role === r.value ? 'border-primary bg-mist ring-1 ring-primary' : 'border-line bg-white hover:border-secondary'
              }`}
            >
              <span className="block font-semibold">{r.title}</span>
              <span className="mt-1 block text-xs text-muted">{r.text}</span>
            </button>
          ))}
        </div>
        {errors.role && <p className="text-sm text-red-600">{errors.role}</p>}
        {values.role === 'client' && <SideChooser value={values.side} onChange={(side) => set('side', side)} error={errors.side} />}
        <Field label="Номи корбар" autoComplete="username" required {...bind('username')} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Почтаи электронӣ" type="email" {...bind('email')} />
          <Field label="Телефон" type="tel" placeholder="+992" {...bind('phone')} />
        </div>
        <Field label="Парол" type="password" autoComplete="new-password" placeholder="Ақаллан 6 аломат" required {...bind('password')} />
        <Field label="Такрори парол" type="password" autoComplete="new-password" required {...bind('password2')} />
        <button className="btn-primary w-full" disabled={mutation.isPending}>
          {mutation.isPending ? 'Интизор шавед…' : 'Ҳисоб сохтан'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">
        Аллакай ҳисоб доред?{' '}
        <Link to="/login" className="font-medium text-primary hover:underline">
          Воридшавӣ
        </Link>
      </p>
    </AuthLayout>
  )
}
