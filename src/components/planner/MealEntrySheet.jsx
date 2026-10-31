import { useState } from 'react'
import { Search, Check, BookOpen, ArrowRight, Link2 } from 'lucide-react'
import BottomSheet from '../ui/BottomSheet'
import Pressable from '../ui/Pressable'
import RecipeImage from '../RecipeImage'
import { getRecipeMetadata, isRecipeFavourite } from '../../utils/localStorage'

export default function MealEntrySheet({
  slot,
  recipes,
  onClose,
  onSave,
  canContinue,
}) {
  const [mode, setMode] = useState('quick')
  const [name, setName] = useState(slot.editMeal?.recipeName || '')
  const [linked, setLinked] = useState(
    () =>
      recipes.find(
        (recipe) => (recipe.id || recipe.name) === slot.editMeal?.recipeId,
      ) || null,
  )
  const [servings, setServings] = useState(slot.editMeal?.plannedServings || 4)
  const [error, setError] = useState('')
  const metadata = getRecipeMetadata()
  const filtered = recipes.filter(
    (recipe) =>
      recipe.name.toLowerCase().includes(name.toLowerCase()) &&
      (mode !== 'favourites' ||
        isRecipeFavourite(recipe.id || recipe.name, metadata)),
  )
  function choose(recipe) {
    setLinked(recipe)
    setName(recipe.name)
    setServings(recipe.servings || 4)
    setError('')
  }
  function save(event, next = false) {
    event.preventDefault()
    if (!name.trim()) {
      setError('What’s on the menu? Add a meal name.')
      return
    }
    if (
      !Number.isFinite(Number(servings)) ||
      Number(servings) < 1 ||
      Number(servings) > 100
    ) {
      setError('Choose between 1 and 100 servings.')
      return
    }
    if (!onSave({ name, recipe: linked, servings }, next))
      setError('Your meal couldn’t be saved. Please try again.')
  }
  const label = `${slot.day.dayName} ${slot.day.date} · ${slot.mealSlot}`
  return (
    <BottomSheet
      title={slot.editMeal ? 'Change your meal' : 'What’s on the menu?'}
      eyebrow={label}
      onClose={onClose}
    >
      <form className="form-stack" onSubmit={save}>
        <div className="segmented" aria-label="Meal entry options">
          {[
            ['quick', 'Quick add'],
            ['recipes', 'Recipes'],
            ['favourites', 'Favourites'],
          ].map(([key, text]) => (
            <button
              key={key}
              type="button"
              aria-pressed={mode === key}
              onClick={() => setMode(key)}
            >
              {text}
            </button>
          ))}
        </div>
        <label className="field">
          {mode === 'quick' ? 'Meal name' : 'Find a recipe'}
          <div className={mode === 'quick' ? '' : 'search-field'}>
            {mode !== 'quick' && <Search size={18} />}
            <input
              className={mode === 'quick' ? 'input' : ''}
              autoFocus
              data-autofocus
              placeholder={
                mode === 'quick'
                  ? 'e.g. Chicken fajitas'
                  : 'Search your recipes…'
              }
              value={name}
              maxLength={160}
              onChange={(event) => {
                setName(event.target.value)
                setLinked(null)
                setError('')
              }}
            />
          </div>
        </label>
        {linked ? (
          <div className="linked-recipe">
            <RecipeImage recipe={linked} className="recipe-thumb" />
            <div>
              <strong>{linked.name}</strong>
              <span>
                <Link2 size={12} />
                Recipe linked · ingredients included
              </span>
            </div>
            <button
              className="icon-button"
              type="button"
              aria-label="Unlink recipe"
              onClick={() => setLinked(null)}
            >
              <Check size={19} />
            </button>
          </div>
        ) : mode !== 'quick' || name.length > 1 ? (
          <div>
            <p className="eyebrow">
              {mode === 'quick'
                ? 'Link a recipe, if you like'
                : `${filtered.length} ${mode === 'favourites' ? 'favourite ' : ''}recipes`}
            </p>
            <div className="entry-recipes">
              {filtered.slice(0, mode === 'quick' ? 2 : 20).map((recipe) => (
                <button
                  type="button"
                  className="entry-recipe"
                  key={recipe.id || recipe.name}
                  onClick={() => choose(recipe)}
                >
                  <RecipeImage recipe={recipe} className="recipe-thumb" />
                  <span>
                    <strong>{recipe.name}</strong>
                    <small>
                      {recipe.time || recipe.cookTime || recipe.mealType} ·
                      Serves {recipe.servings || 1}
                    </small>
                  </span>
                  <BookOpen size={17} />
                </button>
              ))}
              {filtered.length === 0 && mode !== 'quick' && (
                <p className="helper">
                  No matches. You can still save this as a simple meal.
                </p>
              )}
            </div>
          </div>
        ) : null}
        <div className="entry-bottom">
          <label className="field">
            Servings
            <input
              type="number"
              min="1"
              max="100"
              value={servings}
              onChange={(event) => setServings(event.target.value)}
            />
          </label>
          <p className="helper">
            {linked
              ? 'Ingredients will scale to your servings.'
              : 'A simple meal is fine. Add its shopping items manually.'}
          </p>
        </div>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <div className={canContinue ? 'form-row' : ''}>
          <Pressable
            variant={canContinue ? 'surface' : 'primary'}
            type="submit"
          >
            Save meal
          </Pressable>
          {canContinue && (
            <Pressable variant="primary" onClick={(event) => save(event, true)}>
              Save & next <ArrowRight size={16} />
            </Pressable>
          )}
        </div>
      </form>
    </BottomSheet>
  )
}
