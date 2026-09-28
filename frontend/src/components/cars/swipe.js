// Turns a stream of hand positions into gestures. x and y are 0..1 across the screen (x already mirrored,
// so it matches what the user sees). Returns 'next' (hand moved left), 'prev' (moved right),
// 'select' (moved up or down) or null.
//
// One stroke is one gesture: it fires as soon as the hand has moved far enough (no waiting for the
// stroke to end), and the rest of that stroke is ignored until the hand stops or turns around.
// After a swipe the hand naturally travels back. That return stroke must not count as a swipe the
// other way (nor close 3D right after opening it), so the detector remembers the last direction and
// ignores opposite strokes until the hand rests for a while (or leaves the frame). Swiping again in
// the same direction keeps working. Strokes are measured from the furthest point in the recent window,
// so a stroke that starts right after the hand turned around still counts in full.
const OPPOSITE = { left: 'right', right: 'left', up: 'down', down: 'up' }
const GESTURE = { left: 'next', right: 'prev', up: 'select', down: 'select' }

export function createSwipeDetector({
  distance = 0.15, // share of the screen width the hand must travel sideways
  distanceY = 0.22, // …or of the height for up/down
  windowMs = 700, // …within this time
  cooldownMs = 350, // minimum gap between two gestures
  settleMs = 120, // hand still this long (or turning around) -> the stroke is over
  restMs = 800, // hand still this long -> any direction allowed again
  stillRange = 0.03, // "still" = moves less than this
  lostMs = 500, // hand out of frame this long -> any direction allowed again
} = {}) {
  let history = [] // [time, x, y]
  let strokeStart = 0 // points before this time belong to strokes already used
  let lastFire = -Infinity
  let lastDir = null // left | right | up | down
  let inStroke = false // the stroke that fired a gesture is still going
  let lastSeen = -Infinity

  const since = (t, ms) => history.filter(([time]) => t - time <= ms)
  const spread = (list, i) => Math.max(...list.map((p) => p[i])) - Math.min(...list.map((p) => p[i]))
  const stillFor = (t, ms) => {
    if (history.length < 2 || t - history[0][0] < ms) return false
    const recent = since(t, ms)
    return spread(recent, 1) < stillRange && spread(recent, 2) < stillRange
  }

  return function track(x, y, t) {
    history = since(t, Math.max(windowMs, restMs) + 200)
    if (x == null) {
      if (t - lastSeen > lostMs) {
        lastDir = null
        inStroke = false
        history = []
      }
      return null
    }
    lastSeen = t
    history.push([t, x, y])
    const stroke = history.filter(([time]) => time >= strokeStart && t - time <= windowMs)
    const xs = stroke.map((p) => p[1])
    const ys = stroke.map((p) => p[2])
    const moved = {
      left: Math.max(...xs) - x, // from the rightmost point
      right: x - Math.min(...xs),
      up: Math.max(...ys) - y,
      down: y - Math.min(...ys),
    }

    if (inStroke) {
      if (moved[OPPOSITE[lastDir]] <= 0.04 && !stillFor(t, settleMs)) return null
      inStroke = false
      strokeStart = t
      return null
    }
    if (lastDir && stillFor(t, restMs)) lastDir = null // a real pause: the next stroke may go either way
    if (t - lastFire < cooldownMs || stroke.length < 2) return null

    const sideways = Math.max(moved.left, moved.right)
    const vertical = Math.max(moved.up, moved.down)
    let dir = null
    if (vertical >= distanceY && vertical > sideways * 1.5) dir = moved.up >= moved.down ? 'up' : 'down'
    else if (moved.left >= distance && moved.left >= moved.right) dir = 'left'
    else if (moved.right >= distance) dir = 'right'
    if (!dir) return null

    strokeStart = t
    if (dir === OPPOSITE[lastDir]) return null // the hand coming back: ignore
    lastFire = t
    lastDir = dir
    inStroke = true
    return GESTURE[dir]
  }
}
