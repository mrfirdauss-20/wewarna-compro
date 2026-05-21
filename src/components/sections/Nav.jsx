import { useState, useEffect } from 'react'
import Logo from '../Logo'
import { LangToggle, useT } from '../../i18n/LangContext'

export default function Nav() {
  const { t } = useT()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  const waHref = `https://wa.me/${t.whatsapp.number}?text=${encodeURIComponent(t.whatsapp.defaultMessage)}`

  return (
    <>
      <style>{`
        .nav{position:sticky;top:0;z-index:60;backdrop-filter:blur(14px);background:rgba(244,238,227,.78);border-bottom:1px solid var(--line-soft)}
        .nav-inner{display:flex;align-items:center;justify-content:space-between;height:74px}
        .nav-links{display:flex;gap:34px;font-size:13px;letter-spacing:.04em}
        .nav-links a{padding:6px 0;color:var(--ink)}
        .nav-links a:hover{color:var(--moss)}
        .nav-cta{display:inline-flex;align-items:center;gap:8px;background:var(--moss);color:var(--ivory);padding:10px 18px;border-radius:999px;font-size:12px;letter-spacing:.18em;text-transform:uppercase;transition:background .25s}
        .nav-cta:hover{background:var(--moss-deep)}
        .nav-cta .dot{width:6px;height:6px;border-radius:50%;background:#86C77E;box-shadow:0 0 0 3px rgba(134,199,126,.25)}
        .nav-burger{display:inline-flex;background:transparent;border:0;width:44px;height:44px;cursor:pointer;padding:0;align-items:center;justify-content:center;color:var(--ink)}
        .burger{position:relative;width:22px;height:14px;display:inline-block}
        .burger span{position:absolute;left:0;width:100%;height:1.5px;background:currentColor;transition:transform .35s ease,top .35s ease,opacity .25s ease}
        .burger span:nth-child(1){top:0}
        .burger span:nth-child(2){top:6px}
        .burger span:nth-child(3){top:12px}
        .burger.is-open span:nth-child(1){top:6px;transform:rotate(45deg)}
        .burger.is-open span:nth-child(2){opacity:0}
        .burger.is-open span:nth-child(3){top:6px;transform:rotate(-45deg)}
        .nav-sheet{position:fixed;inset:0;background:rgba(30,42,29,.35);backdrop-filter:blur(6px);opacity:0;pointer-events:none;transition:opacity .35s ease;z-index:55}
        .nav-sheet.is-open{opacity:1;pointer-events:auto}
        .nav-sheet-inner{position:absolute;top:0;right:0;height:100%;width:min(420px,86vw);background:var(--ivory);padding:96px 32px 40px;display:flex;flex-direction:column;transform:translateX(100%);transition:transform .45s cubic-bezier(.7,0,.2,1)}
        .nav-sheet.is-open .nav-sheet-inner{transform:translateX(0)}
        .nav-sheet-links{display:flex;flex-direction:column;gap:4px;border-top:1px solid var(--line-soft)}
        .nav-sheet-links a{display:grid;grid-template-columns:auto 1fr auto;align-items:baseline;gap:18px;padding:22px 4px;border-bottom:1px solid var(--line-soft);font-family:'Cormorant Garamond',serif;font-size:32px;color:var(--moss-deep);opacity:0;transform:translateY(8px);transition:opacity .4s ease,transform .4s ease}
        .nav-sheet.is-open .nav-sheet-links a{opacity:1;transform:translateY(0)}
        .nav-sheet-links .ix{font-family:'Jost',sans-serif;font-size:10px;letter-spacing:.24em;color:var(--ink-soft);font-style:normal}
        .nav-sheet-links .ar{font-family:'Cormorant Garamond',serif;font-style:italic;font-size:22px;color:var(--brass)}
        .nav-sheet-foot{margin-top:auto;padding-top:28px;border-top:1px solid var(--line-soft)}
        .nav-sheet-foot .lbl{font-size:10px;letter-spacing:.26em;text-transform:uppercase;color:var(--ink-soft);margin-bottom:6px}
        .nav-sheet-foot .val{font-family:'Cormorant Garamond',serif;font-size:18px;color:var(--ink)}
        @media(min-width:881px){
          .nav-burger{display:none}
        }
        @media(max-width:880px){
          .nav-cta-desk{display:none}
          .nav-links{display:none}
        }
      `}</style>

      <nav className="nav">
        <div className="wrap nav-inner">
          <Logo />
          <div className="nav-links">
            {t.nav.links.map(l => (
              <a key={l.anchor} href={`#${l.anchor}`}>{l.label}</a>
            ))}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:16 }}>
            <LangToggle />
            <a href={waHref} target="_blank" rel="noopener" className="nav-cta nav-cta-desk">
              <span className="dot" />
              {t.nav.cta}
            </a>
          </div>
          <button
            className="nav-burger"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            onClick={() => setOpen(o => !o)}
          >
            <span className={`burger ${open ? 'is-open' : ''}`}>
              <span /><span /><span />
            </span>
          </button>
        </div>

        <div className={`nav-sheet ${open ? 'is-open' : ''}`} onClick={() => setOpen(false)}>
          <div className="nav-sheet-inner" onClick={e => e.stopPropagation()}>
            <div className="nav-sheet-links">
              {t.nav.links.map((l, i) => (
                <a
                  key={l.anchor}
                  href={`#${l.anchor}`}
                  onClick={() => setOpen(false)}
                  style={{ transitionDelay: open ? `${80 + i * 40}ms` : '0ms' }}
                >
                  <span className="ix">{String(i + 1).padStart(2, '0')}</span>
                  <span>{l.label}</span>
                  <span className="ar">↗</span>
                </a>
              ))}
            </div>
            <a href={waHref} target="_blank" rel="noopener"
               onClick={() => setOpen(false)}
               className="nav-cta"
               style={{ marginTop: 32, alignSelf: 'flex-start' }}>
              <span className="dot" />
              {t.nav.cta}
            </a>
            <div className="nav-sheet-foot">
              <div className="lbl">Atelier</div>
              <div className="val">{t.nav.atelier}</div>
              <div className="lbl" style={{ marginTop: 18 }}>{t.contact.whatsappLabel}</div>
              <div className="val">{t.whatsapp.displayNumber}</div>
            </div>
          </div>
        </div>
      </nav>
    </>
  )
}
