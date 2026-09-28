import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { notificationsApi } from '../api/notifications'
import { showApiError } from '../utils/errors'
import { formatDate } from '../utils/format'
import Icon from './Icon'

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const queryClient = useQueryClient()

  const { data: unread } = useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: () => notificationsApi.list({ is_read: false }),
    refetchInterval: 30_000,
  })
  const { data: list, isLoading } = useQuery({
    queryKey: ['notifications', 'all'],
    queryFn: () => notificationsApi.list(),
    enabled: open,
  })

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['notifications'] })
  const markRead = useMutation({
    mutationFn: (id) => notificationsApi.update(id, { is_read: true }),
    onSuccess: refresh,
    onError: (e) => showApiError(e),
  })
  const readAll = useMutation({ mutationFn: notificationsApi.readAll, onSuccess: refresh, onError: (e) => showApiError(e) })

  useEffect(() => {
    const onClick = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false)
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const count = unread?.count ?? 0

  return (
    <div className="relative" ref={ref}>
      <button className="btn-ghost relative h-9 w-9 p-0" onClick={() => setOpen(!open)} aria-label="Огоҳиномаҳо">
        <Icon name="notifications" className="text-[22px]" />
        {count > 0 && (
          <span className="absolute -top-0.5 right-0.5 min-w-5 rounded-full bg-secondary px-1 ring-2 ring-ivory text-center text-[11px] font-semibold leading-5 text-white">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-40 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-line bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <span className="font-semibold">Огоҳиномаҳо</span>
            <button
              className="text-xs font-medium text-primary hover:underline disabled:opacity-50"
              disabled={!count || readAll.isPending}
              onClick={() => readAll.mutate()}
            >
              Ҳамаро хондашуда кардан
            </button>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {isLoading && <p className="p-4 text-sm text-muted">Бор шуда истодааст…</p>}
            {list?.results.length === 0 && <p className="p-6 text-center text-sm text-muted">Огоҳинома нест</p>}
            {list?.results.map((n) => (
              <button
                key={n.id}
                onClick={() => !n.is_read && markRead.mutate(n.id)}
                className={`flex w-full gap-3 border-b border-line/60 px-4 py-3 text-left text-sm last:border-0 hover:bg-ivory ${n.is_read ? 'text-muted' : ''}`}
              >
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.is_read ? 'bg-transparent' : 'bg-primary'}`} />
                <span>
                  <span className="block">{n.text}</span>
                  <span className="mt-0.5 block text-xs text-muted">{formatDate(n.created_at, true)}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
