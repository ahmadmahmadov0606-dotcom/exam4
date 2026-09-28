import { useCallback, useEffect, useState } from 'react'
import Icon from './Icon'

function Lightbox({ images, index, onClose, onMove }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') onMove(1)
      if (e.key === 'ArrowLeft') onMove(-1)
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose, onMove])

  const arrow = 'absolute top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur hover:bg-white/25'
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={onClose} role="dialog" aria-modal="true">
      <img src={images[index]} alt="" className="max-h-[88vh] max-w-full rounded-lg object-contain shadow-2xl" onClick={(e) => e.stopPropagation()} />
      <button className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/25" onClick={onClose} aria-label="Пӯшидан">
        <Icon name="close" />
      </button>
      {images.length > 1 && (
        <>
          <button className={`${arrow} left-4`} onClick={(e) => (e.stopPropagation(), onMove(-1))} aria-label="Пешина">
            <Icon name="chevron_left" className="text-3xl" />
          </button>
          <button className={`${arrow} right-4`} onClick={(e) => (e.stopPropagation(), onMove(1))} aria-label="Оянда">
            <Icon name="chevron_right" className="text-3xl" />
          </button>
          <p className="absolute bottom-5 text-sm text-white/70">
            {index + 1} / {images.length}
          </p>
        </>
      )}
    </div>
  )
}

// Photo grid: the first photo is large, the rest fill in; clicking any photo opens a lightbox.
export default function GalleryGrid({ images }) {
  const [open, setOpen] = useState(null)
  const move = useCallback((step) => setOpen((i) => (i + step + images.length) % images.length), [images.length])
  const close = useCallback(() => setOpen(null), [])
  if (!images.length) return null

  return (
    <>
      <div className={`grid auto-rows-[11rem] gap-3 sm:auto-rows-[13rem] ${images.length >= 3 ? 'grid-cols-2 md:grid-cols-4' : images.length === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {images.map((src, i) => (
          <button
            key={src}
            type="button"
            onClick={() => setOpen(i)}
            className={`group relative overflow-hidden rounded-xl bg-mist ${images.length >= 3 && i === 0 ? 'col-span-2 row-span-2' : images.length < 3 ? 'row-span-2' : ''}`}
            aria-label={`Сурати ${i + 1}`}
          >
            <img src={src} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
            <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-white opacity-0 transition group-hover:bg-black/25 group-hover:opacity-100">
              <Icon name="zoom_in" className="text-3xl" />
            </span>
          </button>
        ))}
      </div>
      {open !== null && <Lightbox images={images} index={open} onClose={close} onMove={move} />}
    </>
  )
}
