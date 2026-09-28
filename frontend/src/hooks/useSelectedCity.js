import { useEffect, useState } from 'react'
import useCities from './useCities'

const KEY = 'city'
const EVENT = 'city:change'

function read() {
  try {
    return localStorage.getItem(KEY) || ''
  } catch {
    return ''
  }
}

// City chosen in the header; shared across components and remembered between visits.
export default function useSelectedCity() {
  const cities = useCities()
  const [id, setId] = useState(read)

  useEffect(() => {
    const sync = () => setId(read())
    window.addEventListener(EVENT, sync)
    return () => window.removeEventListener(EVENT, sync)
  }, [])

  const select = (value) => {
    try {
      localStorage.setItem(KEY, value)
    } catch {
      // Private mode: the choice just isn't remembered.
    }
    window.dispatchEvent(new Event(EVENT))
  }

  const city = cities.find((c) => String(c.id) === String(id))
  return { cities, city, cityId: city ? String(city.id) : '', select }
}
