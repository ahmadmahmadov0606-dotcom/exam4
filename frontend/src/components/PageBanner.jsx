import { Link } from 'react-router-dom'
import { Divider, Petals } from './Decor'
import Icon from './Icon'

// Festive page header: photo, girih pattern, falling petals and a gold floral divider.
export default function PageBanner({ icon, eyebrow, title, subtitle, image, crumbs = [] }) {
  return (
    <section data-no-reveal className="relative isolate overflow-hidden bg-primary-dark text-white">
      {image && <div className="absolute inset-0 -z-10 scale-105 bg-cover bg-center" style={{ backgroundImage: `url(${image})` }} />}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/70 via-primary-dark/70 to-primary-dark/95" />
      <div className="bg-ornament-gold absolute inset-0 -z-10 opacity-60" />
      <Petals count={12} />

      <div className="container-page relative flex flex-col items-center py-14 text-center sm:py-16">
        {crumbs.length > 0 && (
          <nav className="mb-4 flex items-center gap-1 text-xs text-white/60">
            <Link to="/" className="hover:text-white">
              Бозоргоҳ
            </Link>
            {crumbs.map(([label, to]) => (
              <span key={label} className="flex items-center gap-1">
                <Icon name="chevron_right" className="text-[14px]" />
                {to ? (
                  <Link to={to} className="hover:text-white">
                    {label}
                  </Link>
                ) : (
                  <span className="text-white/90">{label}</span>
                )}
              </span>
            ))}
          </nav>
        )}
        <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-secondary-bright text-primary shadow-lg ring-4 ring-secondary-bright/20">
          <Icon name={icon} className="text-[26px]" />
        </span>
        {eyebrow && <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-secondary-light">{eyebrow}</p>}
        <h1 className="mt-2 font-serif text-4xl font-semibold tracking-tight drop-shadow-lg sm:text-5xl">{title}</h1>
        <Divider light className="mt-4" />
        {subtitle && <p className="mt-3 max-w-xl text-sm text-white/80">{subtitle}</p>}
      </div>
    </section>
  )
}
