import { CalendarPlus, X } from 'lucide-react'
import { plannerDays } from '../data/sampleData'

function AddToPlannerModal({
  choice,
  onChangeChoice,
  onClose,
  onSave,
  recipe,
}) {
  if (!recipe) {
    return null
  }

  return (
    <div className="fixed inset-0 z-20 flex items-end bg-stone-900/25 px-4 pb-4">
      <div className="mx-auto w-full max-w-[430px] rounded-3xl bg-[#FAF8F3] p-4 shadow-[0_18px_50px_rgba(30,41,59,0.25)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-[#5A8D2B]">
              Add to Planner
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-stone-900">
              {recipe.name}
            </h2>
          </div>

          <button
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-stone-700 shadow-sm"
            onClick={onClose}
            type="button"
          >
            <X size={22} />
          </button>
        </div>

        <div className="mt-5 grid gap-4">
          <label>
            <span className="text-sm font-bold text-stone-700">
              Day of week
            </span>
            <select
              className="mt-2 h-14 w-full rounded-2xl border border-stone-100 bg-white px-4 text-base font-bold text-stone-800 shadow-sm outline-none focus:border-[#A8C686] focus:ring-4 focus:ring-[#EAF3DE]"
              name="day"
              onChange={onChangeChoice}
              value={choice.day}
            >
              {plannerDays.map((day) => (
                <option key={day.weekday} value={day.weekday}>
                  {day.weekday} {day.date}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="text-sm font-bold text-stone-700">Meal slot</span>
            <select
              className="mt-2 h-14 w-full rounded-2xl border border-stone-100 bg-white px-4 text-base font-bold text-stone-800 shadow-sm outline-none focus:border-[#A8C686] focus:ring-4 focus:ring-[#EAF3DE]"
              name="mealSlot"
              onChange={onChangeChoice}
              value={choice.mealSlot}
            >
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
            </select>
          </label>

          <label>
            <span className="text-sm font-bold text-stone-700">
              Servings needed
            </span>
            <input
              className="mt-2 h-14 w-full rounded-2xl border border-stone-100 bg-white px-4 text-base font-bold text-stone-800 shadow-sm outline-none focus:border-[#A8C686] focus:ring-4 focus:ring-[#EAF3DE]"
              min="1"
              name="plannedServings"
              onChange={onChangeChoice}
              type="number"
              value={choice.plannedServings}
            />
          </label>
        </div>

        <button
          className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#5A8D2B] text-base font-bold text-white shadow-[0_12px_24px_rgba(90,141,43,0.3)]"
          onClick={onSave}
          type="button"
        >
          <CalendarPlus size={21} />
          Add Meal
        </button>
      </div>
    </div>
  )
}

export default AddToPlannerModal
