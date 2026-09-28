import { useEffect, useState } from 'react'

const query = '(prefers-reduced-motion: reduce)'

// Whether heavy motion (autoplay video, zoom) is welcome: false for reduced-motion users and Data Saver.
export default function useMotionPrefs() {
  const [reduced, setReduced] = useState(() => window.matchMedia?.(query).matches ?? false)
  const saveData = Boolean(navigator.connection?.saveData)

  useEffect(() => {
    const media = window.matchMedia?.(query)
    if (!media) return
    const onChange = (e) => setReduced(e.matches)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  return { reduced, saveData, allowVideo: !reduced && !saveData }
}
