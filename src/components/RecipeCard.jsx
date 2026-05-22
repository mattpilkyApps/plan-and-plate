import {
  CalendarPlus,
  Clock,
  Flame,
  Leaf,
  Moon,
  MoreVertical,
  Star,
  Sun,
  Sunrise,
  User,
} from 'lucide-react'

const mealStyles = {
  Breakfast: {
    Icon: Sun,
    className: 'bg-amber-50 text-amber-600',
  },
  Lunch: {
    Icon: Sunrise,
    className: 'bg-orange-50 text-orange-500',
  },
  Dinner: {
    Icon: Moon,
    className: 'bg-violet-50 text-violet-500',
  },
  Snacks: {
    Icon: Leaf,
    className: 'bg-green-50 text-green-700',
  },
}

const badgeStyles = {
  'Family Favourite': {
    Icon: Star,
    className: 'bg-amber-50 text-amber-700',
  },
  'Medium Spice': {
    Icon: Flame,
    className: 'bg-red-50 text-red-600',
  },
  Vegetarian: {
    Icon: Leaf,
    className: 'bg-green-50 text-green-700',
  },
  'High Protein': {
    Icon: User,
    className: 'bg-blue-50 text-blue-700',
  },
  'Saved Recipe': {
    Icon: Star,
    className: 'bg-green-50 text-[#5A8D2B]',
  },
}

function SmallPill({ icon: Icon, children, className }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-bold ${className}`}
    >
      <Icon size={14} />
      {children}
    </span>
  )
}

function RecipeThumbnail({ recipe, icon: Icon }) {
  if (recipe.image) {
    return (
      <img
        src={recipe.image}
        alt=""
        className="h-32 w-32 shrink-0 rounded-2xl object-cover"
      />
    )
  }

  return (
    <div className="flex h-32 w-32 shrink-0 items-center justify-center rounded-2xl bg-[#EAF3DE] text-[#5A8D2B]">
      <Icon size={42} />
    </div>
  )
}

function RecipeCard({
  addedRecipeId,
  onAddToWeek,
  onOpenActions,
  onOpenRecipe,
  recipe,
}) {
  const mealStyle = mealStyles[recipe.mealType] || mealStyles.Dinner
  const MealIcon = mealStyle.Icon
  const firstBadge = recipe.badges?.[0] || 'Saved Recipe'
  const badgeStyle = badgeStyles[firstBadge] || badgeStyles['Saved Recipe']
  const BadgeIcon = badgeStyle.Icon
  const recipeId = recipe.id || recipe.name
  const wasJustAdded = addedRecipeId === recipeId

  return (
    <article
      className="flex cursor-pointer gap-4 rounded-3xl border border-stone-100 bg-white p-3 text-left shadow-[0_8px_24px_rgba(30,41,59,0.05)] transition hover:scale-[1.005]"
      onClick={() => onOpenRecipe(recipe)}
    >
      <RecipeThumbnail icon={MealIcon} recipe={recipe} />

      <div className="min-w-0 flex-1 py-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="line-clamp-2 text-xl font-bold leading-tight tracking-tight text-stone-900">
              {recipe.name}
            </h2>

            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
              <SmallPill icon={MealIcon} className={mealStyle.className}>
                {recipe.mealType}
              </SmallPill>
              <span className="text-stone-300">-</span>
              <span className="inline-flex items-center gap-1 font-semibold text-[#5A8D2B]">
                <User size={15} />
                Serves {recipe.servings}
              </span>
            </div>
          </div>

          <button
            aria-label={`Recipe actions for ${recipe.name}`}
            className="rounded-full p-1 text-stone-700"
            onClick={(event) => {
              event.stopPropagation()
              onOpenActions(recipe)
            }}
            type="button"
          >
            <MoreVertical size={22} />
          </button>
        </div>

        <p className="mt-3 line-clamp-2 text-[0.95rem] leading-relaxed text-stone-600">
          {recipe.description}
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          <SmallPill icon={Clock} className="bg-green-50 text-[#5A8D2B]">
            {recipe.time}
          </SmallPill>
          <SmallPill icon={BadgeIcon} className={badgeStyle.className}>
            {firstBadge}
          </SmallPill>
        </div>

        <button
          className={`mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-2xl text-sm font-bold transition active:scale-[0.96] ${
            wasJustAdded
              ? 'bg-[#5A8D2B] text-white shadow-[0_10px_20px_rgba(90,141,43,0.22)]'
              : 'bg-[#EAF3DE] text-[#5A8D2B] hover:scale-[1.01]'
          }`}
          onClick={(event) => {
            event.stopPropagation()
            onAddToWeek(recipe)
          }}
          type="button"
        >
          <CalendarPlus size={18} />
          {wasJustAdded ? 'Added' : 'Add to Week'}
        </button>
      </div>
    </article>
  )
}

export default RecipeCard
