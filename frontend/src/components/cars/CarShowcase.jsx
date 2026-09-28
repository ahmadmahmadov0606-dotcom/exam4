import { useQuery } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { carsApi } from '../../api/cars'
import { formatPrice } from '../../utils/format'
import Icon from '../Icon'
import Car3DViewer, { preload3D } from './Car3DViewer'
import GestureControl from './GestureControl'
import { plateText } from './plate'

// Glow behind the car, picked from its colour.
const GLOW = { сиёҳ: '#6b5ba8', сафед: '#b9c8dc', сурх: '#b3263a', кабуд: '#3559b8', нуқрагин: '#8f99ab' }
const glowOf = (car) => GLOW[car?.color] ?? '#ffd07e'

// The photo melts into the dark background instead of sitting in a hard rectangle.
const MASK = 'radial-gradient(ellipse 50% 48% at 50% 52%, #000 45%, rgba(0,0,0,.6) 70%, transparent 100%)'
const MELT = { maskImage: MASK, WebkitMaskImage: MASK }

function Corners() {
  const c = 'absolute h-3 w-3 border-white/40'
  return (
    <div className="pointer-events-none absolute inset-x-6 bottom-6 top-24 sm:inset-x-14" aria-hidden="true">
      <span className={`${c} left-0 top-0 border-l border-t`} />
      <span className={`${c} right-0 top-0 border-r border-t`} />
      <span className={`${c} bottom-0 left-0 border-b border-l`} />
      <span className={`${c} bottom-0 right-0 border-b border-r`} />
    </div>
  )
}

function ArrowButton({ dir, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={dir < 0 ? 'Пешина' : 'Оянда'}
      className="flex h-12 w-12 items-center justify-center rounded-full text-white/80 ring-1 ring-white/25 backdrop-blur transition hover:bg-white/10 hover:text-white"
    >
      <Icon name={dir < 0 ? 'chevron_left' : 'chevron_right'} className="text-3xl" />
    </button>
  )
}

// Part 1: cars on an arc; the centre one is the star. Arrows, clicks, swipes and arrow keys move it.
function Carousel({ cars, index, setIndex }) {
  const [show3D, setShow3D] = useState(false)
  const n = cars.length
  const car = cars[index]
  const touch = useRef(null)
  const [auto, setAuto] = useState(true)
  const viewer = useRef(null)
  const go = (step) => {
    setAuto(false)
    setIndex((i) => (i + step + n) % n)
  }

  // Hand gestures: the car follows the hand sideways (in 3D the view turns); up or down opens/closes 3D.
  const onGesture = (gesture) => {
    if (gesture === 'select') {
      setAuto(false)
      setShow3D((open) => !open)
    } else if (show3D) viewer.current?.turn(gesture === 'next' ? 1 : -1)
    else go(gesture === 'next' ? 1 : -1)
  }

  // Get this car's 3D model and its neighbours' ready in the background.
  useEffect(() => {
    preload3D([cars[index], cars[(index + 1) % n], cars[(index - 1 + n) % n]])
  }, [cars, index, n])

  useEffect(() => {
    if (!auto || show3D || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const timer = setInterval(() => setIndex((i) => (i + 1) % n), 5000)
    return () => clearInterval(timer)
  }, [auto, show3D, n, setIndex])

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.closest('input, select, textarea')) return
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
      e.preventDefault()
      onGesture(e.key === 'ArrowLeft' ? 'prev' : 'next')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <section
      data-no-reveal
      data-dark
      className="relative flex h-[100svh] min-h-[40rem] flex-col items-center justify-center overflow-hidden bg-[#0b0b0e] text-white"
      onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        const dx = e.changedTouches[0].clientX - (touch.current ?? 0)
        if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1)
      }}
    >
      <div
        className="absolute inset-0 transition-[background] duration-1000"
        style={{ background: `radial-gradient(ellipse 60% 55% at 50% 58%, ${glowOf(car)}55, transparent 70%), radial-gradient(ellipse at 50% 120%, ${glowOf(car)}40, transparent 60%)` }}
      />
      <Corners />

      <div className="relative h-[46vh] w-full max-w-[1400px]">
        {cars.map((c, i) => {
          let d = i - index
          if (d > n / 2) d -= n
          if (d < -n / 2) d += n
          const a = Math.abs(d)
          const hidden = a > 3
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => (d === 0 ? null : go(d))}
              tabIndex={d === 0 ? -1 : 0}
              aria-label={c.name}
              className="absolute left-1/2 top-1/2 w-[70vw] max-w-[560px] sm:w-[38vw]"
              style={{
                transform: `translate(-50%, -50%) translateX(${d * 26}vw) translateY(${a * 4}vh) rotate(${d * 8}deg) scale(${1 - a * 0.25})`,
                opacity: hidden ? 0 : 1 - a * 0.28,
                zIndex: 10 - a,
                filter: `brightness(${1 - a * 0.3})`,
                transition: 'transform 1s cubic-bezier(0.22,1,0.36,1), opacity 1s ease, filter 1s ease',
                pointerEvents: hidden ? 'none' : 'auto',
              }}
            >
              <img src={c.image} alt="" className="aspect-[4/3] w-full object-cover" style={MELT} draggable="false" />
            </button>
          )
        })}
        <div className="pointer-events-none absolute inset-x-0 top-1/2 z-20 flex -translate-y-1/2 justify-between px-4 sm:px-[18%]">
          <span className="pointer-events-auto">
            <ArrowButton dir={-1} onClick={() => go(-1)} />
          </span>
          <span className="pointer-events-auto">
            <ArrowButton dir={1} onClick={() => go(1)} />
          </span>
        </div>
      </div>

      <div className="relative z-20 mt-2 text-center">
        <h1 key={car.id} className="car-title font-sans text-4xl font-extrabold uppercase italic leading-[0.95] tracking-tight sm:text-6xl" data-no-translate>
          {car.brand}
          <br />
          <span className="text-white/70">{car.model}</span>
        </h1>
        <p key={`n${car.id}`} className="car-sub mt-3 inline-block rounded bg-white px-2 py-0.5 font-mono text-sm font-bold text-gray-900" data-no-translate>
          {plateText(car)}
        </p>
        <p key={`p${car.id}`} className="car-sub mt-2 text-sm text-white/70">
          {car.year} · {car.city_name} · {formatPrice(car.price_per_hour)} / соат
        </p>
      </div>

      <div className="relative z-20 mt-6 w-[min(30rem,80vw)]">
        <div className="h-0.5 w-full rounded-full bg-gradient-to-r from-[#8a7cff] via-[#ffd07e] to-[#ff7ab8] opacity-70" />
        <span
          className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_14px_rgba(255,255,255,.8)] transition-[left] duration-700"
          style={{ left: `${n > 1 ? (index / (n - 1)) * 100 : 50}%` }}
        />
      </div>

      <div className="relative z-20 mt-6 flex gap-3">
        <button type="button" onClick={() => setShow3D(true)} className="flex items-center gap-1.5 rounded-full px-6 py-2.5 text-sm font-semibold text-white ring-1 ring-white/30 backdrop-blur transition hover:bg-white/10">
          <span className="material-symbols-outlined text-[18px]">view_in_ar</span> 3D
        </button>
        <Link to={`/cars/${car.id}`} className="rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-gray-900 transition hover:bg-white/90">
          Бандкунӣ
        </Link>
        <Link to={`/cars/${car.id}`} className="rounded-full px-6 py-2.5 text-sm font-semibold text-white ring-1 ring-white/30 backdrop-blur transition hover:bg-white/10">
          Муфассал
        </Link>
      </div>

      <p className="absolute bottom-8 z-20 text-[11px] uppercase tracking-[0.3em] text-white/50">Скрол кунед</p>
      <GestureControl onGesture={onGesture} raised={show3D} />
      {show3D && <Car3DViewer ref={viewer} car={car} onClose={() => setShow3D(false)} />}
    </section>
  )
}

export default function CarShowcase() {
  const [index, setIndex] = useState(0)
  const { data } = useQuery({ queryKey: ['cars', 'showcase'], queryFn: () => carsApi.list({ ordering: '-rating' }) })
  // Cars you can see in 3D come first.
  const cars = (data?.results ?? []).filter((c) => c.image).sort((a, b) => Boolean(b.model_3d) - Boolean(a.model_3d)).slice(0, 9)

  if (!cars.length) return <section className="h-[100svh] bg-[#0b0b0e]" />
  return (
    <>
      <Carousel cars={cars} index={Math.min(index, cars.length - 1)} setIndex={setIndex} />
    </>
  )
}
