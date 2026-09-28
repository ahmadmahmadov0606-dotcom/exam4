import { useEffect, useState } from 'react'
import Icon from '../Icon'

const MAX_MB = 15

// Short looping hero video for a restaurant (MP4/WebM, up to 15 MB — the server checks this too).
export default function VideoUpload({ value, onChange, error }) {
  const [preview, setPreview] = useState(null)
  const [localError, setLocalError] = useState(null)

  useEffect(() => {
    if (!(value instanceof File)) {
      setPreview(value || null)
      return
    }
    const url = URL.createObjectURL(value)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [value])

  const pick = (file) => {
    if (!file) return
    if (!/\.(mp4|webm)$/i.test(file.name)) return setLocalError('Танҳо видеои MP4 ё WebM.')
    if (file.size > MAX_MB * 1024 * 1024) return setLocalError(`Видео бояд аз ${MAX_MB} МБ хурдтар бошад.`)
    setLocalError(null)
    onChange(file)
  }

  return (
    <div>
      <span className="label">Видеои толор (ихтиёрӣ)</span>
      <label className="flex cursor-pointer items-center gap-4 rounded-xl border border-dashed border-line bg-ivory p-3 hover:border-secondary">
        <div className="flex h-20 w-32 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-mist text-primary/60">
          {preview ? <video src={preview} className="h-full w-full object-cover" muted autoPlay loop playsInline /> : <Icon name="movie" className="text-3xl" />}
        </div>
        <div className="text-sm">
          <p className="font-medium text-primary">{preview ? 'Видеоро иваз кардан' : 'Видео интихоб кунед'}</p>
          <p className="text-muted">MP4 ё WebM, то {MAX_MB} МБ. Беҳтар: 10–20 сония, бе садо, уфуқӣ.</p>
        </div>
        <input type="file" accept="video/mp4,video/webm" className="hidden" onChange={(e) => pick(e.target.files[0])} />
      </label>
      {(localError || error) && <span className="mt-1 block text-sm text-red-600">{localError || error}</span>}
    </div>
  )
}
