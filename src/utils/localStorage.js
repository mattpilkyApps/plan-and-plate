import { getCurrentWeekKey } from './plannerWeeks.js'
import { datedMeals, mealsInWeek, replaceWeekMeals } from './plannerData.js'

const SAVED_RECIPES_KEY = 'plan-and-plate-recipes'
const PLANNED_MEALS_KEY = 'plan-and-plate-planned-meals'
const PLANNED_MEALS_BY_WEEK_KEY = 'plan-and-plate-planned-meals-by-week'
const WEEKLY_QUEUE_KEY = 'plan-and-plate-weekly-queue'
const CLEARED_SHOPPING_ITEMS_KEY = 'plan-and-plate-cleared-shopping-items'
const MANUAL_SHOPPING_ITEMS_KEY = 'plan-and-plate-manual-shopping-items'
const REMOVED_PLANNER_MEALS_KEY = 'plan-and-plate-removed-planner-meals'
const REMOVED_RECIPES_KEY = 'plan-and-plate-removed-recipes'
const PLANNER_SETTINGS_KEY = 'plan-and-plate-planner-settings'
const RECIPE_METADATA_KEY = 'plan-and-plate-recipe-metadata'
const RECIPE_SORT_KEY = 'plan-and-plate-recipe-sort'
const DEFAULT_RECIPE_SORT = 'Recently Added'

const defaultPlannerSettings = {
  weekStartDay: 'MON',
  selectedWeekStartDate: '',
}

const defaultRecipeStats = {
  favourite: false,
  timesUsed: 0,
  lastUsed: '',
}

function readFromStorage(key, fallbackValue) {
  let storedValue

  try {
    storedValue = window.localStorage.getItem(key)
  } catch {
    return fallbackValue
  }

  if (!storedValue) {
    return fallbackValue
  }

  try {
    const parsed = JSON.parse(storedValue)
    if (Array.isArray(fallbackValue))
      return Array.isArray(parsed) ? parsed : fallbackValue
    if (fallbackValue && typeof fallbackValue === 'object')
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? parsed
        : fallbackValue
    return typeof parsed === typeof fallbackValue ? parsed : fallbackValue
  } catch {
    return fallbackValue
  }
}

function writeToStorage(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    window.dispatchEvent?.(new Event('plan-and-plate-storage-error'))
    return false
  }
}

export function createLocalId(prefix) {
  if (window.crypto?.randomUUID) {
    return `${prefix}-${window.crypto.randomUUID()}`
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function getSavedRecipes() {
  return readFromStorage(SAVED_RECIPES_KEY, [])
}

function getRecipeStorageId(recipe) {
  return recipe?.id || recipe?.name || ''
}

export function getRecipeMetadata() {
  return readFromStorage(RECIPE_METADATA_KEY, {})
}

export function getRecipeStats(recipeId, metadata = getRecipeMetadata()) {
  return {
    ...defaultRecipeStats,
    ...(metadata[recipeId] || {}),
  }
}

export function isRecipeFavourite(recipeId, metadata = getRecipeMetadata()) {
  return getRecipeStats(recipeId, metadata).favourite
}

export function toggleRecipeFavourite(recipeId) {
  const metadata = getRecipeMetadata()
  const currentStats = getRecipeStats(recipeId, metadata)
  const nextMetadata = {
    ...metadata,
    [recipeId]: {
      ...currentStats,
      favourite: !currentStats.favourite,
    },
  }
  const didSave = writeToStorage(RECIPE_METADATA_KEY, nextMetadata)

  if (!didSave) {
    return metadata
  }

  return nextMetadata
}

export function markRecipeUsed(recipeId) {
  const metadata = getRecipeMetadata()
  const currentStats = getRecipeStats(recipeId, metadata)
  const nextMetadata = {
    ...metadata,
    [recipeId]: {
      ...currentStats,
      timesUsed: (Number(currentStats.timesUsed) || 0) + 1,
      lastUsed: new Date().toISOString(),
    },
  }
  const didSave = writeToStorage(RECIPE_METADATA_KEY, nextMetadata)

  if (!didSave) {
    return metadata
  }

  return nextMetadata
}

export function withRecipeStats(recipe, metadata = getRecipeMetadata()) {
  return {
    ...recipe,
    ...getRecipeStats(getRecipeStorageId(recipe), metadata),
  }
}

export function withRecipeStatsList(recipes, metadata = getRecipeMetadata()) {
  return recipes.map((recipe) => withRecipeStats(recipe, metadata))
}

export function getFavouriteRecipes(recipes, metadata = getRecipeMetadata()) {
  return recipes.filter((recipe) =>
    isRecipeFavourite(getRecipeStorageId(recipe), metadata),
  )
}

export function getRecipeSortOption() {
  return readFromStorage(RECIPE_SORT_KEY, DEFAULT_RECIPE_SORT)
}

export function saveRecipeSortOption(sortOption) {
  const didSave = writeToStorage(RECIPE_SORT_KEY, sortOption)

  if (!didSave) {
    return getRecipeSortOption()
  }

  return sortOption
}

export function saveRecipe(recipe) {
  const savedRecipes = getSavedRecipes()
  const nextRecipes = [
    recipe,
    ...savedRecipes.filter((savedRecipe) => savedRecipe.id !== recipe.id),
  ]
  const didSave = writeToStorage(SAVED_RECIPES_KEY, nextRecipes)

  if (!didSave) {
    return savedRecipes
  }

  return nextRecipes
}

export function updateSavedRecipe(updatedRecipe) {
  const savedRecipes = getSavedRecipes()
  const recipeAlreadyExists = savedRecipes.some(
    (recipe) => recipe.id === updatedRecipe.id,
  )
  const nextRecipes = recipeAlreadyExists
    ? savedRecipes.map((recipe) =>
        recipe.id === updatedRecipe.id ? updatedRecipe : recipe,
      )
    : [updatedRecipe, ...savedRecipes]
  const didSave = writeToStorage(SAVED_RECIPES_KEY, nextRecipes)

  if (!didSave) {
    return savedRecipes
  }

  syncPlannedMealsForRecipe(updatedRecipe)
  syncWeeklyQueueForRecipe(updatedRecipe)
  saveRemovedRecipeIds(
    getRemovedRecipeIds().filter((recipeId) => recipeId !== updatedRecipe.id),
  )

  return nextRecipes
}

export function deleteSavedRecipe(recipeId) {
  const savedRecipes = getSavedRecipes()
  const nextRecipes = savedRecipes.filter((recipe) => recipe.id !== recipeId)
  const didSave = writeToStorage(SAVED_RECIPES_KEY, nextRecipes)

  if (!didSave) {
    return savedRecipes
  }

  removePlannedMealsForRecipe(recipeId)
  removeWeeklyQueueItemsForRecipe(recipeId)
  saveRemovedRecipeIds([...getRemovedRecipeIds(), recipeId])

  return nextRecipes
}

export function getRemovedRecipeIds() {
  return readFromStorage(REMOVED_RECIPES_KEY, [])
}

export function saveRemovedRecipeIds(recipeIds) {
  const uniqueRecipeIds = [...new Set(recipeIds)]
  const didSave = writeToStorage(REMOVED_RECIPES_KEY, uniqueRecipeIds)

  if (!didSave) {
    return getRemovedRecipeIds()
  }

  return uniqueRecipeIds
}

export function getPlannedMeals() {
  return readFromStorage(PLANNED_MEALS_KEY, [])
}

function getPlannedMealsByWeek() {
  return readFromStorage(PLANNED_MEALS_BY_WEEK_KEY, {})
}

export function savePlannedMealsForWeek(weekKey, plannedMeals) {
  const plannedMealsByWeek = getCompatiblePlanBuckets()
  // A single atomic write preserves dates outside this visible week, including
  // records in overlapping legacy buckets after a week-start preference change.
  const nextPlannedMealsByWeek = replaceWeekMeals(
    plannedMealsByWeek,
    weekKey,
    plannedMeals,
  )
  const backupKey = 'plan-and-plate-plans-before-v2'
  try {
    if (!window.localStorage.getItem(backupKey)) {
      window.localStorage.setItem(backupKey, JSON.stringify(plannedMealsByWeek))
    }
  } catch {
    window.dispatchEvent?.(new Event('plan-and-plate-storage-error'))
    return getPlannedMealsForWeek(weekKey)
  }
  const didSave = writeToStorage(
    PLANNED_MEALS_BY_WEEK_KEY,
    nextPlannedMealsByWeek,
  )

  if (!didSave) {
    return getPlannedMealsForWeek(weekKey)
  }

  return mealsInWeek(nextPlannedMealsByWeek, weekKey)
}

function getCompatiblePlanBuckets() {
  const plannedMealsByWeek = getPlannedMealsByWeek()
  if (Object.keys(plannedMealsByWeek).length > 0) {
    return plannedMealsByWeek
  }
  const settings = getPlannerSettings()
  const anchor =
    settings.selectedWeekStartDate || getCurrentWeekKey(settings.weekStartDay)
  return { [anchor]: datedMeals(getPlannedMeals(), anchor) }
}

export function getPlannedMealsForWeek(weekKey) {
  if (!weekKey) return getPlannedMeals()
  return mealsInWeek(getCompatiblePlanBuckets(), weekKey)
}

export function savePlannedMeal(plannedMeal, weekKey) {
  const plannedMeals = weekKey
    ? getPlannedMealsForWeek(weekKey)
    : getPlannedMeals()
  const nextPlannedMeals = [plannedMeal, ...plannedMeals]

  if (weekKey) {
    return savePlannedMealsForWeek(weekKey, nextPlannedMeals)
  }

  const didSave = writeToStorage(PLANNED_MEALS_KEY, nextPlannedMeals)

  if (!didSave) {
    return plannedMeals
  }

  return nextPlannedMeals
}

export function removePlannedMeal(plannedMealId) {
  const plannedMeals = getPlannedMeals()
  const nextPlannedMeals = plannedMeals.filter(
    (plannedMeal) => plannedMeal.id !== plannedMealId,
  )
  const didSave = writeToStorage(PLANNED_MEALS_KEY, nextPlannedMeals)

  if (!didSave) {
    return plannedMeals
  }

  return nextPlannedMeals
}

export function removePlannedMealFromWeek(plannedMealId, weekKey) {
  if (!weekKey) {
    return removePlannedMeal(plannedMealId)
  }

  const plannedMeals = getPlannedMealsForWeek(weekKey)
  const nextPlannedMeals = plannedMeals.filter(
    (plannedMeal) => plannedMeal.id !== plannedMealId,
  )

  return savePlannedMealsForWeek(weekKey, nextPlannedMeals)
}

export function updatePlannedMeal(updatedMeal, weekKey) {
  const plannedMeals = weekKey
    ? getPlannedMealsForWeek(weekKey)
    : getPlannedMeals()
  const nextPlannedMeals = plannedMeals.map((plannedMeal) =>
    plannedMeal.id === updatedMeal.id ? updatedMeal : plannedMeal,
  )

  if (weekKey) {
    return savePlannedMealsForWeek(weekKey, nextPlannedMeals)
  }

  const didSave = writeToStorage(PLANNED_MEALS_KEY, nextPlannedMeals)

  if (!didSave) {
    return plannedMeals
  }

  return nextPlannedMeals
}

export function getWeeklyQueueItems() {
  return readFromStorage(WEEKLY_QUEUE_KEY, [])
}

export function saveWeeklyQueueItem(queueItem) {
  const queueItems = getWeeklyQueueItems()
  const nextQueueItems = [queueItem, ...queueItems]
  const didSave = writeToStorage(WEEKLY_QUEUE_KEY, nextQueueItems)

  if (!didSave) {
    return queueItems
  }

  return nextQueueItems
}

export function duplicateWeeklyQueueItem(queueItemId) {
  const queueItems = getWeeklyQueueItems()
  const queueItem = queueItems.find((item) => item.id === queueItemId)

  if (!queueItem) {
    return queueItems
  }

  const copiedQueueItem = {
    ...queueItem,
    id: createLocalId('weekly-queue'),
  }
  const nextQueueItems = [copiedQueueItem, ...queueItems]
  const didSave = writeToStorage(WEEKLY_QUEUE_KEY, nextQueueItems)

  if (!didSave) {
    return queueItems
  }

  return nextQueueItems
}

export function removeWeeklyQueueItem(queueItemId) {
  const queueItems = getWeeklyQueueItems()
  const nextQueueItems = queueItems.filter((item) => item.id !== queueItemId)
  const didSave = writeToStorage(WEEKLY_QUEUE_KEY, nextQueueItems)

  if (!didSave) {
    return queueItems
  }

  return nextQueueItems
}

function syncWeeklyQueueForRecipe(recipe) {
  const queueItems = getWeeklyQueueItems()
  const nextQueueItems = queueItems.map((item) => {
    if (item.recipeId !== recipe.id) {
      return item
    }

    return {
      ...item,
      recipeName: recipe.name,
      icon: recipe.icon || item.icon,
      image: recipe.image,
      mealType: recipe.mealType || item.mealType,
    }
  })

  writeToStorage(WEEKLY_QUEUE_KEY, nextQueueItems)
}

function removeWeeklyQueueItemsForRecipe(recipeId) {
  const queueItems = getWeeklyQueueItems()
  const nextQueueItems = queueItems.filter((item) => item.recipeId !== recipeId)

  writeToStorage(WEEKLY_QUEUE_KEY, nextQueueItems)
}

function syncPlannedMealsForRecipe(recipe) {
  const plannedMeals = getPlannedMeals()
  const nextPlannedMeals = plannedMeals.map((plannedMeal) => {
    if (plannedMeal.recipeId !== recipe.id) {
      return plannedMeal
    }

    return {
      ...plannedMeal,
      recipeName: recipe.name,
      icon: recipe.icon || plannedMeal.icon,
      image: recipe.image,
    }
  })

  writeToStorage(PLANNED_MEALS_KEY, nextPlannedMeals)

  const plannedMealsByWeek = getPlannedMealsByWeek()
  const nextPlannedMealsByWeek = Object.fromEntries(
    Object.entries(plannedMealsByWeek).map(([weekKey, weekMeals]) => [
      weekKey,
      weekMeals.map((plannedMeal) => {
        if (plannedMeal.recipeId !== recipe.id) {
          return plannedMeal
        }

        return {
          ...plannedMeal,
          recipeName: recipe.name,
          icon: recipe.icon || plannedMeal.icon,
          image: recipe.image,
        }
      }),
    ]),
  )

  writeToStorage(PLANNED_MEALS_BY_WEEK_KEY, nextPlannedMealsByWeek)
}

function removePlannedMealsForRecipe(recipeId) {
  const plannedMeals = getPlannedMeals()
  const nextPlannedMeals = plannedMeals.filter(
    (plannedMeal) => plannedMeal.recipeId !== recipeId,
  )

  writeToStorage(PLANNED_MEALS_KEY, nextPlannedMeals)

  const plannedMealsByWeek = getPlannedMealsByWeek()
  const nextPlannedMealsByWeek = Object.fromEntries(
    Object.entries(plannedMealsByWeek).map(([weekKey, weekMeals]) => [
      weekKey,
      weekMeals.filter((plannedMeal) => plannedMeal.recipeId !== recipeId),
    ]),
  )

  writeToStorage(PLANNED_MEALS_BY_WEEK_KEY, nextPlannedMealsByWeek)
}

export function getClearedShoppingItemIds() {
  return readFromStorage(CLEARED_SHOPPING_ITEMS_KEY, [])
}

export function saveClearedShoppingItemIds(itemIds) {
  const didSave = writeToStorage(CLEARED_SHOPPING_ITEMS_KEY, itemIds)

  if (!didSave) {
    return getClearedShoppingItemIds()
  }

  return itemIds
}

export function getManualShoppingItems() {
  return readFromStorage(MANUAL_SHOPPING_ITEMS_KEY, [])
}

export function updateManualShoppingItem(updatedItem) {
  const items = getManualShoppingItems()
  const next = items.map((item) =>
    item.id === updatedItem.id ? updatedItem : item,
  )
  return writeToStorage(MANUAL_SHOPPING_ITEMS_KEY, next) ? next : items
}

export function getCheckedShoppingItemIds() {
  return readFromStorage('plan-and-plate-checked-shopping-items', [])
}

export function saveCheckedShoppingItemIds(ids) {
  return writeToStorage('plan-and-plate-checked-shopping-items', ids)
    ? ids
    : getCheckedShoppingItemIds()
}

export function saveManualShoppingItem(item) {
  const manualItems = getManualShoppingItems()
  const nextManualItems = [item, ...manualItems]
  const didSave = writeToStorage(MANUAL_SHOPPING_ITEMS_KEY, nextManualItems)

  if (!didSave) {
    return manualItems
  }

  return nextManualItems
}

export function deleteManualShoppingItem(itemId) {
  const manualItems = getManualShoppingItems()
  const nextManualItems = manualItems.filter((item) => item.id !== itemId)
  const didSave = writeToStorage(MANUAL_SHOPPING_ITEMS_KEY, nextManualItems)

  if (!didSave) {
    return manualItems
  }

  return nextManualItems
}

export function deleteManualShoppingItems(itemIds) {
  const manualItems = getManualShoppingItems()
  const nextManualItems = manualItems.filter(
    (item) => !itemIds.includes(item.id),
  )
  const didSave = writeToStorage(MANUAL_SHOPPING_ITEMS_KEY, nextManualItems)

  if (!didSave) {
    return manualItems
  }

  return nextManualItems
}

export function getRemovedPlannerMealIds() {
  return readFromStorage(REMOVED_PLANNER_MEALS_KEY, [])
}

export function saveRemovedPlannerMealIds(mealIds) {
  const didSave = writeToStorage(REMOVED_PLANNER_MEALS_KEY, mealIds)

  if (!didSave) {
    return getRemovedPlannerMealIds()
  }

  return mealIds
}

export function getPlannerSettings() {
  return {
    ...defaultPlannerSettings,
    ...readFromStorage(PLANNER_SETTINGS_KEY, defaultPlannerSettings),
  }
}

export function savePlannerSettings(settings) {
  // The legacy single-week fallback must be anchored before a navigation or
  // preference write changes its reference week. The old key is never deleted.
  if (
    getPlannedMeals().length &&
    Object.keys(getPlannedMealsByWeek()).length === 0
  ) {
    const current = getPlannerSettings()
    const anchor =
      current.selectedWeekStartDate || getCurrentWeekKey(current.weekStartDay)
    savePlannedMealsForWeek(anchor, datedMeals(getPlannedMeals(), anchor))
    if (Object.keys(getPlannedMealsByWeek()).length === 0) return current
  }
  const nextSettings = {
    ...getPlannerSettings(),
    ...settings,
  }
  const didSave = writeToStorage(PLANNER_SETTINGS_KEY, nextSettings)

  if (!didSave) {
    return getPlannerSettings()
  }

  return nextSettings
}
