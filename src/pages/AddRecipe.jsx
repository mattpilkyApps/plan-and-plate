import { ArrowLeft, CheckCircle2, Clock, Save, Users } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import EmptyState from '../components/EmptyState'
import { recipes as sampleRecipes } from '../data/sampleData'
import {
  createLocalId,
  getRemovedRecipeIds,
  getSavedRecipes,
  saveRecipe as saveRecipeToStorage,
  updateSavedRecipe,
} from '../utils/localStorage'
import { getMealIcon } from '../utils/mealIcons'
import { parseIngredients } from '../utils/ingredientParser'
import {
  findRecipeByKey,
  getRecipeId,
  getRecipeKey,
  getVisibleRecipes,
} from '../utils/recipeKeys'

const initialRecipe = {
  name: '',
  category: 'Dinner',
  prepTime: '',
  cookTime: '',
  servings: '',
  ingredients: '',
  method: '',
  notes: '',
}

function getRecipeFormValues(recipe) {
  if (!recipe) {
    return initialRecipe
  }

  return {
    name: recipe.name || '',
    category: recipe.mealType || recipe.category || 'Dinner',
    prepTime: recipe.prepTime || '',
    cookTime: recipe.cookTime || '',
    servings: recipe.servings || '',
    ingredients:
      recipe.ingredients ||
      (recipe.parsedIngredients || [])
        .map((ingredient) => ingredient.rawText || ingredient.name)
        .join('\n'),
    method: recipe.method || recipe.instructions || '',
    notes: recipe.notes || '',
  }
}

function TextInput({ label, name, value, onChange, placeholder, type = 'text' }) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-stone-700">{label}</span>
      <input
        className="mt-2 h-14 w-full rounded-2xl border border-stone-100 bg-white px-4 text-base font-medium text-stone-800 shadow-sm outline-none transition placeholder:text-stone-400 focus:border-[#A8C686] focus:ring-4 focus:ring-[#EAF3DE]"
        name={name}
        onChange={onChange}
        placeholder={placeholder}
        type={type}
        value={value}
      />
    </label>
  )
}

function TextArea({
  helperText,
  label,
  name,
  value,
  onChange,
  placeholder,
  rows = 4,
}) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-stone-700">{label}</span>
      <textarea
        className="mt-2 w-full resize-none rounded-2xl border border-stone-100 bg-white px-4 py-4 text-base font-medium leading-relaxed text-stone-800 shadow-sm outline-none transition placeholder:text-stone-400 focus:border-[#A8C686] focus:ring-4 focus:ring-[#EAF3DE]"
        name={name}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        value={value}
      />
      {helperText && (
        <span className="mt-2 block text-sm font-medium leading-relaxed text-stone-500">
          {helperText}
        </span>
      )}
    </label>
  )
}

function AddRecipe() {
  const navigate = useNavigate()
  const { recipeKey } = useParams()
  const [savedRecipes] = useState(() => getSavedRecipes())
  const allRecipes = getVisibleRecipes(
    savedRecipes,
    sampleRecipes,
    getRemovedRecipeIds(),
  )
  const recipeToEdit = recipeKey
    ? findRecipeByKey(allRecipes, recipeKey)
    : null
  const isEditing = Boolean(recipeKey && recipeToEdit)
  const [recipe, setRecipe] = useState(() => getRecipeFormValues(recipeToEdit))
  const [errorMessage, setErrorMessage] = useState('')

  function updateRecipe(event) {
    const { name, value } = event.target
    setRecipe((currentRecipe) => ({
      ...currentRecipe,
      [name]: value,
    }))
    setErrorMessage('')
  }

  function handleSaveRecipe(event) {
    event.preventDefault()

    const recipeToSave = {
      id: recipeToEdit ? getRecipeId(recipeToEdit) : createLocalId('recipe'),
      name: recipe.name || 'Untitled Recipe',
      mealType: recipe.category,
      prepTime: recipe.prepTime,
      time: recipe.prepTime || recipe.cookTime || 'Not set',
      cookTime: recipe.cookTime,
      servings: recipe.servings || '1',
      description: recipe.notes || 'A locally saved recipe.',
      ingredients: recipe.ingredients,
      parsedIngredients: parseIngredients(recipe.ingredients),
      method: recipe.method,
      notes: recipe.notes,
      badges: recipeToEdit?.badges || ['Saved Recipe'],
      icon: getMealIcon({ mealType: recipe.category, name: recipe.name }),
      image: recipeToEdit?.image || '/recipe-images/spaghetti.svg',
    }

    const nextSavedRecipes = isEditing
      ? updateSavedRecipe(recipeToSave)
      : saveRecipeToStorage(recipeToSave)
    console.log(isEditing ? 'Updated recipe:' : 'New recipe:', recipeToSave)

    const recipeWasSaved = nextSavedRecipes.some(
      (savedRecipe) =>
        savedRecipe.id === recipeToSave.id &&
        savedRecipe.name === recipeToSave.name,
    )

    if (!recipeWasSaved) {
      setErrorMessage('Recipe could not be saved in this browser.')
      return
    }

    if (isEditing) {
      navigate(`/recipes/${getRecipeKey(recipeToSave)}`)
      return
    }

    navigate('/recipes', {
      state: { successMessage: `${recipeToSave.name} saved to recipes.` },
    })
  }

  if (recipeKey && !recipeToEdit) {
    return (
      <section>
        <Link
          className="mb-5 flex h-[3.25rem] w-[3.25rem] items-center justify-center rounded-2xl border border-stone-100 bg-white text-stone-800 shadow-sm"
          to="/recipes"
        >
          <ArrowLeft size={25} />
        </Link>
        <EmptyState title="Recipe cannot be edited">
          Head back to recipes and choose another meal.
        </EmptyState>
      </section>
    )
  }

  return (
    <section className="pb-6">
      <header className="flex items-center justify-between gap-4">
        <Link
          className="flex h-[3.25rem] w-[3.25rem] items-center justify-center rounded-2xl border border-stone-100 bg-white text-stone-800 shadow-sm"
          to={isEditing ? `/recipes/${getRecipeKey(recipeToEdit)}` : '/recipes'}
        >
          <ArrowLeft size={25} />
        </Link>

        <div className="min-w-0 flex-1">
          <h1 className="text-[2.2rem] font-bold leading-none tracking-tight text-stone-900">
            {isEditing ? 'Edit Recipe' : 'Add Recipe'}
          </h1>
          <p className="mt-2 text-base text-stone-500">
            {isEditing
              ? 'Update your saved recipe'
              : 'Save a family favourite for later'}
          </p>
        </div>
      </header>

      {errorMessage && (
        <div className="mt-6 flex items-center gap-3 rounded-3xl border border-red-100 bg-red-50 px-4 py-3 text-red-600 shadow-sm">
          <CheckCircle2 size={22} />
          <p className="font-bold">{errorMessage}</p>
        </div>
      )}

      <form className="mt-6 space-y-5" onSubmit={handleSaveRecipe}>
        <div className="rounded-3xl border border-stone-100 bg-white/70 p-4 shadow-[0_8px_24px_rgba(30,41,59,0.05)]">
          <TextInput
            label="Recipe name"
            name="name"
            onChange={updateRecipe}
            placeholder="Spaghetti Bolognese"
            value={recipe.name}
          />

          <label className="mt-5 block">
            <span className="text-sm font-bold text-stone-700">Category</span>
            <select
              className="mt-2 h-14 w-full rounded-2xl border border-stone-100 bg-white px-4 text-base font-bold text-stone-800 shadow-sm outline-none transition focus:border-[#A8C686] focus:ring-4 focus:ring-[#EAF3DE]"
              name="category"
              onChange={updateRecipe}
              value={recipe.category}
            >
              <option>Breakfast</option>
              <option>Lunch</option>
              <option>Dinner</option>
              <option>Snacks</option>
            </select>
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3 rounded-3xl border border-stone-100 bg-white/70 p-4 shadow-[0_8px_24px_rgba(30,41,59,0.05)]">
          <div className="col-span-2 flex items-center gap-2 text-sm font-bold text-[#5A8D2B]">
            <Clock size={18} />
            Time and servings
          </div>
          <TextInput
            label="Prep time"
            name="prepTime"
            onChange={updateRecipe}
            placeholder="15 mins"
            value={recipe.prepTime}
          />
          <TextInput
            label="Cook time"
            name="cookTime"
            onChange={updateRecipe}
            placeholder="30 mins"
            value={recipe.cookTime}
          />
          <div className="col-span-2">
            <TextInput
              label="Servings"
              name="servings"
              onChange={updateRecipe}
              placeholder="4"
              type="number"
              value={recipe.servings}
            />
          </div>
          <div className="col-span-2 flex items-center gap-2 rounded-2xl bg-[#F8F2EA] px-4 py-3 text-sm font-semibold text-stone-500">
            <Users size={18} />
            Keep this simple for now. We can add smarter serving tools later.
          </div>
        </div>

        <div className="space-y-5 rounded-3xl border border-stone-100 bg-white/70 p-4 shadow-[0_8px_24px_rgba(30,41,59,0.05)]">
          <TextArea
            helperText="For best results, add one ingredient per line. Pasted lists also work, but please double-check before saving."
            label="Ingredients"
            name="ingredients"
            onChange={updateRecipe}
            placeholder={'500g chicken breast\n2 onions\n1 tbsp olive oil'}
            rows={5}
            value={recipe.ingredients}
          />
          <TextArea
            label="Method / instructions"
            name="method"
            onChange={updateRecipe}
            placeholder="Write the cooking steps here..."
            rows={6}
            value={recipe.method}
          />
          <TextArea
            label="Optional notes"
            name="notes"
            onChange={updateRecipe}
            placeholder="Freezes well, swap pasta for rice..."
            rows={3}
            value={recipe.notes}
          />
        </div>

        <button
          className="sticky bottom-[6.4rem] flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#5A8D2B] text-base font-bold text-white shadow-[0_12px_24px_rgba(90,141,43,0.3)] transition hover:scale-[1.01]"
          type="submit"
        >
          <Save size={21} />
          {isEditing ? 'Update Recipe' : 'Save Recipe'}
        </button>
      </form>
    </section>
  )
}

export default AddRecipe
