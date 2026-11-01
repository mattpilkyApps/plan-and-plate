import {
  ArrowLeft,
  CheckCircle2,
  ClipboardPaste,
  Clock,
  ImagePlus,
  Save,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import EmptyState from '../components/EmptyState'
import BottomSheet from '../components/ui/BottomSheet'
import Pressable from '../components/ui/Pressable'
import { recipes as sampleRecipes } from '../data/sampleData'
import {
  createLocalId,
  getRemovedRecipeIds,
  getSavedRecipes,
  saveRecipe as saveRecipeToStorage,
  updateSavedRecipe,
} from '../utils/localStorage'
import { getMealIcon } from '../utils/mealIcons'
import { parsePastedRecipe } from '../utils/recipeImport'
import { getRecipePasteSeparator } from '../utils/recipePaste'
import { parseIngredients } from '../utils/ingredientParser'
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
  sourcePaste: '',
}

function recipeHasDraftContent(recipe) {
  return Object.entries(recipe).some(
    ([key, value]) => key !== 'category' && String(value || '').trim(),
  )
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
    sourcePaste: recipe.sourcePaste || '',
  }
}

function TextInput({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = 'text',
}) {
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

function PasteRecipeSheet({
  errorMessage,
  onClose,
  onImport,
  onPasteTextChange,
  onPaste,
  pasteText,
}) {
  return (
    <BottomSheet
      eyebrow="Paste Recipe"
      onClose={onClose}
      panelClassName="max-h-[92vh] overflow-y-auto"
      title="Import from text"
      zIndex="z-30"
    >
      <p className="mt-4 rounded-2xl bg-[#EAF3DE] px-4 py-3 text-sm font-semibold leading-relaxed text-[#5A8D2B]">
        Copy the recipe text from a website or message. We’ll fill in the title,
        ingredients, method, servings and times we can recognise. Review the
        details before saving.
        {' '}For separate website tabs, paste the ingredients, then the method
        below them before filling the form.
      </p>

      <textarea
        aria-label="Pasted recipe text"
        className="mt-4 h-[48vh] max-h-[24rem] w-full touch-pan-y resize-none overflow-y-auto overscroll-contain rounded-2xl border border-stone-100 bg-white px-4 py-4 text-base font-medium leading-relaxed text-stone-800 shadow-sm outline-none transition placeholder:text-stone-400 focus:border-[#A8C686] focus:ring-4 focus:ring-[#EAF3DE]"
        onChange={onPasteTextChange}
        onPaste={onPaste}
        placeholder={
          'Family vegetable curry\nServes 4\nPrep time: 15 mins\nCook time: 30 mins\n\nIngredients\n2 onions, finely chopped\n400ml coconut milk\n\nMethod\nAdd the cooking steps here.'
        }
        value={pasteText}
      />

      {errorMessage && (
        <p className="mt-3 text-sm font-semibold text-red-700" role="alert">
          {errorMessage}
        </p>
      )}

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Pressable onClick={onClose} variant="surface">
          Cancel
        </Pressable>
        <Pressable
          disabled={!pasteText.trim()}
          onClick={onImport}
          variant="primary"
        >
          Fill form
        </Pressable>
      </div>
    </BottomSheet>
  )
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
  const recipeToEdit = recipeKey ? findRecipeByKey(allRecipes, recipeKey) : null
  const isEditing = Boolean(recipeKey && recipeToEdit)
  const [recipe, setRecipe] = useState(() => {
    if (isEditing) {
      return getRecipeFormValues(recipeToEdit)
    }

    return getAddRecipeDraft() || initialRecipe
  })
  const [restoredDraft] = useState(
    () => !isEditing && Boolean(getAddRecipeDraft()),
  )
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [pasteText, setPasteText] = useState(() => recipe.sourcePaste || '')
  const [pasteError, setPasteError] = useState('')
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
    setPasteError('')
  }

  function importPastedRecipe() {
    const parsedRecipe = parsePastedRecipe(pasteText, { includeDiagnostics: true })
    if (!parsedRecipe.ingredients && !parsedRecipe.method) {
      setPasteError(
        'We couldn’t find ingredients or cooking steps. Paste the recipe text, including its Ingredients and Method headings. A website link on its own won’t fill the form.',
      )
      return
    }

    const methodNeedsReview = parsedRecipe.diagnostics.method.reviewNeeded
    setRecipe((currentRecipe) => ({
      ...currentRecipe,
      name: parsedRecipe.name || currentRecipe.name,
      servings: parsedRecipe.servings || currentRecipe.servings,
      prepTime: parsedRecipe.prepTime || currentRecipe.prepTime,
      cookTime: parsedRecipe.cookTime || currentRecipe.cookTime,
      ingredients: parsedRecipe.ingredients || currentRecipe.ingredients,
      method: parsedRecipe.method || currentRecipe.method,
      notes: parsedRecipe.notes
        ? [...new Set([currentRecipe.notes, parsedRecipe.notes].filter(Boolean))].join('\n\n')
        : currentRecipe.notes,
      sourcePaste: methodNeedsReview ? pasteText : '',
    }))
    closePasteSheet()
    if (!methodNeedsReview) setPasteText('')
    setErrorMessage('')
    const needsReview = [
      ['name', 'recipe name'],
      ['servings', 'servings'],
      ['ingredients', 'ingredients'],
      ['method', 'method'],
    ]
      .filter(([field]) => !parsedRecipe[field])
      .map(([, label]) => label)
    const reviewMessage = needsReview.length
        ? 'Recipe text imported. Check or add: ' + needsReview.join(', ') + '.'
        : 'Recipe details filled. Check the ingredients and method before saving.'
    setSuccessMessage(
      methodNeedsReview
        ? reviewMessage + ' Some cooking text may need checking. Your original text is kept in Paste Recipe.'
        : reviewMessage,
    )
  }

  function handleSaveRecipe(event) {
    event.preventDefault()
    if (!recipe.name.trim()) {
      setErrorMessage('Give your recipe a name before saving.')
      return
    }
    if (
      recipe.servings &&
      (Number(recipe.servings) < 1 || Number(recipe.servings) > 100)
    ) {
      setErrorMessage('Choose between 1 and 100 servings.')
      return
    }
    const savedAt = new Date().toISOString()

    const recipeToSave = {
      id: recipeToEdit ? getRecipeId(recipeToEdit) : createLocalId('recipe'),
      name: recipe.name.trim(),
      mealType: recipe.category,
      prepTime: recipe.prepTime,
      time: recipe.cookTime || recipe.prepTime || 'Not set',
      cookTime: recipe.cookTime,
      servings: recipe.servings || '1',
      description: recipe.notes || 'A locally saved recipe.',
      ingredients: recipe.ingredients,
      parsedIngredients: parseIngredients(recipe.ingredients),
      method: recipe.method,
      notes: recipe.notes,
      ...(recipe.sourcePaste ? { sourcePaste: recipe.sourcePaste } : {}),
      badges: recipeToEdit?.badges || ['Saved Recipe'],
      icon: getMealIcon({ mealType: recipe.category, name: recipe.name }),
      image: recipe.image,
      createdAt: recipeToEdit?.createdAt || savedAt,
      updatedAt: isEditing ? savedAt : '',
      ...(recipeToEdit?.cuisine ? { cuisine: recipeToEdit.cuisine } : {}),
      ...(recipeToEdit?.tags ? { tags: recipeToEdit.tags } : {}),
    }

    const nextSavedRecipes = isEditing
      ? updateSavedRecipe(recipeToSave)
      : saveRecipeToStorage(recipeToSave)

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
          className="premium-press mb-5 flex h-[3.25rem] w-[3.25rem] items-center justify-center rounded-2xl border border-stone-100 bg-white text-stone-800 shadow-sm"
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
    <section className="recipe-form pb-6">
      <header className="flex items-center justify-between gap-4">
        <Link
          className="premium-press flex h-[3.25rem] w-[3.25rem] items-center justify-center rounded-2xl border border-stone-100 bg-white text-stone-800 shadow-sm"
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

      {restoredDraft && (
        <p className="helper mt-4" role="status">
          Your unfinished recipe has been restored. Pick up where you left off.
        </p>
      )}
      <Pressable
        className="mt-6 w-full"
        onClick={() => setShowPasteSheet(true)}
        size="lg"
        variant="secondary"
      >
        <ClipboardPaste size={20} />
        Paste Recipe
      </Pressable>

      {(errorMessage || successMessage) && (
        <div
          className={`mt-4 flex items-center gap-3 rounded-3xl border px-4 py-3 shadow-sm ${
            errorMessage
              ? 'border-red-100 bg-red-50 text-red-600'
              : 'border-green-100 bg-[#EAF3DE] text-[#5A8D2B]'
          } toast-motion-centered`}
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
                <label className="premium-press flex h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#EAF3DE] px-4 text-sm font-bold text-[#5A8D2B]">
                  <ImagePlus size={18} />
                  Replace
                  <input
                    accept="image/*"
                    className="sr-only"
                    onChange={handleImageChange}
                    type="file"
                  />
                </label>
                <button
                  className="premium-press h-12 rounded-2xl border border-red-100 bg-red-50 px-4 text-sm font-bold text-red-600"
                  onClick={removeImage}
                  type="button"
                >
                  Remove photo
                </button>
              </div>
            </div>
          ) : (
            <label className="premium-press flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-green-200 bg-[#F8F2EA] px-4 py-6 text-center">
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
                className="sr-only"
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
            helperText="Use one ingredient per line, with its quantity, unit and any preparation notes."
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

        <Pressable
          as="button"
          className="sticky bottom-[6.4rem] w-full"
          disabled={isProcessingImage}
          size="lg"
          type="submit"
          variant="primary"
        >
          <Save size={21} />
          {isEditing ? 'Update Recipe' : 'Save Recipe'}
        </Pressable>
      </form>

      {showPasteSheet && (
        <PasteRecipeSheet
          errorMessage={pasteError}
          onClose={closePasteSheet}
          onImport={importPastedRecipe}
          onPaste={(event) => {
            const input = event.currentTarget
            const incoming = event.clipboardData.getData('text/plain')
            const separator = getRecipePasteSeparator(input.value, incoming, input.selectionStart, input.selectionEnd)
            if (!separator) return
            event.preventDefault()
            setPasteText(input.value + separator + incoming)
            setPasteError('')
          }}
          onPasteTextChange={(event) => {
            setPasteText(event.target.value)
            setPasteError('')
          }}
          pasteText={pasteText}
        />
      )}
    </section>
  )
}

export default AddRecipe
