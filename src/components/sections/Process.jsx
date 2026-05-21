import { useT } from '../../i18n/LangContext'

export default function Process() {
  const { t } = useT()
  const p = t.process
  return (
    <>
      <style>{`
        .proc-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:32px;margin-top:48px}
        .proc{padding:34px 26px 30px;border-top:1px solid var(--ink);position:relative}
        .proc .num{font-family:'Cormorant Garamond',serif;font-style:italic;font-size:64px;line-height:1;color:var(--brass);position:absolute;top:14px;right:18px;opacity:.55}
        .proc h4{font-family:'Cormorant Garamond',serif;font-weight:400;font-size:26px;margin:0 0 12px;color:var(--moss-deep);max-width:9ch;line-height:1.1}
        .proc p{margin:0;color:var(--ink-soft);font-size:14px;line-height:1.7}
        .proc-tag{display:inline-block;margin-top:18px;font-size:10px;letter-spacing:.26em;text-transform:uppercase;color:var(--moss);padding:5px 10px;border:1px solid var(--moss);border-radius:999px}
        @media(max-width:880px){.proc-grid{grid-template-columns:1fr 1fr}}
      `}</style>
      <section className="section wrap" id="process">
        <div className="section-head">
          <h2>{p.headline} <em>{p.headlineItalic}</em></h2>
          <div className="side">{p.side}</div>
        </div>
        <div className="proc-grid">
          {p.steps.map(s => (
            <div className="proc" key={s.n}>
              <span className="num">{s.n}</span>
              <h4>{s.title}</h4>
              <p>{s.body}</p>
              <span className="proc-tag">{s.tag}</span>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
