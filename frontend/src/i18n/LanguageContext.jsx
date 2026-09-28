import { createContext, useContext, useState } from 'react'
import { LANGUAGES, setLanguage } from './translator'

const KEY = 'lang'
const LanguageContext = createContext(null)

export function savedLanguage() {
  try {
    const saved = localStorage.getItem(KEY)
    if (LANGUAGES.some(([code]) => code === saved)) return saved
  } catch {
    // Storage blocked: fall back to Tajik.
  }
  return 'tg'
}

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(savedLanguage)

  const change = (next) => {
    setLang(next)
    setLanguage(next)
    try {
      localStorage.setItem(KEY, next)
    } catch {
      // Not remembered in private mode.
    }
  }

  return <LanguageContext.Provider value={{ lang, setLang: change }}>{children}</LanguageContext.Provider>
}

export const useLanguage = () => useContext(LanguageContext)
