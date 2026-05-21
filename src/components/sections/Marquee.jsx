import { useT } from '../../i18n/LangContext'

export default function Marquee() {
  const { t } = useT()
  const row = t.marquee.map((item, i) => (
    <span key={i}>{item}<i style={{ color:'var(--brass)', fontStyle:'italic', fontFamily:"'Cormorant Garamond',serif", fontSize:16 }}>✦</i></span>
  ))
  return (
    <>
      <style>{`
        .marquee{border-top:1px solid var(--line-soft);border-bottom:1px solid var(--line-soft);overflow:hidden;background:var(--ivory-2)}
        .marquee-track{display:flex;gap:64px;padding:22px 0;white-space:nowrap;animation:scroll 38s linear infinite;font-family:'Cormorant Garamond',serif;font-size:22px;color:var(--moss-deep)}
        .marquee-track span{display:inline-flex;align-items:center;gap:64px}
        @keyframes scroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}
      `}</style>
      <div className="marquee" aria-hidden="true">
        <div className="marquee-track">{row}{row}{row}</div>
      </div>
    </>
  )
}
