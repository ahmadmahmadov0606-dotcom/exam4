import { useEffect, useState } from 'react'

export default function Countdown({ date }) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  const diff = new Date(`${date}T00:00`).getTime() - now
  if (diff <= 0) return <p className="font-serif text-3xl text-secondary-bright">Муборак бошад!</p>

  const parts = [
    [Math.floor(diff / 86_400_000), 'рӯз'],
    [Math.floor(diff / 3_600_000) % 24, 'соат'],
    [Math.floor(diff / 60_000) % 60, 'дақиқа'],
    [Math.floor(diff / 1000) % 60, 'сония'],
  ]
  return (
    <div className="flex gap-3">
      {parts.map(([value, label]) => (
        <div key={label} className="min-w-16 rounded-2xl bg-white/10 px-3 py-2 text-center ring-1 ring-white/15">
          <span className="block font-serif text-3xl font-semibold tabular-nums sm:text-4xl">{value}</span>
          <span className="text-xs text-white/70">{label}</span>
        </div>
      ))}
    </div>
  )
}
