import { CalendarDays, BookOpen, ShoppingBasket } from 'lucide-react'
import { NavLink } from 'react-router-dom'
const items = [
  { label: 'Planner', path: '/planner', icon: CalendarDays },
  { label: 'Recipes', path: '/recipes', icon: BookOpen },
  { label: 'Shopping', path: '/shopping', icon: ShoppingBasket },
]
export default function BottomNav() {
  return <nav className="bottom-nav" aria-label="Main navigation"><div className="nav-inner">
    {items.map(({ label, path, icon: Icon }) => <NavLink key={path} to={path} className={({ isActive }) => `nav-item ${isActive ? 'nav-active' : ''}`}>
      <span className="nav-icon"><Icon size={22} strokeWidth={1.8} /></span><span>{label}</span>
    </NavLink>)}
  </div></nav>
}
