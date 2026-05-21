import { useT } from '../../i18n/LangContext'

export default function FloatWA() {
  const { t } = useT()
  const waHref = `https://wa.me/${t.whatsapp.number}?text=${encodeURIComponent(t.whatsapp.defaultMessage)}`
  return (
    <>
      <style>{`
        .float-wa{position:fixed;right:28px;bottom:28px;z-index:80;display:flex;align-items:center;gap:12px;background:#25D366;color:white;padding:14px 20px 14px 14px;border-radius:999px;box-shadow:0 18px 40px -16px rgba(37,211,102,.6);font-size:12px;letter-spacing:.2em;text-transform:uppercase;font-weight:500;transition:transform .25s;text-decoration:none}
        .float-wa:hover{transform:translateY(-3px) scale(1.02)}
        .float-wa .ic{width:30px;height:30px;border-radius:50%;background:rgba(255,255,255,.18);display:grid;place-items:center;font-size:16px}
      `}</style>
      <a href={waHref} target="_blank" rel="noopener" className="float-wa">
        <span className="ic">✦</span>
        Chat us
      </a>
    </>
  )
}
