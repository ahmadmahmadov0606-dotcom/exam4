import { useEffect, useState } from 'react'
import { Divider, Petals } from './Decor'
import Icon from './Icon'

const KEY = 'intro-seen'

function shouldShow() {
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return false
  try {
    return !sessionStorage.getItem(KEY)
  } catch {
    return true
  }
}

// Once per visit: the logo blooms on a dark emerald curtain, which then lifts to reveal the site.
export default function IntroScreen() {
  const [stage, setStage] = useState(() => (shouldShow() ? 'show' : 'done'))

  useEffect(() => {
    if (stage === 'done') return
    try {
      sessionStorage.setItem(KEY, '1')
    } catch {
      // Shown again next time in private mode; harmless.
    }
    document.body.style.overflow = 'hidden'
    const lift = setTimeout(() => setStage('leaving'), 1700)
    const end = setTimeout(() => setStage('done'), 2700)
    return () => {
      clearTimeout(lift)
      clearTimeout(end)
      document.body.style.overflow = ''
    }
  }, [stage === 'done'])

  if (stage === 'done') return null
  return (
    <div
      className={`intro-curtain fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-primary-dark text-white ${stage === 'leaving' ? 'is-leaving' : ''}`}
      onClick={() => setStage('leaving')}
      aria-hidden="true"
    >
      <div className="bg-ornament-gold absolute inset-0 opacity-40" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,222,168,.25),transparent_60%)]" />
      <Petals count={14} />
      <span className="intro-logo relative flex h-20 w-20 items-center justify-center rounded-2xl bg-secondary-bright text-primary shadow-2xl ring-8 ring-secondary-bright/15">
        <Icon name="diamond" fill className="text-[44px]" />
      </span>
      <p className="intro-text relative mt-6 font-serif text-5xl font-semibold sm:text-6xl">Тӯёна</p>
      <div className="intro-line relative mt-4 origin-center">
        <Divider light />
      </div>
      <p className="intro-tagline relative mt-3 text-sm uppercase tracking-[0.3em] text-secondary-light">Ҳама барои тӯй</p>
      <span className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-secondary via-secondary-bright to-secondary" />
    </div>
  )
}
