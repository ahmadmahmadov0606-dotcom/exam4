import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import useSelectedCity from '../hooks/useSelectedCity'
import Icon from './Icon'
import NotificationBell from './NotificationBell'
import { AUDIENCES } from '../utils/constants'
import LanguageSwitcher from '../i18n/LanguageSwitcher'

const NAV = [
  { to: '/', label: 'Бозоргоҳ', end: true },
  { to: '/restaurants', label: 'Тарабхонаҳо' },
  { to: '/services', label: 'Хизматҳо' },
  { to: '/cars', label: 'Кортеж' },
  { to: '/products?group=clothes', label: 'Либосҳо' },
  { to: '/fitting', label: 'Ороишгоҳ' },
  { to: '/wedding', label: 'Банақшагирӣ' },
]

const navClass = (clear) => ({ isActive }) =>
  `whitespace-nowrap border-b-2 py-1 text-sm transition-colors ${
    clear
      ? isActive
        ? 'border-secondary-bright font-bold text-white'
        : 'border-transparent font-medium text-white/85 hover:text-white'
      : isActive
        ? 'border-secondary font-bold text-primary'
        : 'border-transparent font-medium text-muted hover:text-primary'
  }`

// Pages that open with a full-screen photo/video hero: the header floats over it until the user scrolls.
const OVERLAY_PAGES = /^\/(restaurants\/\d+|cars)\/?$/

// True while a dark section (marked data-dark) is under the header, so it can stay light-on-dark.
function useDarkUnderHeader(pathname) {
  const [dark, setDark] = useState(true)
  useEffect(() => {
    const onScroll = () =>
      setDark([...document.querySelectorAll('[data-dark]')].some((el) => {
        const r = el.getBoundingClientRect()
        return r.top <= 1 && r.bottom > 80
      }))
    onScroll()
    const late = setTimeout(onScroll, 500)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      clearTimeout(late)
      window.removeEventListener('scroll', onScroll)
    }
  }, [pathname])
  return dark
}

function useScrolled(threshold = 40) {
  const [scrolled, setScrolled] = useState(() => window.scrollY > threshold)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [threshold])
  return scrolled
}

export function Logo({ light = false }) {
  return (
    <Link to="/" className="flex items-center gap-2">
      <span className={`flex h-8 w-8 items-center justify-center rounded ${light ? 'bg-secondary-bright text-primary' : 'bg-primary text-secondary-bright'}`}>
        <Icon name="diamond" fill className="text-[20px]" />
      </span>
      <span className={`font-serif text-xl font-semibold tracking-tight ${light ? 'text-white' : 'text-primary'}`}>Тӯёна</span>
    </Link>
  )
}

function useOutside(onOutside) {
  const ref = useRef(null)
  useEffect(() => {
    const handler = (e) => ref.current && !ref.current.contains(e.target) && onOutside()
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onOutside])
  return ref
}

function CityPicker({ clear }) {
  const { cities, city, select } = useSelectedCity()
  return (
    <label className={`relative hidden cursor-pointer items-center gap-1 rounded py-1 pl-2 pr-1 sm:flex xl:hidden 2xl:flex ${clear ? 'bg-white/15 text-white backdrop-blur [&_select]:text-white [&_option]:text-ink' : 'bg-mist'}`}>
      <Icon name="location_on" className={`text-[18px] ${clear ? 'text-secondary-bright' : 'text-secondary'}`} />
      <select
        value={city?.id ?? ''}
        onChange={(e) => select(e.target.value)}
        className="cursor-pointer appearance-none bg-transparent pr-5 text-xs font-bold text-ink outline-none"
        aria-label="Шаҳр"
      >
        <option value="">Ҳамаи шаҳрҳо</option>
        {cities.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <Icon name="expand_more" className="pointer-events-none absolute right-1 text-[16px] text-muted" />
    </label>
  )
}

export function Avatar({ user, size = 'h-8 w-8' }) {
  if (user.avatar) return <img src={user.avatar} alt="" className={`${size} rounded-full object-cover ring-1 ring-secondary/30`} />
  return (
    <span className={`${size} flex items-center justify-center rounded-full bg-primary font-semibold text-secondary-bright ring-1 ring-secondary/30`}>
      {user.username[0].toUpperCase()}
    </span>
  )
}

function UserMenu({ user, isVendor, logout }) {
  const [open, setOpen] = useState(false)
  const ref = useOutside(() => setOpen(false))
  const items = [
    ['/profile', 'person', 'Профил'],
    ['/my-bookings', 'event_available', 'Бронҳои ман'],
    ['/wedding', 'event_note', 'Нақшаи тӯй'],
    ...(isVendor ? [['/vendor', 'storefront', 'Панели фурӯшанда']] : []),
  ]
  return (
    <div className="relative" ref={ref}>
      <button className="flex items-center gap-2 rounded py-1 pl-1 pr-1 hover:bg-haze" onClick={() => setOpen(!open)}>
        <Avatar user={user} />
        <span className="hidden flex-col text-left leading-tight 2xl:flex">
          <span className="text-xs font-bold">{user.first_name || user.username}</span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">{isVendor ? 'Фурӯшанда' : AUDIENCES[user.side]?.label ?? 'Мизоҷ'}</span>
        </span>
        <Icon name="expand_more" className="hidden text-[16px] text-muted sm:block" />
      </button>
      {open && (
        <div className="absolute right-0 z-40 mt-2 w-56 overflow-hidden rounded-xl bg-white py-1 shadow-xl ring-1 ring-line" onClick={() => setOpen(false)}>
          {items.map(([to, icon, label]) => (
            <Link key={to} to={to} className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-mist">
              <Icon name={icon} className="text-[20px] text-secondary" /> {label}
            </Link>
          ))}
          <button onClick={logout} className="flex w-full items-center gap-3 border-t border-line px-4 py-2.5 text-sm text-red-700 hover:bg-red-50">
            <Icon name="logout" className="text-[20px]" /> Баромад
          </button>
        </div>
      )}
    </div>
  )
}

export default function Navbar() {
  const { user, isVendor, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const { pathname } = useLocation()
  const [lastPath, setLastPath] = useState(pathname)

  if (pathname !== lastPath) {
    setLastPath(pathname)
    setMenuOpen(false)
  }

  const businessLink = isVendor ? '/vendor' : '/register?role=vendor'
  const overlay = OVERLAY_PAGES.test(pathname)
  const scrolled = useScrolled()
  const darkUnder = useDarkUnderHeader(pathname)
  const clear = overlay && darkUnder && !menuOpen
  const ghost = clear ? '[&_.btn-ghost]:text-white [&_.btn-ghost:hover]:bg-white/15' : ''

  return (
    <header
      className={`${overlay ? 'fixed inset-x-0' : 'sticky'} top-0 z-30 transition-colors duration-300 ${
        clear
          ? scrolled
            ? 'bg-black/45 backdrop-blur-xl'
            : 'bg-gradient-to-b from-black/40 to-transparent'
          : 'bg-ivory/90 shadow-[0_1px_12px_rgba(13,56,43,0.06)] backdrop-blur-xl'
      } ${ghost}`}
    >
      <div className="container-page flex h-20 items-center justify-between gap-4 2xl:max-w-[1600px] 2xl:gap-6">
        <div className="flex shrink-0 items-center gap-4">
          <Logo light={clear} />
          <div className={`hidden h-4 w-px sm:block xl:hidden 2xl:block ${clear ? 'bg-white/30' : 'bg-line'}`} />
          <CityPicker clear={clear} />
        </div>

        <nav className="hidden items-center gap-5 xl:flex 2xl:gap-6">
          {NAV.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={navClass(clear)}>
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <LanguageSwitcher clear={clear} className="hidden lg:flex" />
          <button className="btn-ghost hidden h-9 w-9 p-0 sm:inline-flex" onClick={() => navigate('/services')} aria-label="Ҷустуҷӯ">
            <Icon name="search" className="text-[22px]" />
          </button>
          {user && <NotificationBell />}
          <Link
            to={businessLink}
            className={`btn hidden px-4 py-2 hover:bg-secondary-bright hover:text-ink md:inline-flex xl:hidden 2xl:inline-flex ${clear ? 'bg-white/15 text-white backdrop-blur' : 'bg-mist text-secondary'}`}
          >
            Барои бизнес
          </Link>
          {user ? (
            <div className={clear ? '[&>div>button]:text-white [&>div>button_.text-muted]:text-white/75 [&>div>button:hover]:bg-white/15' : ''}>
              <UserMenu user={user} isVendor={isVendor} logout={logout} />
            </div>
          ) : (
            <Link to="/login" className="btn-primary hidden px-4 py-2 sm:inline-flex">
              Воридшавӣ
            </Link>
          )}
          <button className="btn-ghost h-9 w-9 p-0 2xl:hidden" onClick={() => setMenuOpen(!menuOpen)} aria-label="Меню">
            <Icon name={menuOpen ? 'close' : 'menu'} />
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="border-t border-line bg-ivory 2xl:hidden">
          <div className="container-page flex flex-col gap-1 py-3">
            <div className="mb-2 flex items-center gap-2">
              <div className="flex-1 sm:hidden xl:block">
                <MobileCity />
              </div>
              <LanguageSwitcher className="flex lg:hidden" />
            </div>
            {NAV.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) => `rounded px-3 py-2.5 text-sm font-semibold ${isActive ? 'bg-mist text-primary' : 'text-muted'}`}
              >
                {l.label}
              </NavLink>
            ))}
            <Link to={businessLink} className="rounded px-3 py-2.5 text-sm font-semibold text-secondary">
              Барои бизнес
            </Link>
            {!user && (
              <div className="mt-2 flex gap-2 border-t border-line pt-3">
                <Link to="/login" className="btn-outline flex-1">
                  Воридшавӣ
                </Link>
                <Link to="/register" className="btn-primary flex-1">
                  Бақайдгирӣ
                </Link>
              </div>
            )}
          </div>
        </nav>
      )}
    </header>
  )
}

function MobileCity() {
  const { cities, city, select } = useSelectedCity()
  return (
    <select className="input" value={city?.id ?? ''} onChange={(e) => select(e.target.value)} aria-label="Шаҳр">
      <option value="">Ҳамаи шаҳрҳо</option>
      {cities.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </select>
  )
}
