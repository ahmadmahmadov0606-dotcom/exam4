import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import Field from '../components/Field'
import { useAuth } from '../context/AuthContext'
import useForm from '../hooks/useForm'
import { showApiError } from '../utils/errors'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { values, bind, setErrors } = useForm({ username: '', password: '' })

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: (user) => {
      toast.success(`Хуш омадед, ${user.username}!`)
      navigate(location.state?.from?.pathname || '/', { replace: true })
    },
    onError: (e) => showApiError(e, setErrors),
  })

  const submit = (e) => {
    e.preventDefault()
    mutation.mutate(values)
  }

  return (
    <AuthLayout title="Воридшавӣ" subtitle="Ба ҳисоби худ ворид шавед">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Номи корбар" autoComplete="username" required {...bind('username')} />
        <Field label="Парол" type="password" autoComplete="current-password" required {...bind('password')} />
        <button className="btn-primary w-full" disabled={mutation.isPending}>
          {mutation.isPending ? 'Интизор шавед…' : 'Ворид шудан'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">
        Ҳисоб надоред?{' '}
        <Link to="/register" className="font-medium text-primary hover:underline">
          Бақайдгирӣ
        </Link>
      </p>
    </AuthLayout>
  )
}
