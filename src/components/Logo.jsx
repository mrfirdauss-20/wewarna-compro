export default function Logo() {
  return (
    <a href="#" className="brand" style={{ display:'flex', alignItems:'baseline', gap:10, textDecoration:'none' }}>
      <span className="brand-mark" style={{
        width:30, height:30, border:'1px solid var(--moss)', borderRadius:'50%',
        display:'grid', placeItems:'center', color:'var(--moss)',
        fontFamily:"'Cormorant Garamond',serif", fontStyle:'italic', fontSize:18, alignSelf:'center',
      }}>w</span>
      <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, letterSpacing:'.04em' }}>Wewarna</span>
      <span style={{ fontSize:10, letterSpacing:'.28em', textTransform:'uppercase', color:'var(--ink-soft)', marginLeft:6 }}>Ecoprint · Blitar</span>
    </a>
  )
}
