import { CalendarDays, BookOpen, ShoppingCart } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const navItems = [
  { label: 'Planner', path: '/planner', icon: CalendarDays },
  { label: 'Recipes', path: '/recipes', icon: BookOpen },
  { label: 'Shopping', path: '/shopping', icon: ShoppingCart },
]

function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 rounded-t-[1.5rem] border border-stone-100 bg-white/95 px-4 pb-3 pt-2 shadow-[0_-10px_30px_rgba(30,41,59,0.08)] backdrop-blur">
      <div className="mx-auto flex max-w-[430px] items-center justify-between">
        {navItems.map((item) => {
          const Icon = item.icon

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-1 flex-col items-center gap-0.5 rounded-2xl px-2 py-1 text-xs font-semibold transition active:scale-[0.98] ${
                  isActive
                    ? 'text-[#5A8D2B]'
                    : 'text-stone-400 hover:text-[#5A8D2B]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`rounded-xl p-1.5 ${
                      isActive ? 'bg-[#EAF3DE]' : 'bg-transparent'
                    }`}
                  >
                    <Icon size={21} strokeWidth={2} />
                  </span>
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}

export default BottomNav
