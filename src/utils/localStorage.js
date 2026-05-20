const SAVED_RECIPES_KEY = 'plan-and-plate-recipes'
const PLANNED_MEALS_KEY = 'plan-and-plate-planned-meals'
const WEEKLY_QUEUE_KEY = 'plan-and-plate-weekly-queue'
const CLEARED_SHOPPING_ITEMS_KEY = 'plan-and-plate-cleared-shopping-items'
const MANUAL_SHOPPING_ITEMS_KEY = 'plan-and-plate-manual-shopping-items'
const REMOVED_PLANNER_MEALS_KEY = 'plan-and-plate-removed-planner-meals'
const REMOVED_RECIPES_KEY = 'plan-and-plate-removed-recipes'
const PLANNER_SETTINGS_KEY = 'plan-and-plate-planner-settings'

const defaultPlannerSettings = {
  weekStartDay: 'MON',
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
    return JSON.parse(storedValue)
  } catch {
    return fallbackValue
  }
}

function writeToStorage(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
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

export function savePlannedMeal(plannedMeal) {
  const plannedMeals = getPlannedMeals()
  const nextPlannedMeals = [plannedMeal, ...plannedMeals]
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

export function updatePlannedMeal(updatedMeal) {
  const plannedMeals = getPlannedMeals()
  const nextPlannedMeals = plannedMeals.map((plannedMeal) =>
    plannedMeal.id === updatedMeal.id ? updatedMeal : plannedMeal,
  )
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
      image: recipe.image || item.image,
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
    }
  })

  writeToStorage(PLANNED_MEALS_KEY, nextPlannedMeals)
}

function removePlannedMealsForRecipe(recipeId) {
  const plannedMeals = getPlannedMeals()
  const nextPlannedMeals = plannedMeals.filter(
    (plannedMeal) => plannedMeal.recipeId !== recipeId,
  )

  writeToStorage(PLANNED_MEALS_KEY, nextPlannedMeals)
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
