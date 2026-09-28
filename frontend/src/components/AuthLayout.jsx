import { Divider, Petals } from './Decor'
import Icon from './Icon'

export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="container-page grid min-h-[calc(100vh-5rem)] items-center gap-10 py-10 lg:grid-cols-2">
      <div className="relative isolate hidden h-full min-h-[34rem] overflow-hidden rounded-3xl bg-primary-dark lg:block">
        <div className="absolute inset-0 -z-10 bg-cover bg-center" style={{ backgroundImage: 'url(/hero-hall.jpg)' }} />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-primary-dark via-primary-dark/60 to-black/30" />
        <div className="bg-ornament-gold absolute inset-0 -z-10 opacity-40" />
        <Petals count={12} />
        <div className="absolute inset-5 rounded-2xl ring-1 ring-secondary-bright/30" />
        <div className="relative flex h-full flex-col items-center justify-end p-12 text-center text-white">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary-bright text-primary shadow-lg ring-4 ring-secondary-bright/20">
            <Icon name="favorite" fill className="text-[28px]" />
          </span>
          <p className="mt-5 font-serif text-4xl font-semibold leading-tight drop-shadow-lg">Тӯйи орзуҳоятонро бо мо ташкил кунед</p>
          <Divider light className="mt-4" />
          <p className="mt-3 max-w-sm text-white/80">Тарабхона, кортеж, ҳофиз, либос ва нақшаи тӯй — ҳама дар як ҷо.</p>
        </div>
      </div>

      <div className="relative mx-auto w-full max-w-md">
        <div className="card relative overflow-hidden p-8">
          <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-secondary via-secondary-bright to-secondary" />
          <div className="text-center">
            <h1 className="title">{title}</h1>
            <Divider className="mt-3" />
            {subtitle && <p className="mt-3 text-muted">{subtitle}</p>}
          </div>
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  )
}
