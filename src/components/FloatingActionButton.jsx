import { Plus } from 'lucide-react'
import { Link } from 'react-router-dom'

function ButtonContent({ label }) {
  return (
    <>
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#5A8D2B] text-white shadow-[0_10px_22px_rgba(90,141,43,0.32)]">
        <Plus size={30} />
      </span>
      <span className="max-w-0 overflow-hidden whitespace-nowrap text-sm font-bold text-[#5A8D2B] opacity-0 transition-all duration-300 group-hover:max-w-28 group-hover:opacity-100 group-focus-visible:max-w-28 group-focus-visible:opacity-100">
        {label}
      </span>
    </>
  )
}

function sharedClasses() {
  return 'group fixed bottom-[6.4rem] right-0 z-10 flex h-16 translate-x-5 items-center gap-2 rounded-l-full border border-green-100 bg-white/95 py-2 pl-2 pr-7 shadow-[0_12px_28px_rgba(30,41,59,0.12)] backdrop-blur transition-all duration-300 hover:translate-x-0 hover:pr-5 active:scale-[0.98] focus-visible:translate-x-0 focus-visible:pr-5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#EAF3DE]'
}

function FloatingActionButton({ label, onClick, to }) {
  if (to) {
    return (
      <Link aria-label={label} className={sharedClasses()} to={to}>
        <ButtonContent label={label} />
      </Link>
    )
  }

  return (
    <button
      aria-label={label}
      className={sharedClasses()}
      onClick={onClick}
      type="button"
    >
      <ButtonContent label={label} />
    </button>
  )
}

export default FloatingActionButton
