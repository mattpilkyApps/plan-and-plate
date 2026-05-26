import {
  ArrowLeft,
  CheckCircle2,
  ClipboardPaste,
  Clock,
  ImagePlus,
  Save,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
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
import {
  formatIngredientForSingleUnit,
  isInstructionLikeIngredientLine,
  isRejectedIngredientLine,
  parseIngredients,
} from '../utils/ingredientParser'
import {
  findRecipeByKey,
  getRecipeId,
  getRecipeKey,
  getVisibleRecipes,
} from '../utils/recipeKeys'

const imageSizeLimit = 900
const imageQuality = 0.75
const addRecipeDraftKey = 'plan-and-plate-add-recipe-draft'

const initialRecipe = {
  name: '',
  category: 'Dinner',
  prepTime: '',
  cookTime: '',
  servings: '',
  image: '',
  ingredients: '',
  method: '',
  notes: '',
}

function recipeHasDraftContent(recipe) {
  return Object.values(recipe).some((value) => String(value || '').trim())
}

function getAddRecipeDraft() {
  try {
    const savedDraft = window.localStorage.getItem(addRecipeDraftKey)

    if (!savedDraft) {
      return null
    }

    const parsedDraft = JSON.parse(savedDraft)

    return recipeHasDraftContent(parsedDraft) ? parsedDraft : null
  } catch {
    return null
  }
}

function saveAddRecipeDraft(recipe) {
  try {
    window.localStorage.setItem(addRecipeDraftKey, JSON.stringify(recipe))
  } catch {
    // If browser storage is full, saving the recipe still works when submitted.
  }
}

function clearAddRecipeDraft() {
  try {
    window.localStorage.removeItem(addRecipeDraftKey)
  } catch {
    // Draft clearing is helpful, but not critical to recipe saving.
  }
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
    image: recipe.image || '',
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
        onFocus={(event) =>
          event.currentTarget.scrollIntoView({
            block: 'center',
            behavior: 'smooth',
          })
        }
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
        className="mt-2 w-full touch-pan-y resize-none overflow-y-auto overscroll-contain rounded-2xl border border-stone-100 bg-white px-4 py-4 text-base font-medium leading-relaxed text-stone-800 shadow-sm outline-none transition placeholder:text-stone-400 focus:border-[#A8C686] focus:ring-4 focus:ring-[#EAF3DE]"
        name={name}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        style={{ WebkitOverflowScrolling: 'touch' }}
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

function FormSection({ children, description, title }) {
  return (
    <section className="space-y-5 rounded-3xl border border-stone-100 bg-white/75 p-4 shadow-[0_8px_24px_rgba(30,41,59,0.05)]">
      <div>
        <h2 className="text-lg font-bold tracking-tight text-stone-900">
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-sm font-medium leading-relaxed text-stone-500">
            {description}
          </p>
        )}
      </div>
      {children}
    </section>
  )
}

function PasteRecipeSheet({ onClose, onImport, onPasteTextChange, pasteText }) {
  return (
    <div className="fixed inset-0 z-30 flex items-end bg-stone-900/25 px-4 pb-4">
      <div className="mx-auto max-h-[92vh] w-full max-w-[430px] overflow-y-auto rounded-3xl bg-[#FAF8F3] p-4 shadow-[0_18px_50px_rgba(30,41,59,0.25)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-[#5A8D2B]">
              Paste Recipe
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-stone-900">
              Import from text
            </h2>
          </div>

          <button
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-stone-700 shadow-sm transition active:scale-95"
            onClick={onClose}
            type="button"
          >
            <X size={22} />
          </button>
        </div>

        <p className="mt-4 rounded-2xl bg-[#EAF3DE] px-4 py-3 text-sm font-semibold leading-relaxed text-[#5A8D2B]">
          Paste a recipe here, even if it includes extra page text. Plan & Plate
          will automatically clean the ingredients into one measurement format
          and fill the form.
        </p>

        <textarea
          className="mt-4 h-[48vh] max-h-[24rem] w-full touch-pan-y resize-none overflow-y-auto overscroll-contain rounded-2xl border border-stone-100 bg-white px-4 py-4 text-base font-medium leading-relaxed text-stone-800 shadow-sm outline-none transition placeholder:text-stone-400 focus:border-[#A8C686] focus:ring-4 focus:ring-[#EAF3DE]"
          onChange={onPasteTextChange}
          placeholder={'Serves 4\nPrep time: 15 mins\nCook time: 30 mins\n\nIngredients\n500g chicken breast\n400ml coconut milk\n\nMethod\nCook everything gently until done.'}
          value={pasteText}
        />

        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            className="h-12 rounded-2xl border border-stone-100 bg-white px-4 text-base font-bold text-stone-700 shadow-sm transition active:scale-[0.98]"
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
          <button
            className="h-12 rounded-2xl bg-[#5A8D2B] px-4 text-base font-bold text-white shadow-[0_12px_24px_rgba(90,141,43,0.25)] transition active:scale-[0.98] disabled:bg-stone-300 disabled:shadow-none"
            disabled={!pasteText.trim()}
            onClick={onImport}
            type="button"
          >
            Fill form
          </button>
        </div>
      </div>
    </div>
  )
}

function cleanRecipePageLine(line) {
  return line
    .replace(/^[\s\-*\u2022]+/, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function getRecipePageHeading(line) {
  return line.replace(/:$/, '').trim().toLowerCase()
}

function isRecipePageMetaLine(line) {
  return /^(serves|servings|yield|prep time|cook time|total time)\b|^(prep|cook)\s*:/i.test(
    line,
  )
}

function isRecipePageNoiseLine(line) {
  const cleanLine = getRecipePageHeading(line)

  return [
    /^advertisement$/,
    /^skip to/,
    /^jump to recipe/,
    /^print recipe/,
    /^print$/,
    /^pin recipe/,
    /^save recipe/,
    /^shopping list$/,
    /^share$/,
    /^subscribe/,
    /^newsletter/,
    /^sign up/,
    /^log in/,
    /^privacy policy/,
    /^terms/,
    /^all rights reserved/,
    /^rating/,
    /^\d+(\.\d+)? from \d+ votes/,
    /^course\b/,
    /^cuisine\b/,
    /^keyword\b/,
    /^author\b/,
    /^calories\b/,
    /^cook(?:'|\u2019)?s notes?$/,
  ].some((pattern) => pattern.test(cleanLine))
}

function isRecipePageIngredientsHeading(line) {
  const cleanLine = getRecipePageHeading(line)

  return cleanLine.length < 60 && /^ingredients?\b/.test(cleanLine)
}

function isRecipePageMethodHeading(line) {
  const cleanLine = getRecipePageHeading(line)

  return (
    cleanLine.length < 60 &&
    /^(method|instructions|directions|preparation|steps)\b/.test(cleanLine)
  )
}

function isRecipePageStopHeading(line) {
  const cleanLine = getRecipePageHeading(line)

  return (
    cleanLine.length < 80 &&
    /^(nutrition|nutritional information|method|instructions|directions|notes|tips|recipe tips|equipment|storage|make ahead|freezing|substitutions|variations|faq|frequently asked questions|comments|reviews|video|more recipes|you may also like)\b/.test(
      cleanLine,
    )
  )
}

function isRecipePageIngredientSubheading(line) {
  return /^for\s+(the\s+)?/i.test(line.trim()) && line.length < 70
}

function isRecipePageLikelyIngredient(line) {
  return /^(\d|[\u00bc\u00bd\u00be\u2153\u2154\u215b\u215c\u215d\u215e]|one|two|three|four|five|six|seven|eight|nine|ten)\b/i.test(
    line,
  )
}

function isRecipePageUsefulIngredient(line) {
  return (
    isRecipePageLikelyIngredient(line) ||
    line.length < 120
  )
}

function shouldKeepDetectedIngredient(line) {
  if (isRejectedIngredientLine(line)) {
    return false
  }

  if (
    isInstructionLikeIngredientLine(line) &&
    !isRecipePageLikelyIngredient(line)
  ) {
    return false
  }

  return true
}

function getRecipePageTime(line, label) {
  const match = line.match(
    new RegExp(`^${label}(?:\\s*time)?\\s*:?\\s*(.+)$`, 'i'),
  )

  if (!match) {
    return ''
  }

  return match[1].trim()
}

function parsePastedRecipe(text) {
  if (!text.trim()) {
    return {
      servings: '',
      prepTime: '',
      cookTime: '',
      ingredients: '',
      method: '',
    }
  }

  const lines = text
    .replace(/\r/g, '\n')
    .split('\n')
    .map(cleanRecipePageLine)
    .filter(Boolean)
  let servings = ''
  let prepTime = ''
  let cookTime = ''
  let activeSection = ''
  const ingredientLines = []
  const methodLines = []

  lines.forEach((line) => {
    const cleanLine = line.replace(/:$/, '').trim()
    const lowerLine = cleanLine.toLowerCase()

    if (isRecipePageNoiseLine(cleanLine)) {
      return
    }

    if (isRecipePageIngredientsHeading(cleanLine)) {
      activeSection = 'ingredients'
      return
    }

    if (isRecipePageMethodHeading(cleanLine)) {
      activeSection = 'method'
      return
    }

    if (isRecipePageStopHeading(cleanLine)) {
      activeSection = 'ignore'
      return
    }

    const servingsMatch = line.match(
      /\b(?:serves|servings|yield)\s*:?\s*(\d+)/i,
    )

    if (servingsMatch && !servings) {
      servings = servingsMatch[1]
      return
    }

    if (activeSection !== 'method' && lowerLine.startsWith('prep') && !prepTime) {
      prepTime = getRecipePageTime(line, 'prep')
      return
    }

    if (activeSection !== 'method' && lowerLine.startsWith('cook') && !cookTime) {
      cookTime = getRecipePageTime(line, 'cook')
      return
    }

    if (
      activeSection === 'ingredients' &&
      !isRecipePageMetaLine(line) &&
      !isRecipePageIngredientSubheading(line) &&
      shouldKeepDetectedIngredient(line) &&
      isRecipePageUsefulIngredient(line)
    ) {
      ingredientLines.push(line)
      return
    }

    if (activeSection === 'method' && !isRecipePageMetaLine(line)) {
      methodLines.push(line)
      return
    }

    if (!activeSection && isRecipePageLikelyIngredient(line)) {
      ingredientLines.push(line)
    }
  })

  return {
    servings,
    prepTime,
    cookTime,
    ingredients: ingredientLines.join('\n'),
    method: methodLines.join('\n'),
  }
}

function resizeRecipeImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      const image = new Image()

      image.onload = () => {
        const scale = Math.min(
          1,
          imageSizeLimit / Math.max(image.width, image.height),
        )
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(image.width * scale)
        canvas.height = Math.round(image.height * scale)

        const context = canvas.getContext('2d')
        context.drawImage(image, 0, 0, canvas.width, canvas.height)

        resolve(canvas.toDataURL('image/jpeg', imageQuality))
      }

      image.onerror = () => reject(new Error('Image could not be loaded.'))
      image.src = reader.result
    }

    reader.onerror = () => reject(new Error('Image could not be read.'))
    reader.readAsDataURL(file)
  })
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
  const [recipe, setRecipe] = useState(() => {
    if (isEditing) {
      return getRecipeFormValues(recipeToEdit)
    }

    return getAddRecipeDraft() || initialRecipe
  })
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [pasteText, setPasteText] = useState('')
  const [showPasteSheet, setShowPasteSheet] = useState(false)
  const [isProcessingImage, setIsProcessingImage] = useState(false)

  useEffect(() => {
    if (isEditing) {
      return
    }

    if (recipeHasDraftContent(recipe)) {
      saveAddRecipeDraft(recipe)
      return
    }

    clearAddRecipeDraft()
  }, [isEditing, recipe])

  function updateRecipe(event) {
    const { name, value } = event.target
    setRecipe((currentRecipe) => ({
      ...currentRecipe,
      [name]: value,
    }))
    setErrorMessage('')
    setSuccessMessage('')
  }

  async function handleImageChange(event) {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    setIsProcessingImage(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const compressedImage = await resizeRecipeImage(file)
      setRecipe((currentRecipe) => ({
        ...currentRecipe,
        image: compressedImage,
      }))
      setSuccessMessage('Photo added. It will be saved with this recipe.')
    } catch {
      setErrorMessage('That photo could not be added. Try another image.')
    } finally {
      setIsProcessingImage(false)
      event.target.value = ''
    }
  }

  function removeImage() {
    setRecipe((currentRecipe) => ({
      ...currentRecipe,
      image: '',
    }))
    setSuccessMessage('Photo removed from this recipe.')
  }

  function closePasteSheet() {
    setShowPasteSheet(false)
  }

  function getFormattedImportedIngredients(ingredientsText) {
    return parseIngredients(ingredientsText)
      .map(formatIngredientForSingleUnit)
      .filter(Boolean)
      .join('\n')
  }

  function importPastedRecipe() {
    const parsedRecipe = parsePastedRecipe(pasteText)
    const formattedIngredients = getFormattedImportedIngredients(
      parsedRecipe.ingredients,
    )

    setRecipe((currentRecipe) => ({
      ...currentRecipe,
      ingredients: formattedIngredients || currentRecipe.ingredients,
      method: parsedRecipe.method || currentRecipe.method,
    }))
    closePasteSheet()
    setPasteText('')
    setErrorMessage('')
    setSuccessMessage(
      'Recipe imported and cleaned. Please double-check before saving.',
    )
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
      image: recipe.image,
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

    clearAddRecipeDraft()
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
          className="flex h-[3.25rem] w-[3.25rem] items-center justify-center rounded-2xl border border-stone-100 bg-white text-stone-800 shadow-sm transition active:scale-95"
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

      <button
        className="mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-2xl border border-green-100 bg-[#EAF3DE] px-4 py-3 text-base font-bold text-[#5A8D2B] shadow-sm transition active:scale-[0.98]"
        onClick={() => setShowPasteSheet(true)}
        type="button"
      >
        <ClipboardPaste size={20} />
        Paste Recipe
      </button>

      {(errorMessage || successMessage) && (
        <div
          className={`mt-4 flex items-center gap-3 rounded-3xl border px-4 py-3 shadow-sm ${
            errorMessage
              ? 'border-red-100 bg-red-50 text-red-600'
              : 'border-green-100 bg-[#EAF3DE] text-[#5A8D2B]'
          }`}
        >
          <CheckCircle2 size={22} />
          <p className="font-bold">{errorMessage || successMessage}</p>
        </div>
      )}

      <form className="mt-5 space-y-5" onSubmit={handleSaveRecipe}>
        <FormSection
          description="Name the recipe and choose where it belongs."
          title="Basics"
        >
          <TextInput
            label="Recipe name"
            name="name"
            onChange={updateRecipe}
            placeholder="Spaghetti Bolognese"
            value={recipe.name}
          />

          <label className="block">
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

          <div className="grid grid-cols-2 gap-3">
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
          </div>

          <TextInput
            label="Servings"
            name="servings"
            onChange={updateRecipe}
            placeholder="4"
            type="number"
            value={recipe.servings}
          />

          <div className="flex items-center gap-2 rounded-2xl bg-[#F8F2EA] px-4 py-3 text-sm font-semibold text-stone-500">
            <Clock size={18} />
            <span>Time estimates can stay simple for beta testing.</span>
          </div>
        </FormSection>

        <FormSection
          description="Optional, but photos make recipes easier to recognise."
          title="Photo"
        >
          {recipe.image ? (
            <div className="overflow-hidden rounded-3xl border border-stone-100 bg-white shadow-sm">
              <img
                alt=""
                className="h-56 w-full object-cover"
                src={recipe.image}
              />
              <div className="grid grid-cols-2 gap-3 p-3">
                <label className="flex h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#EAF3DE] px-4 text-sm font-bold text-[#5A8D2B] transition active:scale-[0.98]">
                  <ImagePlus size={18} />
                  Replace
                  <input
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                    type="file"
                  />
                </label>
                <button
                  className="h-12 rounded-2xl border border-red-100 bg-red-50 px-4 text-sm font-bold text-red-600 transition active:scale-[0.98]"
                  onClick={removeImage}
                  type="button"
                >
                  Remove photo
                </button>
              </div>
            </div>
          ) : (
            <label className="flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-green-200 bg-[#F8F2EA] px-4 py-6 text-center transition active:scale-[0.99]">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF3DE] text-[#5A8D2B]">
                <ImagePlus size={26} />
              </span>
              <span className="mt-3 text-base font-bold text-stone-900">
                Add recipe photo
              </span>
              <span className="mt-1 text-sm font-medium leading-relaxed text-stone-500">
                Choose an image from this device.
              </span>
              <input
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
                type="file"
              />
            </label>
          )}

          {isProcessingImage && (
            <p className="text-sm font-semibold text-[#5A8D2B]">
              Preparing photo...
            </p>
          )}
        </FormSection>

        <FormSection
          description="This powers your generated shopping list."
          title="Ingredients"
        >
          <TextArea
            helperText="Pasted recipes are cleaned automatically into one measurement format."
            label="Ingredients"
            name="ingredients"
            onChange={updateRecipe}
            placeholder={'500g chicken breast\n2 onions\n1 tbsp olive oil'}
            rows={6}
            value={recipe.ingredients}
          />
        </FormSection>

        <FormSection
          description="Add the cooking steps in the order you use them."
          title="Method"
        >
          <TextArea
            label="Method / instructions"
            name="method"
            onChange={updateRecipe}
            placeholder="Write the cooking steps here..."
            rows={7}
            value={recipe.method}
          />
        </FormSection>

        <FormSection
          description="Optional reminders, swaps, or family notes."
          title="Notes"
        >
          <TextArea
            label="Optional notes"
            name="notes"
            onChange={updateRecipe}
            placeholder="Freezes well, swap pasta for rice..."
            rows={3}
            value={recipe.notes}
          />
        </FormSection>

        <button
          className="sticky bottom-[6.4rem] flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#5A8D2B] text-base font-bold text-white shadow-[0_12px_24px_rgba(90,141,43,0.3)] transition active:scale-[0.98]"
          type="submit"
        >
          <Save size={21} />
          {isEditing ? 'Update Recipe' : 'Save Recipe'}
        </button>
      </form>

      {showPasteSheet && (
        <PasteRecipeSheet
          onClose={closePasteSheet}
          onImport={importPastedRecipe}
          onPasteTextChange={(event) => setPasteText(event.target.value)}
          pasteText={pasteText}
        />
      )}
    </section>
  )
}

export default AddRecipe
