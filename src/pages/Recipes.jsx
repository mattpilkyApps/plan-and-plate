import {
  Apple,
  BookOpen,
  Bookmark,
  CalendarPlus,
  CheckCircle2,
  Filter,
  BookOpenText,
  Moon,
  Pencil,
  Search,
  Sun,
  Sunrise,
  Trash2,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import ComingSoonSheet from '../components/ComingSoonSheet'
import EmptyState from '../components/EmptyState'
import FloatingActionButton from '../components/FloatingActionButton'
import RecipeCard from '../components/RecipeCard'
import ScreenHeader from '../components/ScreenHeader'
import { recipes as sampleRecipes } from '../data/sampleData'
import { getMealIcon } from '../utils/mealIcons'
import { getRecipeId, getRecipeKey, getVisibleRecipes } from '../utils/recipeKeys'
import {
  createLocalId,
  deleteSavedRecipe,
  getRemovedRecipeIds,
  getSavedRecipes,
  saveWeeklyQueueItem,
} from '../utils/localStorage'

const categoryFilters = [
  { label: 'All', Icon: Bookmark },
  { label: 'Breakfast', Icon: Sun },
  { label: 'Lunch', Icon: Sunrise },
  { label: 'Dinner', Icon: Moon },
  { label: 'Snacks', Icon: Apple },
]

const filterComingSoonMessage =
  'More recipe filters are coming soon. For now, use search and the category chips.'

function RecipesHeader({ recipeCount }) {
  return (
    <ScreenHeader
      actions={
        <span className="flex h-[3.25rem] w-[3.25rem] items-center justify-center rounded-2xl bg-[#EAF3DE] text-[#5A8D2B] shadow-sm">
          <BookOpen size={25} />
        </span>
      }
      eyebrow="Recipe Library"
      stats={[{ label: `${recipeCount} recipes`, icon: BookOpenText }]}
      subtitle="Quick meals, family favourites, and saved ideas"
      title="Your recipes"
    />
  )
}

function SearchAndFilter({ onOpenFilter, onSearchChange, searchTerm }) {
  return (
    <div className="mt-7 flex gap-3">
      <label className="flex h-14 min-w-0 flex-1 items-center gap-3 rounded-2xl border border-stone-100 bg-white px-4 text-stone-400 shadow-sm">
        <Search size={24} />
        <input
          className="w-full bg-transparent text-base font-medium text-stone-700 outline-none placeholder:text-stone-400"
          onChange={onSearchChange}
          placeholder="Search recipes..."
          type="search"
          value={searchTerm}
        />
      </label>

      <button
        className="flex h-14 items-center gap-2 rounded-2xl border border-stone-100 bg-white px-4 font-bold text-[#5A8D2B] shadow-sm"
        onClick={onOpenFilter}
        type="button"
      >
        <Filter size={20} />
        <span>Filter</span>
      </button>
    </div>
  )
}

function CategoryChips({ onSelectCategory, selectedCategory }) {
  return (
    <div className="no-scrollbar -mx-4 mt-5 overflow-x-auto px-4 pb-1">
      <div className="flex w-max gap-3">
        {categoryFilters.map((category) => {
          const Icon = category.Icon
          const isActive = category.label === selectedCategory

          return (
            <button
              key={category.label}
              onClick={() => onSelectCategory(category.label)}
              className={`flex h-12 items-center gap-2 rounded-2xl px-4 text-base font-bold shadow-sm transition ${
                isActive
                  ? 'bg-[#EAF3DE] text-[#5A8D2B]'
                  : 'bg-[#FBF6EE] text-stone-800'
              }`}
              type="button"
            >
              <Icon
                size={21}
                className={isActive ? 'text-[#5A8D2B]' : ''}
              />
              {category.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function BottomSheet({ children }) {
  return (
    <div className="fixed inset-0 z-20 flex items-end bg-stone-900/25 px-4 pb-4">
      <div className="mx-auto w-full max-w-[430px] rounded-3xl bg-[#FAF8F3] p-4 shadow-[0_18px_50px_rgba(30,41,59,0.25)]">
        {children}
      </div>
    </div>
  )
}

function SheetHeader({ eyebrow, onClose, title }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-bold uppercase tracking-wide text-[#5A8D2B]">
          {eyebrow}
        </p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-stone-900">
          {title}
        </h2>
      </div>

      <button
        className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-stone-700 shadow-sm"
        onClick={onClose}
        type="button"
      >
        <X size={22} />
      </button>
    </div>
  )
}

function RecipeActionButton({ children, icon: Icon, isDanger, onClick }) {
  return (
    <button
      className={`flex h-12 w-full items-center gap-3 rounded-2xl bg-white px-4 py-3 text-left text-base font-bold shadow-sm ${
        isDanger ? 'text-red-600' : 'text-stone-800'
      }`}
      onClick={onClick}
      type="button"
    >
      <Icon
        className={isDanger ? 'text-red-600' : 'text-[#5A8D2B]'}
        size={21}
      />
      {children}
    </button>
  )
}

function RecipeActionsSheet({
  onAddToWeek,
  onClose,
  onDelete,
  onEdit,
  onView,
  recipe,
}) {
  if (!recipe) {
    return null
  }

  return (
    <BottomSheet>
      <SheetHeader
        eyebrow="Recipe actions"
        onClose={onClose}
        title={recipe.name}
      />

      <div className="mt-5 grid gap-3">
        <RecipeActionButton icon={BookOpen} onClick={onView}>
          View recipe
        </RecipeActionButton>
        <RecipeActionButton icon={Pencil} onClick={onEdit}>
          Edit recipe
        </RecipeActionButton>
        <RecipeActionButton icon={CalendarPlus} onClick={onAddToWeek}>
          Add to Week
        </RecipeActionButton>
        <RecipeActionButton icon={Trash2} isDanger onClick={onDelete}>
          Delete recipe
        </RecipeActionButton>
      </div>
    </BottomSheet>
  )
}

function DeleteRecipeSheet({ onCancel, onDelete, recipe }) {
  if (!recipe) {
    return null
  }

  return (
    <BottomSheet>
      <SheetHeader eyebrow="Delete recipe" onClose={onCancel} title={recipe.name} />

      <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold leading-relaxed text-red-600">
        This will remove the recipe and any linked planned meals.
      </p>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <button
          className="h-12 rounded-2xl border border-stone-100 bg-white px-4 text-base font-bold text-stone-700 shadow-sm"
          onClick={onCancel}
          type="button"
        >
          Cancel
        </button>
        <button
          className="h-12 rounded-2xl bg-red-600 px-4 text-base font-bold text-white shadow-[0_12px_24px_rgba(220,38,38,0.22)]"
          onClick={onDelete}
          type="button"
        >
          Delete
        </button>
      </div>
    </BottomSheet>
  )
}

function Recipes() {
  const location = useLocation()
  const navigate = useNavigate()
  const [savedRecipes, setSavedRecipes] = useState(() => getSavedRecipes())
  const [removedRecipeIds, setRemovedRecipeIds] = useState(() =>
    getRemovedRecipeIds(),
  )
  const [recipeForActions, setRecipeForActions] = useState(null)
  const [recipeToDelete, setRecipeToDelete] = useState(null)
  const [comingSoonMessage, setComingSoonMessage] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [successMessage, setSuccessMessage] = useState(
    location.state?.successMessage || '',
  )
  const [addedRecipeId, setAddedRecipeId] = useState('')

  const allRecipes = getVisibleRecipes(
    savedRecipes,
    sampleRecipes,
    removedRecipeIds,
  )
  const filteredRecipes = allRecipes.filter((recipe) => {
    const searchableText = [
      recipe.name,
      recipe.mealType,
      recipe.description,
      ...(recipe.badges || []),
    ]
      .join(' ')
      .toLowerCase()

    const matchesSearch = searchableText.includes(searchTerm.trim().toLowerCase())
    const matchesCategory =
      selectedCategory === 'All' || recipe.mealType === selectedCategory

    return matchesSearch && matchesCategory
  })

  function addRecipeToWeek(recipe) {
    const recipeId = recipe.id || recipe.name

    setRecipeForActions(null)
    setSuccessMessage('')
    setAddedRecipeId(recipeId)
    window.setTimeout(() => {
      setAddedRecipeId((currentId) => (currentId === recipeId ? '' : currentId))
    }, 1400)

    const queueItem = {
      id: createLocalId('weekly-queue'),
      recipeId,
      recipeName: recipe.name,
      plannedServings: recipe.servings || 1,
      icon:
        recipe.icon ||
        getMealIcon({
          mealType: recipe.mealType,
          name: recipe.name,
        }),
      image: recipe.image,
      mealType: recipe.mealType,
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

  function openRecipeDetail(recipe) {
    navigate(`/recipes/${getRecipeKey(recipe)}`)
  }

  function openRecipeActions(recipe) {
    setRecipeForActions(recipe)
    setSuccessMessage('')
  }

  function editRecipeFromActions() {
    navigate(`/recipes/${getRecipeKey(recipeForActions)}/edit`)
  }

  function deleteRecipeFromActions() {
    const nextSavedRecipes = deleteSavedRecipe(getRecipeId(recipeToDelete))

    setSavedRecipes(nextSavedRecipes)
    setRemovedRecipeIds(getRemovedRecipeIds())
    setRecipeToDelete(null)
    setRecipeForActions(null)
    setSuccessMessage(`${recipeToDelete.name} deleted.`)
  }

  return (
    <section className="relative">
      <RecipesHeader recipeCount={filteredRecipes.length} />
      <SearchAndFilter
        onOpenFilter={() => setComingSoonMessage(filterComingSoonMessage)}
        onSearchChange={(event) => setSearchTerm(event.target.value)}
        searchTerm={searchTerm}
      />
      <CategoryChips
        onSelectCategory={setSelectedCategory}
        selectedCategory={selectedCategory}
      />

      {successMessage && (
        <div className="fixed bottom-[6.25rem] left-1/2 z-30 flex w-[calc(100%-2rem)] max-w-[430px] -translate-x-1/2 items-center gap-3 rounded-3xl border border-green-100 bg-[#EAF3DE] px-4 py-3 text-[#5A8D2B] shadow-[0_14px_34px_rgba(30,41,59,0.16)]">
          <CheckCircle2 size={22} />
          <p className="font-bold">{successMessage}</p>
        </div>
      )}

      {filteredRecipes.length === 0 ? (
        <div className="mt-5">
          <EmptyState icon={BookOpenText} title="No recipes found">
            {allRecipes.length === 0
              ? 'Add your first recipe to start planning meals.'
              : 'Try another search or add a new recipe.'}
          </EmptyState>
        </div>
      ) : (
        <div className="mt-5 grid gap-3">
          {filteredRecipes.map((recipe) => (
            <RecipeCard
              addedRecipeId={addedRecipeId}
              key={recipe.id || recipe.name}
              onAddToWeek={addRecipeToWeek}
              onOpenActions={openRecipeActions}
              onOpenRecipe={openRecipeDetail}
              recipe={recipe}
            />
          ))}
        </div>
      )}

      <FloatingActionButton label="Add recipe" to="/recipes/add" />

      <RecipeActionsSheet
        onAddToWeek={() => addRecipeToWeek(recipeForActions)}
        onClose={() => setRecipeForActions(null)}
        onDelete={() => {
          setRecipeToDelete(recipeForActions)
          setRecipeForActions(null)
        }}
        onEdit={editRecipeFromActions}
        onView={() => openRecipeDetail(recipeForActions)}
        recipe={recipeForActions}
      />

      <DeleteRecipeSheet
        onCancel={() => setRecipeToDelete(null)}
        onDelete={deleteRecipeFromActions}
        recipe={recipeToDelete}
      />

      <ComingSoonSheet
        message={comingSoonMessage}
        onClose={() => setComingSoonMessage('')}
        title="Recipe filters"
      />
    </section>
  )
}

export default Recipes
