function ScreenHeader({ actions, eyebrow, stats = [], subtitle, title }) {
  return (
    <header className="relative overflow-hidden rounded-[1.75rem] bg-white/65 px-4 py-4 shadow-[0_16px_34px_rgba(68,64,60,0.07)] ring-1 ring-stone-100/80 backdrop-blur">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <span className="inline-flex rounded-full bg-[#EAF3DE] px-3 py-1 text-[0.72rem] font-bold uppercase tracking-wide text-[#5A8D2B]">
            {eyebrow}
          </span>
          <h1 className="mt-3 text-[2.25rem] font-bold leading-none tracking-tight text-stone-950">
            {title}
          </h1>
          <p className="mt-2 max-w-[17rem] text-[0.95rem] font-medium leading-relaxed text-stone-500">
            {subtitle}
          </p>
        </div>

        {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
      </div>

      {stats.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {stats.map((stat) => {
            const Icon = stat.icon

            return (
              <span
                className="inline-flex items-center gap-1.5 rounded-full bg-[#FAF8F3] px-3 py-1.5 text-xs font-bold text-stone-600 shadow-sm ring-1 ring-stone-100"
                key={stat.label}
              >
                {Icon && <Icon className="text-[#5A8D2B]" size={14} />}
                {stat.label}
              </span>
            )
          })}
        </div>
      )}
    </header>
  )
}

export default ScreenHeader
