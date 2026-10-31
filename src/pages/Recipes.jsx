import {
  Apple,
  BookOpen,
  Bookmark,
  CalendarPlus,
  Check,
  CheckCircle2,
  ChevronDown,
  Filter,
  BookOpenText,
  Moon,
  Pencil,
  Search,
  Star,
  Sun,
  Sunrise,
  Trash2,
} from 'lucide-react'
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import EmptyState from '../components/EmptyState'
import RecipeCard from '../components/RecipeCard'
import ScreenHeader from '../components/ScreenHeader'
import BottomSheet from '../components/ui/BottomSheet'
import Pressable from '../components/ui/Pressable'
import StatusToast from '../components/ui/StatusToast'
import { recipes as sampleRecipes } from '../data/sampleData'
import { getMealIcon } from '../utils/mealIcons'
import {
  filterRecipesByChip,
  filterRecipesByCuisine,
  filterRecipesBySearch,
  recipeSortOptions,
  sortRecipes,
} from '../utils/recipeFilters'
import { getRecipeId, getRecipeKey, getVisibleRecipes } from '../utils/recipeKeys'
import {
  createLocalId,
  deleteSavedRecipe,
  getRecipeMetadata,
  getRecipeSortOption,
  getRemovedRecipeIds,
  getSavedRecipes,
  markRecipeUsed,
  saveRecipeSortOption,
  saveWeeklyQueueItem,
  toggleRecipeFavourite,
  withRecipeStatsList,
} from '../utils/localStorage'

const categoryFilters = [
  { label: 'All Recipes', Icon: Bookmark },
  { label: 'Favourites', Icon: Star },
  { label: 'Breakfast', Icon: Sun },
  { label: 'Lunch', Icon: Sunrise },
  { label: 'Dinner', Icon: Moon },
  { label: 'Snacks', Icon: Apple },
]

function RecipesHeader() {
  return (
    <ScreenHeader
      actions={
        <Pressable
          className="h-[3.25rem] px-3 text-sm shadow-sm"
          to="/recipes/add"
          variant="primary"
        >
          <CalendarPlus size={18} />
          <span>Add</span>
        </Pressable>
      }
      eyebrow="Recipe Library"
      stats={[]}
      subtitle="Familiar favourites. Fresh ideas. All in one place."
      title="Your recipe book"
    />
  )
}

function SearchAndFilter({ onOpenFilter, onSearchChange, searchTerm }) {
  return <div className="recipe-search-row"><label className="search-field"><Search size={19} /><input aria-label="Search recipes" type="search" placeholder="Find a recipe…" value={searchTerm} onChange={onSearchChange} /></label><button className="icon-button filter-button" aria-label="Sort recipes" onClick={onOpenFilter}><Filter size={19} /></button></div>
}
function RecipeTabs({ onSelectTab, selectedTab }) {
  return <div className="recipe-tabs no-scrollbar" aria-label="Recipe categories">{categoryFilters.map(({label,Icon}) => <button key={label} type="button" aria-pressed={selectedTab === label} onClick={() => onSelectTab(label)}><Icon size={14} />{label === 'All Recipes' ? 'All recipes' : label}</button>)}</div>
}

function RecipeActionButton({ children, icon: Icon, isDanger, onClick }) {
  return (
    <Pressable
      className="w-full justify-start text-left"
      onClick={onClick}
      variant={isDanger ? 'danger' : 'surface'}
    >
      <Icon
        className={isDanger ? 'text-red-600' : 'text-[#5A8D2B]'}
        size={21}
      />
      {children}
    </Pressable>
  )
}

function SortRecipesSheet({ onClose, onSelectSort, selectedSort }) {
  return (
    <BottomSheet eyebrow="Recipe filters" onClose={onClose} title="Sort Recipes">
      <div className="mt-5 grid gap-3">
        {recipeSortOptions.map((sortOption) => {
          const isSelected = selectedSort === sortOption

          return (
            <button
              className={`premium-press flex min-h-14 items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left shadow-sm ${
                isSelected
                  ? 'border-[#D7E8C3] bg-[#EAF3DE] text-[#5A8D2B]'
                  : 'border-stone-100 bg-white text-stone-800'
              }`}
              key={sortOption}
              onClick={() => onSelectSort(sortOption)}
              type="button"
            >
              <span>
                <span className="block text-base font-bold">{sortOption}</span>
                {sortOption === 'Recently Used' && (
                  <span className="mt-0.5 block text-xs font-semibold text-stone-500">
                    Meals you have planned most recently.
                  </span>
                )}
              </span>

              {isSelected && (
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-[#5A8D2B] shadow-sm">
                  <Check size={18} strokeWidth={3} />
                </span>
              )}
            </button>
          )
        })}
      </div>
    </BottomSheet>
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
    <BottomSheet eyebrow="Recipe actions" onClose={onClose} title={recipe.name}>
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
    <BottomSheet
      eyebrow="Delete recipe"
      onClose={onCancel}
      title={recipe.name}
      tone="danger"
    >

      <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold leading-relaxed text-red-600">
        This will remove the recipe and any linked planned meals.
      </p>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <Pressable
          onClick={onCancel}
          variant="surface"
        >
          Cancel
        </Pressable>
        <Pressable
          onClick={onDelete}
          variant="dangerSolid"
        >
          Delete
        </Pressable>
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
  const [showSortSheet, setShowSortSheet] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTab, setSelectedTab] = useState('All Recipes')
  const [selectedSort, setSelectedSort] = useState(() => getRecipeSortOption())
  const [recipeMetadata, setRecipeMetadata] = useState(() => getRecipeMetadata())
  const [successMessage, setSuccessMessage] = useState(
    location.state?.successMessage || '',
  )
  const [addedRecipeId, setAddedRecipeId] = useState('')

  const allRecipes = getVisibleRecipes(
    savedRecipes,
    sampleRecipes,
    removedRecipeIds,
  )
  const recipesWithStats = withRecipeStatsList(allRecipes, recipeMetadata)
  const chipFilteredRecipes = filterRecipesByChip(recipesWithStats, selectedTab)
  const searchedRecipes = filterRecipesBySearch(chipFilteredRecipes, searchTerm)
  const cuisineReadyRecipes = filterRecipesByCuisine(searchedRecipes, '')
  const filteredRecipes = sortRecipes(cuisineReadyRecipes, selectedSort)

  function toggleFavourite(recipe) {
    setRecipeMetadata(toggleRecipeFavourite(getRecipeId(recipe)))
  }

  function updateSelectedSort(sortOption) {
    setSelectedSort(saveRecipeSortOption(sortOption))
    setShowSortSheet(false)
  }

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
      usageTracked: true,
    }
    const queueItems = saveWeeklyQueueItem(queueItem)
    const itemWasSaved = queueItems.some((item) => item.id === queueItem.id)

    if (itemWasSaved) {
      setRecipeMetadata(markRecipeUsed(recipeId))
    }

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
    <section className="recipe-library relative">
      <RecipesHeader />
      <SearchAndFilter
        onOpenFilter={() => setShowSortSheet(true)}
        onSearchChange={(event) => setSearchTerm(event.target.value)}
        searchTerm={searchTerm}
      />
      <RecipeTabs
        onSelectTab={setSelectedTab}
        selectedTab={selectedTab}
      />

      <StatusToast
        icon={CheckCircle2}
        message={successMessage}
        show={Boolean(successMessage)}
      />

      <div className="library-result"><span>{filteredRecipes.length} {filteredRecipes.length === 1 ? 'recipe' : 'recipes'} to make your own</span><button className="inline-link" onClick={() => setShowSortSheet(true)}>{selectedSort}<ChevronDown size={13} /></button></div>
      {filteredRecipes.length === 0 ? (
        <div className="mt-5">
          <EmptyState icon={BookOpenText} title="No recipes found">
            {selectedTab === 'Favourites'
              ? 'Favourite recipes to find them quickly later.'
              : allRecipes.length === 0
              ? 'Add your first recipe to start planning meals.'
              : 'Try another search or add a new recipe.'}
          </EmptyState>
        </div>
      ) : (
        <div className="recipe-grid">
          {filteredRecipes.map((recipe, index) => (
            <div
              className="card-enter"
              key={recipe.id || recipe.name}
              style={{ animationDelay: `${Math.min(index, 8) * 35}ms` }}
            >
              <RecipeCard
                addedRecipeId={addedRecipeId}
                isFavourite={recipe.favourite}
                onAddToWeek={addRecipeToWeek}
                onOpenActions={openRecipeActions}
                onOpenRecipe={openRecipeDetail}
                onToggleFavourite={toggleFavourite}
                recipe={recipe}
              />
            </div>
          ))}
        </div>
      )}

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

      {showSortSheet && (
        <SortRecipesSheet
          onClose={() => setShowSortSheet(false)}
          onSelectSort={updateSelectedSort}
          selectedSort={selectedSort}
        />
      )}
    </section>
  )
}

export default Recipes
