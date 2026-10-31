export default function ScreenHeader({ actions, eyebrow, stats = [], subtitle, title }) {
  return <header className="screen-header">
    <div className="screen-heading"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1>{subtitle && <p className="muted screen-subtitle">{subtitle}</p>}</div>{actions && <div className="header-actions">{actions}</div>}</div>
    {stats.length > 0 && <div className="header-stats">{stats.map(({ label, icon: Icon }) => <span key={label}>{Icon && <Icon size={14} />}{label}</span>)}</div>}
  </header>
}
