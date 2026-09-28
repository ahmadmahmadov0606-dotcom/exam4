import { useEffect, useRef } from 'react'
import useMotionPrefs from '../hooks/useMotionPrefs'
import { formatPrice } from '../utils/format'
import Icon from './Icon'
import ListingImage from './ListingImage'

export const scrollToId = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

// Plays only while the hero is on screen and the tab is visible.
function useVisiblePlayback(videoRef, sectionRef, enabled) {
  useEffect(() => {
    const video = videoRef.current
    const section = sectionRef.current
    if (!enabled || !video || !section) return
    let inView = true
    const sync = () => (inView && !document.hidden ? video.play().catch(() => {}) : video.pause())
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting
      sync()
    })
    observer.observe(section)
    document.addEventListener('visibilitychange', sync)
    return () => {
      observer.disconnect()
      document.removeEventListener('visibilitychange', sync)
    }
  }, [videoRef, sectionRef, enabled])
}

// Full-screen restaurant hero: looping video (or a slow zoom on the photo), name, key facts and two actions.
export default function VenueHero({ item, type, secondary }) {
  const sectionRef = useRef(null)
  const videoRef = useRef(null)
  const { reduced, allowVideo } = useMotionPrefs()
  const showVideo = Boolean(item.video) && allowVideo
  useVisiblePlayback(videoRef, sectionRef, showVideo)

  const facts = [item.city_name, `то ${item.capacity} меҳмон`, `${formatPrice(item.price_per_person)} / нафар`]

  return (
    <section ref={sectionRef} data-no-reveal data-dark className="relative isolate flex h-[100svh] min-h-[32rem] w-full items-center justify-center overflow-hidden bg-ink text-white">
      <div className="absolute inset-0 -z-10 overflow-hidden" style={{ viewTransitionName: `restaurant-${item.id}` }}>
        {showVideo ? (
          <video
            ref={videoRef}
            className="h-full w-full object-cover"
            src={item.video}
            poster={item.image ?? undefined}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
          />
        ) : (
          <ListingImage src={item.image} icon={type.icon} className={reduced ? '' : 'ken-burns'} />
        )}
      </div>
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/60 via-black/15 to-black/75" />

      <div className="container-page flex flex-col items-center text-center">
        <p className="blur-reveal text-[11px] font-bold uppercase tracking-[0.25em] text-secondary-light" style={{ animationDelay: '0s' }}>
          {item.rating ? `★ ${item.rating.toFixed(1)} · ` : ''}Тарабхона
        </p>
        <h1
          className="blur-reveal mt-3 max-w-5xl font-serif text-5xl font-semibold leading-[1.05] tracking-tight drop-shadow-lg sm:text-6xl lg:text-8xl"
          style={{ animationDelay: '0.08s' }}
        >
          {item.name}
        </h1>
        <p className="blur-reveal mt-5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm text-white/85 sm:text-base" style={{ animationDelay: '0.16s' }}>
          {facts.map((fact, i) => (
            <span key={fact} className="flex items-center gap-3">
              {i > 0 && <span className="h-1 w-1 rounded-full bg-secondary-bright" />}
              {fact}
            </span>
          ))}
        </p>
        <div className="blur-reveal mt-8 flex flex-wrap items-center justify-center gap-3" style={{ animationDelay: '0.24s' }}>
          <button type="button" onClick={() => scrollToId('booking')} className="btn-secondary px-7 py-3 text-base">
            <Icon name="event_available" className="text-[20px]" /> Брон кардан
          </button>
          {secondary && (
            <button
              type="button"
              onClick={() => scrollToId(secondary.id)}
              className="btn rounded-full border border-white/40 bg-white/10 px-7 py-3 text-base text-white backdrop-blur hover:bg-white/20"
            >
              <Icon name={secondary.icon} className="text-[20px]" /> {secondary.label}
            </button>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={() => scrollToId('about')}
        className="absolute bottom-6 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-white/75 hover:text-white"
        aria-label="Ба поён"
      >
        <span className="flex h-9 w-6 justify-center rounded-full border-2 border-white/60 pt-1.5">
          <span className="scroll-dot h-2 w-1 rounded-full bg-white" />
        </span>
        Дохил шавед
      </button>
    </section>
  )
}
