import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { listingsApi } from '../../api/listings'
import useCities from '../../hooks/useCities'
import useForm from '../../hooks/useForm'
import { showApiError, toFormData } from '../../utils/errors'
import Field from '../Field'
import ImageUpload from '../ImageUpload'
import VideoUpload from './VideoUpload'

function initialValues(type, item) {
  const values = Object.fromEntries(type.fields.map((f) => [f.name, item?.[f.name] ?? '']))
  if (type.key === 'car') values.with_driver = item?.with_driver ?? true
  if (type.key === 'restaurant') values.video = item?.video ?? null
  if (type.key === 'car') {
    values.model_3d = item?.model_3d ?? null
    values.interior = item?.interior ?? null
  }
  return { ...values, image: item?.image ?? null }
}

export default function ListingForm({ type, item, onDone }) {
  const cities = useCities()
  const queryClient = useQueryClient()
  const { values, set, bind, errors, setErrors } = useForm(initialValues(type, item))
  const api = listingsApi[type.key]

  const mutation = useMutation({
    mutationFn: () => {
      const body = toFormData(values)
      return item ? api.update(item.id, body) : api.create(body)
    },
    onSuccess: () => {
      toast.success(item ? 'Эълон таҳрир шуд' : 'Эълон илова шуд')
      queryClient.invalidateQueries({ queryKey: [type.slug] })
      onDone()
    },
    onError: (e) => showApiError(e, setErrors),
  })

  const renderField = (f) => {
    const props = { label: f.label, required: f.required, className: f.wide ? 'sm:col-span-2' : '', ...bind(f.name) }
    if (f.type === 'checkbox') {
      return (
        <label key={f.name} className="flex items-center gap-3 self-end rounded-xl border border-line px-4 py-3">
          <input type="checkbox" className="h-5 w-5 accent-primary" checked={values[f.name]} onChange={(e) => set(f.name, e.target.checked)} />
          <span className="text-sm font-medium">{f.label}</span>
        </label>
      )
    }
    if (f.type === 'city' || f.type === 'select') {
      const options = f.type === 'city' ? cities.map((c) => [c.id, c.name]) : Object.entries(f.options)
      return (
        <Field key={f.name} as="select" {...props}>
          <option value="">— интихоб кунед —</option>
          {options.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Field>
      )
    }
    if (f.type === 'textarea') return <Field key={f.name} as="textarea" rows="4" {...props} />
    return <Field key={f.name} type={f.type ?? 'text'} min={f.type === 'number' ? 0 : undefined} step={f.type === 'number' ? 'any' : undefined} {...props} />
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        mutation.mutate()
      }}
      className="space-y-5"
    >
      <div className="grid gap-4 sm:grid-cols-2">{type.fields.map(renderField)}</div>
      <ImageUpload value={values.image} onChange={(file) => set('image', file)} error={errors.image} />
      {type.key === 'restaurant' && <VideoUpload value={values.video} onChange={(file) => set('video', file)} error={errors.video} />}
      {type.key === 'car' && (
        <label className="block">
          <span className="label">3D-модели мошин (.glb, ихтиёрӣ)</span>
          <input type="file" accept=".glb,model/gltf-binary" className="input" onChange={(e) => e.target.files[0] && set('model_3d', e.target.files[0])} />
          <span className="mt-1 block text-xs text-muted">
            {values.model_3d instanceof File ? values.model_3d.name : values.model_3d ? 'Модел бор шудааст' : 'Бе модел 3D сурати мошинро нишон медиҳад.'}
          </span>
          {errors.model_3d && <span className="mt-1 block text-sm text-red-600">{errors.model_3d}</span>}
        </label>
      )}
      {type.key === 'car' && (
        <label className="block">
          <span className="label">Сурати дохили мошин (салон, ихтиёрӣ)</span>
          <input type="file" accept="image/*" className="input" onChange={(e) => e.target.files[0] && set('interior', e.target.files[0])} />
          <span className="mt-1 block text-xs text-muted">
            {values.interior instanceof File ? values.interior.name : values.interior ? 'Сурат бор шудааст' : 'Сурати васеъ аз ҷои ронанда — дар 3D тугмаи «Дарун» онро нишон медиҳад.'}
          </span>
          {errors.interior && <span className="mt-1 block text-sm text-red-600">{errors.interior}</span>}
        </label>
      )}
      <div className="flex justify-end gap-2">
        <button type="button" className="btn-outline" onClick={onDone}>
          Бекор
        </button>
        <button className="btn-primary" disabled={mutation.isPending}>
          {mutation.isPending ? 'Нигоҳ дошта истодааст…' : 'Нигоҳ доштан'}
        </button>
      </div>
    </form>
  )
}
