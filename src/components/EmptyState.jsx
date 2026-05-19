function EmptyState({ children, icon: Icon, title }) {
  return (
    <div className="rounded-3xl border border-stone-100 bg-white p-5 text-center shadow-[0_8px_24px_rgba(30,41,59,0.05)]">
      {Icon && (
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF3DE] text-[#5A8D2B]">
          <Icon size={28} />
        </span>
      )}
      <p className="mt-4 text-lg font-bold text-stone-900">{title}</p>
      <p className="mt-2 text-sm leading-relaxed text-stone-500">{children}</p>
    </div>
  )
}

export default EmptyState
