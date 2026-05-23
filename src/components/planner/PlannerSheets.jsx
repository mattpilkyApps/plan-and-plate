import {
  BookOpen,
  CalendarDays,
  MoveRight,
  Plus,
  Repeat2,
  Trash2,
  Users,
  X,
} from 'lucide-react'
import { getQueueDisplay, weekdayOptions } from './plannerUiHelpers'

function BottomSheet({ children }) {
  return (
    <div className="fixed inset-0 z-20 flex items-end bg-stone-900/25 px-4 pb-4">
      <div className="mx-auto w-full max-w-[430px] rounded-3xl bg-[#FAF8F3] p-4 shadow-[0_18px_50px_rgba(30,41,59,0.25)]">
        {children}
      </div>
    </div>
  )
}

function SheetHeader({ eyebrow, onClose, title }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-bold uppercase tracking-wide text-[#5A8D2B]">
          {eyebrow}
        </p>
        <h2 className="mt-1 line-clamp-2 text-2xl font-bold tracking-tight text-stone-900">
          {title}
        </h2>
      </div>

      <button
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-stone-700 shadow-sm"
        onClick={onClose}
        type="button"
      >
        <X size={22} />
      </button>
    </div>
  )
}

function MealActionButton({ children, icon: Icon, isDanger, onClick }) {
  return (
    <button
      className={`flex h-12 w-full items-center gap-3 rounded-2xl bg-white px-4 py-3 text-left text-base font-bold shadow-sm ${
        isDanger ? 'text-red-600' : 'text-stone-800'
      }`}
      onClick={onClick}
      type="button"
    >
      <Icon
        className={isDanger ? 'text-red-600' : 'text-[#5A8D2B]'}
        size={21}
      />
      {children}
    </button>
  )
}

export function PlannerAddMealModal({
  choice,
  days,
  onChangeChoice,
  onClose,
  onSave,
  recipes,
}) {
  return (
    <BottomSheet>
      <SheetHeader eyebrow="Add meal" onClose={onClose} title="Choose a recipe" />

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
            {days.map((day) => (
              <option key={day.weekday} value={day.weekday}>
                {day.weekday} {day.date}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="text-sm font-bold text-stone-700">Meal type</span>
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
          <span className="text-sm font-bold text-stone-700">Recipe</span>
          <select
            className="mt-2 h-14 w-full rounded-2xl border border-stone-100 bg-white px-4 text-base font-bold text-stone-800 shadow-sm outline-none focus:border-[#A8C686] focus:ring-4 focus:ring-[#EAF3DE]"
            name="recipeId"
            onChange={onChangeChoice}
            value={choice.recipeId}
          >
            {recipes.map((recipe) => (
              <option
                key={recipe.id || recipe.name}
                value={recipe.id || recipe.name}
              >
                {recipe.name}
              </option>
            ))}
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
        <Plus size={22} />
        Add to Planner
      </button>
    </BottomSheet>
  )
}

export function QueueActionsSheet({
  item,
  onClose,
  onDuplicate,
  onPlace,
  onRemove,
  recipes,
}) {
  if (!item) {
    return null
  }

  const display = getQueueDisplay(item, recipes)

  return (
    <BottomSheet>
      <SheetHeader
        eyebrow="Queue actions"
        onClose={onClose}
        title={display.name}
      />

      <div className="mt-5 grid gap-3">
        <MealActionButton icon={MoveRight} onClick={onPlace}>
          Place into planner
        </MealActionButton>
        <MealActionButton icon={Repeat2} onClick={onDuplicate}>
          Duplicate
        </MealActionButton>
        <MealActionButton icon={Trash2} isDanger onClick={onRemove}>
          Remove from queue
        </MealActionButton>
      </div>
    </BottomSheet>
  )
}

export function MealActionsModal({
  canViewRecipe,
  meal,
  onChangeServings,
  onClose,
  onDuplicate,
  onMove,
  onRemove,
  onViewRecipe,
}) {
  if (!meal) {
    return null
  }

  return (
    <BottomSheet>
      <SheetHeader
        eyebrow="Meal actions"
        onClose={onClose}
        title={meal.name}
      />

      <div className="mt-5 grid gap-3">
        <MealActionButton
          icon={BookOpen}
          onClick={canViewRecipe ? onViewRecipe : onClose}
        >
          {canViewRecipe ? 'View recipe' : 'Recipe not found'}
        </MealActionButton>
        <MealActionButton icon={MoveRight} onClick={onMove}>
          Move meal
        </MealActionButton>
        <MealActionButton icon={Repeat2} onClick={onDuplicate}>
          Duplicate
        </MealActionButton>
        <MealActionButton icon={Users} onClick={onChangeServings}>
          Change servings
        </MealActionButton>
        <MealActionButton icon={Trash2} isDanger onClick={onRemove}>
          Remove meal
        </MealActionButton>
      </div>
    </BottomSheet>
  )
}

export function ServingsModal({
  meal,
  onChangeServings,
  onClose,
  onSave,
  servings,
}) {
  if (!meal) {
    return null
  }

  return (
    <BottomSheet>
      <SheetHeader
        eyebrow="Change servings"
        onClose={onClose}
        title={meal.name}
      />

      <label className="mt-5 block">
        <span className="text-sm font-bold text-stone-700">
          Servings needed
        </span>
        <input
          className="mt-2 h-14 w-full rounded-2xl border border-stone-100 bg-white px-4 text-base font-bold text-stone-800 shadow-sm outline-none focus:border-[#A8C686] focus:ring-4 focus:ring-[#EAF3DE]"
          min="1"
          onChange={onChangeServings}
          type="number"
          value={servings}
        />
      </label>

      <button
        className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#5A8D2B] text-base font-bold text-white shadow-[0_12px_24px_rgba(90,141,43,0.3)]"
        onClick={onSave}
        type="button"
      >
        <Users size={21} />
        Save Servings
      </button>
    </BottomSheet>
  )
}

export function PlannerSettingsModal({
  copiedWeekMessage,
  onCopyWeek,
  onChangeSettings,
  onClose,
  onSave,
  settings,
}) {
  return (
    <BottomSheet>
      <SheetHeader
        eyebrow="Planner settings"
        onClose={onClose}
        title="Week setup"
      />

      <label className="mt-5 block">
        <span className="text-sm font-bold text-stone-700">
          Planner week starts on
        </span>
        <select
          className="mt-2 h-14 w-full rounded-2xl border border-stone-100 bg-white px-4 text-base font-bold text-stone-800 shadow-sm outline-none focus:border-[#A8C686] focus:ring-4 focus:ring-[#EAF3DE]"
          name="weekStartDay"
          onChange={onChangeSettings}
          value={settings.weekStartDay}
        >
          {weekdayOptions.map((day) => (
            <option key={day.key} value={day.key}>
              {day.label}
            </option>
          ))}
        </select>
      </label>

      <p className="mt-3 rounded-2xl bg-[#F8F2EA] px-4 py-3 text-sm font-semibold leading-relaxed text-stone-500">
        This changes which day your planner weeks start on. Your selected week
        is saved on this device.
      </p>

      <div className="mt-5 rounded-3xl border border-stone-100 bg-white p-3 shadow-sm">
        <div>
          <p className="text-sm font-bold text-stone-900">Week actions</p>
          <p className="mt-1 text-xs font-semibold leading-relaxed text-stone-500">
            Copy this week into next week, then jump there to make quick edits.
          </p>
        </div>

        <button
          className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#EAF3DE] px-4 text-sm font-bold text-[#5A8D2B] shadow-sm transition active:scale-[0.96]"
          onClick={onCopyWeek}
          type="button"
        >
          <Repeat2 size={19} />
          Copy to next week
        </button>

        {copiedWeekMessage && (
          <p className="mt-3 rounded-2xl bg-[#F8F2EA] px-3 py-2 text-xs font-bold text-[#5A8D2B]">
            {copiedWeekMessage}
          </p>
        )}
      </div>

      <button
        className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#5A8D2B] text-base font-bold text-white shadow-[0_12px_24px_rgba(90,141,43,0.3)]"
        onClick={onSave}
        type="button"
      >
        <CalendarDays size={21} />
        Save Settings
      </button>
    </BottomSheet>
  )
}

export function UndoMealToast({ mealName, onUndo }) {
  if (!mealName) {
    return null
  }

  return (
    <div className="fixed bottom-[9.25rem] left-4 right-4 z-20 mx-auto flex max-w-[430px] items-center justify-between gap-3 rounded-3xl bg-stone-900 px-4 py-3 text-white shadow-[0_14px_34px_rgba(30,41,59,0.25)]">
      <div>
        <p className="text-sm font-bold">Meal removed</p>
        <p className="line-clamp-1 text-xs font-medium text-stone-300">
          {mealName}
        </p>
      </div>
      <button
        className="rounded-full bg-white px-4 py-2 text-sm font-bold text-[#5A8D2B] transition active:scale-[0.96]"
        onClick={onUndo}
        type="button"
      >
        Undo
      </button>
    </div>
  )
}
