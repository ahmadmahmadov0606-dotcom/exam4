import { Link, Route, Routes } from 'react-router-dom'
import { Divider } from './components/Decor'
import Icon from './components/Icon'
import IntroScreen from './components/IntroScreen'
import Navbar, { Logo } from './components/Navbar'
import ScrollToTop from './components/ScrollToTop'
import { useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import BookableDetail from './pages/BookableDetail'
import Home from './pages/Home'
import Listings from './pages/Listings'
import Login from './pages/Login'
import MyBookings from './pages/MyBookings'
import NotFound from './pages/NotFound'
import ProductDetail from './pages/ProductDetail'
import Profile from './pages/Profile'
import Register from './pages/Register'
import RestaurantDetail from './pages/RestaurantDetail'
import VendorDashboard from './pages/VendorDashboard'
import WeddingDashboard from './pages/WeddingDashboard'
import WeddingPlanner from './pages/WeddingPlanner'
import { TYPES, TYPE_LIST } from './utils/constants'
import Fitting from './pages/Fitting'
import ScrollReveal from './components/ScrollReveal'
import WeddingAssistant from './components/WeddingAssistant'

function Footer() {
  const { user, isVendor } = useAuth()
  const columns = [
    ['Бозоргоҳ', [['/restaurants', 'Тарабхонаҳо'], ['/services', 'Хизматҳо'], ['/cars', 'Кортеж'], ['/products?group=clothes', 'Либосҳо'], ['/products?group=sep', 'Сеп ва кӯрпа'], ['/products?group=jewelry', 'Заргарӣ']]],
    ['Банақшагирӣ', user
      ? [['/wedding', 'Нақшаи тӯй'], ['/my-bookings', 'Бронҳои ман'], ['/profile', 'Профил']]
      : [['/register', 'Бақайдгирӣ'], ['/login', 'Воридшавӣ'], ['/wedding', 'Нақшаи тӯй']]],
    ['Барои бизнес', isVendor ? [['/vendor', 'Панели фурӯшанда'], ['/vendor?section=bookings', 'Дархостҳо']] : [['/register?role=vendor', 'Фурӯшанда шудан']]],
  ]

  return (
    <footer className="relative isolate overflow-hidden bg-primary-dark text-white/70">
      <div className="bg-ornament-gold absolute inset-0 -z-10 opacity-40" />
      <div className="h-1 bg-gradient-to-r from-secondary via-secondary-bright to-secondary" />
      <div className="container-page flex flex-col items-center py-10 text-center">
        <Logo light />
        <Divider light className="mt-4" />
        <p className="mt-3 max-w-md text-sm">Тарабхона, ҳофиз, кортеж, либос ва нақшаи тӯй — ҳама барои тӯйи тоҷикона дар як ҷо.</p>
      </div>
      <div className="container-page grid gap-8 border-t border-white/10 py-10 text-center sm:grid-cols-3">
        {columns.map(([title, links]) => (
          <div key={title}>
            <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-secondary-light">{title}</p>
            <ul className="space-y-2 text-sm">
              {links.map(([to, label]) => (
                <li key={to}>
                  <Link to={to} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="transition-colors hover:text-secondary-bright">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10">
        <p className="container-page flex items-center justify-center gap-2 py-5 text-xs">
          © {new Date().getFullYear()} Тӯёна <Icon name="favorite" fill className="text-[14px] text-secondary-bright" /> Бо муҳаббат барои тӯйҳои тоҷикон
        </p>
      </div>
    </footer>
  )
}

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <ScrollToTop />
      <ScrollReveal />
      <IntroScreen />
      <Navbar />
      <main className="bg-ornament-soft flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          {TYPE_LIST.map((t) => (
            <Route key={t.slug} path={`/${t.slug}`} element={<Listings key={t.slug} type={t} />} />
          ))}
          <Route path="/restaurants/:id" element={<RestaurantDetail />} />
          <Route path="/cars/:id" element={<BookableDetail key="car" type={TYPES.car} />} />
          <Route path="/services/:id" element={<BookableDetail key="service" type={TYPES.service} />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/fitting" element={<Fitting />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/profile" element={<Profile />} />
            <Route path="/my-bookings" element={<MyBookings />} />
            <Route path="/wedding" element={<WeddingPlanner />} />
            <Route path="/wedding/:id" element={<WeddingDashboard />} />
          </Route>
          <Route element={<ProtectedRoute vendor />}>
            <Route path="/vendor" element={<VendorDashboard />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      <WeddingAssistant />
    </div>
  )
}
