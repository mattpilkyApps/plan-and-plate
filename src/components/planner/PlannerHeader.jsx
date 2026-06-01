import { BookOpen, CalendarDays, SlidersHorizontal } from 'lucide-react'
import ScreenHeader from '../ScreenHeader'
import Pressable from '../ui/Pressable'

function PlannerHeader({
  mealCount,
  onOpenSettings,
  weekRange,
  weekStartLabel,
}) {
  return (
    <ScreenHeader
      actions={
        <Pressable
          aria-label="Planner settings"
          onClick={onOpenSettings}
          size="iconLg"
          variant="secondary"
        >
          <SlidersHorizontal size={25} />
        </Pressable>
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
