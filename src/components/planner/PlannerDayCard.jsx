import { MoreVertical, X } from 'lucide-react'
import { getMealItemId, mealTypes } from './plannerUiHelpers'

function MealHeading({ meal }) {
  const Icon = meal.Icon

  return (
    <div className="mb-1.5 hidden items-center gap-1.5 pl-1 text-sm font-bold text-stone-900 min-[390px]:flex">
      <Icon className={meal.textColor} size={18} />
      <span>{meal.label}</span>
    </div>
  )
}

function MealCard({
  canPlaceInSlot,
  index,
  isEditMode,
  isSelected,
  meal,
  item,
  onDeleteMeal,
  onOpenActions,
  onOpenRecipe,
  onPlaceInSlot,
  onSelectMeal,
}) {
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
      } ${
        isSelected
          ? 'scale-[1.03] ring-2 ring-[#5A8D2B] ring-offset-2 ring-offset-white'
          : ''
      } ${meal.cardColor}`}
      onClick={(event) => {
        event.stopPropagation()

        if (canPlaceInSlot && !isSelected) {
          onPlaceInSlot(item.day, item.mealSlot)
          return
        }

        if (isEditMode) {
          if (!isSelected) {
            onSelectMeal(item)
          }
          return
        }

        onOpenRecipe(item)
      }}
      onContextMenu={(event) => event.preventDefault()}
      onKeyDown={handleKeyDown}
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
      {!isEditMode && !canPlaceInSlot && (
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
  onOpenActions,
  onOpenRecipe,
  onPlaceMeal,
  onSelectMeal,
  selectedMealId,
  showHeading,
}) {
  return (
    <div className="min-w-0">
      {showHeading && <MealHeading meal={meal} />}

      <div
        className={`min-h-10 space-y-1 rounded-2xl transition ${
          canPlaceInSlot
            ? 'bg-[#EAF3DE]/60 ring-2 ring-[#A8C686]/80'
            : isEditMode
              ? 'bg-stone-50'
              : ''
        }`}
        onClick={(event) => {
          if (canPlaceInSlot) {
            event.stopPropagation()
            onPlaceMeal(day.weekday, meal.key)
          }
        }}
      >
        {items.map((item, index) => (
          <MealCard
            canPlaceInSlot={canPlaceInSlot}
            index={index}
            isEditMode={isEditMode}
            isSelected={getMealItemId(item) === selectedMealId}
            item={item}
            key={getMealItemId(item)}
            meal={meal}
            onDeleteMeal={onDeleteMeal}
            onOpenActions={onOpenActions}
            onOpenRecipe={onOpenRecipe}
            onPlaceInSlot={onPlaceMeal}
            onSelectMeal={onSelectMeal}
          />
        ))}
      </div>
    </div>
  )
}

function PlannerDayCard({
  canPlaceInSlot,
  day,
  isEditMode,
  onDeleteMeal,
  onOpenActions,
  onOpenRecipe,
  onPlaceMeal,
  onSelectMeal,
  selectedMealId,
  showMealHeadings,
}) {
  return (
    <article
      className="rounded-3xl border border-stone-100 bg-white p-2 shadow-[0_8px_24px_rgba(30,41,59,0.05)]"
      onClick={(event) => {
        if (isEditMode || canPlaceInSlot) {
          event.stopPropagation()
        }
      }}
    >
      <div
        className="grid grid-cols-[3.35rem_repeat(3,minmax(0,1fr))] gap-1.5"
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
            onOpenActions={onOpenActions}
            onOpenRecipe={onOpenRecipe}
            onPlaceMeal={onPlaceMeal}
            onSelectMeal={onSelectMeal}
            selectedMealId={selectedMealId}
            showHeading={showMealHeadings}
          />
        ))}
      </div>
    </article>
  )
}

export default PlannerDayCard
