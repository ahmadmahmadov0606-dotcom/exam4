import { useMutation, useQuery } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { productsApi } from '../api/products'
import { tryonApi } from '../api/tryon'
import { Divider, Petals } from '../components/Decor'
import Icon from '../components/Icon'
import ListingImage from '../components/ListingImage'
import { CardSkeletons } from '../components/Loader'
import PageBanner from '../components/PageBanner'
import { useAuth } from '../context/AuthContext'
import useAudience from '../hooks/useAudience'
import { PRODUCT_CATEGORIES, visibleFor } from '../utils/constants'
import { showApiError } from '../utils/errors'
import { formatPrice } from '../utils/format'

// Categories the AI can dress a person in (must match WEARABLE in myapp/tryon_views.py).
const WEARABLE = ['groom_suit', 'trousers', 'groom_national', 'bride_dress', 'bride_national']
const TIPS = ['Қади пурра ё то зону', 'Рӯ ба рӯ, дастҳо дар паҳлу', 'Равшанӣ хуб, замина содда', 'Либоси танг беҳтар аст']

function usePreview(file) {
  const [url, setUrl] = useState(null)
  useEffect(() => {
    if (!file) {
      setUrl(null)
      return
    }
    const next = URL.createObjectURL(file)
    setUrl(next)
    return () => URL.revokeObjectURL(next)
  }, [file])
  return url
}

function PhotoDrop({ onFile, onProductDrop }) {
  const input = useRef(null)
  const [over, setOver] = useState(false)
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        setOver(true)
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setOver(false)
        const file = e.dataTransfer.files?.[0]
        if (file?.type.startsWith('image/')) onFile(file)
        else onProductDrop(e)
      }}
      onClick={() => input.current.click()}
      className={`flex aspect-[3/4] cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed p-8 text-center transition ${
        over ? 'border-secondary-bright bg-secondary-light/30' : 'border-secondary/40 bg-white hover:border-secondary hover:bg-mist'
      }`}
    >
      <span className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary-bright text-primary shadow-lg ring-8 ring-secondary-bright/20">
        <Icon name="add_a_photo" className="text-[40px]" />
      </span>
      <p className="mt-5 font-serif text-2xl font-medium">Сурати худро бор кунед</p>
      <p className="mt-1 text-sm text-muted">Ин ҷо партоед ё пахш кунед (дар телефон — камера)</p>
      <ul className="mt-6 grid grid-cols-2 gap-2 text-left text-xs text-muted">
        {TIPS.map((t) => (
          <li key={t} className="flex items-center gap-1.5">
            <Icon name="check_circle" className="text-[16px] text-secondary" /> {t}
          </li>
        ))}
      </ul>
      <input ref={input} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files[0] && onFile(e.target.files[0])} />
    </div>
  )
}

function Stage({ photoUrl, result, loading, onProductDrop, onReset, onRetry }) {
  const [showBefore, setShowBefore] = useState(false)
  const [over, setOver] = useState(false)
  const shown = result && !showBefore ? result.image : photoUrl

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setOver(true)
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setOver(false)
          onProductDrop(e)
        }}
        className={`relative isolate overflow-hidden rounded-3xl bg-primary-dark shadow-xl ring-1 ring-black/10 transition ${over ? 'ring-4 ring-secondary-bright' : ''}`}
      >
        <div className="bg-ornament-gold absolute inset-0 -z-10 opacity-40" />
        <img key={shown} src={shown} alt="" className={`mx-auto max-h-[36rem] w-full object-contain ${result && !showBefore ? 'photo-reveal' : ''}`} />
        <div className="pointer-events-none absolute inset-3 rounded-2xl ring-1 ring-secondary-bright/30" />

        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-primary-dark/60 backdrop-blur-[2px]">
            <span className="scan-line" />
            <Petals count={10} />
            <Icon name="auto_awesome" fill className="animate-pulse text-5xl text-secondary-bright" />
            <p className="mt-3 font-serif text-2xl text-white">Либос пӯшонида мешавад… (то 1 дақиқа)</p>
            <p className="mt-1 text-sm text-white/70">Лутфан саҳифаро напӯшед</p>
          </div>
        )}
        {over && !loading && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-primary-dark/40">
            <span className="rounded-full bg-secondary-bright px-5 py-2 font-semibold text-primary shadow-lg">Ин либосро интихоб кунед</span>
          </div>
        )}
        {result && !loading && (
          <div className="absolute left-4 top-4 flex overflow-hidden rounded-full bg-black/40 p-1 text-xs font-semibold text-white ring-1 ring-white/20 backdrop-blur">
            {[
              [true, 'Пеш'],
              [false, 'Пас'],
            ].map(([before, label]) => (
              <button
                key={label}
                onClick={() => setShowBefore(before)}
                className={`rounded-full px-4 py-1.5 transition ${showBefore === before ? 'bg-secondary-bright text-primary' : 'hover:bg-white/10'}`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <button onClick={onReset} className="btn-outline btn-sm" disabled={loading}>
          <Icon name="photo_camera" className="text-[16px]" /> Сурати дигар
        </button>
        {result && !loading && (
          <>
            <a href={result.image} download="tuyona-tryon.jpg" target="_blank" rel="noreferrer" className="btn-outline btn-sm">
              <Icon name="download" className="text-[16px]" /> Боргирӣ
            </a>
            <button onClick={onRetry} className="btn-outline btn-sm">
              <Icon name="refresh" className="text-[16px]" /> Боз кӯшиш кардан
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function GarmentCard({ item, selected, onSelect }) {
  return (
    <button
      type="button"
      draggable
      onDragStart={(e) => e.dataTransfer.setData('application/x-product', String(item.id))}
      onClick={() => onSelect(item)}
      className={`group relative flex flex-col overflow-hidden rounded-xl bg-white text-left shadow-sm ring-1 transition ${
        selected ? 'ring-2 ring-secondary-bright' : 'ring-line hover:-translate-y-0.5 hover:shadow-md hover:ring-secondary-bright'
      }`}
    >
      {selected && <Icon name="check_circle" fill className="absolute right-2 top-2 z-10 rounded-full bg-white text-[22px] text-secondary" />}
      <div className="aspect-[3/4] overflow-hidden bg-mist">
        <ListingImage src={item.image} icon="styler" className="transition-transform duration-500 group-hover:scale-105" />
      </div>
      <div className="p-3">
        <p className="line-clamp-1 text-sm font-semibold">{item.name}</p>
        <p className="line-clamp-1 text-[11px] text-muted">{PRODUCT_CATEGORIES[item.category]}</p>
        <p className="mt-1 text-sm font-bold text-primary">{formatPrice(item.price)}</p>
      </div>
    </button>
  )
}

export default function Fitting() {
  const { user } = useAuth()
  const location = useLocation()
  const side = useAudience()
  const [photo, setPhoto] = useState(null)
  const [product, setProduct] = useState(null)
  const [category, setCategory] = useState('')
  const [result, setResult] = useState(null)
  const [history, setHistory] = useState([])
  const photoUrl = usePreview(photo)

  const categories = Object.keys(visibleFor(side, Object.fromEntries(WEARABLE.map((c) => [c, true]))))
  const { data: service } = useQuery({ queryKey: ['tryon', 'status'], queryFn: tryonApi.status, staleTime: 60_000 })
  const { data: garments, isLoading } = useQuery({
    queryKey: ['products', 'wearable', category || categories.join(',')],
    queryFn: () => productsApi.listAll({ category__in: category || categories.join(',') }),
  })
  const items = garments?.filter((g) => g.image) ?? []

  const run = useMutation({
    mutationFn: () => {
      const form = new FormData()
      form.append('photo', photo)
      form.append('product', product.id)
      return tryonApi.run(form)
    },
    onSuccess: (data) => {
      const entry = { ...data, product }
      setResult(entry)
      setHistory((h) => [entry, ...h].slice(0, 8))
    },
    onError: (e) => showApiError(e),
  })

  const choosePhoto = (file) => {
    setPhoto(file)
    setResult(null)
  }
  const onProductDrop = (e) => {
    const id = Number(e.dataTransfer.getData('application/x-product'))
    const item = items.find((g) => g.id === id)
    if (item) setProduct(item)
  }

  const enabled = Boolean(service?.active)
  // e.g. a skullcap (tryon_category "none"), or trousers while only the upper-body model is available
  const unsupported = product && !(service?.supports ?? []).includes(product.tryon_category)
  const canRun = user && enabled && photo && product && !unsupported && !run.isPending

  return (
    <>
      <PageBanner
        icon="auto_awesome"
        eyebrow="Ороишгоҳ · AI"
        title="Либосро дар тани худ бинед"
        subtitle="Сурати худро бор кунед, либоси воқеиро аз бозор интихоб кунед — AI онро дар тани шумо мепӯшонад."
        crumbs={[['Ороишгоҳ']]}
      />

      <div className="container-page py-10">
        <ol className="mb-8 grid gap-3 sm:grid-cols-3">
          {[
            ['add_a_photo', 'Сурати худро бор кунед', Boolean(photo)],
            ['checkroom', 'Либосро интихоб кунед', Boolean(product)],
            ['auto_awesome', '«Пӯшондан»-ро пахш кунед', Boolean(result)],
          ].map(([icon, text, done], i) => (
            <li key={text} className={`flex items-center gap-3 rounded-xl p-3 ring-1 transition ${done ? 'bg-secondary-light/40 ring-secondary-bright' : 'bg-white ring-line'}`}>
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${done ? 'bg-secondary-bright text-primary' : 'bg-mist text-primary'}`}>
                <Icon name={done ? 'check' : icon} className="text-[22px]" />
              </span>
              <span className="text-sm font-semibold">
                <span className="text-secondary">{i + 1}.</span> {text}
              </span>
            </li>
          ))}
        </ol>

        {!user && (
          <div className="card mb-8 flex flex-col items-center gap-3 p-6 text-center sm:flex-row sm:text-left">
            <Icon name="lock" className="text-3xl text-secondary" />
            <p className="flex-1 text-sm">Барои пӯшондани либос бо AI ба ҳисоби худ ворид шавед. Либосҳоро ҳоло ҳам дидан мумкин аст.</p>
            <Link to="/login" state={{ from: location }} className="btn-primary">
              Воридшавӣ
            </Link>
          </div>
        )}
        {service && !enabled && (
          <p className="mb-8 flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
            <Icon name="info" className="text-[20px]" />
            Хизмати AI ҳоло кор намекунад. Либосҳоро дидан мумкин аст — пӯшонданро баъдтар кӯшиш кунед.
          </p>
        )}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <section className="min-w-0 lg:sticky lg:top-24 lg:self-start">
            {photoUrl ? (
              <Stage photoUrl={photoUrl} result={result} loading={run.isPending} onProductDrop={onProductDrop} onReset={() => choosePhoto(null)} onRetry={() => run.mutate()} />
            ) : (
              <PhotoDrop onFile={choosePhoto} onProductDrop={onProductDrop} />
            )}

            <button className="btn-primary mt-5 w-full py-4 text-base" disabled={!canRun} onClick={() => run.mutate()}>
              <Icon name="auto_awesome" fill className="text-[22px] text-secondary-bright" />
              {run.isPending ? 'Интизор шавед…' : product ? `«${product.name}»-ро пӯшондан` : 'Пӯшондан'}
            </button>
            {unsupported && (
              <p className="mt-3 flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900 ring-1 ring-amber-200">
                <Icon name="block" className="text-[18px]" /> Ин либосро ҳоло пӯшонда наметавонем
              </p>
            )}
            <p className="mt-3 flex items-start gap-2 text-xs text-muted">
              <Icon name="shield_lock" className="text-[16px] text-secondary" />
              Сурати шумо танҳо барои сохтани натиҷа ба хизмати AI (FASHN ё Hugging Face) фиристода мешавад ва дар сервери мо нигоҳ дошта намешавад.
            </p>

            {result?.product && (
              <Link to={`/products/${result.product.id}`} className="card mt-5 flex items-center gap-3 p-3 transition hover:ring-secondary-bright">
                <div className="h-16 w-12 shrink-0 overflow-hidden rounded-lg">
                  <ListingImage src={result.product.image} icon="styler" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{result.product.name}</p>
                  <p className="text-sm font-bold text-primary">{formatPrice(result.product.price)}</p>
                </div>
                <span className="btn-primary btn-sm">
                  <Icon name="shopping_bag" className="text-[16px]" /> Харидан
                </span>
              </Link>
            )}
          </section>

          <section className="min-w-0">
            <div className="mb-2 flex items-end justify-between gap-3">
              <h2 className="font-serif text-2xl font-medium">Либосҳои бозор</h2>
              <span className="text-sm text-muted">{items.length} либос</span>
            </div>
            <Divider className="mb-4 justify-start [&>span:first-child]:hidden" />

            <div className="-mx-4 mb-4 overflow-x-auto px-4">
              <div className="flex w-max gap-2">
                {[['', 'Ҳама'], ...categories.map((c) => [c, PRODUCT_CATEGORIES[c]])].map(([value, label]) => (
                  <button
                    key={value}
                    onClick={() => setCategory(value)}
                    className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition ${
                      category === value ? 'bg-primary text-white shadow' : 'bg-white text-muted ring-1 ring-line hover:text-primary'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <p className="mb-3 flex items-center gap-2 text-sm text-muted">
              <Icon name="drag_pan" className="text-[18px] text-secondary" />
              Либосро пахш кунед ё ба сурати худ кашида партоед.
            </p>
            {isLoading ? (
              <CardSkeletons count={6} />
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {items.map((item) => (
                  <GarmentCard key={item.id} item={item} selected={product?.id === item.id} onSelect={setProduct} />
                ))}
              </div>
            )}

            {history.length > 0 && (
              <div className="mt-8">
                <h3 className="mb-3 font-serif text-xl font-medium">Кӯшишҳои шумо</h3>
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {history.map((h) => (
                    <button
                      key={h.image}
                      onClick={() => setResult(h)}
                      className={`h-28 w-20 shrink-0 overflow-hidden rounded-lg ring-2 transition ${result?.image === h.image ? 'ring-secondary-bright' : 'ring-transparent opacity-80 hover:opacity-100'}`}
                      title={h.product.name}
                    >
                      <img src={h.image} alt={h.product.name} className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  )
}
