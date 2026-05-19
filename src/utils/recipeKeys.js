export function getRecipeKey(recipe) {
  return encodeURIComponent(recipe.id || recipe.name)
}

export function getRecipeId(recipe) {
  return recipe.id || recipe.name
}

export function findRecipeByKey(recipes, recipeKey) {
  const decodedRecipeKey = decodeURIComponent(recipeKey)

  return recipes.find((recipe) => getRecipeId(recipe) === decodedRecipeKey)
}

export function getVisibleRecipes(
  savedRecipes,
  sampleRecipes,
  removedRecipeIds,
) {
  const savedRecipeIds = savedRecipes.map((recipe) => getRecipeId(recipe))
  const visibleSavedRecipes = savedRecipes.filter(
    (recipe) => !removedRecipeIds.includes(getRecipeId(recipe)),
  )
  const visibleSampleRecipes = sampleRecipes.filter((recipe) => {
    const recipeId = getRecipeId(recipe)

    return (
      !removedRecipeIds.includes(recipeId) && !savedRecipeIds.includes(recipeId)
    )
  })

  return [...visibleSavedRecipes, ...visibleSampleRecipes]
}
