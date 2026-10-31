import {
  formatDateKey,
  getDisplayDaysForWeek,
  parseDateKey,
} from './plannerWeeks.js'

// Legacy plans keep their original calendar dates. Reading is non-destructive.
export function datedMeals(meals, weekKey) {
  const days = getDisplayDaysForWeek(weekKey)
  return (Array.isArray(meals) ? meals : []).map((meal) => ({
    ...meal,
    dateKey:
      meal.dateKey ||
      days.find((day) => day.weekday === meal.day)?.dateKey ||
      weekKey,
  }))
}

export function mealsInWeek(buckets, weekKey) {
  const dates = new Set(
    getDisplayDaysForWeek(weekKey).map((day) => day.dateKey),
  )
  return Object.entries(buckets)
    .flatMap(([key, meals]) => datedMeals(meals, key))
    .filter((meal) => dates.has(meal.dateKey))
}

export function replaceWeekMeals(buckets, weekKey, meals) {
  const dates = new Set(
    getDisplayDaysForWeek(weekKey).map((day) => day.dateKey),
  )
  const next = Object.fromEntries(
    Object.entries(buckets).map(([key, saved]) => [
      key,
      datedMeals(saved, key).filter((meal) => !dates.has(meal.dateKey)),
    ]),
  )
  next[weekKey] = [...(next[weekKey] || []), ...datedMeals(meals, weekKey)]
  return next
}

export function relocateMeal(meals, id, destination, mode = 'move', newId) {
  const source = meals.find((meal) => meal.id === id)
  if (!source) return meals
  if (mode === 'duplicate')
    return [...meals, { ...source, ...destination, id: newId }]
  const target =
    mode === 'swap'
      ? meals.find((meal) => meal.id === destination.targetId)
      : null
  return meals.map((meal) => {
    if (meal.id === id)
      return {
        ...meal,
        dateKey: destination.dateKey,
        day: destination.day,
        mealSlot: destination.mealSlot,
      }
    if (target && meal.id === target.id)
      return {
        ...meal,
        dateKey: source.dateKey,
        day: source.day,
        mealSlot: source.mealSlot,
      }
    return meal
  })
}

export function copyMealsToNextWeek(meals, createId) {
  return meals.map((meal) => {
    const date = parseDateKey(meal.dateKey)
    date.setDate(date.getDate() + 7)
    return { ...meal, id: createId(), dateKey: formatDateKey(date) }
  })
}
