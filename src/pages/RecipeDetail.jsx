import {
  ArrowLeft,
  CalendarPlus,
  CheckCircle2,
  Clock,
  Pencil,
  Trash2,
  Users,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import EmptyState from '../components/EmptyState'
import { recipes as sampleRecipes } from '../data/sampleData'
import { getMealIcon } from '../utils/mealIcons'
import {
  findRecipeByKey,
  getRecipeId,
  getRecipeKey,
  getVisibleRecipes,
} from '../utils/recipeKeys'
import {
  createLocalId,
  deleteSavedRecipe,
  getRemovedRecipeIds,
  getSavedRecipes,
  saveWeeklyQueueItem,
} from '../utils/localStorage'

function InfoPill({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
      <div className="flex items-center gap-2 text-sm font-bold text-[#5A8D2B]">
        <Icon size={17} />
        {label}
      </div>
      <p className="mt-1 text-base font-bold text-stone-900">{value}</p>
    </div>
  )
}

function DetailSection({ children, title }) {
  return (
    <section className="rounded-3xl border border-stone-100 bg-white/80 p-4 shadow-[0_8px_24px_rgba(30,41,59,0.05)]">
      <h2 className="text-lg font-bold text-stone-900">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  )
}

function RecipeHeroImage({ recipe, icon }) {
  if (recipe.image) {
    return (
      <img
        alt=""
        className="mt-5 h-64 w-full rounded-[2rem] object-cover shadow-[0_12px_30px_rgba(30,41,59,0.08)]"
        src={recipe.image}
      />
    )
  }

  return (
    <div className="mt-5 flex h-64 w-full items-center justify-center rounded-[2rem] bg-[#EAF3DE] text-[#5A8D2B] shadow-[0_12px_30px_rgba(30,41,59,0.08)]">
      <span className="text-6xl" aria-hidden="true">
        {icon}
      </span>
    </div>
  )
}

function getIngredientLines(recipe) {
  if (recipe.ingredients) {
    return recipe.ingredients
      .split('\n')
      .map((ingredient) => ingredient.trim())
      .filter(Boolean)
  }

  return (recipe.parsedIngredients || [])
    .map((ingredient) => ingredient.rawText || ingredient.name)
    .filter(Boolean)
}

function DeleteRecipeModal({ onCancel, onDelete, recipeName }) {
  return (
    <div className="fixed inset-0 z-20 flex items-end bg-stone-900/25 px-4 pb-4">
      <div className="mx-auto w-full max-w-[430px] rounded-3xl bg-[#FAF8F3] p-4 shadow-[0_18px_50px_rgba(30,41,59,0.25)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-red-600">
              Delete recipe
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-stone-900">
              Remove {recipeName}?
            </h2>
          </div>

          <button
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-stone-700 shadow-sm"
            onClick={onCancel}
            type="button"
          >
            <X size={22} />
          </button>
        </div>

        <p className="mt-4 text-sm font-medium leading-relaxed text-stone-500">
          This will also remove the recipe from your planner so your shopping
          list stays accurate.
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            className="h-12 rounded-2xl border border-stone-100 bg-white px-4 py-3 text-base font-bold text-stone-700 shadow-sm"
            onClick={onCancel}
            type="button"
          >
            Cancel
          </button>
          <button
            className="h-12 rounded-2xl bg-red-600 px-4 py-3 text-base font-bold text-white shadow-[0_12px_24px_rgba(220,38,38,0.22)]"
            onClick={onDelete}
            type="button"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

function RecipeDetail() {
  const navigate = useNavigate()
  const { recipeKey } = useParams()
  const [savedRecipes] = useState(() => getSavedRecipes())
  const allRecipes = getVisibleRecipes(
    savedRecipes,
    sampleRecipes,
    getRemovedRecipeIds(),
  )
  const recipe = findRecipeByKey(allRecipes, recipeKey)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [wasJustAdded, setWasJustAdded] = useState(false)

  if (!recipe) {
    return (
      <section>
        <Link
          className="mb-5 flex h-[3.25rem] w-[3.25rem] items-center justify-center rounded-2xl border border-stone-100 bg-white text-stone-800 shadow-sm"
          to="/recipes"
        >
          <ArrowLeft size={25} />
        </Link>
        <EmptyState title="Recipe not found">
          Head back to recipes and choose another meal.
        </EmptyState>
      </section>
    )
  }

  const category = recipe.mealType || recipe.category || 'Recipe'
  const prepTime = recipe.prepTime || recipe.time || 'Not set'
  const cookTime = recipe.cookTime || 'Not set'
  const servings = recipe.servings || 1
  const ingredients = getIngredientLines(recipe)
  const method = recipe.method || recipe.instructions || ''
  const HeroIcon = getMealIcon({
    mealType: category,
    name: recipe.name,
  })

  function addRecipeToWeek() {
    setWasJustAdded(true)
    window.setTimeout(() => setWasJustAdded(false), 1400)

    const queueItem = {
      id: createLocalId('weekly-queue'),
      recipeName: recipe.name,
      recipeId: recipe.id || recipe.name,
      plannedServings: servings,
      icon:
        recipe.icon ||
        getMealIcon({
          mealType: category,
          name: recipe.name,
        }),
      image: recipe.image,
      mealType: category,
    }
    const queueItems = saveWeeklyQueueItem(queueItem)
    const itemWasSaved = queueItems.some((item) => item.id === queueItem.id)

    setSuccessMessage(
      itemWasSaved
        ? `${recipe.name} added to Meals This Week.`
        : 'Meal could not be saved in this browser.',
    )
    window.setTimeout(() => setSuccessMessage(''), 2200)
  }

  function deleteRecipe() {
    if (!recipe) {
      return
    }

    deleteSavedRecipe(getRecipeId(recipe))
    navigate('/recipes', {
      state: { successMessage: `${recipe.name} deleted.` },
    })
  }

  return (
    <section className="pb-6">
      <header className="flex items-center justify-between gap-3">
        <Link
          className="flex h-[3.25rem] w-[3.25rem] items-center justify-center rounded-2xl border border-stone-100 bg-white text-stone-800 shadow-sm"
          to="/recipes"
        >
          <ArrowLeft size={25} />
        </Link>

        <div className="flex gap-3">
          <Link
            className="flex h-[3.25rem] items-center gap-2 rounded-2xl bg-[#EAF3DE] px-4 text-sm font-bold text-[#5A8D2B] shadow-sm"
            to={`/recipes/${getRecipeKey(recipe)}/edit`}
          >
            <Pencil size={18} />
            Edit
          </Link>
        </div>
      </header>

      <RecipeHeroImage icon={HeroIcon} recipe={recipe} />

      <div className="mt-5">
        <p className="text-sm font-bold uppercase tracking-wide text-[#5A8D2B]">
          {category}
        </p>
        <h1 className="mt-2 text-[2.25rem] font-bold leading-none tracking-tight text-stone-900">
          {recipe.name}
        </h1>
        {recipe.description && (
          <p className="mt-3 text-base leading-relaxed text-stone-500">
            {recipe.description}
          </p>
        )}
      </div>

      {successMessage && (
        <div className="fixed bottom-[6.25rem] left-1/2 z-30 flex w-[calc(100%-2rem)] max-w-[430px] -translate-x-1/2 items-center gap-3 rounded-3xl border border-green-100 bg-[#EAF3DE] px-4 py-3 text-[#5A8D2B] shadow-[0_14px_34px_rgba(30,41,59,0.16)]">
          <CheckCircle2 size={22} />
          <p className="font-bold">{successMessage}</p>
        </div>
      )}

      <div className="mt-5 grid grid-cols-3 gap-3">
        <InfoPill icon={Clock} label="Prep" value={prepTime} />
        <InfoPill icon={Clock} label="Cook" value={cookTime} />
        <InfoPill icon={Users} label="Serves" value={servings} />
      </div>

      <div className="mt-5 space-y-4">
        <DetailSection title="Ingredients">
          {ingredients.length > 0 ? (
            <ul className="space-y-2">
              {ingredients.map((ingredient) => (
                <li
                  className="rounded-2xl bg-[#FAF8F3] px-4 py-3 text-sm font-semibold text-stone-700"
                  key={ingredient}
                >
                  {ingredient}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm font-medium text-stone-500">
              No ingredients added yet.
            </p>
          )}
        </DetailSection>

        <DetailSection title="Method">
          {method ? (
            <p className="whitespace-pre-line text-sm font-medium leading-relaxed text-stone-600">
              {method}
            </p>
          ) : (
            <p className="text-sm font-medium text-stone-500">
              No method added yet.
            </p>
          )}
        </DetailSection>

        {recipe.notes && (
          <DetailSection title="Notes">
            <p className="whitespace-pre-line text-sm font-medium leading-relaxed text-stone-600">
              {recipe.notes}
            </p>
          </DetailSection>
        )}

        <button
          className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl border border-red-100 bg-red-50 text-base font-bold text-red-600 shadow-sm"
          onClick={() => setShowDeleteConfirm(true)}
          type="button"
        >
          <Trash2 size={20} />
          Delete Recipe
        </button>
      </div>

      <button
        className={`sticky bottom-[6.4rem] mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-base font-bold text-white transition active:scale-[0.96] ${
          wasJustAdded
            ? 'bg-[#466F22] shadow-[0_16px_28px_rgba(70,111,34,0.28)]'
            : 'bg-[#5A8D2B] shadow-[0_12px_24px_rgba(90,141,43,0.3)] hover:scale-[1.01]'
        }`}
        onClick={addRecipeToWeek}
        type="button"
      >
        <CalendarPlus size={21} />
        {wasJustAdded ? 'Added to Week' : 'Add to Week'}
      </button>

      {showDeleteConfirm && (
        <DeleteRecipeModal
          onCancel={() => setShowDeleteConfirm(false)}
          onDelete={deleteRecipe}
          recipeName={recipe.name}
        />
      )}
    </section>
  )
}

export default RecipeDetail
