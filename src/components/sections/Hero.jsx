import { useT } from '../../i18n/LangContext'

function LeafIcon({ size = 14, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
         stroke={color} strokeWidth="1.4" strokeLinecap="round"
         style={{ display:'inline-block', verticalAlign:'middle' }}>
      <path d="M3 21c0-8 6-15 18-18-1 12-7 18-15 18-1 0-3-0-3 0z" />
      <path d="M5 19c4-4 9-8 14-12" />
    </svg>
  )
}

export default function Hero() {
  const { t } = useT()
  const h = t.hero
  return (
    <>
      <style>{`
        .hero{position:relative;padding:64px 0 96px}
        .hero-grid{display:grid;grid-template-columns:1.05fr 1fr;gap:64px;align-items:end}
        .hero-eyebrow{display:flex;gap:14px;align-items:center;margin-bottom:34px}
        .hero-eyebrow .line{width:42px;height:1px;background:var(--ink)}
        .hero h1{font-family:'Cormorant Garamond',serif;font-weight:300;font-size:clamp(56px,8.2vw,128px);line-height:.92;letter-spacing:-.015em;margin:0;color:var(--moss-deep)}
        .hero h1 em{font-style:italic;color:var(--brass)}
        .hero-sub{margin-top:28px;max-width:520px;color:var(--ink-soft);font-size:16px;line-height:1.6}
        .hero-cta-row{margin-top:42px;display:flex;gap:18px;align-items:center;flex-wrap:wrap}
        .hero-meta{margin-top:48px;display:flex;gap:48px;flex-wrap:wrap}
        .hero-meta .m-num{font-family:'Cormorant Garamond',serif;font-size:36px;line-height:1;color:var(--moss-deep)}
        .hero-meta .m-lbl{font-size:11px;letter-spacing:.24em;text-transform:uppercase;color:var(--ink-soft);margin-top:8px}
        .hero-visual{position:relative;height:640px}
        .hero-img-a{position:absolute;inset:0 0 60px 60px;background:var(--ivory-2);border-radius:280px 280px 12px 12px;overflow:hidden}
        .hero-img-a img{width:100%;height:100%;object-fit:cover}
        .hero-img-b{position:absolute;left:0;bottom:0;width:46%;height:46%;background:var(--ivory-2);border-radius:12px;overflow:hidden}
        .hero-img-b img{width:100%;height:100%;object-fit:cover}
        .hero-badge{position:absolute;left:-14px;top:42%;background:var(--ivory);border:1px solid var(--line);padding:14px 18px;border-radius:999px;display:flex;align-items:center;gap:10px;box-shadow:0 14px 40px -22px rgba(31,27,22,.5)}
        .hero-badge .leaf{width:22px;height:22px;border-radius:50%;background:var(--moss);display:grid;place-items:center}
        .hero-badge .t{font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:var(--ink)}
        .hero-tag-tr{position:absolute;right:-12px;top:18px;writing-mode:vertical-rl;transform:rotate(180deg);font-size:11px;letter-spacing:.32em;text-transform:uppercase;color:var(--ink-soft)}
        .hero-img-placeholder{width:100%;height:100%;background:repeating-linear-gradient(45deg,#E4DBC9 0 12px,#DCD1BC 12px 24px)}
        @media(max-width:980px){
          .hero-grid{grid-template-columns:1fr;gap:48px}
          .hero-visual{height:520px}
        }
      `}</style>

      <section className="hero wrap">
        <div className="hero-grid">
          <div>
            <div className="hero-eyebrow">
              <span className="line" />
              <span className="eyebrow">{h.eyebrow}</span>
            </div>
            <h1>
              {h.headline1}<br />
              {h.headline2} <em>{h.headlineItalic}</em>
            </h1>
            <p className="hero-sub">{h.sub}</p>
            <div className="hero-cta-row">
              <a href="#collection" className="btn-primary">{h.ctaPrimary} →</a>
              <a href="#story" className="btn-ghost">{h.ctaSecondary} <span className="arr">↘</span></a>
            </div>
            <div className="hero-meta">
              {h.stats.map(s => (
                <div key={s.label}>
                  <div className="m-num">{s.value}</div>
                  <div className="m-lbl">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="hero-visual">
            <span className="hero-tag-tr">{h.sideTag}</span>
            <div className="hero-img-a">
              <div className="hero-img-placeholder" />
            </div>
            <div className="hero-img-b">
              <div className="hero-img-placeholder" />
            </div>
            <div className="hero-badge">
              <span className="leaf"><LeafIcon size={12} color="#F4EEE3" /></span>
              <span className="t">{h.badge}</span>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
