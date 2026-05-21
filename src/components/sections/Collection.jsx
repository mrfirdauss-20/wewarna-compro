import { useT } from '../../i18n/LangContext'

const SLOT_SPANS = {
  'c-a': { col: 'span 5', mt: 0,  h: 560 },
  'c-b': { col: 'span 4', mt: 80, h: 520 },
  'c-c': { col: 'span 3', mt: 0,  h: 440 },
  'c-d': { col: 'span 4', mt: 40, h: 480 },
  'c-e': { col: 'span 4', mt: 0,  h: 520 },
  'c-f': { col: 'span 4', mt: 60, h: 460 },
}

export default function Collection() {
  const { t } = useT()
  const c = t.collection
  return (
    <>
      <style>{`
        .col-grid{display:grid;grid-template-columns:repeat(12,1fr);gap:24px}
        .card{position:relative;cursor:pointer;transition:transform .5s}
        .card-img{position:relative;overflow:hidden;background:#E4DBC9;border-radius:8px}
        .card-img img{width:100%;height:100%;object-fit:cover;transition:transform .8s ease;display:block}
        .card:hover .card-img img{transform:scale(1.04)}
        .card-tag{position:absolute;top:18px;left:18px;background:var(--ivory);padding:6px 12px;border-radius:999px;font-size:10px;letter-spacing:.24em;text-transform:uppercase;color:var(--moss-deep);z-index:2}
        .card-foot{display:flex;justify-content:space-between;align-items:flex-end;padding:20px 4px 0}
        .card-foot .ttl{font-family:'Cormorant Garamond',serif;font-size:24px;letter-spacing:.01em;color:var(--ink)}
        .card-foot .sub{font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:var(--ink-soft);margin-top:4px}
        .card-foot .price{font-family:'Cormorant Garamond',serif;font-size:20px;font-style:italic;color:var(--moss-deep)}
        .card-shop{display:inline-flex;align-items:center;gap:6px;margin-top:14px;font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:var(--moss);opacity:0;transform:translateY(4px);transition:.35s}
        .card:hover .card-shop{opacity:1;transform:translateY(0)}
        .card-placeholder{width:100%;height:100%;background:repeating-linear-gradient(45deg,#E4DBC9 0 12px,#DCD1BC 12px 24px)}
        @media(max-width:980px){
          .col-grid{grid-template-columns:repeat(2,1fr)}
          .col-grid .card{grid-column:span 1 !important;margin-top:0 !important}
          .col-grid .card-img{height:380px !important}
        }
      `}</style>
      <section className="section wrap" id="collection">
        <div className="section-head">
          <h2>{c.headline.replace(c.headlineItalic, '')} <em>{c.headlineItalic}</em></h2>
          <div className="side">{c.side}</div>
        </div>
        <div className="col-grid">
          {c.products.map(p => {
            const sp = SLOT_SPANS[p.slot] || SLOT_SPANS['c-a']
            const waMsg = c.inquireTemplate.replace('{name}', p.name)
            const waHref = `https://wa.me/${t.whatsapp.number}?text=${encodeURIComponent(waMsg)}`
            return (
              <article key={p.id} className="card" style={{ gridColumn: sp.col, marginTop: sp.mt }}>
                <div className="card-img" style={{ height: sp.h }}>
                  <span className="card-tag">{p.tag}</span>
                  {p.image
                    ? <img src={p.image} alt={p.name} />
                    : <div className="card-placeholder" />
                  }
                </div>
                <div className="card-foot">
                  <div>
                    <div className="ttl">{p.name}</div>
                    <div className="sub">{p.sub}</div>
                    <a href={waHref} target="_blank" rel="noopener" className="card-shop">
                      Inquire on WhatsApp →
                    </a>
                  </div>
                  <div className="price">{p.price}</div>
                </div>
              </article>
            )
          })}
        </div>
      </section>
    </>
  )
}
