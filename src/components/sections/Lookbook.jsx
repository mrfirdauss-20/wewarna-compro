import { useT } from '../../i18n/LangContext'

export default function Lookbook() {
  const { t } = useT()
  const l = t.lookbook
  return (
    <>
      <style>{`
        .lookbook{background:var(--ivory-2);padding:120px 0}
        .look-scroll{display:flex;gap:24px;overflow-x:auto;padding:8px 56px 32px;scroll-snap-type:x mandatory;-ms-overflow-style:none;scrollbar-width:none}
        .look-scroll::-webkit-scrollbar{display:none}
        .look-card{flex:0 0 360px;scroll-snap-align:start}
        .look-card .img{height:480px;border-radius:6px;overflow:hidden;background:#E4DBC9}
        .look-card img{width:100%;height:100%;object-fit:cover}
        .look-placeholder{width:100%;height:100%;background:repeating-linear-gradient(45deg,#E4DBC9 0 12px,#DCD1BC 12px 24px)}
        .look-card .meta{display:flex;justify-content:space-between;margin-top:14px;font-size:12px;letter-spacing:.04em;color:var(--ink-soft)}
        .look-card .meta .n{font-family:'Cormorant Garamond',serif;font-size:18px;color:var(--ink);font-style:italic}
        @media(max-width:780px){.look-scroll{padding:8px 22px 32px}}
      `}</style>
      <section className="lookbook" id="lookbook">
        <div className="wrap" style={{ paddingRight: 0 }}>
          <div className="section-head" style={{ paddingRight: 56 }}>
            <h2>{l.headline.replace(l.headlineItalic, '')} <em>{l.headlineItalic}</em></h2>
            <div className="side">{l.side}</div>
          </div>
        </div>
        <div className="look-scroll">
          {l.looks.map(lk => (
            <div className="look-card" key={lk.id}>
              <div className="img">
                {lk.image
                  ? <img src={lk.image} alt={lk.title} />
                  : <div className="look-placeholder" />
                }
              </div>
              <div className="meta">
                <span className="n">{lk.n}</span>
                <span>{lk.title}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
