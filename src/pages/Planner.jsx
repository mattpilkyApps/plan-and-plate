import {
  DragOverlay,
  DndContext,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  BookOpen,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Moon,
  MoreVertical,
  MoveRight,
  Plus,
  Sunrise,
  Sun,
  Trash2,
  Users,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ComingSoonSheet from '../components/ComingSoonSheet'
import EmptyState from '../components/EmptyState'
import FloatingActionButton from '../components/FloatingActionButton'
import ScreenHeader from '../components/ScreenHeader'
import { plannerDays, recipes as sampleRecipes } from '../data/sampleData'
import {
  createLocalId,
  getPlannerSettings,
  getPlannedMeals,
  getRemovedPlannerMealIds,
  getRemovedRecipeIds,
  getSavedRecipes,
  removePlannedMeal,
  savePlannerSettings,
  savePlannedMeal,
  saveRemovedPlannerMealIds,
  updatePlannedMeal,
} from '../utils/localStorage'
import { getMealIcon } from '../utils/mealIcons'
import { getRecipeKey, getVisibleRecipes } from '../utils/recipeKeys'

const weekdayOptions = [
  { key: 'MON', label: 'Monday' },
  { key: 'TUE', label: 'Tuesday' },
  { key: 'WED', label: 'Wednesday' },
  { key: 'THU', label: 'Thursday' },
  { key: 'FRI', label: 'Friday' },
  { key: 'SAT', label: 'Saturday' },
  { key: 'SUN', label: 'Sunday' },
]

const multiWeekComingSoonMessage =
  'Multi-week planning is coming soon. For now, use Planner settings to choose your week start day.'

const mealTypes = [
  {
    key: 'breakfast',
    label: 'Breakfast',
    Icon: Sunrise,
    textColor: 'text-amber-500',
    cardColor: 'bg-gradient-to-br from-[#FFF3C8] to-[#FFF8E8]',
  },
  {
    key: 'lunch',
    label: 'Lunch',
    Icon: Sun,
    textColor: 'text-orange-500',
    cardColor: 'bg-gradient-to-br from-[#FFE4C6] to-[#FFF2E4]',
  },
  {
    key: 'dinner',
    label: 'Dinner',
    Icon: Moon,
    textColor: 'text-violet-500',
    cardColor: 'bg-gradient-to-br from-[#E9D8FF] to-[#F3E9FF]',
  },
]

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
          <CalendarDays size={25} />
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

function WeekControls({
  days,
  isEditMode,
  onExitEditMode,
  onOpenSettings,
  onShowComingSoon,
}) {
  const firstDay = days[0]
  const lastDay = days[days.length - 1]

  return (
    <div className="mt-4 flex items-center justify-between">
      {isEditMode ? (
        <button
          className="flex h-12 items-center justify-center rounded-2xl bg-[#5A8D2B] px-5 text-sm font-bold text-white shadow-[0_10px_20px_rgba(90,141,43,0.24)] transition active:scale-[0.96]"
          onClick={onExitEditMode}
          type="button"
        >
          Done
        </button>
      ) : (
        <button
          aria-label="Previous week"
          className="flex h-12 w-12 items-center justify-center rounded-2xl border border-stone-100 bg-white text-stone-800 shadow-sm"
          onClick={onShowComingSoon}
          type="button"
        >
          <ChevronLeft size={26} />
        </button>
      )}

      <button
        className="flex items-center gap-2 text-lg font-bold tracking-tight text-stone-900"
        onClick={onOpenSettings}
        type="button"
      >
        <span>
          {firstDay.weekday} {firstDay.date} - {lastDay.weekday} {lastDay.date}
        </span>
        <ChevronDown size={20} />
      </button>

      <button
        aria-label="Next week"
        className="flex h-12 w-12 items-center justify-center rounded-2xl border border-stone-100 bg-white text-[#5A8D2B] shadow-sm"
        onClick={onShowComingSoon}
        type="button"
      >
        <ChevronRight size={26} />
      </button>
    </div>
  )
}

function MealHeading({ meal }) {
  const Icon = meal.Icon

  return (
    <div className="mb-1.5 hidden items-center gap-1.5 pl-1 text-sm font-bold text-stone-900 min-[390px]:flex">
      <Icon className={meal.textColor} size={18} />
      <span>{meal.label}</span>
    </div>
  )
}

function getMealDragId(item) {
  return item.plannedMealId || item.starterMealId
}

function getMealStyle(mealSlot) {
  return mealTypes.find((meal) => meal.key === mealSlot) || mealTypes[2]
}

function MealDragPreview({ item }) {
  if (!item) {
    return null
  }

  const meal = getMealStyle(item.mealSlot)

  return (
    <div
      className={`flex min-h-10 w-36 scale-105 items-center gap-1 rounded-xl px-2 py-1.5 shadow-[0_18px_34px_rgba(30,41,59,0.24)] ring-2 ring-white ${meal.cardColor}`}
    >
      <span className="text-sm leading-none">{item.icon}</span>
      <p className="line-clamp-2 flex-1 text-[0.72rem] font-bold leading-tight text-stone-800">
        {item.name}
      </p>
    </div>
  )
}

function MealCard({
  index,
  isEditMode,
  meal,
  item,
  onDeleteMeal,
  onOpenActions,
  onOpenRecipe,
}) {
  const dragId = getMealDragId(item)
  const { attributes, isDragging, listeners, setNodeRef } = useDraggable({
    id: dragId,
    data: {
      item,
    },
  })

  function handleKeyDown(event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      if (isEditMode) {
        return
      }

      onOpenRecipe(item)
    }
  }

  return (
    <div
      {...listeners}
      {...attributes}
      className={`relative flex min-h-9 cursor-pointer touch-none items-center gap-1 rounded-xl px-1.5 py-1 shadow-sm transition active:scale-[0.98] ${
        isEditMode && !isDragging ? 'planner-meal-editing' : ''
      } ${
        isDragging ? 'opacity-35' : ''
      } ${meal.cardColor}`}
      onClick={(event) => {
        event.stopPropagation()

        if (isEditMode) {
          return
        }

        onOpenRecipe(item)
      }}
      onKeyDown={handleKeyDown}
      ref={setNodeRef}
      role="button"
      style={{
        animationDelay: `${index * 70}ms`,
      }}
      tabIndex={0}
    >
      {isEditMode && (
        <button
          aria-label={`Remove ${item.name}`}
          className="absolute -left-1.5 -top-2 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow-[0_6px_12px_rgba(239,68,68,0.28)] ring-2 ring-white"
          onClick={(event) => {
            event.stopPropagation()
            onDeleteMeal(item)
          }}
          onPointerDown={(event) => event.stopPropagation()}
          type="button"
        >
          <X size={12} strokeWidth={3} />
        </button>
      )}
      <span className="text-sm leading-none">{item.icon}</span>
      <p className="line-clamp-2 flex-1 pr-4 text-[0.68rem] font-bold leading-tight text-stone-800">
        {item.name}
      </p>
      {!isEditMode && (
        <button
          aria-label={`Meal actions for ${item.name}`}
          className={`absolute right-0.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center ${meal.textColor}`}
          onClick={(event) => {
            event.stopPropagation()
            onOpenActions(item)
          }}
          onPointerDown={(event) => event.stopPropagation()}
          title="Meal actions"
          type="button"
        >
          <MoreVertical size={16} />
        </button>
      )}
    </div>
  )
}

function MealColumn({
  day,
  isEditMode,
  meal,
  items,
  onDeleteMeal,
  onExitEditMode,
  onOpenActions,
  onOpenRecipe,
  showHeading,
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: `${day.weekday}:${meal.key}`,
    data: {
      day: day.weekday,
      mealSlot: meal.key,
    },
  })

  return (
    <div className="min-w-0">
      {showHeading && <MealHeading meal={meal} />}

      <div
        className={`min-h-10 space-y-1 rounded-2xl transition ${
          isOver ? 'bg-[#EAF3DE]/50 ring-2 ring-[#A8C686]' : ''
        }`}
        onClick={(event) => {
          if (isEditMode && event.target === event.currentTarget) {
            onExitEditMode()
          }
        }}
        ref={setNodeRef}
      >
        {items.map((item, index) => (
          <MealCard
            index={index}
            isEditMode={isEditMode}
            item={item}
            key={getMealDragId(item)}
            meal={meal}
            onDeleteMeal={onDeleteMeal}
            onOpenActions={onOpenActions}
            onOpenRecipe={onOpenRecipe}
          />
        ))}
      </div>
    </div>
  )
}

function DayCard({
  day,
  isEditMode,
  onDeleteMeal,
  onExitEditMode,
  onOpenActions,
  onOpenRecipe,
  showMealHeadings,
}) {
  return (
    <article
      className="rounded-3xl border border-stone-100 bg-white p-2 shadow-[0_8px_24px_rgba(30,41,59,0.05)]"
      onClick={(event) => {
        if (isEditMode && event.target === event.currentTarget) {
          onExitEditMode()
        }
      }}
    >
      <div
        className="grid grid-cols-[3.35rem_repeat(3,minmax(0,1fr))] gap-1.5"
        onClick={(event) => {
          if (isEditMode && event.target === event.currentTarget) {
            onExitEditMode()
          }
        }}
      >
        <div className="pt-1">
          <p className="text-sm font-bold text-[#6D8E3D]">{day.weekday}</p>
          <p className="text-[2.15rem] font-bold leading-none tracking-tight text-stone-900">
            {day.date}
          </p>
          {day.isToday && (
            <div className="mt-2 flex items-center gap-1">
              <span className="text-sm font-bold text-[#6D8E3D]">Today</span>
              <span className="h-2 w-2 rounded-full bg-[#6D8E3D]" />
            </div>
          )}
        </div>

        {mealTypes.map((meal) => (
          <MealColumn
            day={day}
            isEditMode={isEditMode}
            key={meal.key}
            meal={meal}
            items={day.meals[meal.key]}
            onDeleteMeal={onDeleteMeal}
            onExitEditMode={onExitEditMode}
            onOpenActions={onOpenActions}
            onOpenRecipe={onOpenRecipe}
            showHeading={showMealHeadings}
          />
        ))}
      </div>
    </article>
  )
}

function PlannerAddMealModal({
  choice,
  days,
  onChangeChoice,
  onClose,
  onSave,
  recipes,
}) {
  return (
    <div className="fixed inset-0 z-20 flex items-end bg-stone-900/25 px-4 pb-4">
      <div className="mx-auto w-full max-w-[430px] rounded-3xl bg-[#FAF8F3] p-4 shadow-[0_18px_50px_rgba(30,41,59,0.25)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-[#5A8D2B]">
              Add meal
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-stone-900">
              Choose a recipe
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
      </div>
    </div>
  )
}

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

function MealActionsModal({
  canViewRecipe,
  meal,
  onChangeServings,
  onClose,
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

function MoveMealModal({ choice, meal, onChangeChoice, onClose, onSave, days }) {
  if (!meal) {
    return null
  }

  return (
    <BottomSheet>
      <SheetHeader eyebrow="Move meal" onClose={onClose} title={meal.name} />

      <div className="mt-5 grid gap-4">
        <label>
          <span className="text-sm font-bold text-stone-700">Day</span>
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
      </div>

      <button
        className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#5A8D2B] text-base font-bold text-white shadow-[0_12px_24px_rgba(90,141,43,0.3)]"
        onClick={onSave}
        type="button"
      >
        <MoveRight size={21} />
        Move Meal
      </button>
    </BottomSheet>
  )
}

function ServingsModal({ meal, onChangeServings, onClose, onSave, servings }) {
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

function PlannerSettingsModal({
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
        This changes the order of this planner week only. Full future-week
        planning can come later.
      </p>

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

function UndoMealToast({ mealName, onUndo }) {
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

function reorderPlannerDays(days, weekStartDay) {
  const startIndex = days.findIndex((day) => day.weekday === weekStartDay)

  if (startIndex <= 0) {
    return days
  }

  const daysAfterStart = days.slice(startIndex)
  const wrappedDays = days.slice(0, startIndex).map((day) => ({
    ...day,
    date: String(Number(day.date) + 7),
    isToday: false,
  }))

  return [...daysAfterStart, ...wrappedDays]
}

function formatPlannerWeekRange(days) {
  const firstDay = days[0]
  const lastDay = days[days.length - 1]

  return `${firstDay.weekday} ${firstDay.date} - ${lastDay.weekday} ${lastDay.date}`
}

function getWeekStartLabel(weekStartDay) {
  return (
    weekdayOptions.find((day) => day.key === weekStartDay)?.label || 'Monday'
  )
}

function getRecipeForMealItem(item, recipes) {
  if (item.recipeId) {
    const recipeById = recipes.find(
      (recipe) => (recipe.id || recipe.name) === item.recipeId,
    )

    if (recipeById) {
      return recipeById
    }
  }

  const mealName = item.name.toLowerCase()

  return recipes.find((recipe) => {
    const recipeName = recipe.name.toLowerCase()

    return mealName === recipeName || mealName.includes(recipeName)
  })
}

function Planner() {
  const navigate = useNavigate()
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 450,
        tolerance: 8,
      },
    }),
  )
  const [plannedMeals, setPlannedMeals] = useState(() => getPlannedMeals())
  const [removedPlannerMealIds, setRemovedPlannerMealIds] = useState(() =>
    getRemovedPlannerMealIds(),
  )
  const [plannerSettings, setPlannerSettings] = useState(() =>
    getPlannerSettings(),
  )
  const [draftPlannerSettings, setDraftPlannerSettings] = useState(() =>
    getPlannerSettings(),
  )
  const [showAddMealModal, setShowAddMealModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [comingSoonMessage, setComingSoonMessage] = useState('')
  const [activeMealModal, setActiveMealModal] = useState('')
  const [isEditMode, setIsEditMode] = useState(false)
  const [activeDraggedMeal, setActiveDraggedMeal] = useState(null)
  const [lastRemovedMeal, setLastRemovedMeal] = useState(null)
  const [selectedMeal, setSelectedMeal] = useState(null)
  const [moveChoice, setMoveChoice] = useState({
    day: plannerDays[0].weekday,
    mealSlot: 'dinner',
  })
  const [servingsChoice, setServingsChoice] = useState(1)
  const [availableRecipes] = useState(() =>
    getVisibleRecipes(getSavedRecipes(), sampleRecipes, getRemovedRecipeIds()),
  )
  const [plannerChoice, setPlannerChoice] = useState(() => ({
    day: plannerDays[0].weekday,
    mealSlot: 'dinner',
    recipeId: sampleRecipes[0].id || sampleRecipes[0].name,
    plannedServings: sampleRecipes[0].servings,
  }))
  const displayedPlannerDays = reorderPlannerDays(
    plannerDays,
    plannerSettings.weekStartDay,
  )

  function buildStarterMeal(day, mealSlot, item, index) {
    const matchedRecipe = getRecipeForMealItem(item, availableRecipes)

    return {
      ...item,
      day: day.weekday,
      mealSlot,
      plannedServings: matchedRecipe?.servings || 1,
      recipeId: matchedRecipe?.id || matchedRecipe?.name || item.name,
      starterMealId: `${day.weekday}-${mealSlot}-${index}-${item.name}`,
    }
  }

  const plannerDaysWithSavedMeals = displayedPlannerDays.map((day) => {
    const savedMealsForDay = plannedMeals.filter(
      (plannedMeal) => plannedMeal.day === day.weekday,
    )

    const meals = {
      breakfast: day.meals.breakfast
        .map((item, index) => buildStarterMeal(day, 'breakfast', item, index))
        .filter((item) => !removedPlannerMealIds.includes(item.starterMealId)),
      lunch: day.meals.lunch
        .map((item, index) => buildStarterMeal(day, 'lunch', item, index))
        .filter((item) => !removedPlannerMealIds.includes(item.starterMealId)),
      dinner: day.meals.dinner
        .map((item, index) => buildStarterMeal(day, 'dinner', item, index))
        .filter((item) => !removedPlannerMealIds.includes(item.starterMealId)),
    }

    savedMealsForDay.forEach((plannedMeal) => {
      meals[plannedMeal.mealSlot].push({
        day: plannedMeal.day,
        name: plannedMeal.recipeName,
        mealSlot: plannedMeal.mealSlot,
        plannedServings: plannedMeal.plannedServings,
        plannedMealId: plannedMeal.id,
        recipeId: plannedMeal.recipeId,
        icon:
          plannedMeal.icon ||
          getMealIcon({
            mealSlot: plannedMeal.mealSlot,
            name: plannedMeal.recipeName,
          }),
      })
    })

    return {
      ...day,
      meals,
    }
  })
  const plannedMealCount = plannerDaysWithSavedMeals.reduce(
    (total, day) =>
      total +
      day.meals.breakfast.length +
      day.meals.lunch.length +
      day.meals.dinner.length,
    0,
  )
  const weekRange = formatPlannerWeekRange(displayedPlannerDays)
  const weekStartLabel = getWeekStartLabel(plannerSettings.weekStartDay)

  function openAddMealModal() {
    const firstRecipe = availableRecipes[0]

    if (!firstRecipe) {
      return
    }

    setPlannerChoice({
      day: displayedPlannerDays[0].weekday,
      mealSlot: 'dinner',
      recipeId: firstRecipe.id || firstRecipe.name,
      plannedServings: firstRecipe.servings || 1,
    })
    setShowAddMealModal(true)
  }

  function openMealActions(item) {
    setSelectedMeal(item)
    setMoveChoice({
      day: item.day,
      mealSlot: item.mealSlot,
    })
    setServingsChoice(item.plannedServings || 1)
    setActiveMealModal('actions')
  }

  function closeMealModals() {
    setActiveMealModal('')
    setSelectedMeal(null)
  }

  function updatePlannerChoice(event) {
    const { name, value } = event.target

    if (name === 'recipeId') {
      const selectedRecipe = availableRecipes.find(
        (recipe) => (recipe.id || recipe.name) === value,
      )

      setPlannerChoice((currentChoice) => ({
        ...currentChoice,
        recipeId: value,
        plannedServings: selectedRecipe?.servings || 1,
      }))
      return
    }

    setPlannerChoice((currentChoice) => ({
      ...currentChoice,
      [name]: value,
    }))
  }

  function saveMealFromPlanner() {
    const selectedRecipe = availableRecipes.find(
      (recipe) => (recipe.id || recipe.name) === plannerChoice.recipeId,
    )

    if (!selectedRecipe) {
      return
    }

    const plannedMeal = {
      id: createLocalId('planned-meal'),
      day: plannerChoice.day,
      mealSlot: plannerChoice.mealSlot,
      recipeName: selectedRecipe.name,
      recipeId: selectedRecipe.id || selectedRecipe.name,
      plannedServings:
        Number(plannerChoice.plannedServings) || selectedRecipe.servings || 1,
      icon:
        selectedRecipe.icon ||
        getMealIcon({
          mealSlot: plannerChoice.mealSlot,
          mealType: selectedRecipe.mealType,
          name: selectedRecipe.name,
        }),
    }

    const nextPlannedMeals = savePlannedMeal(plannedMeal)
    setPlannedMeals(nextPlannedMeals)
    setShowAddMealModal(false)
  }

  function updateMoveChoice(event) {
    const { name, value } = event.target

    setMoveChoice((currentChoice) => ({
      ...currentChoice,
      [name]: value,
    }))
  }

  function updateDraftPlannerSettings(event) {
    const { name, value } = event.target

    setDraftPlannerSettings((currentSettings) => ({
      ...currentSettings,
      [name]: value,
    }))
  }

  function savePlannerPreferences() {
    const savedSettings = savePlannerSettings(draftPlannerSettings)

    setPlannerSettings(savedSettings)
    setShowSettingsModal(false)
  }

  function openPlannerSettings() {
    setDraftPlannerSettings(plannerSettings)
    setShowSettingsModal(true)
  }

  function getExistingPlannedMeal(item) {
    return plannedMeals.find((plannedMeal) => plannedMeal.id === item.plannedMealId)
  }

  function saveStarterAsPlannedMeal(item, updates) {
    const matchedRecipe = getRecipeForMealItem(item, availableRecipes)
    const plannedMeal = {
      id: createLocalId('planned-meal'),
      day: item.day,
      mealSlot: item.mealSlot,
      recipeName: item.name,
      recipeId: matchedRecipe?.id || matchedRecipe?.name || item.recipeId,
      plannedServings: item.plannedServings || matchedRecipe?.servings || 1,
      icon: item.icon,
      ...updates,
    }
    const nextPlannedMeals = savePlannedMeal(plannedMeal)
    const nextRemovedMealIds = saveRemovedPlannerMealIds([
      ...removedPlannerMealIds,
      item.starterMealId,
    ])

    setPlannedMeals(nextPlannedMeals)
    setRemovedPlannerMealIds(nextRemovedMealIds)
  }

  function updateSelectedMeal(updates) {
    if (!selectedMeal) {
      return
    }

    if (selectedMeal.plannedMealId) {
      const existingMeal = getExistingPlannedMeal(selectedMeal)

      if (!existingMeal) {
        return
      }

      const nextPlannedMeals = updatePlannedMeal({
        ...existingMeal,
        ...updates,
      })
      setPlannedMeals(nextPlannedMeals)
      closeMealModals()
      return
    }

    if (selectedMeal.starterMealId) {
      saveStarterAsPlannedMeal(selectedMeal, updates)
      closeMealModals()
    }
  }

  function moveSelectedMeal() {
    updateSelectedMeal({
      day: moveChoice.day,
      mealSlot: moveChoice.mealSlot,
    })
  }

  function saveSelectedMealServings() {
    updateSelectedMeal({
      plannedServings: Number(servingsChoice) || selectedMeal.plannedServings || 1,
    })
  }

  function viewSelectedMealRecipe() {
    openMealRecipe(selectedMeal)
  }

  function openMealRecipe(mealItem) {
    const recipe = getRecipeForMealItem(mealItem, availableRecipes)

    if (recipe) {
      navigate(`/recipes/${getRecipeKey(recipe)}`)
    }
  }

  function removeMealFromPlanner(item) {
    if (item.plannedMealId) {
      const nextPlannedMeals = removePlannedMeal(item.plannedMealId)
      setPlannedMeals(nextPlannedMeals)
      closeMealModals()
      return
    }

    if (item.starterMealId) {
      const nextRemovedMealIds = saveRemovedPlannerMealIds([
        ...removedPlannerMealIds,
        item.starterMealId,
      ])
      setRemovedPlannerMealIds(nextRemovedMealIds)
      closeMealModals()
    }
  }

  function moveMealToSlot(item, day, mealSlot) {
    if (item.day === day && item.mealSlot === mealSlot) {
      return
    }

    if (item.plannedMealId) {
      const existingMeal = getExistingPlannedMeal(item)

      if (!existingMeal) {
        return
      }

      const nextPlannedMeals = updatePlannedMeal({
        ...existingMeal,
        day,
        mealSlot,
      })
      setPlannedMeals(nextPlannedMeals)
      return
    }

    if (item.starterMealId) {
      saveStarterAsPlannedMeal(item, {
        day,
        mealSlot,
      })
    }
  }

  function handleDragStart(event) {
    const mealItem = event.active.data.current?.item

    setIsEditMode(true)
    setActiveDraggedMeal(mealItem || null)
    setLastRemovedMeal(null)
  }

  function handleDragEnd(event) {
    const mealItem = event.active.data.current?.item
    const dropTarget = event.over?.data.current

    if (mealItem && dropTarget) {
      moveMealToSlot(mealItem, dropTarget.day, dropTarget.mealSlot)
    }

    setActiveDraggedMeal(null)
  }

  function handleDragCancel() {
    setActiveDraggedMeal(null)
  }

  function deleteMealWithUndo(item) {
    if (item.plannedMealId) {
      const existingMeal = getExistingPlannedMeal(item)
      const mealToRestore =
        existingMeal || {
          id: item.plannedMealId,
          day: item.day,
          mealSlot: item.mealSlot,
          recipeName: item.name,
          recipeId: item.recipeId,
          plannedServings: item.plannedServings,
          icon: item.icon,
        }

      const nextPlannedMeals = removePlannedMeal(item.plannedMealId)
      setPlannedMeals(nextPlannedMeals)
      setLastRemovedMeal({
        type: 'planned',
        meal: mealToRestore,
        mealName: item.name,
      })
      return
    }

    if (item.starterMealId) {
      const nextRemovedMealIds = saveRemovedPlannerMealIds([
        ...new Set([...removedPlannerMealIds, item.starterMealId]),
      ])

      setRemovedPlannerMealIds(nextRemovedMealIds)
      setLastRemovedMeal({
        type: 'starter',
        starterMealId: item.starterMealId,
        mealName: item.name,
      })
    }
  }

  function undoLastRemovedMeal() {
    if (!lastRemovedMeal) {
      return
    }

    if (lastRemovedMeal.type === 'planned') {
      const plannedMealExists = getPlannedMeals().some(
        (meal) => meal.id === lastRemovedMeal.meal.id,
      )

      if (!plannedMealExists) {
        setPlannedMeals(savePlannedMeal(lastRemovedMeal.meal))
      }
    }

    if (lastRemovedMeal.type === 'starter') {
      const nextRemovedMealIds = saveRemovedPlannerMealIds(
        removedPlannerMealIds.filter(
          (mealId) => mealId !== lastRemovedMeal.starterMealId,
        ),
      )

      setRemovedPlannerMealIds(nextRemovedMealIds)
    }

    setLastRemovedMeal(null)
  }

  const selectedMealRecipe = selectedMeal
    ? getRecipeForMealItem(selectedMeal, availableRecipes)
    : null

  return (
    <section
      className="relative"
      onClick={(event) => {
        if (isEditMode && event.target === event.currentTarget) {
          setIsEditMode(false)
        }
      }}
    >
      <PlannerHeader
        mealCount={plannedMealCount}
        onOpenSettings={openPlannerSettings}
        weekRange={weekRange}
        weekStartLabel={weekStartLabel}
      />
      <DndContext
        onDragCancel={handleDragCancel}
        onDragEnd={handleDragEnd}
        onDragStart={handleDragStart}
        sensors={sensors}
      >
        <WeekControls
          days={displayedPlannerDays}
          isEditMode={isEditMode}
          onExitEditMode={() => setIsEditMode(false)}
          onOpenSettings={openPlannerSettings}
          onShowComingSoon={() =>
            setComingSoonMessage(multiWeekComingSoonMessage)
          }
        />

        {plannedMealCount === 0 ? (
          <div className="mt-4">
            <EmptyState icon={CalendarDays} title="No meals planned">
              Add a meal to start building your week.
            </EmptyState>
          </div>
        ) : (
          <div className="mt-3 space-y-2.5 pb-24">
            {plannerDaysWithSavedMeals.map((day, index) => (
              <DayCard
                day={day}
                isEditMode={isEditMode}
                key={day.weekday}
                onDeleteMeal={deleteMealWithUndo}
                onExitEditMode={() => setIsEditMode(false)}
                onOpenActions={openMealActions}
                onOpenRecipe={openMealRecipe}
                showMealHeadings={index === 0}
              />
            ))}
          </div>
        )}
        <DragOverlay>
          <MealDragPreview item={activeDraggedMeal} />
        </DragOverlay>
      </DndContext>

      <FloatingActionButton label="Add meal" onClick={openAddMealModal} />

      <UndoMealToast
        mealName={lastRemovedMeal?.mealName}
        onUndo={undoLastRemovedMeal}
      />

      {showAddMealModal && (
        <PlannerAddMealModal
          choice={plannerChoice}
          days={displayedPlannerDays}
          onChangeChoice={updatePlannerChoice}
          onClose={() => setShowAddMealModal(false)}
          onSave={saveMealFromPlanner}
          recipes={availableRecipes}
        />
      )}

      <MealActionsModal
        canViewRecipe={Boolean(selectedMealRecipe)}
        meal={activeMealModal === 'actions' ? selectedMeal : null}
        onChangeServings={() => setActiveMealModal('servings')}
        onClose={closeMealModals}
        onMove={() => setActiveMealModal('move')}
        onRemove={() => removeMealFromPlanner(selectedMeal)}
        onViewRecipe={viewSelectedMealRecipe}
      />

      <MoveMealModal
        choice={moveChoice}
        days={displayedPlannerDays}
        meal={activeMealModal === 'move' ? selectedMeal : null}
        onChangeChoice={updateMoveChoice}
        onClose={closeMealModals}
        onSave={moveSelectedMeal}
      />

      <ServingsModal
        meal={activeMealModal === 'servings' ? selectedMeal : null}
        onChangeServings={(event) => setServingsChoice(event.target.value)}
        onClose={closeMealModals}
        onSave={saveSelectedMealServings}
        servings={servingsChoice}
      />

      {showSettingsModal && (
        <PlannerSettingsModal
          onChangeSettings={updateDraftPlannerSettings}
          onClose={() => setShowSettingsModal(false)}
          onSave={savePlannerPreferences}
          settings={draftPlannerSettings}
        />
      )}

      <ComingSoonSheet
        message={comingSoonMessage}
        onClose={() => setComingSoonMessage('')}
        title="Multi-week planning"
      />
    </section>
  )
}

export default Planner
