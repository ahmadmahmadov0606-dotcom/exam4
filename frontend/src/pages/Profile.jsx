import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { authApi } from '../api/auth'
import Field from '../components/Field'
import ImageUpload from '../components/ImageUpload'
import { Avatar } from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import useForm from '../hooks/useForm'
import { showApiError, toFormData } from '../utils/errors'
import SideChooser from '../components/SideChooser'
import { AUDIENCES } from '../utils/constants'

export default function Profile() {
  const { user, setUser, logout } = useAuth()
  const profile = useForm({
    side: user.side,
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    phone: user.phone,
    avatar: user.avatar,
  })
  const password = useForm({ old_password: '', new_password: '' })

  const queryClient = useQueryClient()
  const saveProfile = useMutation({
    mutationFn: () => authApi.updateMe(toFormData(profile.values)),
    onSuccess: (me) => {
      setUser(me)
      queryClient.invalidateQueries()
      toast.success('Профил нигоҳ дошта шуд')
    },
    onError: (e) => showApiError(e, profile.setErrors),
  })

  const changePassword = useMutation({
    mutationFn: () => authApi.changePassword(password.values),
    onSuccess: (res) => {
      toast.success(res.detail)
      password.setValues({ old_password: '', new_password: '' })
    },
    onError: (e) => showApiError(e, password.setErrors),
  })

  const onSubmit = (mutation) => (e) => {
    e.preventDefault()
    mutation.mutate()
  }

  return (
    <div className="container-page max-w-4xl py-10">
      <div className="card flex flex-col items-center gap-5 p-6 sm:flex-row">
        <Avatar user={user} size="h-20 w-20 text-3xl" />
        <div className="text-center sm:text-left">
          <h1 className="title">{user.username}</h1>
          <p className="text-muted">{user.role === 'vendor' ? 'Фурӯшанда' : AUDIENCES[user.side]?.label ?? 'Мизоҷ'}</p>
        </div>
        <button className="btn-outline sm:ml-auto" onClick={logout}>
          Баромад
        </button>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[3fr_2fr]">
        <form onSubmit={onSubmit(saveProfile)} className="card space-y-4 p-6">
          <h2 className="font-serif text-2xl font-semibold">Маълумоти шахсӣ</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Ном" {...profile.bind('first_name')} />
            <Field label="Насаб" {...profile.bind('last_name')} />
            <Field label="Почтаи электронӣ" type="email" {...profile.bind('email')} />
            <Field label="Телефон" type="tel" {...profile.bind('phone')} />
          </div>
          {user.role === 'client' && (
            <SideChooser value={profile.values.side} onChange={(side) => profile.set('side', side)} error={profile.errors.side} />
          )}
          <ImageUpload
            label="Акс"
            value={profile.values.avatar}
            onChange={(file) => profile.set('avatar', file)}
            error={profile.errors.avatar}
          />
          <button className="btn-primary" disabled={saveProfile.isPending}>
            {saveProfile.isPending ? 'Нигоҳ дошта истодааст…' : 'Нигоҳ доштан'}
          </button>
        </form>

        <form onSubmit={onSubmit(changePassword)} className="card space-y-4 self-start p-6">
          <h2 className="font-serif text-2xl font-semibold">Ивази парол</h2>
          <Field label="Пароли кӯҳна" type="password" required {...password.bind('old_password')} />
          <Field label="Пароли нав" type="password" required {...password.bind('new_password')} />
          <button className="btn-outline w-full" disabled={changePassword.isPending}>
            Иваз кардан
          </button>
        </form>
      </div>
    </div>
  )
}
