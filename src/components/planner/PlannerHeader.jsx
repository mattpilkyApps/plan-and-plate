import { BookOpen, CalendarDays, SlidersHorizontal } from 'lucide-react'
import ScreenHeader from '../ScreenHeader'

function PlannerHeader({
  mealCount,
  onOpenSettings,
  weekRange,
  weekStartLabel,
}) {
  return (
    <ScreenHeader
      actions={
        <button
          aria-label="Planner settings"
          className="flex h-[3.05rem] w-[3.05rem] items-center justify-center rounded-2xl bg-[#EAF3DE] text-[#5A8D2B] shadow-sm transition active:scale-[0.96]"
          onClick={onOpenSettings}
          type="button"
        >
          <SlidersHorizontal size={25} />
        </button>
      }
      eyebrow="This week"
      stats={[
        { label: `${mealCount} meals planned`, icon: BookOpen },
        { label: `Starts ${weekStartLabel}`, icon: CalendarDays },
      ]}
      subtitle={weekRange}
      title="Meal Planner"
    />
  )
}

export default PlannerHeader
