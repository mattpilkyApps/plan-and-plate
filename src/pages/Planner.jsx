import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  ChevronDown,
  Copy,
  Heart,
  Leaf,
  MoreHorizontal,
  MoveRight,
  Pencil,
  Plus,
  RefreshCw,
  ShoppingBasket,
  Shuffle,
  Trash2,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import PlannerDayCard from '../components/planner/PlannerDayCard'
import MealEntrySheet from '../components/planner/MealEntrySheet'
import RecipeImage from '../components/RecipeImage'
import BottomSheet from '../components/ui/BottomSheet'
import Pressable from '../components/ui/Pressable'
import StatusToast from '../components/ui/StatusToast'
import usePlanner from '../hooks/usePlanner'
import { createLocalId, getPlannedMealsForWeek } from '../utils/localStorage'
import { shiftWeekKey } from '../utils/plannerWeeks'
import { getRecipeKey } from '../utils/recipeKeys'

function DestinationSheet({ action, days, meals, onClose, onPlace }) {
  const [slot, setSlot] = useState(action.item.mealSlot || 'dinner')
  const [error, setError] = useState('')
  function place(day, targetId) {
    if (
      !onPlace({
        dateKey: day.dateKey,
        day: day.weekday,
        mealSlot: slot,
        targetId,
      })
    )
      setError('The change couldn’t be saved. Please try again.')
  }
  return (
    <BottomSheet
      eyebrow={action.item.recipeName}
      title={
        action.mode === 'swap'
          ? 'Swap with a meal'
          : action.mode === 'duplicate'
            ? 'Make room for seconds'
            : 'Choose a day'
      }
      onClose={onClose}
    >
      <div className="form-stack">
        {action.mode !== 'swap' && (
          <div className="segmented">
            {['breakfast', 'lunch', 'dinner'].map((name) => (
              <button
                type="button"
                aria-pressed={slot === name}
                onClick={() => setSlot(name)}
                key={name}
              >
                {name[0].toUpperCase() + name.slice(1)}
              </button>
            ))}
          </div>
        )}
        <div className="destination-list">
          {days.map((day) => {
            const existing = meals.filter(
              (meal) =>
                meal.dateKey === day.dateKey &&
                meal.mealSlot === slot &&
                meal.id !== action.item.id,
            )
            if (action.mode === 'swap')
              return meals
                .filter(
                  (meal) =>
                    meal.dateKey === day.dateKey && meal.id !== action.item.id,
                )
                .map((meal) => (
                  <button
                    type="button"
                    className="destination"
                    key={meal.id}
                    onClick={() => {
                      if (
                        !onPlace({
                          dateKey: day.dateKey,
                          day: day.weekday,
                          mealSlot: meal.mealSlot,
                          targetId: meal.id,
                        })
                      )
                        setError('The swap couldn’t be saved.')
                    }}
                  >
                    <span>
                      <strong>
                        {day.dayName} {day.date}
                      </strong>
                      <small>
                        {meal.mealSlot} · {meal.recipeName}
                      </small>
                    </span>
                    <Shuffle size={17} />
                  </button>
                ))
            return (
              <button
                type="button"
                className="destination"
                key={day.dateKey}
                onClick={() => place(day)}
                disabled={
                  action.mode === 'move' &&
                  action.item.dateKey === day.dateKey &&
                  action.item.mealSlot === slot
                }
              >
                <span>
                  <strong>
                    {day.dayName} {day.date}
                  </strong>
                  <small>
                    {existing.length
                      ? `Alongside ${existing.map((meal) => meal.recipeName).join(', ')}`
                      : 'A little space on the menu'}
                  </small>
                </span>
                <Plus size={17} />
              </button>
            )
          })}
        </div>
        {action.mode === 'swap' && meals.length < 2 && (
          <p className="helper">
            Plan another meal first, then you can swap them.
          </p>
        )}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
      </div>
    </BottomSheet>
  )
}

export default function Planner() {
  const planner = usePlanner()
  const navigate = useNavigate()
  const { meals, days, queue, recipes, weekKey, view } = planner
  const [entry, setEntry] = useState(null)
  const [actionMeal, setActionMeal] = useState(null)
  const [destination, setDestination] = useState(null)
  const [options, setOptions] = useState(false)
  const [copyConfirm, setCopyConfirm] = useState(false)
  const [removedMeal, setRemovedMeal] = useState(null)
  const [message, setMessage] = useState('')
  useEffect(() => {
    if (!message) return
    const timer = window.setTimeout(() => setMessage(''), 4000)
    return () => window.clearTimeout(timer)
  }, [message])
  const dinners = days.filter((day) =>
    meals.some(
      (meal) => meal.dateKey === day.dateKey && meal.mealSlot === 'dinner',
    ),
  ).length
  const linkedCount = meals.filter((meal) =>
    recipes.some((recipe) => (recipe.id || recipe.name) === meal.recipeId),
  ).length
  const firstDate = new Date(`${days[0].dateKey}T12:00:00`)
  const lastDate = new Date(`${days[6].dateKey}T12:00:00`)
  const dateRange = `${firstDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – ${lastDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`
  const viewRecipe = (recipe) => navigate(`/recipes/${getRecipeKey(recipe)}`)
  function saveEntry(value, next) {
    if (!planner.saveEntry(value, entry)) return false
    setRemovedMeal(null)
    if (next) {
      const index = days.findIndex((day) => day.dateKey === entry.day.dateKey)
      const nextDay = days
        .slice(index + 1)
        .find(
          (day) =>
            !meals.some(
              (meal) =>
                meal.dateKey === day.dateKey &&
                meal.mealSlot === entry.mealSlot,
            ),
        )
      setEntry(nextDay ? { day: nextDay, mealSlot: entry.mealSlot } : null)
      if (!nextDay) setMessage('Your week is taking shape. Meal saved.')
    } else {
      setEntry(null)
      setMessage('Meal saved. One less thing to think about.')
    }
    return true
  }
  function removeMeal() {
    if (planner.commit(meals.filter((meal) => meal.id !== actionMeal.id))) {
      setRemovedMeal(actionMeal)
      setActionMeal(null)
      setMessage('Meal removed from your plan.')
    }
  }
  function undoRemove() {
    if (planner.commit([...meals, removedMeal])) {
      setRemovedMeal(null)
      setMessage('Meal back on the menu.')
    }
  }
  function beginMove(mode) {
    setDestination({ item: actionMeal, mode })
    setActionMeal(null)
  }
  function place(destinationSlot) {
    const success =
      destination.mode === 'queue'
        ? planner.placeQueue(destination.item, destinationSlot)
        : planner.move(destination.item.id, destinationSlot, destination.mode)
    if (success) {
      setDestination(null)
      setRemovedMeal(null)
      setMessage('Your plan has been updated.')
    }
    return success
  }
  function tryCopy() {
    setOptions(false)
    if (getPlannedMealsForWeek(shiftWeekKey(weekKey, 1)).length)
      setCopyConfirm(true)
    else if (planner.copyWeek())
      setMessage('A head start on next week. Plan copied.')
  }
  function exampleWeek() {
    const names = [
      'Spaghetti Bolognese',
      'Chicken Curry',
      'Chicken Fajitas',
      'Jacket Potatoes',
      'Homemade Pizza',
      'Roast Chicken',
      'Salmon Fillet & Veg',
    ]
    const examples = days.map((day, index) => {
      const recipe = recipes.find((recipe) => recipe.name === names[index])
      return {
        id: createLocalId('planned-meal'),
        dateKey: day.dateKey,
        day: day.weekday,
        mealSlot: 'dinner',
        recipeName: names[index],
        recipeId: recipe ? recipe.id || recipe.name : null,
        plannedServings: 4,
        image: recipe?.image || '',
      }
    })
    if (planner.commit(examples))
      setMessage('An example week to make your own.')
  }
  const currentRecipe =
    actionMeal &&
    recipes.find((recipe) => (recipe.id || recipe.name) === actionMeal.recipeId)
  return (
    <div className="planner-layout">
      <section className="planner-main">
        <div className="planner-topline">
          {weekKey !== planner.currentWeekKey ? (
            <button
              className="return-week"
              onClick={() => planner.navigateWeek(planner.currentWeekKey)}
            >
              <RefreshCw size={12} />
              Back to this week
            </button>
          ) : (
            <p className="eyebrow">A little planning. A lot less stress.</p>
          )}
          <button
            className="icon-button"
            aria-label="Week options"
            onClick={() => setOptions(true)}
          >
            <MoreHorizontal size={21} />
          </button>
        </div>
        <div className="week-control">
          <button
            className="icon-button"
            aria-label="Previous week"
            onClick={() => planner.navigateWeek(shiftWeekKey(weekKey, -1))}
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1>
              {weekKey === planner.currentWeekKey ? 'This week' : 'Weekly menu'}
            </h1>
            <p>{dateRange}</p>
          </div>
          <button
            className="icon-button"
            aria-label="Next week"
            onClick={() => planner.navigateWeek(shiftWeekKey(weekKey, 1))}
          >
            <ArrowRight size={20} />
          </button>
        </div>
        <div className="planner-toolbar">
          <div className="segmented" aria-label="Planner view">
            <button
              aria-pressed={view === 'dinners'}
              onClick={() => planner.changeView('dinners')}
            >
              Dinners
            </button>
            <button
              aria-pressed={view === 'all'}
              onClick={() => planner.changeView('all')}
            >
              All Meals
            </button>
          </div>
          <span className="dinner-count">
            <span className="progress-dots" aria-hidden="true">
              {days.map((day, index) => (
                <i
                  key={day.dateKey}
                  className={index < dinners ? 'filled' : ''}
                />
              ))}
            </span>
            {dinners} of 7 dinners
          </span>
        </div>
        <div className="planner-days">
          {days.map((day) => (
            <PlannerDayCard
              day={day}
              key={day.dateKey}
              meals={meals}
              recipes={recipes}
              view={view}
              onAdd={(day, mealSlot) => setEntry({ day, mealSlot })}
              onActions={setActionMeal}
              onView={viewRecipe}
            />
          ))}
        </div>
        {meals.length === 0 && (
          <div className="planner-hint">
            <Leaf size={21} strokeWidth={1.3} />
            <div>
              <strong>Start with what you love.</strong>
              <p>Tap a day and type dinner. That’s a plan.</p>
              <button className="inline-link" onClick={exampleWeek}>
                Try an example week <ArrowRight size={13} />
              </button>
            </div>
          </div>
        )}
        <details
          className="weekly-queue"
          open={queue.length > 0 ? true : undefined}
        >
          <summary>
            <span>
              <BookOpen size={18} />
              <strong>Meals to place</strong>
              <span className="queue-count">{queue.length}</span>
            </span>
            <ChevronDown size={17} />
          </summary>
          <p className="helper">
            A few ideas, before you choose the days. This queue stays with you
            as you browse weeks.
          </p>
          <div className="queue-items">
            {queue.map((item) => (
              <div className="queue-item" key={item.id}>
                <RecipeImage recipe={item} className="recipe-thumb" />
                <button
                  className="queue-name"
                  onClick={() => setDestination({ item, mode: 'queue' })}
                >
                  <strong>{item.recipeName}</strong>
                  <span>
                    Choose a day <ArrowRight size={12} />
                  </span>
                </button>
                <button
                  className="icon-button"
                  aria-label={`Remove ${item.recipeName} from queue`}
                  onClick={() => planner.removeQueue(item.id)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
          <Link className="inline-link" to="/recipes">
            <Plus size={15} />
            Choose from your recipes
          </Link>
        </details>
        {meals.length > 0 && (
          <Link className="planner-shopping-link" to="/shopping">
            <span>
              <ShoppingBasket size={21} />
              <span>
                <strong>Your shop starts here</strong>
                <small>
                  {linkedCount} recipe{' '}
                  {linkedCount === 1 ? 'meal adds' : 'meals add'} ingredients
                  automatically.
                  {linkedCount < meals.length
                    ? ` ${meals.length - linkedCount} simple ${meals.length - linkedCount === 1 ? 'meal needs' : 'meals need'} manual items.`
                    : ''}
                </small>
              </span>
            </span>
            <ArrowRight size={18} />
          </Link>
        )}
      </section>
      <aside className="planner-aside">
        <div className="aside-brand">
          <Leaf size={32} strokeWidth={1} />
          <h2>
            Good food.
            <br />
            Less stress.
          </h2>
          <p>A happier home starts with a little plan.</p>
        </div>
        <div className="section-title">
          <h2>Made for your week</h2>
        </div>
        {recipes.slice(0, 2).map((recipe) => (
          <button
            className="inspiration-card"
            key={recipe.name}
            onClick={() => viewRecipe(recipe)}
          >
            <RecipeImage recipe={recipe} />
            <span>
              <strong>{recipe.name}</strong>
              <small>
                {recipe.time || recipe.cookTime} · Serves {recipe.servings}
              </small>
            </span>
            <ArrowRight size={17} />
          </button>
        ))}
        <Link className="inline-link" to="/recipes">
          Find your next favourite <ArrowRight size={14} />
        </Link>
      </aside>
      {entry && (
        <MealEntrySheet
          key={`${entry.day.dateKey}-${entry.mealSlot}-${entry.editMeal?.id || ''}`}
          slot={entry}
          recipes={recipes}
          onClose={() => setEntry(null)}
          onSave={saveEntry}
          canContinue={
            !entry.editMeal &&
            days.some(
              (day) =>
                day.dateKey > entry.day.dateKey &&
                !meals.some(
                  (meal) =>
                    meal.dateKey === day.dateKey &&
                    meal.mealSlot === entry.mealSlot,
                ),
            )
          }
        />
      )}
      {actionMeal && (
        <BottomSheet
          title={actionMeal.recipeName}
          eyebrow={`${days.find((day) => day.dateKey === actionMeal.dateKey)?.dayName} · ${actionMeal.mealSlot}`}
          onClose={() => setActionMeal(null)}
        >
          <div className="menu-list">
            {currentRecipe && (
              <Pressable onClick={() => viewRecipe(currentRecipe)}>
                <BookOpen size={18} />
                View recipe
              </Pressable>
            )}
            <Pressable
              onClick={() => {
                setEntry({
                  day: days.find((day) => day.dateKey === actionMeal.dateKey),
                  mealSlot: actionMeal.mealSlot,
                  editMeal: actionMeal,
                })
                setActionMeal(null)
              }}
            >
              <Pencil size={18} />
              Change meal or servings
            </Pressable>
            <Pressable onClick={() => beginMove('move')}>
              <MoveRight size={18} />
              Move to another day
            </Pressable>
            <Pressable
              onClick={() => beginMove('swap')}
              disabled={meals.length < 2}
            >
              <Shuffle size={18} />
              Swap with another meal
            </Pressable>
            <Pressable onClick={() => beginMove('duplicate')}>
              <Copy size={18} />
              Duplicate meal
            </Pressable>
            <Pressable
              onClick={() => {
                const day = days.find(
                  (day) => day.dateKey === actionMeal.dateKey,
                )
                setEntry({ day, mealSlot: actionMeal.mealSlot })
                setActionMeal(null)
              }}
            >
              <Plus size={18} />
              Add another meal to this slot
            </Pressable>
            <Pressable variant="danger" onClick={removeMeal}>
              <Trash2 size={18} />
              Remove meal
            </Pressable>
          </div>
        </BottomSheet>
      )}
      {destination && (
        <DestinationSheet
          action={destination}
          days={days}
          meals={meals}
          onClose={() => setDestination(null)}
          onPlace={place}
        />
      )}
      {options && (
        <BottomSheet
          title="A week that works for you"
          eyebrow="Your plan"
          onClose={() => setOptions(false)}
        >
          <div className="menu-list">
            <Pressable disabled={!meals.length} onClick={tryCopy}>
              <Copy size={18} />
              Copy this plan to next week
            </Pressable>
            <Pressable to="/recipes">
              <Heart size={18} />
              Find a recipe for the week
            </Pressable>
            <p className="helper mt-3">
              Change your week’s start day using the settings icon at the top of
              the app.
            </p>
          </div>
        </BottomSheet>
      )}
      {copyConfirm && (
        <BottomSheet
          title="Replace next week’s plan?"
          eyebrow="Copy week"
          onClose={() => setCopyConfirm(false)}
        >
          <p className="helper mb-5">
            Next week already has meals. Copying this plan will replace them.
            Your current week stays saved.
          </p>
          <div className="form-row">
            <Pressable onClick={() => setCopyConfirm(false)}>
              Keep next week
            </Pressable>
            <Pressable
              variant="primary"
              onClick={() => {
                if (planner.copyWeek()) {
                  setCopyConfirm(false)
                  setMessage('Next week’s plan updated.')
                }
              }}
            >
              Replace plan
            </Pressable>
          </div>
        </BottomSheet>
      )}
      <StatusToast
        show={Boolean(message)}
        message={message}
        actionLabel={removedMeal ? 'Undo' : undefined}
        onAction={removedMeal ? undoRemove : undefined}
      />
    </div>
  )
}
