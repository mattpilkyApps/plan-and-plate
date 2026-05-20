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
  Repeat2,
  Sunrise,
  Sun,
  Trash2,
  Users,
  X,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
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
  getWeeklyQueueItems,
  duplicateWeeklyQueueItem,
  removePlannedMeal,
  removeWeeklyQueueItem,
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
        onClick={isEditMode ? onExitEditMode : onOpenSettings}
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

function getMealItemId(item) {
  return item.plannedMealId || item.starterMealId
}

function MealCard({
  canPlaceInSlot,
  index,
  isEditMode,
  meal,
  item,
  onDeleteMeal,
  onOpenActions,
  onOpenRecipe,
  onPlaceInSlot,
  onStartPlacement,
}) {
  const longPressTimer = useRef(null)
  const pointerStart = useRef({ x: 0, y: 0 })
  const ignoreNextClick = useRef(false)

  function clearLongPressTimer() {
    if (longPressTimer.current) {
      window.clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }

  function handlePointerDown(event) {
    if (isEditMode) {
      return
    }

    pointerStart.current = {
      x: event.clientX,
      y: event.clientY,
    }
    clearLongPressTimer()
    longPressTimer.current = window.setTimeout(() => {
      ignoreNextClick.current = true
      onStartPlacement(item)
    }, 425)
  }

  function handlePointerMove(event) {
    const xDistance = Math.abs(event.clientX - pointerStart.current.x)
    const yDistance = Math.abs(event.clientY - pointerStart.current.y)

    if (xDistance > 12 || yDistance > 12) {
      clearLongPressTimer()
    }
  }

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
      className={`no-touch-callout relative flex min-h-9 cursor-pointer touch-manipulation select-none items-center gap-1 rounded-xl px-1.5 py-1 shadow-sm transition active:scale-[0.98] ${
        isEditMode ? 'planner-meal-editing' : ''
      } ${meal.cardColor}`}
      onClick={(event) => {
        event.stopPropagation()

        if (ignoreNextClick.current) {
          ignoreNextClick.current = false
          return
        }

        if (isEditMode) {
          if (canPlaceInSlot) {
            onPlaceInSlot(item.day, item.mealSlot)
          }
          return
        }

        onOpenRecipe(item)
      }}
      onContextMenu={(event) => event.preventDefault()}
      onKeyDown={handleKeyDown}
      onPointerCancel={clearLongPressTimer}
      onPointerDown={handlePointerDown}
      onPointerLeave={clearLongPressTimer}
      onPointerMove={handlePointerMove}
      onPointerUp={clearLongPressTimer}
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
  canPlaceInSlot,
  day,
  isEditMode,
  meal,
  items,
  onDeleteMeal,
  onExitEditMode,
  onOpenActions,
  onOpenRecipe,
  onPlaceMeal,
  onStartPlacement,
  showHeading,
}) {
  return (
    <div className="min-w-0">
      {showHeading && <MealHeading meal={meal} />}

      <div
        className={`min-h-10 space-y-1 rounded-2xl transition ${
          isEditMode ? 'bg-[#EAF3DE]/45 ring-2 ring-[#A8C686]/70' : ''
        }`}
        onClick={(event) => {
          if (isEditMode) {
            event.stopPropagation()

            if (!canPlaceInSlot) {
              onExitEditMode()
              return
            }

            onPlaceMeal(day.weekday, meal.key)
          }
        }}
      >
        {items.map((item, index) => (
          <MealCard
            canPlaceInSlot={canPlaceInSlot}
            index={index}
            isEditMode={isEditMode}
            item={item}
            key={getMealItemId(item)}
            meal={meal}
            onDeleteMeal={onDeleteMeal}
            onOpenActions={onOpenActions}
            onOpenRecipe={onOpenRecipe}
            onPlaceInSlot={onPlaceMeal}
            onStartPlacement={onStartPlacement}
          />
        ))}
      </div>
    </div>
  )
}

function DayCard({
  canPlaceInSlot,
  day,
  isEditMode,
  onDeleteMeal,
  onExitEditMode,
  onOpenActions,
  onOpenRecipe,
  onPlaceMeal,
  onStartPlacement,
  showMealHeadings,
}) {
  return (
    <article
      className="rounded-3xl border border-stone-100 bg-white p-2 shadow-[0_8px_24px_rgba(30,41,59,0.05)]"
      onClick={(event) => {
        if (isEditMode) {
          event.stopPropagation()
          onExitEditMode()
        }
      }}
    >
      <div
        className="grid grid-cols-[3.35rem_repeat(3,minmax(0,1fr))] gap-1.5"
        onClick={(event) => {
          if (isEditMode && event.target === event.currentTarget) {
            event.stopPropagation()
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
            canPlaceInSlot={canPlaceInSlot}
            day={day}
            isEditMode={isEditMode}
            key={meal.key}
            meal={meal}
            items={day.meals[meal.key]}
            onDeleteMeal={onDeleteMeal}
            onExitEditMode={onExitEditMode}
            onOpenActions={onOpenActions}
            onOpenRecipe={onOpenRecipe}
            onPlaceMeal={onPlaceMeal}
            onStartPlacement={onStartPlacement}
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

function getQueueRecipe(queueItem, recipes) {
  return recipes.find(
    (recipe) => (recipe.id || recipe.name) === queueItem.recipeId,
  )
}

function getQueueDisplay(queueItem, recipes) {
  const recipe = getQueueRecipe(queueItem, recipes)

  return {
    image: recipe?.image || queueItem.image,
    icon: recipe?.icon || queueItem.icon || '🍽️',
    name: recipe?.name || queueItem.recipeName || 'Recipe',
    servings: queueItem.plannedServings || recipe?.servings || 1,
  }
}

function WeeklyQueueSection({
  activeQueueItem,
  items,
  onOpenActions,
  onSelectItem,
  recipes,
}) {
  if (items.length === 0) {
    return null
  }

  return (
    <section className="mt-4 rounded-3xl border border-stone-100 bg-white/80 p-3 shadow-[0_8px_24px_rgba(30,41,59,0.05)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-stone-900">Meals This Week</p>
          <p className="text-xs font-semibold text-stone-500">
            Tap a meal, then tap a planner slot.
          </p>
        </div>
        <span className="rounded-full bg-[#EAF3DE] px-3 py-1 text-xs font-bold text-[#5A8D2B]">
          {items.length}
        </span>
      </div>

      <div className="no-scrollbar -mx-3 mt-3 overflow-x-auto px-3 pb-1">
        <div className="flex w-max gap-2.5">
          {items.map((item) => {
            const display = getQueueDisplay(item, recipes)
            const isActive = activeQueueItem?.id === item.id

            return (
              <article
                className={`no-touch-callout relative flex w-40 shrink-0 items-center gap-2 rounded-2xl border bg-[#FAF8F3] p-2 text-left shadow-sm transition active:scale-[0.98] ${
                  isActive
                    ? 'border-[#A8C686] ring-2 ring-[#EAF3DE]'
                    : 'border-stone-100'
                }`}
                key={item.id}
              >
                <button
                  className="flex min-w-0 flex-1 items-center gap-2 text-left"
                  onClick={() => onSelectItem(item)}
                  type="button"
                >
                  {display.image ? (
                    <img
                      alt=""
                      className="h-10 w-10 shrink-0 rounded-xl object-cover"
                      src={display.image}
                    />
                  ) : (
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-lg">
                      {display.icon}
                    </span>
                  )}

                  <span className="min-w-0">
                    <span className="line-clamp-2 text-xs font-bold leading-tight text-stone-900">
                      {display.name}
                    </span>
                    <span className="mt-0.5 block text-[0.68rem] font-bold text-[#5A8D2B]">
                      Serves {display.servings}
                    </span>
                  </span>
                </button>

                <button
                  aria-label={`Queue actions for ${display.name}`}
                  className="flex h-8 w-6 shrink-0 items-center justify-center text-stone-500"
                  onClick={() => onOpenActions(item)}
                  type="button"
                >
                  <MoreVertical size={16} />
                </button>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function QueueActionsSheet({
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
  const [plannedMeals, setPlannedMeals] = useState(() => getPlannedMeals())
  const [weeklyQueueItems, setWeeklyQueueItems] = useState(() =>
    getWeeklyQueueItems(),
  )
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
  const [placementSelection, setPlacementSelection] = useState(null)
  const [activeQueueItem, setActiveQueueItem] = useState(null)
  const [lastRemovedMeal, setLastRemovedMeal] = useState(null)
  const [selectedMeal, setSelectedMeal] = useState(null)
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
  const isEditMode = Boolean(placementSelection)
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

  function createPlannedMealFromRecipe(recipe, day, mealSlot, plannedServings) {
    return {
      id: createLocalId('planned-meal'),
      day,
      mealSlot,
      recipeName: recipe.name,
      recipeId: recipe.id || recipe.name,
      plannedServings: Number(plannedServings) || recipe.servings || 1,
      icon:
        recipe.icon ||
        getMealIcon({
          mealSlot,
          mealType: recipe.mealType,
          name: recipe.name,
        }),
    }
  }

  function placeQueuedMeal(queueItem, day, mealSlot) {
    const recipe = getQueueRecipe(queueItem, availableRecipes)
    const plannedMeal = recipe
      ? createPlannedMealFromRecipe(
          recipe,
          day,
          mealSlot,
          queueItem.plannedServings || recipe.servings,
        )
      : {
          id: createLocalId('planned-meal'),
          day,
          mealSlot,
          recipeName: queueItem.recipeName,
          recipeId: queueItem.recipeId,
          plannedServings: Number(queueItem.plannedServings) || 1,
          icon:
            queueItem.icon ||
            getMealIcon({
              mealSlot,
              mealType: queueItem.mealType,
              name: queueItem.recipeName,
            }),
        }

    setPlannedMeals(savePlannedMeal(plannedMeal))
    setWeeklyQueueItems(removeWeeklyQueueItem(queueItem.id))
  }

  function startPlacementFromQueue(queueItem) {
    setPlacementSelection({
      type: 'queue',
      item: queueItem,
    })
    setActiveQueueItem(null)
    setLastRemovedMeal(null)
  }

  function startPlacementFromMeal(item, mode = 'delete') {
    setPlacementSelection({
      type: 'meal',
      item,
      mode,
    })
    setActiveMealModal('')
    setSelectedMeal(null)
    setLastRemovedMeal(null)
  }

  function placeSelectionInSlot(day, mealSlot) {
    if (!placementSelection) {
      return
    }

    if (placementSelection.type === 'queue') {
      placeQueuedMeal(placementSelection.item, day, mealSlot)
    }

    if (placementSelection.type === 'meal') {
      moveMealToSlot(placementSelection.item, day, mealSlot)
      if (placementSelection.item.plannedMealId) {
        setPlacementSelection({
          type: 'meal',
          item: {
            ...placementSelection.item,
            day,
            mealSlot,
          },
          mode: placementSelection.mode,
        })
        return
      }
    }

    if (placementSelection.type === 'queue') {
      setPlacementSelection(null)
    }
  }

  function duplicateQueueItem() {
    if (!activeQueueItem) {
      return
    }

    setWeeklyQueueItems(duplicateWeeklyQueueItem(activeQueueItem.id))
    setActiveQueueItem(null)
  }

  function removeQueueItem() {
    if (!activeQueueItem) {
      return
    }

    setWeeklyQueueItems(removeWeeklyQueueItem(activeQueueItem.id))
    if (placementSelection?.item?.id === activeQueueItem.id) {
      setPlacementSelection(null)
    }
    setActiveQueueItem(null)
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

  useEffect(() => {
    if (!lastRemovedMeal) {
      return undefined
    }

    const timeoutId = window.setTimeout(() => {
      setLastRemovedMeal(null)
    }, 3500)

    return () => window.clearTimeout(timeoutId)
  }, [lastRemovedMeal])

  const selectedMealRecipe = selectedMeal
    ? getRecipeForMealItem(selectedMeal, availableRecipes)
    : null
  const shouldShowPlannerGrid =
    plannedMealCount > 0 ||
    weeklyQueueItems.length > 0 ||
    Boolean(placementSelection)
  const canPlaceInSlot =
    placementSelection?.type === 'queue' || placementSelection?.mode === 'move'

  return (
    <section
      className="relative"
      onClick={(event) => {
        if (lastRemovedMeal && event.target === event.currentTarget) {
          setLastRemovedMeal(null)
        }

        if (isEditMode && event.target === event.currentTarget) {
          setPlacementSelection(null)
        }
      }}
    >
      <PlannerHeader
        mealCount={plannedMealCount}
        onOpenSettings={openPlannerSettings}
        weekRange={weekRange}
        weekStartLabel={weekStartLabel}
      />

      <WeeklyQueueSection
        activeQueueItem={
          placementSelection?.type === 'queue' ? placementSelection.item : null
        }
        items={weeklyQueueItems}
        onOpenActions={setActiveQueueItem}
        onSelectItem={startPlacementFromQueue}
        recipes={availableRecipes}
      />

      {placementSelection && (
        <div className="mt-3 flex items-center justify-between gap-3 rounded-3xl border border-[#A8C686]/60 bg-[#EAF3DE] px-4 py-3 text-[#5A8D2B] shadow-sm">
          <p className="text-sm font-bold">
            Tap a planner slot to place {placementSelection.item.recipeName || placementSelection.item.name}.
          </p>
          <button
            className="rounded-full bg-white px-3 py-1.5 text-xs font-bold shadow-sm"
            onClick={() => setPlacementSelection(null)}
            type="button"
          >
            Cancel
          </button>
        </div>
      )}

      <WeekControls
        days={displayedPlannerDays}
        isEditMode={isEditMode}
        onExitEditMode={() => setPlacementSelection(null)}
        onOpenSettings={openPlannerSettings}
        onShowComingSoon={() =>
          setComingSoonMessage(multiWeekComingSoonMessage)
        }
      />

      {shouldShowPlannerGrid ? (
        <div className="mt-3 space-y-2.5 pb-24">
          {plannerDaysWithSavedMeals.map((day, index) => (
            <DayCard
              canPlaceInSlot={canPlaceInSlot}
              day={day}
              isEditMode={isEditMode}
              key={day.weekday}
              onDeleteMeal={deleteMealWithUndo}
              onExitEditMode={() => setPlacementSelection(null)}
              onOpenActions={openMealActions}
              onOpenRecipe={openMealRecipe}
              onPlaceMeal={placeSelectionInSlot}
              onStartPlacement={startPlacementFromMeal}
              showMealHeadings={index === 0}
            />
          ))}
        </div>
      ) : (
        <div className="mt-4">
          <EmptyState icon={CalendarDays} title="No meals planned">
            Add meals to your weekly queue to start building your week.
          </EmptyState>
        </div>
      )}

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
        onMove={() => startPlacementFromMeal(selectedMeal, 'move')}
        onRemove={() => removeMealFromPlanner(selectedMeal)}
        onViewRecipe={viewSelectedMealRecipe}
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

      <QueueActionsSheet
        item={activeQueueItem}
        onClose={() => setActiveQueueItem(null)}
        onDuplicate={duplicateQueueItem}
        onPlace={() => startPlacementFromQueue(activeQueueItem)}
        onRemove={removeQueueItem}
        recipes={availableRecipes}
      />

      <ComingSoonSheet
        message={comingSoonMessage}
        onClose={() => setComingSoonMessage('')}
        title="Multi-week planning"
      />
    </section>
  )
}

export default Planner
