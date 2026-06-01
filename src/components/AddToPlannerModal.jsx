import { CalendarPlus } from 'lucide-react'
import { plannerDays } from '../data/sampleData'
import BottomSheet from './ui/BottomSheet'
import Pressable from './ui/Pressable'

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
    <BottomSheet eyebrow="Add to Planner" onClose={onClose} title={recipe.name}>
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

        <Pressable
          className="mt-5 w-full"
          onClick={onSave}
          size="lg"
          variant="primary"
        >
          <CalendarPlus size={21} />
          Add Meal
        </Pressable>
    </BottomSheet>
  )
}

export default AddToPlannerModal
