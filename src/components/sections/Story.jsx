import { useT } from '../../i18n/LangContext'

export default function Story() {
  const { t } = useT()
  const s = t.story
  return (
    <>
      <style>{`
        .story{background:var(--moss-deep);color:var(--ivory);padding:140px 0;position:relative;overflow:hidden}
        .story::before{content:"";position:absolute;inset:0;background:radial-gradient(60% 50% at 80% 20%,rgba(168,134,84,.18),transparent 60%)}
        .story-grid{display:grid;grid-template-columns:1fr 1.1fr;gap:80px;align-items:center;position:relative}
        .story h2{font-family:'Cormorant Garamond',serif;font-weight:300;font-size:clamp(40px,4.6vw,68px);line-height:1.05;margin:24px 0 28px;color:var(--ivory);letter-spacing:-.01em}
        .story h2 em{font-style:italic;color:var(--brass-soft)}
        .story p{color:rgba(244,238,227,.78);font-size:15.5px;line-height:1.8;max-width:48ch}
        .story p+p{margin-top:18px}
        .story-eyebrow{color:var(--brass-soft);font-size:11px;letter-spacing:.32em;text-transform:uppercase}
        .story-quote{margin-top:36px;padding-left:18px;border-left:1px solid var(--brass-soft);font-family:'Cormorant Garamond',serif;font-style:italic;font-size:22px;line-height:1.4;color:var(--ivory);max-width:38ch}
        .story-attr{font-size:11px;letter-spacing:.24em;text-transform:uppercase;color:rgba(244,238,227,.55);margin-top:14px;font-style:normal;font-family:'Jost',sans-serif}
        .story-img{position:relative;height:600px}
        .story-img img{width:100%;height:100%;object-fit:cover;border-radius:6px}
        .story-img-placeholder{width:100%;height:100%;border-radius:6px;background:#3A4A35}
        .story-img-cap{position:absolute;left:24px;bottom:24px;background:rgba(30,42,29,.85);backdrop-filter:blur(8px);padding:14px 18px;border-radius:6px;border:1px solid rgba(244,238,227,.12);max-width:260px}
        .story-img-cap .t{font-family:'Cormorant Garamond',serif;font-style:italic;font-size:16px;color:var(--ivory)}
        .story-img-cap .s{font-size:10px;letter-spacing:.24em;text-transform:uppercase;color:rgba(244,238,227,.55);margin-top:6px}
        @media(max-width:980px){.story-grid{grid-template-columns:1fr}.story-img{height:420px}}
      `}</style>
      <section className="story" id="story">
        <div className="wrap">
          <div className="story-grid">
            <div>
              <span className="story-eyebrow">— {s.eyebrow}</span>
              <h2>{s.headline} <em>{s.headlineItalic}</em></h2>
              {s.body.map((p, i) => <p key={i}>{p}</p>)}
              <blockquote className="story-quote">
                "{s.quote}"
                <div className="story-attr">— {s.attribution}</div>
              </blockquote>
            </div>
            <div className="story-img">
              {s.image
                ? <img src={s.image} alt={s.captionTitle} />
                : <div className="story-img-placeholder" />
              }
              <div className="story-img-cap">
                <div className="t">{s.captionTitle}</div>
                <div className="s">{s.captionSub}</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
