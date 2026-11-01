import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  Check,
  Clock,
  Heart,
  Minus,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  Users,
} from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import RecipeImage from '../components/RecipeImage'
import AddToPlannerModal from '../components/AddToPlannerModal'
import BottomSheet from '../components/ui/BottomSheet'
import Pressable from '../components/ui/Pressable'
import StatusToast from '../components/ui/StatusToast'
import { recipes as samples } from '../data/sampleData'
import {
  createLocalId,
  deleteSavedRecipe,
  getRecipeMetadata,
  getRecipeStats,
  getRemovedRecipeIds,
  getSavedRecipes,
  markRecipeUsed,
  saveWeeklyQueueItem,
  toggleRecipeFavourite,
} from '../utils/localStorage'
import {
  findRecipeByKey,
  getRecipeId,
  getRecipeKey,
  getVisibleRecipes,
} from '../utils/recipeKeys'
import {
  formatIngredientForSingleUnit,
  parseIngredients,
} from '../utils/ingredientParser'

export default function RecipeDetail() {
  const { recipeKey } = useParams()
  const navigate = useNavigate()
  const [recipes] = useState(() =>
    getVisibleRecipes(getSavedRecipes(), samples, getRemovedRecipeIds()),
  )
  const recipe = findRecipeByKey(recipes, recipeKey)
  const [metadata, setMetadata] = useState(getRecipeMetadata)
  const [tab, setTab] = useState('ingredients')
  const [servings, setServings] = useState(recipe?.servings || 1)
  const [checked, setChecked] = useState([])
  const [showPlan, setShowPlan] = useState(false)
  const [options, setOptions] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [message, setMessage] = useState('')
  useEffect(() => {
    if (!message) return
    const timer = window.setTimeout(() => setMessage(''), 4500)
    return () => window.clearTimeout(timer)
  }, [message])
  const [added, setAdded] = useState(false)
  if (!recipe)
    return (
      <div className="empty-panel">
        <BookOpen size={28} className="mx-auto mb-3" />
        <h1>Recipe not found</h1>
        <p className="mt-3">It may have been removed from this browser.</p>
        <Pressable to="/recipes" className="mt-5" variant="primary">
          Back to recipes
        </Pressable>
      </div>
    )
  const id = getRecipeId(recipe)
  const favourite = getRecipeStats(id, metadata).favourite
  const ingredients = recipe.parsedIngredients?.length
    ? recipe.parsedIngredients
    : parseIngredients(recipe.ingredients || '')
  const rawMethod = recipe.method || recipe.instructions || ''
  const steps = Array.isArray(rawMethod)
    ? rawMethod
    : rawMethod
        .split(/\n+/)
        .map((line) => line.replace(/^\s*\d+[.)]\s*/, '').trim())
        .filter(Boolean)
  const scale = Number(servings) / (Number(recipe.servings) || 1)
  function addToWeek() {
    const item = {
      id: createLocalId('weekly-queue'),
      recipeName: recipe.name,
      recipeId: id,
      plannedServings: Number(servings),
      image: recipe.image || '',
      icon: recipe.icon || '',
      mealType: recipe.mealType || 'Dinner',
      usageTracked: true,
    }
    const result = saveWeeklyQueueItem(item)
    if (result.some((record) => record.id === item.id)) {
      setMetadata(markRecipeUsed(id))
      setAdded(true)
      setMessage('Added to Meals to place. Pick a day in your planner.')
    } else setMessage('Your meal couldn’t be saved in this browser.')
  }
  function deleteRecipe() {
    deleteSavedRecipe(id)
    if (!getRemovedRecipeIds().includes(id)) return
    navigate('/recipes', {
      state: { successMessage: `${recipe.name} deleted.` },
    })
  }
  return (
    <article className="recipe-detail">
      <div className="detail-hero">
        <RecipeImage recipe={recipe} eager />
        <div className="hero-controls">
          <Link
            to="/recipes"
            className="hero-icon"
            aria-label="Back to recipes"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <button
              className={`hero-icon ${favourite ? 'is-favourite' : ''}`}
              aria-pressed={favourite}
              aria-label={
                favourite ? 'Remove from favourites' : 'Add to favourites'
              }
              onClick={() => setMetadata(toggleRecipeFavourite(id))}
            >
              <Heart size={20} fill={favourite ? 'currentColor' : 'none'} />
            </button>
            <button
              className="hero-icon"
              aria-label="Recipe options"
              onClick={() => setOptions(true)}
            >
              <MoreHorizontal size={21} />
            </button>
          </div>
        </div>
      </div>
      <div className="detail-content">
        <p className="eyebrow">
          {recipe.mealType || 'Your recipe'} · Made for your table
        </p>
        <h1>{recipe.name}</h1>
        <div className="detail-meta">
          <span>
            <Clock size={16} />
            {recipe.time ||
              recipe.cookTime ||
              recipe.prepTime ||
              'Time not set'}
          </span>
          <span>
            <Users size={16} />
            {recipe.servings || 1} servings
          </span>
          {recipe.badges?.[0] && (
            <span className="detail-badge">{recipe.badges[0]}</span>
          )}
        </div>
        {recipe.description && (
          <p className="detail-description">{recipe.description}</p>
        )}
        <div className="detail-primary-actions">
          <Pressable variant="primary" onClick={() => setShowPlan(true)}>
            <CalendarDays size={19} />
            Add to planner
          </Pressable>
          <Pressable variant="surface" onClick={addToWeek}>
            {added ? <Check size={18} /> : <Plus size={18} />}
            {added ? 'Added to week' : 'Add to week'}
          </Pressable>
        </div>
        {(recipe.prepTime || recipe.cookTime) && (
          <div className="cooking-times">
            {recipe.prepTime && <span>Prep: {recipe.prepTime}</span>}
            {recipe.cookTime && <span>Cook: {recipe.cookTime}</span>}
          </div>
        )}
        <div
          className="detail-tabs"
          role="tablist"
          aria-label="Recipe sections"
        >
          {['ingredients', 'method'].map((name) => (
            <button
              key={name}
              role="tab"
              type="button"
              aria-selected={tab === name}
              aria-controls={`recipe-${name}`}
              id={`tab-${name}`}
              tabIndex={tab === name ? 0 : -1}
              onKeyDown={(event) => {
                if (
                  ['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)
                ) {
                  event.preventDefault()
                  const next =
                    event.key === 'Home'
                      ? 'ingredients'
                      : event.key === 'End'
                        ? 'method'
                        : name === 'ingredients'
                          ? 'method'
                          : 'ingredients'
                  setTab(next)
                  document.getElementById(`tab-${next}`)?.focus()
                }
              }}
              onClick={() => setTab(name)}
            >
              {name === 'ingredients' ? 'Ingredients' : 'Method'}
            </button>
          ))}
        </div>
        {tab === 'ingredients' ? (
          <section
            id="recipe-ingredients"
            role="tabpanel"
            aria-labelledby="tab-ingredients"
            tabIndex={0}
          >
            <div className="ingredient-heading">
              <p>Make it for your household</p>
              <div className="serving-stepper">
                <button
                  aria-label="Fewer servings"
                  disabled={Number(servings) <= 1}
                  onClick={() => {
                    setServings(Number(servings) - 1)
                    setChecked([])
                  }}
                >
                  <Minus size={14} />
                </button>
                <span>
                  {servings}
                  <Users size={13} />
                </span>
                <button
                  aria-label="More servings"
                  disabled={Number(servings) >= 100}
                  onClick={() => {
                    setServings(Number(servings) + 1)
                    setChecked([])
                  }}
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
            {ingredients.length ? (
              <ul className="ingredient-list">
                {ingredients.map((ingredient, index) => {
                  const quantity = Number(ingredient.quantity)
                  const text =
                    scale === 1 && ingredient.rawText
                      ? ingredient.rawText
                      : quantity
                        ? formatIngredientForSingleUnit({
                            ...ingredient,
                            quantity: String(
                              Math.round(quantity * scale * 100) / 100,
                            ),
                          })
                        : ingredient.rawText || ingredient.name
                  return (
                    <li key={index}>
                      <label
                        className={
                          checked.includes(index) ? 'ingredient-checked' : ''
                        }
                      >
                        <input
                          type="checkbox"
                          checked={checked.includes(index)}
                          onChange={() =>
                            setChecked((current) =>
                              current.includes(index)
                                ? current.filter((item) => item !== index)
                                : [...current, index],
                            )
                          }
                        />
                        <span>{text}</span>
                      </label>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <p className="helper py-5">
                No ingredients saved yet. Add them by editing this recipe.
              </p>
            )}
            <p className="helper mt-4">
              Tick ingredients as you cook. Changing servings here leaves your
              original recipe unchanged.
            </p>
          </section>
        ) : (
          <section
            id="recipe-method"
            role="tabpanel"
            aria-labelledby="tab-method"
            tabIndex={0}
          >
            {steps.length ? (
              <ol className="method-list">
                {steps.map((step, index) => (
                  <li key={index}>
                    <span>{index + 1}</span>
                    <p>{step}</p>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="empty-panel mt-4">
                No method saved yet. Add your cooking notes with Edit recipe.
              </div>
            )}
          </section>
        )}
        {recipe.notes && (
          <div className="recipe-notes">
            <h2>A note for next time</h2>
            <p>{recipe.notes}</p>
          </div>
        )}
        <Link
          className="inline-link mt-5"
          to={`/recipes/${getRecipeKey(recipe)}/edit`}
        >
          <Pencil size={15} />
          Edit recipe
        </Link>
      </div>
      <StatusToast
        show={Boolean(message)}
        message={message}
        actionLabel="Dismiss"
        onAction={() => setMessage('')}
      />
      {showPlan && (
        <AddToPlannerModal
          recipe={recipe}
          initialServings={servings}
          onClose={() => setShowPlan(false)}
          onSaved={(text) => {
            setShowPlan(false)
            setMessage(text)
            setMetadata(getRecipeMetadata())
          }}
        />
      )}
      {options && (
        <BottomSheet
          title={recipe.name}
          eyebrow="Recipe options"
          onClose={() => setOptions(false)}
        >
          <div className="menu-list">
            <Pressable to={`/recipes/${getRecipeKey(recipe)}/edit`}>
              <Pencil size={18} />
              Edit recipe
            </Pressable>
            <Pressable
              onClick={() => {
                setOptions(false)
                setShowPlan(true)
              }}
            >
              <CalendarDays size={18} />
              Add to planner
            </Pressable>
            <Pressable
              onClick={() => {
                addToWeek()
                setOptions(false)
              }}
            >
              <Plus size={18} />
              Add to week
            </Pressable>
            <Pressable
              variant="danger"
              onClick={() => {
                setOptions(false)
                setDeleteConfirm(true)
              }}
            >
              <Trash2 size={18} />
              Delete recipe
            </Pressable>
          </div>
        </BottomSheet>
      )}
      {deleteConfirm && (
        <BottomSheet
          title="Remove this recipe?"
          eyebrow={recipe.name}
          tone="danger"
          onClose={() => setDeleteConfirm(false)}
        >
          <p className="helper mb-5">
            This removes the saved recipe and its linked meals from every week.
            Your shopping list will update too.
          </p>
          <div className="form-row">
            <Pressable onClick={() => setDeleteConfirm(false)}>
              Keep recipe
            </Pressable>
            <Pressable variant="dangerSolid" onClick={deleteRecipe}>
              Delete recipe
            </Pressable>
          </div>
        </BottomSheet>
      )}
    </article>
  )
}
