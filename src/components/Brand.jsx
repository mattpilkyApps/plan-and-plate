export default function Brand({ compact = false }) {
  return <span className={`brand ${compact ? 'brand-compact' : ''}`}>
    <svg viewBox="0 0 48 48" fill="none" aria-hidden="true"><path d="M7 36a19 19 0 1 1 34 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /><path d="M25 28c-2-12 6-16 13-16 0 9-4 17-13 16Z" fill="currentColor" /><path d="M22 33c2-9-4-12-10-13 0 7 3 12 10 13Z" fill="currentColor" opacity=".75" /><path d="m21 37 10-17m-10 17-4-11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
    <span><span className="brand-name">Plan <i>&</i> Plate</span>{!compact && <span className="brand-tagline">PLAN. COOK. SHOP. SAVE.</span>}</span>
  </span>
}
