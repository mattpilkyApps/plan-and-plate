import { useState } from 'react'
import { recipes as samples } from '../data/sampleData'
import { createLocalId, getPlannerSettings, getPlannedMealsForWeek, getRemovedRecipeIds, getSavedRecipes, getWeeklyQueueItems, markRecipeUsed, removeWeeklyQueueItem, savePlannerSettings, savePlannedMealsForWeek } from '../utils/localStorage'
import { getCurrentWeekKey, getDisplayDaysForWeek, shiftWeekKey } from '../utils/plannerWeeks'
import { getVisibleRecipes } from '../utils/recipeKeys'
import { copyMealsToNextWeek, relocateMeal } from '../utils/plannerData'

export default function usePlanner() {
  const [weekKey, setWeekKey] = useState(() => {
    const settings = getPlannerSettings()
    return settings.selectedWeekStartDate || getCurrentWeekKey(settings.weekStartDay)
  })
  const [meals, setMeals] = useState(() => getPlannedMealsForWeek(weekKey))
  const [queue, setQueue] = useState(getWeeklyQueueItems)
  const [recipes] = useState(() => getVisibleRecipes(getSavedRecipes(), samples, getRemovedRecipeIds()))
  const [view, setView] = useState(() => getPlannerSettings().plannerView || 'dinners')
  const days = getDisplayDaysForWeek(weekKey)
  const currentWeekKey = getCurrentWeekKey(getPlannerSettings().weekStartDay)

  function commit(next, targetWeek = weekKey) {
    const saved = savePlannedMealsForWeek(targetWeek, next)
    const success = saved.length === next.length && next.every((meal) => saved.some((record) =>
      record.id === meal.id && Object.entries(meal).every(([key, value]) => record[key] === value)))
    if (targetWeek === weekKey) setMeals(saved)
    return success
  }
  function navigateWeek(key) {
    // Resolve any legacy single-week data before changing its saved anchor.
    const next = getPlannedMealsForWeek(key)
    const saved = savePlannerSettings({ selectedWeekStartDate: key })
    if (saved.selectedWeekStartDate !== key) return
    setWeekKey(key)
    setMeals(next)
  }
  function changeView(next) { setView(next); savePlannerSettings({ plannerView: next }) }
  function saveEntry(entry, slot) {
    const recipe = entry.recipe
    const meal = {
      ...(slot.editMeal || {}), id: slot.editMeal?.id || createLocalId('planned-meal'),
      day: slot.day.weekday, dateKey: slot.day.dateKey, mealSlot: slot.mealSlot,
      recipeName: entry.name.trim(), recipeId: recipe ? recipe.id || recipe.name : null,
      plannedServings: Number(entry.servings) || 4, image: recipe?.image || '', icon: recipe?.icon || '',
    }
    const next = slot.editMeal ? meals.map((item) => item.id === meal.id ? meal : item) : [...meals, meal]
    const saved = commit(next)
    if (saved && recipe && slot.editMeal?.recipeId !== meal.recipeId) markRecipeUsed(meal.recipeId)
    return saved
  }
  function placeQueue(item, destination) {
    const recipe = recipes.find((recipe) => (recipe.id || recipe.name) === item.recipeId)
    const meal = { ...item, id: createLocalId('planned-meal'), ...destination, image: recipe?.image || item.image || '', usageTracked: true }
    if (!commit([...meals, meal])) return false
    if (!item.usageTracked && item.recipeId) markRecipeUsed(item.recipeId)
    setQueue(removeWeeklyQueueItem(item.id))
    return true
  }
  function move(id, destination, mode) { return commit(relocateMeal(meals, id, destination, mode, createLocalId('planned-meal'))) }
  function copyWeek() {
    const nextKey = shiftWeekKey(weekKey, 1)
    const copied = copyMealsToNextWeek(meals, () => createLocalId('planned-meal'))
    if (!commit(copied, nextKey)) return false
    navigateWeek(nextKey)
    return true
  }
  return { weekKey, currentWeekKey, meals, queue, recipes, days, view, changeView, navigateWeek, saveEntry, commit, move, copyWeek, placeQueue, removeQueue: (id) => setQueue(removeWeeklyQueueItem(id)) }
}
