import { Clock, Users, Heart, MoreHorizontal, Plus, Check } from 'lucide-react'
import RecipeImage from './RecipeImage'
export default function RecipeCard({
  addedRecipeId,
  isFavourite,
  onAddToWeek,
  onOpenActions,
  onOpenRecipe,
  onToggleFavourite,
  recipe,
}) {
  const added = addedRecipeId === (recipe.id || recipe.name)
  return (
    <article className="recipe-card">
      <div className="recipe-card-top">
        <button
          className="recipe-photo-button"
          aria-label={`View ${recipe.name}`}
          onClick={() => onOpenRecipe(recipe)}
        >
          <RecipeImage recipe={recipe} />
        </button>
        <button
          className={`favourite-button ${isFavourite ? 'is-favourite' : ''}`}
          aria-label={`${isFavourite ? 'Remove' : 'Add'} ${recipe.name} ${isFavourite ? 'from' : 'to'} favourites`}
          aria-pressed={isFavourite}
          onClick={() => onToggleFavourite(recipe)}
        >
          <Heart
            size={19}
            strokeWidth={1.8}
            fill={isFavourite ? 'currentColor' : 'none'}
          />
        </button>
        <span className="recipe-type">{recipe.mealType || 'Recipe'}</span>
      </div>
      <div className="recipe-card-body">
        <button
          className="recipe-card-name"
          onClick={() => onOpenRecipe(recipe)}
        >
          {recipe.name}
        </button>
        <div className="recipe-card-meta">
          <span>
            <Clock size={12} />
            {recipe.time ||
              recipe.cookTime ||
              recipe.prepTime ||
              'Time not set'}
          </span>
          <span>
            <Users size={12} />
            {recipe.servings || 1}
          </span>
        </div>
        <div className="recipe-card-actions">
          <button
            className="add-week-button"
            onClick={() => onAddToWeek(recipe)}
          >
            {added ? <Check size={15} /> : <Plus size={15} />}
            {added ? 'Added' : 'Add to week'}
          </button>
          <button
            className="icon-button"
            aria-label={`Recipe options for ${recipe.name}`}
            onClick={() => onOpenActions(recipe)}
          >
            <MoreHorizontal size={19} />
          </button>
        </div>
      </div>
    </article>
  )
}
