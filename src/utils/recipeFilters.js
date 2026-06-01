export const recipeSortOptions = [
  'Recently Used',
  'Recently Added',
  'A-Z',
  'Z-A',
  'Favourites First',
]

export const defaultRecipeSortOption = 'Recently Added'

export function compareRecipeNames(firstRecipe, secondRecipe) {
  return (firstRecipe.name || '').localeCompare(secondRecipe.name || '', undefined, {
    sensitivity: 'base',
  })
}

function getValidDateTime(value) {
  if (!value) {
    return 0
  }

  const dateTime = new Date(value).getTime()

  return Number.isNaN(dateTime) ? 0 : dateTime
}

export function getRecipeCreatedDate(recipe) {
  return getValidDateTime(recipe.createdAt || recipe.savedAt || recipe.date)
}

export function getRecipeLastUsedDate(recipe) {
  return getValidDateTime(recipe.lastUsed)
}

export function filterRecipesByChip(recipes, selectedTab) {
  if (selectedTab === 'Favourites') {
    return recipes.filter((recipe) => recipe.favourite)
  }

  if (selectedTab === 'All Recipes') {
    return recipes
  }

  return recipes.filter((recipe) => recipe.mealType === selectedTab)
}

export function filterRecipesBySearch(recipes, searchTerm) {
  const cleanSearchTerm = searchTerm.trim().toLowerCase()

  if (!cleanSearchTerm) {
    return recipes
  }

  return recipes.filter((recipe) => {
    const searchableText = [
      recipe.name,
      recipe.mealType,
      recipe.description,
      recipe.cuisine,
      ...(recipe.tags || []),
      ...(recipe.badges || []),
    ]
      .join(' ')
      .toLowerCase()

    return searchableText.includes(cleanSearchTerm)
  })
}

export function filterRecipesByCuisine(recipes, cuisine) {
  if (!cuisine) {
    return recipes
  }

  const cleanCuisine = cuisine.trim().toLowerCase()

  if (!cleanCuisine) {
    return recipes
  }

  return recipes.filter(
    (recipe) => (recipe.cuisine || '').trim().toLowerCase() === cleanCuisine,
  )
}

export function sortRecipes(recipes, selectedSort) {
  const recipesToSort = [...recipes]

  if (selectedSort === 'Recently Used') {
    return recipesToSort.sort((firstRecipe, secondRecipe) => {
      const firstLastUsed = getRecipeLastUsedDate(firstRecipe)
      const secondLastUsed = getRecipeLastUsedDate(secondRecipe)

      if (firstLastUsed && secondLastUsed) {
        return secondLastUsed - firstLastUsed
      }

      if (firstLastUsed) {
        return -1
      }

      if (secondLastUsed) {
        return 1
      }

      return compareRecipeNames(firstRecipe, secondRecipe)
    })
  }

  if (selectedSort === 'Recently Added') {
    return recipesToSort.sort((firstRecipe, secondRecipe) => {
      const firstCreatedDate = getRecipeCreatedDate(firstRecipe)
      const secondCreatedDate = getRecipeCreatedDate(secondRecipe)

      if (firstCreatedDate && secondCreatedDate) {
        return secondCreatedDate - firstCreatedDate
      }

      if (firstCreatedDate) {
        return -1
      }

      if (secondCreatedDate) {
        return 1
      }

      return compareRecipeNames(firstRecipe, secondRecipe)
    })
  }

  if (selectedSort === 'Z-A') {
    return recipesToSort.sort((firstRecipe, secondRecipe) =>
      compareRecipeNames(secondRecipe, firstRecipe),
    )
  }

  if (selectedSort === 'Favourites First') {
    return recipesToSort.sort((firstRecipe, secondRecipe) => {
      if (firstRecipe.favourite && !secondRecipe.favourite) {
        return -1
      }

      if (!firstRecipe.favourite && secondRecipe.favourite) {
        return 1
      }

      return compareRecipeNames(firstRecipe, secondRecipe)
    })
  }

  return recipesToSort.sort(compareRecipeNames)
}
