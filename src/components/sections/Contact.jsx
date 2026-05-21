import { useT } from '../../i18n/LangContext'

export default function Contact() {
  const { t } = useT()
  const c = t.contact
  const waHref = `https://wa.me/${t.whatsapp.number}?text=${encodeURIComponent(t.whatsapp.defaultMessage)}`
  return (
    <>
      <style>{`
        .contact{padding:140px 0 100px;background:var(--moss-deep);color:var(--ivory);position:relative;overflow:hidden}
        .contact::before{content:"";position:absolute;left:-10%;bottom:-30%;width:60%;aspect-ratio:1;border-radius:50%;background:radial-gradient(circle,rgba(168,134,84,.16),transparent 65%)}
        .contact-grid{display:grid;grid-template-columns:1.2fr 1fr;gap:80px;align-items:end;position:relative}
        .contact h2{font-family:'Cormorant Garamond',serif;font-weight:300;font-size:clamp(48px,6vw,96px);line-height:1;letter-spacing:-.01em;margin:18px 0 24px}
        .contact h2 em{color:var(--brass-soft);font-style:italic}
        .contact p{color:rgba(244,238,227,.75);max-width:46ch;line-height:1.7;font-size:15px}
        .contact .story-eyebrow{color:var(--brass-soft)}
        .wa-btn{display:inline-flex;align-items:center;gap:14px;background:var(--ivory);color:var(--moss-deep);padding:20px 26px 20px 22px;border-radius:999px;margin-top:40px;font-size:13px;letter-spacing:.22em;text-transform:uppercase;transition:transform .3s;text-decoration:none}
        .wa-btn:hover{transform:translateY(-2px)}
        .wa-btn .ic{width:32px;height:32px;border-radius:50%;background:#25D366;display:grid;place-items:center;color:white;font-size:16px}
        .contact-side{display:flex;flex-direction:column;gap:28px;padding-bottom:8px}
        .contact-side .b{padding-bottom:24px;border-bottom:1px solid rgba(244,238,227,.16)}
        .contact-side .lbl{font-size:10px;letter-spacing:.28em;text-transform:uppercase;color:var(--brass-soft);margin-bottom:8px}
        .contact-side .val{font-family:'Cormorant Garamond',serif;font-size:22px;color:var(--ivory)}
        .contact-side a.val{border-bottom:1px solid rgba(244,238,227,.3);padding-bottom:2px;display:inline-block}
        @media(max-width:980px){.contact-grid{grid-template-columns:1fr;gap:48px}}
      `}</style>
      <section className="contact" id="contact">
        <div className="wrap">
          <div className="contact-grid">
            <div>
              <span className="story-eyebrow">— {c.eyebrow}</span>
              <h2>{c.headline} <em>{c.headlineItalic}</em></h2>
              <p>{c.body}</p>
              <a href={waHref} target="_blank" rel="noopener" className="wa-btn">
                <span className="ic">✦</span>
                {c.cta}
                <span style={{ marginLeft:4, fontFamily:"'Cormorant Garamond',serif", fontSize:20, fontStyle:'italic' }}>↗</span>
              </a>
            </div>
            <div className="contact-side">
              <div className="b">
                <div className="lbl">{c.atelierLabel}</div>
                <div className="val">{c.atelier.join(', ')}</div>
              </div>
              <div className="b">
                <div className="lbl">{c.whatsappLabel}</div>
                <a className="val" href={`https://wa.me/${t.whatsapp.number}`}>{t.whatsapp.displayNumber}</a>
              </div>
              <div className="b">
                <div className="lbl">{c.emailLabel}</div>
                <a className="val" href={`mailto:${c.email}`}>{c.email}</a>
              </div>
              <div>
                <div className="lbl">{c.instagramLabel}</div>
                <a className="val" href={c.instagramUrl} target="_blank" rel="noopener">{c.instagram}</a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
