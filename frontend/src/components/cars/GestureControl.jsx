import { useEffect, useRef, useState } from 'react'
import Icon from '../Icon'
import { createSwipeDetector } from './swipe'

const WASM = '/mediapipe/wasm'
const MODEL = '/mediapipe/hand_landmarker.task'
// The palm centre (wrist and finger roots) moves with the whole hand and ignores wiggling fingers.
const PALM = [0, 5, 9, 13, 17]
const palm = (hand) => ({
  x: 1 - PALM.reduce((sum, i) => sum + hand[i].x, 0) / PALM.length, // mirrored, like a selfie
  y: PALM.reduce((sum, i) => sum + hand[i].y, 0) / PALM.length,
})
const HAND_LINKS = [[0, 5], [5, 8], [0, 9], [9, 12], [0, 13], [13, 16], [0, 17], [17, 20], [0, 1], [1, 4], [5, 9], [9, 13], [13, 17]]

// Hand tracking runs in a worker (see handWorker.js); if workers can't run it, on the main thread.
// Returns detect(bitmap, time) -> Promise<landmarks | null>.
async function createTracker() {
  try {
    const worker = new Worker(new URL('./handWorker.js', import.meta.url), { type: 'module' })
    await new Promise((resolve, reject) => {
      worker.onmessage = ({ data }) => (data.ready ? resolve() : reject(new Error(data.error)))
      worker.onerror = reject
      worker.postMessage({ init: { wasm: new URL(WASM, location.href).href, model: new URL(MODEL, location.href).href } })
    })
    let answer = null
    worker.onmessage = ({ data }) => answer?.(data.hand)
    return {
      detect: (frame, t) => new Promise((resolve) => {
        answer = resolve
        worker.postMessage({ frame, t }, [frame])
      }),
      close: () => worker.terminate(),
    }
  } catch (error) {
    console.warn('Hand tracking worker unavailable, using the main thread:', error)
  }
  const { FilesetResolver, HandLandmarker } = await import('@mediapipe/tasks-vision')
  const fileset = await FilesetResolver.forVisionTasks(WASM)
  const options = (delegate) => ({ baseOptions: { modelAssetPath: MODEL, delegate }, runningMode: 'VIDEO', numHands: 1 })
  const landmarker = await HandLandmarker.createFromOptions(fileset, options('GPU')).catch(() => HandLandmarker.createFromOptions(fileset, options('CPU')))
  return {
    detect: async (frame, t) => {
      const hand = landmarker.detectForVideo(frame, t).landmarks?.[0] ?? null
      frame.close()
      return hand
    },
    close: () => landmarker.close(),
  }
}

// Opt-in camera control: wave the hand left/right to change the car (or turn it in 3D), up/down for 3D.
// Video is analysed in the browser (MediaPipe Hand Landmarker) and never leaves the device.
// Tracking runs in a worker on the newest camera frame only (frames arriving while it is busy are
// skipped), so the page and the 3D view never wait for it and gestures never lag behind the hand.
export default function GestureControl({ onGesture, raised = false }) {
  const [state, setState] = useState('off') // off | loading | on | error
  const [flash, setFlash] = useState(null)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const onGestureRef = useRef(onGesture)
  onGestureRef.current = onGesture
  const active = state === 'loading' || state === 'on'

  useEffect(() => {
    if (!active) return
    let stream
    let tracker
    let cancelled = false
    let handle = 0
    let flashTimer = 0
    const detect = createSwipeDetector()

    const draw = (hand) => {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      if (!hand) return
      // mirrored, like a selfie, so moving the hand right moves the dots right
      const pt = (i) => [(1 - hand[i].x) * canvas.width, hand[i].y * canvas.height]
      ctx.strokeStyle = 'rgba(255,208,126,.9)'
      ctx.lineWidth = 2
      ctx.beginPath()
      for (const [a, b] of HAND_LINKS) {
        ctx.moveTo(...pt(a))
        ctx.lineTo(...pt(b))
      }
      ctx.stroke()
      ctx.fillStyle = '#fff'
      ctx.beginPath()
      const centre = palm(hand)
      ctx.arc(centre.x * canvas.width, centre.y * canvas.height, 5, 0, Math.PI * 2)
      ctx.fill()
    }

    const video = videoRef.current
    const schedule = (fn) =>
      video.requestVideoFrameCallback ? (handle = video.requestVideoFrameCallback(fn)) : (handle = requestAnimationFrame(fn))
    const cancel = () => (video.cancelVideoFrameCallback ? video.cancelVideoFrameCallback(handle) : cancelAnimationFrame(handle))

    let busy = false
    const loop = async () => {
      if (cancelled) return
      schedule(loop)
      if (busy || video.readyState < 2) return
      busy = true
      const now = performance.now()
      try {
        const hand = await tracker.detect(await createImageBitmap(video), now)
        if (cancelled) return
        draw(hand)
        const centre = hand && palm(hand)
        const gesture = detect(centre?.x ?? null, centre?.y ?? null, now)
        if (gesture) {
          onGestureRef.current(gesture)
          setFlash(gesture)
          clearTimeout(flashTimer)
          flashTimer = setTimeout(() => setFlash(null), 600)
        }
      } finally {
        busy = false
      }
    }

    ;(async () => {
      try {
        ;[stream, tracker] = await Promise.all([
          navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 320, height: 240, frameRate: { ideal: 30 } }, audio: false }),
          createTracker(),
        ])
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          tracker.close()
          return
        }
        video.srcObject = stream
        await video.play()
        setState('on')
        schedule(loop)
      } catch (error) {
        console.warn('Gesture control:', error)
        if (!cancelled) setState('error')
      }
    })()

    return () => {
      cancelled = true
      cancel()
      clearTimeout(flashTimer)
      stream?.getTracks().forEach((t) => t.stop())
      tracker?.close()
    }
  }, [active])

  if (!navigator.mediaDevices?.getUserMedia) return null

  return (
    <div className={`bottom-6 left-6 flex flex-col items-start gap-2 sm:bottom-10 sm:left-14 ${raised ? 'fixed z-[95]' : 'absolute z-30'}`}>
      {active && (
        <div className="relative overflow-hidden rounded-xl shadow-2xl ring-1 ring-white/25">
          <video ref={videoRef} className="h-[105px] w-[140px] -scale-x-100 object-cover opacity-70" muted playsInline />
          <canvas ref={canvasRef} width="140" height="105" className="absolute inset-0" />
          {state === 'loading' && (
            <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-[11px] text-white">Бор шуда истодааст…</span>
          )}
          {flash && (
            <span className="absolute inset-0 flex items-center justify-center bg-secondary-bright/30">
              <Icon name={{ next: 'arrow_back', prev: 'arrow_forward', select: 'view_in_ar' }[flash]} className="text-4xl text-white" />
            </span>
          )}
        </div>
      )}
      {state === 'on' && <p className="max-w-[13rem] text-[11px] leading-snug text-white/75">Ба чап ё рост — мошини дигар. Боло ё поён — 3D.</p>}
      {state === 'error' && <p className="max-w-[14rem] text-[11px] leading-snug text-red-300">Камера дастрас нест. Иҷозатро дар браузер санҷед.</p>}
      <button
        type="button"
        onClick={() => setState(active ? 'off' : 'loading')}
        className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold ring-1 backdrop-blur transition ${
          active ? 'bg-secondary-bright text-ink ring-secondary-bright' : 'text-white ring-white/30 hover:bg-white/10'
        }`}
      >
        <Icon name={active ? 'videocam_off' : 'back_hand'} className="text-[18px]" />
        {active ? 'Камераро хомӯш кардан' : 'Бо даст идора кунед'}
      </button>
    </div>
  )
}
