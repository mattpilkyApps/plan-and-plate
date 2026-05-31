import { CalendarDays } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import EmptyState from '../components/EmptyState'
import FloatingActionButton from '../components/FloatingActionButton'
import PlannerDayCard from '../components/planner/PlannerDayCard'
import PlannerHeader from '../components/planner/PlannerHeader'
import {
  MealActionsModal,
  PlannerAddMealModal,
  PlannerSettingsModal,
  QueueActionsSheet,
  ServingsModal,
  UndoMealToast,
} from '../components/planner/PlannerSheets'
import WeekControls from '../components/planner/WeekControls'
import WeeklyQueueSection from '../components/planner/WeeklyQueueSection'
import {
  getMealItemId,
  getQueueRecipe,
  weekdayOptions,
} from '../components/planner/plannerUiHelpers'
import { plannerDays, recipes as sampleRecipes } from '../data/sampleData'
import {
  createLocalId,
  getPlannerSettings,
  getPlannedMealsForWeek,
  getRemovedPlannerMealIds,
  getRemovedRecipeIds,
  getSavedRecipes,
  getWeeklyQueueItems,
  duplicateWeeklyQueueItem,
  markRecipeUsed,
  removePlannedMealFromWeek,
  removeWeeklyQueueItem,
  savePlannerSettings,
  savePlannedMeal,
  savePlannedMealsForWeek,
  saveRemovedPlannerMealIds,
  updatePlannedMeal,
} from '../utils/localStorage'
import { getMealIcon } from '../utils/mealIcons'
import {
  formatDateKey,
  formatPlannerWeekRange,
  getCurrentWeekKey,
  getDisplayDaysForWeek,
  getWeekStartDate,
  parseDateKey,
  shiftWeekKey,
} from '../utils/plannerWeeks'
import { getRecipeKey, getVisibleRecipes } from '../utils/recipeKeys'

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
  const [plannerSettings, setPlannerSettings] = useState(() => {
    const savedSettings = getPlannerSettings()
    const selectedWeekStartDate =
      savedSettings.selectedWeekStartDate ||
      getCurrentWeekKey(savedSettings.weekStartDay)

    return {
      ...savedSettings,
      selectedWeekStartDate,
    }
  })
  const [plannedMeals, setPlannedMeals] = useState(() => {
    const savedSettings = getPlannerSettings()
    const selectedWeekStartDate =
      savedSettings.selectedWeekStartDate ||
      getCurrentWeekKey(savedSettings.weekStartDay)

    return getPlannedMealsForWeek(selectedWeekStartDate)
  })
  const [weeklyQueueItems, setWeeklyQueueItems] = useState(() =>
    getWeeklyQueueItems(),
  )
  const [removedPlannerMealIds, setRemovedPlannerMealIds] = useState(() =>
    getRemovedPlannerMealIds(),
  )
  const [draftPlannerSettings, setDraftPlannerSettings] = useState(() =>
    getPlannerSettings(),
  )
  const [showAddMealModal, setShowAddMealModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [copiedWeekMessage, setCopiedWeekMessage] = useState('')
  const [activeMealModal, setActiveMealModal] = useState('')
  const [placementSelection, setPlacementSelection] = useState(null)
  const [isPlannerEditMode, setIsPlannerEditMode] = useState(false)
  const [selectedEditMeal, setSelectedEditMeal] = useState(null)
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
  const isEditMode = isPlannerEditMode
  const selectedWeekKey =
    plannerSettings.selectedWeekStartDate ||
    getCurrentWeekKey(plannerSettings.weekStartDay)
  const currentWeekKey = getCurrentWeekKey(plannerSettings.weekStartDay)
  const displayedPlannerDays = getDisplayDaysForWeek(selectedWeekKey)
  const showStarterMeals = selectedWeekKey === currentWeekKey

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
    const starterDay = showStarterMeals
      ? plannerDays.find((plannerDay) => plannerDay.weekday === day.weekday)
      : null

    const meals = {
      breakfast: (starterDay?.meals.breakfast || [])
        .map((item, index) => buildStarterMeal(day, 'breakfast', item, index))
        .filter((item) => !removedPlannerMealIds.includes(item.starterMealId)),
      lunch: (starterDay?.meals.lunch || [])
        .map((item, index) => buildStarterMeal(day, 'lunch', item, index))
        .filter((item) => !removedPlannerMealIds.includes(item.starterMealId)),
      dinner: (starterDay?.meals.dinner || [])
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
        image: plannedMeal.image,
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
    if (isPlannerEditMode) {
      return
    }

    setSelectedMeal(item)
    setServingsChoice(item.plannedServings || 1)
    setActiveMealModal('actions')
  }

  function closeMealModals() {
    setActiveMealModal('')
    setSelectedMeal(null)
  }

  function exitPlannerEditMode() {
    setIsPlannerEditMode(false)
    setSelectedEditMeal(null)
  }

  function startPlannerEditMode(item) {
    setIsPlannerEditMode(true)
    setSelectedEditMeal(item || null)
    setPlacementSelection(null)
    setActiveMealModal('')
    setSelectedMeal(null)
    setLastRemovedMeal(null)
  }

  function selectMealInEditMode(item) {
    if (!isPlannerEditMode) {
      return
    }

    setSelectedEditMeal(item)
    setLastRemovedMeal(null)
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
      image: selectedRecipe.image,
      icon:
        selectedRecipe.icon ||
        getMealIcon({
          mealSlot: plannerChoice.mealSlot,
          mealType: selectedRecipe.mealType,
          name: selectedRecipe.name,
        }),
    }

    const nextPlannedMeals = savePlannedMeal(plannedMeal, selectedWeekKey)
    const itemWasSaved = nextPlannedMeals.some(
      (meal) => meal.id === plannedMeal.id,
    )

    if (itemWasSaved) {
      markRecipeUsed(plannedMeal.recipeId)
    }

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
      image: recipe.image,
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
          image: queueItem.image,
          icon:
            queueItem.icon ||
            getMealIcon({
              mealSlot,
              mealType: queueItem.mealType,
              name: queueItem.recipeName,
            }),
        }

    const trackedPlannedMeal = {
      ...plannedMeal,
      usageTracked: true,
    }
    const nextPlannedMeals = savePlannedMeal(trackedPlannedMeal, selectedWeekKey)
    const itemWasSaved = nextPlannedMeals.some(
      (meal) => meal.id === trackedPlannedMeal.id,
    )

    if (itemWasSaved && !queueItem.usageTracked) {
      markRecipeUsed(trackedPlannedMeal.recipeId)
    }

    setPlannedMeals(nextPlannedMeals)
    setWeeklyQueueItems(removeWeeklyQueueItem(queueItem.id))
  }

  function duplicatePlannedMeal(item, day, mealSlot) {
    const recipe = getRecipeForMealItem(item, availableRecipes)
    const plannedMeal = recipe
      ? createPlannedMealFromRecipe(
          recipe,
          day,
          mealSlot,
          item.plannedServings || recipe.servings,
        )
      : {
          id: createLocalId('planned-meal'),
          day,
          mealSlot,
          recipeName: item.name,
          recipeId: item.recipeId,
          plannedServings: Number(item.plannedServings) || 1,
          image: item.image,
          icon:
            item.icon ||
            getMealIcon({
              mealSlot,
              name: item.name,
            }),
        }

    const nextPlannedMeals = savePlannedMeal(plannedMeal, selectedWeekKey)
    const itemWasSaved = nextPlannedMeals.some(
      (meal) => meal.id === plannedMeal.id,
    )

    if (itemWasSaved && plannedMeal.recipeId) {
      markRecipeUsed(plannedMeal.recipeId)
    }

    setPlannedMeals(nextPlannedMeals)
  }

  function startPlacementFromQueue(queueItem) {
    setPlacementSelection({
      type: 'queue',
      item: queueItem,
    })
    setActiveQueueItem(null)
    setLastRemovedMeal(null)
  }

  function startPlacementFromMeal(item, mode = 'move') {
    if (mode === 'move') {
      startPlannerEditMode(item)
      return
    }

    setPlacementSelection({
      type: 'meal',
      item,
      mode,
    })
    exitPlannerEditMode()
    setActiveMealModal('')
    setSelectedMeal(null)
    setLastRemovedMeal(null)
  }

  function placeSelectionInSlot(day, mealSlot) {
    if (selectedEditMeal) {
      moveMealToSlot(selectedEditMeal, day, mealSlot)
      setSelectedEditMeal(null)
      return
    }

    if (!placementSelection) {
      return
    }

    if (placementSelection.type === 'queue') {
      placeQueuedMeal(placementSelection.item, day, mealSlot)
    }

    if (placementSelection.type === 'meal') {
      if (placementSelection.mode === 'duplicate') {
        duplicatePlannedMeal(placementSelection.item, day, mealSlot)
        setPlacementSelection(null)
        return
      }

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

  function saveSelectedWeek(nextWeekKey) {
    const savedSettings = savePlannerSettings({
      selectedWeekStartDate: nextWeekKey,
    })

    setPlannerSettings(savedSettings)
    setPlannedMeals(getPlannedMealsForWeek(nextWeekKey))
    setPlacementSelection(null)
    exitPlannerEditMode()
    setLastRemovedMeal(null)
  }

  function goToPreviousWeek() {
    saveSelectedWeek(shiftWeekKey(selectedWeekKey, -1))
  }

  function goToNextWeek() {
    saveSelectedWeek(shiftWeekKey(selectedWeekKey, 1))
  }

  function copyCurrentWeekToNextWeek() {
    if (plannedMeals.length === 0) {
      setCopiedWeekMessage('Add planned meals before copying this week.')
      return
    }

    const nextWeekKey = shiftWeekKey(selectedWeekKey, 1)
    const existingNextWeekMeals = getPlannedMealsForWeek(nextWeekKey)
    const copiedMeals = plannedMeals.map((plannedMeal) => ({
      ...plannedMeal,
      id: createLocalId('planned-meal'),
    }))
    const nextWeekMeals = savePlannedMealsForWeek(nextWeekKey, [
      ...copiedMeals,
      ...existingNextWeekMeals,
    ])
    const savedSettings = savePlannerSettings({
      selectedWeekStartDate: nextWeekKey,
    })

    setPlannerSettings(savedSettings)
    setPlannedMeals(nextWeekMeals)
    setShowSettingsModal(false)
    setCopiedWeekMessage('')
    setPlacementSelection(null)
    exitPlannerEditMode()
    setLastRemovedMeal(null)
  }

  function savePlannerPreferences() {
    const currentSelectedDate = parseDateKey(selectedWeekKey)
    const nextSelectedWeekStartDate = formatDateKey(
      getWeekStartDate(currentSelectedDate, draftPlannerSettings.weekStartDay),
    )
    const savedSettings = savePlannerSettings({
      ...draftPlannerSettings,
      selectedWeekStartDate: nextSelectedWeekStartDate,
    })

    setPlannerSettings(savedSettings)
    setPlannedMeals(getPlannedMealsForWeek(nextSelectedWeekStartDate))
    setShowSettingsModal(false)
    setPlacementSelection(null)
    exitPlannerEditMode()
    setLastRemovedMeal(null)
  }

  function openPlannerSettings() {
    setDraftPlannerSettings(plannerSettings)
    setCopiedWeekMessage('')
    setShowSettingsModal(true)
  }

  function getExistingPlannedMeal(item) {
    return plannedMeals.find((plannedMeal) => plannedMeal.id === item.plannedMealId)
  }

  function isSameMealItem(firstMeal, secondMeal) {
    if (!firstMeal || !secondMeal) {
      return false
    }

    return getMealItemId(firstMeal) === getMealItemId(secondMeal)
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
      image: matchedRecipe?.image || item.image,
      icon: item.icon,
      ...updates,
    }
    const nextPlannedMeals = savePlannedMeal(plannedMeal, selectedWeekKey)
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

      const nextPlannedMeals = updatePlannedMeal(
        {
          ...existingMeal,
          ...updates,
        },
        selectedWeekKey,
      )
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
    if (isSameMealItem(item, selectedEditMeal)) {
      setSelectedEditMeal(null)
    }

    if (item.plannedMealId) {
      const nextPlannedMeals = removePlannedMealFromWeek(
        item.plannedMealId,
        selectedWeekKey,
      )
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

      const nextPlannedMeals = updatePlannedMeal(
        {
          ...existingMeal,
          day,
          mealSlot,
        },
        selectedWeekKey,
      )
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
    if (isSameMealItem(item, selectedEditMeal)) {
      setSelectedEditMeal(null)
    }

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
          image: item.image,
          icon: item.icon,
        }

      const nextPlannedMeals = removePlannedMealFromWeek(
        item.plannedMealId,
        selectedWeekKey,
      )
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
      const plannedMealExists = getPlannedMealsForWeek(selectedWeekKey).some(
        (meal) => meal.id === lastRemovedMeal.meal.id,
      )

      if (!plannedMealExists) {
        setPlannedMeals(savePlannedMeal(lastRemovedMeal.meal, selectedWeekKey))
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
    placementSelection?.type === 'queue' ||
    placementSelection?.mode === 'move' ||
    placementSelection?.mode === 'duplicate' ||
    Boolean(selectedEditMeal)
  const selectedEditMealName =
    selectedEditMeal?.recipeName || selectedEditMeal?.name || ''
  const selectedEditMealId = selectedEditMeal
    ? getMealItemId(selectedEditMeal)
    : ''

  return (
    <section
      className="relative"
      onClick={(event) => {
        if (lastRemovedMeal && event.target === event.currentTarget) {
          setLastRemovedMeal(null)
        }

        if (isPlannerEditMode && event.target === event.currentTarget) {
          exitPlannerEditMode()
        }
      }}
    >
      <PlannerHeader
        mealCount={plannedMealCount}
        onOpenSettings={openPlannerSettings}
        weekRange={weekRange}
        weekStartLabel={weekStartLabel}
      />

      <WeekControls
        canEditPlanner={plannedMealCount > 0}
        days={displayedPlannerDays}
        editMessage={
          selectedEditMealName
            ? `Selected: ${selectedEditMealName}. Tap a slot to move it.`
            : 'Tap a meal to select it, then tap a destination slot.'
        }
        isEditMode={isPlannerEditMode}
        onExitEditMode={exitPlannerEditMode}
        onNextWeek={goToNextWeek}
        onOpenSettings={openPlannerSettings}
        onPreviousWeek={goToPreviousWeek}
        onStartEditMode={() => startPlannerEditMode()}
      />

      <div
        className={`transition ${
          isPlannerEditMode ? 'pointer-events-none opacity-45' : ''
        }`}
      >
        <WeeklyQueueSection
          activeQueueItem={
            placementSelection?.type === 'queue' ? placementSelection.item : null
          }
          items={weeklyQueueItems}
          onOpenActions={setActiveQueueItem}
          onSelectItem={startPlacementFromQueue}
          recipes={availableRecipes}
        />
      </div>

      {placementSelection && !isPlannerEditMode && (
        <div className="mt-2.5 flex items-center justify-between gap-3 rounded-3xl border border-[#A8C686]/60 bg-[#EAF3DE] px-4 py-2.5 text-[#5A8D2B] shadow-sm">
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

      {shouldShowPlannerGrid ? (
        <div className="mt-2.5 space-y-2.5 pb-24">
          {plannerDaysWithSavedMeals.map((day, index) => (
            <PlannerDayCard
              canPlaceInSlot={canPlaceInSlot}
              day={day}
              isEditMode={isEditMode}
              key={day.weekday}
              onDeleteMeal={deleteMealWithUndo}
              onOpenActions={openMealActions}
              onOpenRecipe={openMealRecipe}
              onPlaceMeal={placeSelectionInSlot}
              onSelectMeal={selectMealInEditMode}
              selectedMealId={selectedEditMealId}
              showMealHeadings={index === 0}
            />
          ))}
        </div>
      ) : (
        <div className="mt-3">
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
        onDuplicate={() => startPlacementFromMeal(selectedMeal, 'duplicate')}
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
          copiedWeekMessage={copiedWeekMessage}
          onCopyWeek={copyCurrentWeekToNextWeek}
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

    </section>
  )
}

export default Planner

