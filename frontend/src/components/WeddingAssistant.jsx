import { useQuery } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { assistantApi } from '../api/assistant'
import Icon from './Icon'

const SUGGESTIONS = [
  'Барои тӯйи 200 нафар чӣ қадар пул лозим?',
  'Нақшаи тӯйро аз 3 моҳ пеш тартиб деҳ',
  'Кадом тарабхона дар Душанбе беҳтар аст?',
  'Барои домод чӣ либос лозим?',
]
const STORAGE = 'assistant-chat'

const load = () => {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE)) ?? []
  } catch {
    return []
  }
}

// «Тӯёна AI»: a chat that helps plan the wedding and suggests listings from the site.
export default function WeddingAssistant() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState(load)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const list = useRef(null)
  const { data: status } = useQuery({ queryKey: ['assistant'], queryFn: assistantApi.status, staleTime: 5 * 60_000 })

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE, JSON.stringify(messages.slice(-30)))
    } catch {
      /* private mode: the chat just isn't kept */
    }
    list.current?.scrollTo({ top: list.current.scrollHeight, behavior: 'smooth' })
  }, [messages, busy, open])

  if (!status?.enabled) return null

  const send = async (question) => {
    const content = question.trim()
    if (!content || busy) return
    const next = [...messages, { role: 'user', content }]
    setMessages(next)
    setText('')
    setError('')
    setBusy(true)
    try {
      const reply = await assistantApi.ask(next)
      setMessages([...next, { role: 'assistant', content: reply }])
    } catch (e) {
      setError(e.response?.status === 429 ? 'Саволҳо зиёд шуданд. Каме баъдтар нависед.' : e.response?.data?.detail ?? 'Пайваст нашуд. Боз кӯшиш кунед.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Ёрдамчии тӯй"
        className="fixed bottom-5 right-5 z-[80] flex h-14 items-center gap-2 rounded-full bg-primary px-5 text-white shadow-2xl ring-2 ring-secondary-bright/60 transition hover:scale-105 hover:bg-primary-dark"
      >
        <Icon name={open ? 'close' : 'auto_awesome'} className="text-[22px] text-secondary-bright" />
        {!open && <span className="hidden text-sm font-semibold sm:inline">Ёрдамчии тӯй</span>}
      </button>

      {open && (
        <div className="fixed bottom-24 right-3 z-[80] flex h-[min(34rem,calc(100svh-8rem))] w-[min(24rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/10">
          <div className="flex items-center gap-3 bg-primary px-4 py-3 text-white">
            <Icon name="auto_awesome" className="text-secondary-bright" />
            <div className="flex-1">
              <p className="font-semibold leading-tight">Тӯёна AI</p>
              <p className="text-[11px] text-white/70">Ёрдамчӣ дар ташкили тӯй</p>
            </div>
            {messages.length > 0 && (
              <button type="button" onClick={() => setMessages([])} className="rounded-full p-1.5 text-white/70 hover:bg-white/10 hover:text-white" aria-label="Сӯҳбати нав">
                <Icon name="refresh" className="text-[20px]" />
              </button>
            )}
          </div>

          <div ref={list} className="flex-1 space-y-3 overflow-y-auto p-4 text-sm">
            {messages.length === 0 && (
              <div>
                <p className="text-muted">Салом! Ман дар банақшагирии тӯй кӯмак мекунам: буҷа, нақша, анъанаҳо, тарабхона, мошин, либос. Бипурсед:</p>
                <div className="mt-3 flex flex-col gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button key={s} type="button" onClick={() => send(s)} className="rounded-xl border border-secondary/40 px-3 py-2 text-left text-primary transition hover:bg-secondary/10">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <p
                  data-no-translate
                  className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 leading-relaxed ${
                    m.role === 'user' ? 'rounded-br-md bg-primary text-white' : 'rounded-bl-md bg-secondary/10 text-ink'
                  }`}
                >
                  {m.content}
                </p>
              </div>
            ))}
            {busy && (
              <div className="flex gap-1 px-2" aria-label="Навишта истодааст">
                {[0, 1, 2].map((d) => (
                  <span key={d} className="h-2 w-2 animate-bounce rounded-full bg-secondary" style={{ animationDelay: `${d * 0.15}s` }} />
                ))}
              </div>
            )}
            {error && <p className="text-center text-xs text-red-600">{error}</p>}
          </div>

          <form
            className="flex items-end gap-2 border-t border-black/10 p-3"
            onSubmit={(e) => {
              e.preventDefault()
              send(text)
            }}
          >
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  send(text)
                }
              }}
              rows={1}
              maxLength={2000}
              placeholder="Саволатонро нависед…"
              className="max-h-28 flex-1 resize-none rounded-xl border border-black/15 px-3 py-2 text-sm outline-none focus:border-primary"
            />
            <button type="submit" disabled={busy || !text.trim()} aria-label="Фиристодан" className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white transition disabled:opacity-40">
              <Icon name="send" className="text-[20px]" />
            </button>
          </form>
        </div>
      )}
    </>
  )
}
