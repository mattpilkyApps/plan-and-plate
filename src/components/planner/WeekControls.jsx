import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MoveRight,
  X,
} from 'lucide-react'

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
        <button
          aria-label="Previous week"
          className="flex h-11 w-11 items-center justify-center rounded-2xl border border-stone-100 bg-white text-stone-800 shadow-sm transition active:scale-[0.96]"
          onClick={onPreviousWeek}
          type="button"
        >
          <ChevronLeft size={24} />
        </button>

        <button
          className="flex min-w-0 items-center justify-center gap-1.5 rounded-2xl border border-stone-100 bg-white/80 px-3 py-2 text-base font-bold tracking-tight text-stone-900 shadow-sm transition active:scale-[0.98]"
          onClick={isEditMode ? onExitEditMode : onOpenSettings}
          type="button"
        >
          <span className="truncate">
            {firstDay.dayName} {firstDay.date} - {lastDay.dayName} {lastDay.date}
          </span>
          <ChevronDown className="shrink-0" size={18} />
        </button>

        <button
          aria-label="Next week"
          className="flex h-11 w-11 items-center justify-center rounded-2xl border border-stone-100 bg-white text-[#5A8D2B] shadow-sm transition active:scale-[0.96]"
          onClick={onNextWeek}
          type="button"
        >
          <ChevronRight size={24} />
        </button>
      </div>

      {(canEditPlanner || isEditMode) && (
        <div className="flex min-h-[3.7rem] flex-col items-center justify-start gap-1.5">
          <button
            className={`flex h-9 min-w-32 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-bold shadow-sm transition active:scale-[0.96] ${
              isEditMode
                ? 'bg-[#5A8D2B] text-white shadow-[0_10px_20px_rgba(90,141,43,0.22)]'
                : 'border border-[#DDE8CC] bg-white text-[#5A8D2B]'
            }`}
            onClick={isEditMode ? onExitEditMode : onStartEditMode}
            type="button"
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
          </button>

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
