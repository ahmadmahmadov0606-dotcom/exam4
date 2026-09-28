import { LANGUAGES } from './translator'
import { useLanguage } from './LanguageContext'

export default function LanguageSwitcher({ clear = false, className = '' }) {
  const { lang, setLang } = useLanguage()
  return (
    <div
      data-no-translate
      role="group"
      aria-label="Language"
      className={`items-center gap-0.5 rounded p-0.5 text-[10px] font-bold ${clear ? 'bg-white/15 text-white/80' : 'bg-mist text-muted'} ${className}`}
    >
      {LANGUAGES.map(([code, label]) => (
        <button
          key={code}
          type="button"
          onClick={() => setLang(code)}
          aria-pressed={lang === code}
          className={`rounded px-1.5 py-1 tracking-wider transition ${lang === code ? 'bg-primary text-white' : clear ? 'hover:text-white' : 'hover:text-ink'}`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
