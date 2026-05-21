import { useT } from '../../i18n/LangContext'

export default function Footer() {
  const { t } = useT()
  const f = t.footer
  return (
    <>
      <style>{`
        footer{padding:48px 0;background:var(--ivory)}
        .foot{display:flex;justify-content:space-between;align-items:center;gap:32px;flex-wrap:wrap;font-size:12px;color:var(--ink-soft);letter-spacing:.04em}
        .foot-links{display:flex;gap:24px}
      `}</style>
      <footer>
        <div className="wrap foot">
          <div style={{ display:'flex', gap:14, alignItems:'center' }}>
            <span style={{ width:26, height:26, border:'1px solid var(--moss)', borderRadius:'50%', display:'grid', placeItems:'center', color:'var(--moss)', fontFamily:"'Cormorant Garamond',serif", fontStyle:'italic', fontSize:14 }}>w</span>
            <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:18 }}>Wewarna Ecoprint</span>
            <span style={{ fontSize:11, letterSpacing:'.22em', textTransform:'uppercase', color:'var(--ink-soft)' }}>· {f.tagline}</span>
          </div>
          <div className="foot-links">
            {f.links.map(l => (
              <a key={l.anchor} href={`#${l.anchor}`}>{l.label}</a>
            ))}
          </div>
          <div>{f.copyright}</div>
        </div>
      </footer>
    </>
  )
}
