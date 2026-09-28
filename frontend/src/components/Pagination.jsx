const PAGE_SIZE = 20

export default function Pagination({ count, page, onChange }) {
  const pages = Math.ceil(count / PAGE_SIZE)
  if (pages <= 1) return null

  const start = Math.max(1, Math.min(page - 2, pages - 4))
  const numbers = Array.from({ length: Math.min(5, pages) }, (_, i) => start + i)
  const cls = (active) =>
    `h-10 min-w-10 rounded-full px-3 text-sm font-medium transition ${
      active ? 'bg-primary text-white' : 'border border-line bg-white hover:border-primary hover:text-primary'
    }`

  return (
    <nav className="mt-10 flex flex-wrap items-center justify-center gap-2">
      <button className={cls(false)} disabled={page === 1} onClick={() => onChange(page - 1)}>
        ‹
      </button>
      {numbers.map((n) => (
        <button key={n} className={cls(n === page)} onClick={() => onChange(n)}>
          {n}
        </button>
      ))}
      <button className={cls(false)} disabled={page === pages} onClick={() => onChange(page + 1)}>
        ›
      </button>
    </nav>
  )
}
