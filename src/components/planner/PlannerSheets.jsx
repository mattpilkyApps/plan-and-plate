import {
  BookOpen,
  CalendarDays,
  MoveRight,
  Plus,
  Repeat2,
  Trash2,
  Users,
} from 'lucide-react'
import BottomSheet from '../ui/BottomSheet'
import Pressable from '../ui/Pressable'
import StatusToast from '../ui/StatusToast'
import { getQueueDisplay, weekdayOptions } from './plannerUiHelpers'

function MealActionButton({ children, icon: Icon, isDanger, onClick }) {
  return (
    <Pressable
      className="w-full justify-start text-left"
      onClick={onClick}
      variant={isDanger ? 'danger' : 'surface'}
    >
      <Icon
        className={isDanger ? 'text-red-600' : 'text-[#5A8D2B]'}
        size={21}
      />
      {children}
    </Pressable>
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
    <BottomSheet eyebrow="Add meal" onClose={onClose} title="Choose a recipe">
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

      <Pressable
        className="mt-5 w-full"
        onClick={onSave}
        size="lg"
        variant="primary"
      >
        <Plus size={22} />
        Add to Planner
      </Pressable>
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
    <BottomSheet
      eyebrow="Queue actions"
      onClose={onClose}
      placement="top"
      title={display.name}
    >
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
    <BottomSheet
      eyebrow="Meal actions"
      onClose={onClose}
      placement="top"
      title={meal.name}
    >
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
    <BottomSheet
      eyebrow="Change servings"
      onClose={onClose}
      placement="top"
      title={meal.name}
    >
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

      <Pressable
        className="mt-5 w-full"
        onClick={onSave}
        size="lg"
        variant="primary"
      >
        <Users size={21} />
        Save Servings
      </Pressable>
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
    <BottomSheet
      eyebrow="Planner settings"
      onClose={onClose}
      placement="top"
      title="Week setup"
    >
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

        <Pressable
          className="mt-3 w-full text-sm"
          onClick={onCopyWeek}
          variant="secondary"
        >
          <Repeat2 size={19} />
          Copy to next week
        </Pressable>

        {copiedWeekMessage && (
          <p className="mt-3 rounded-2xl bg-[#F8F2EA] px-3 py-2 text-xs font-bold text-[#5A8D2B]">
            {copiedWeekMessage}
          </p>
        )}
      </div>

      <Pressable
        className="mt-5 w-full"
        onClick={onSave}
        size="lg"
        variant="primary"
      >
        <CalendarDays size={21} />
        Save Settings
      </Pressable>
    </BottomSheet>
  )
}

export function UndoMealToast({ mealName, onUndo }) {
  if (!mealName) {
    return null
  }

  return (
    <StatusToast
      actionLabel="Undo"
      message={mealName}
      onAction={onUndo}
      positionClassName="bottom-[9.25rem]"
      show={Boolean(mealName)}
      title="Meal removed"
      tone="dark"
    />
  )
}
