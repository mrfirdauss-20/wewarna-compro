import { useT } from '../../i18n/LangContext'

export default function Values() {
  const { t } = useT()
  const v = t.values
  return (
    <>
      <style>{`
        .values{padding:120px 0}
        .v-grid{display:grid;grid-template-columns:1.1fr 1fr;gap:80px;align-items:start}
        .v-list{display:grid;gap:0}
        .v-item{display:grid;grid-template-columns:60px 1fr auto;gap:24px;align-items:center;padding:28px 0;border-bottom:1px solid var(--line)}
        .v-item:first-child{border-top:1px solid var(--line)}
        .v-item .n{font-family:'Cormorant Garamond',serif;font-style:italic;font-size:28px;color:var(--brass)}
        .v-item .title{font-family:'Cormorant Garamond',serif;font-size:24px;color:var(--moss-deep)}
        .v-item .desc{font-size:13px;color:var(--ink-soft);margin-top:4px;max-width:46ch;line-height:1.6}
        .v-item .pin{font-size:10px;letter-spacing:.22em;text-transform:uppercase;color:var(--ink-soft)}
        @media(max-width:980px){.v-grid{grid-template-columns:1fr;gap:48px}}
      `}</style>
      <section className="values section wrap">
        <div className="v-grid">
          <div>
            <span className="eyebrow">— {v.eyebrow}</span>
            <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontWeight:300, fontSize:'clamp(42px,5vw,72px)', lineHeight:1, margin:'18px 0 0', color:'var(--moss-deep)', letterSpacing:'-.01em' }}>
              {v.headline} <em style={{ fontStyle:'italic', color:'var(--brass)' }}>{v.headlineItalic}</em>
            </h2>
            <p style={{ marginTop:28, maxWidth:'40ch', color:'var(--ink-soft)', lineHeight:1.7, fontSize:14 }}>
              {v.sub}
            </p>
          </div>
          <div className="v-list">
            {v.items.map(item => (
              <div className="v-item" key={item.n}>
                <span className="n">{item.n}</span>
                <div>
                  <div className="title">{item.title}</div>
                  <div className="desc">{item.body}</div>
                </div>
                <span className="pin">{item.pin}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
