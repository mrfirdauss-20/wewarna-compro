import { createContext, useContext, useEffect, useState } from 'react'
import EN from './en.js'
import ID from './id.js'

const LangCtx = createContext({ lang: 'en', t: EN, setLang: () => {} })

export const useT = () => useContext(LangCtx)

export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => {
    try { return localStorage.getItem('ww-lang') || 'en' } catch { return 'en' }
  })
  useEffect(() => {
    try { localStorage.setItem('ww-lang', lang) } catch {}
    document.documentElement.lang = lang
  }, [lang])
  const t = lang === 'id' ? ID : EN
  return <LangCtx.Provider value={{ lang, setLang, t }}>{children}</LangCtx.Provider>
}

export function LangToggle() {
  const { lang, setLang } = useT()
  return (
    <div role="group" aria-label="Language" style={{
      display: 'inline-flex', border: '1px solid var(--line)',
      borderRadius: 999, padding: 2, fontSize: 11, letterSpacing: '.1em',
    }}>
      {[{ k: 'en', l: 'EN' }, { k: 'id', l: 'ID' }].map(o => (
        <button key={o.k} onClick={() => setLang(o.k)} aria-pressed={lang === o.k} style={{
          padding: '4px 12px', border: 0, cursor: 'pointer',
          background: lang === o.k ? 'var(--moss-deep)' : 'transparent',
          color: lang === o.k ? 'var(--ivory)' : 'var(--ink-soft)',
          borderRadius: 999, fontFamily: 'Jost,sans-serif', fontSize: 'inherit',
        }}>{o.l}</button>
      ))}
    </div>
  )
}
