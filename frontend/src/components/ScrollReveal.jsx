import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

// What animates on scroll. Hero banners, sticky filters and modals opt out with data-no-reveal
// (or by living outside <main>). Nested matches are skipped so a card inside a card doesn't double-move.
const TARGETS = [
  'main h2',
  'main .eyebrow',
  'main .card',
  'main a.group',
  'main button.group',
  'main section > p',
  'main ul > li',
  'main dl > div',
  'main form',
  'main table',
  'main iframe',
].join(',')

const STYLES = ['reveal-up', 'reveal-left', 'reveal-right', 'reveal-zoom']

function styleFor(el) {
  if (el.matches('h2, .eyebrow')) return 'reveal-left'
  if (el.matches('iframe, table, form')) return 'reveal-zoom'
  const siblings = [...el.parentElement.children]
  return siblings.length > 1 && siblings.indexOf(el) % 2 ? 'reveal-right' : 'reveal-up'
}

// Elements slide in while scrolling down and fade out again once they leave the screen.
export default function ScrollReveal() {
  const { pathname } = useLocation()

  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const main = document.querySelector('main')
    if (!main) return

    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.target.classList.toggle('is-visible', e.isIntersecting)),
      { threshold: 0.1, rootMargin: '0px 0px -4% 0px' },
    )

    const scan = () => {
      for (const el of main.querySelectorAll(TARGETS)) {
        if (el.classList.contains('reveal') || el.closest('[data-no-reveal]') || el.closest('.skeleton')) continue
        if (el.parentElement.closest('.reveal')) continue
        const siblings = [...el.parentElement.children]
        el.style.setProperty('--reveal-delay', `${(siblings.indexOf(el) % 6) * 90}ms`)
        el.classList.add('reveal', styleFor(el))
        observer.observe(el)
      }
    }

    let frame = 0
    const mutations = new MutationObserver(() => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(scan)
    })
    scan()
    mutations.observe(main, { childList: true, subtree: true })
    return () => {
      cancelAnimationFrame(frame)
      mutations.disconnect()
      observer.disconnect()
      main.querySelectorAll('.reveal').forEach((el) => el.classList.remove('reveal', 'is-visible', ...STYLES))
    }
  }, [pathname])

  return null
}
