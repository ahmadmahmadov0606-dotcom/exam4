import { useEffect, useState } from 'react'
import Icon from './Icon'

export default function ImageUpload({ label = 'Сурат', value, onChange, error }) {
  const [preview, setPreview] = useState(null)

  useEffect(() => {
    if (!(value instanceof File)) return setPreview(value || null)
    const url = URL.createObjectURL(value)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [value])

  return (
    <div>
      <span className="label">{label}</span>
      <label className="flex cursor-pointer items-center gap-4 rounded-xl border border-dashed border-line bg-ivory p-3 hover:border-secondary">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-mist">
          {preview ? <img src={preview} alt="" className="h-full w-full object-cover" /> : <Icon name="add_a_photo" className="text-3xl text-primary/60" />}
        </div>
        <div className="text-sm">
          <p className="font-medium text-primary">{preview ? 'Иваз кардан' : 'Сурат интихоб кунед'}</p>
          <p className="text-muted">JPG ё PNG</p>
        </div>
        <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files[0] && onChange(e.target.files[0])} />
      </label>
      {error && <span className="mt-1 block text-sm text-red-600">{error}</span>}
    </div>
  )
}
