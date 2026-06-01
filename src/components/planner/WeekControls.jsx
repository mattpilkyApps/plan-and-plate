import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MoveRight,
  X,
} from 'lucide-react'
import Pressable from '../ui/Pressable'

function WeekControls({
  canEditPlanner,
  days,
  editMessage,
  isEditMode,
  onExitEditMode,
  onNextWeek,
  onOpenSettings,
  onPreviousWeek,
  onStartEditMode,
}) {
  const firstDay = days[0]
  const lastDay = days[days.length - 1]

  return (
    <div className="mt-3 space-y-2">
      <div className="grid grid-cols-[2.75rem_minmax(0,1fr)_2.75rem] items-center gap-2">
        <Pressable
          aria-label="Previous week"
          onClick={onPreviousWeek}
          size="icon"
          variant="surface"
        >
          <ChevronLeft size={24} />
        </Pressable>

        <Pressable
          className="min-w-0 px-3 py-2 tracking-tight"
          onClick={isEditMode ? onExitEditMode : onOpenSettings}
          variant="surface"
        >
          <span className="truncate">
            {firstDay.dayName} {firstDay.date} - {lastDay.dayName} {lastDay.date}
          </span>
          <ChevronDown className="shrink-0" size={18} />
        </Pressable>

        <Pressable
          aria-label="Next week"
          onClick={onNextWeek}
          size="icon"
          variant="surface"
        >
          <ChevronRight size={24} />
        </Pressable>
      </div>

      {(canEditPlanner || isEditMode) && (
        <div className="flex min-h-[3.7rem] flex-col items-center justify-start gap-1.5">
          <Pressable
            className={`h-9 min-w-32 px-4 text-sm ${
              isEditMode
                ? ''
                : 'border border-[#DDE8CC] bg-white text-[#5A8D2B]'
            }`}
            onClick={isEditMode ? onExitEditMode : onStartEditMode}
            size="sm"
            variant={isEditMode ? 'primary' : 'surface'}
          >
            {isEditMode ? (
              <>
                <X size={17} />
                Done
              </>
            ) : (
              <>
                <MoveRight size={17} />
                Edit planner
              </>
            )}
          </Pressable>

          <p
            className={`min-h-4 max-w-[20rem] text-center text-[0.72rem] font-semibold leading-tight transition ${
              isEditMode ? 'text-[#5A8D2B]' : 'text-transparent'
            }`}
          >
            {editMessage || 'Planner edit guidance'}
          </p>
        </div>
      )}
    </div>
  )
}

export default WeekControls
