import { parseIngredientLine, parseIngredients } from './ingredientParser.js'

export const shoppingCategoryOptions = [
  'Fresh Produce',
  'Meat & Fish',
  'Dairy',
  'Pantry',
  'Frozen',
]

const groupStyles = {
  'Fresh Produce': 'green',
  'Meat & Fish': 'red',
  Dairy: 'amber',
  Pantry: 'violet',
  Frozen: 'blue',
}

function getRecipeKey(recipe) {
  return recipe.id || recipe.name
}

function findRecipeForMeal(plannedMeal, recipes) {
  return recipes.find((recipe) => getRecipeKey(recipe) === plannedMeal.recipeId)
}

function getIngredientCategory(ingredientName) {
  const name = ingredientName.toLowerCase()

  if (
    name.includes('chicken') ||
    name.includes('beef') ||
    name.includes('salmon') ||
    name.includes('fish') ||
    name.includes('tuna') ||
    name.includes('bacon')
  ) {
    return 'Meat & Fish'
  }

  if (
    name.includes('milk') ||
    name.includes('yogurt') ||
    name.includes('cheese') ||
    name.includes('egg') ||
    name.includes('butter')
  ) {
    return 'Dairy'
  }

  if (name.includes('frozen')) {
    return 'Frozen'
  }

  if (
    name.includes('spaghetti') ||
    name.includes('rice') ||
    name.includes('oil') ||
    name.includes('paste') ||
    name.includes('tin') ||
    name.includes('tomato') ||
    name.includes('flour') ||
    name.includes('syrup')
  ) {
    return 'Pantry'
  }

  return 'Fresh Produce'
}

function getRecipeIngredients(recipe) {
  if (recipe.parsedIngredients?.length) {
    return recipe.parsedIngredients.map((ingredient) => {
      if (ingredient.quantity || !ingredient.rawText) {
        return ingredient
      }

      return parseIngredientLine(ingredient.rawText) || ingredient
    })
  }

  if (recipe.ingredients) {
    return parseIngredients(recipe.ingredients)
  }

  return []
}

function formatScaledQuantity(quantity, scale) {
  const numericQuantity = Number(quantity)

  if (!quantity || Number.isNaN(numericQuantity)) {
    return ''
  }

  const scaledQuantity = numericQuantity * scale

  if (Number.isInteger(scaledQuantity)) {
    return String(scaledQuantity)
  }

  return String(Math.round(scaledQuantity * 100) / 100)
}

function getServingScale(plannedMeal, recipe) {
  const recipeServings = Number(recipe.servings)
  const plannedServings = Number(plannedMeal.plannedServings || recipe.servings)

  if (!recipeServings || !plannedServings) {
    return 1
  }

  return plannedServings / recipeServings
}

function getShoppingItemDisplay(ingredient, scale) {
  const numericQuantity = Number(ingredient.quantity)

  if (!ingredient.quantity || Number.isNaN(numericQuantity)) {
    return {
      name: ingredient.rawText,
      quantity: '',
    }
  }

  return {
    name: ingredient.name,
    quantity: [formatScaledQuantity(ingredient.quantity, scale), ingredient.unit]
      .filter(Boolean)
      .join(' '),
  }
}

export function generateShoppingGroups(
  plannedMeals,
  recipes,
  clearedItemIds,
  manualItems = [],
) {
  const groupedItems = Object.fromEntries(
    shoppingCategoryOptions.map((category) => [category, []]),
  )

  plannedMeals.forEach((plannedMeal) => {
    const recipe = findRecipeForMeal(plannedMeal, recipes)

    if (!recipe) {
      return
    }

    getRecipeIngredients(recipe).forEach((ingredient, index) => {
      const itemId = `${plannedMeal.id}-${index}-${ingredient.rawText}`

      if (clearedItemIds.includes(itemId)) {
        return
      }

      const category = getIngredientCategory(ingredient.name)
      const scale = getServingScale(plannedMeal, recipe)
      const displayItem = getShoppingItemDisplay(ingredient, scale)

      groupedItems[category].push({
        id: itemId,
        isManual: false,
        name: displayItem.name,
        quantity: displayItem.quantity,
        rawText: ingredient.rawText,
        note: recipe.name,
      })
    })
  })

  manualItems.forEach((item) => {
    const category = shoppingCategoryOptions.includes(item.category)
      ? item.category
      : 'Pantry'

    groupedItems[category].push({
      id: item.id,
      isManual: true,
      name: item.name,
      note: item.note,
      quantity: [item.quantity, item.unit].filter(Boolean).join(' '),
    })
  })

  return shoppingCategoryOptions
    .map((groupName) => ({
      name: groupName,
      color: groupStyles[groupName],
      items: groupedItems[groupName],
    }))
    .filter((group) => group.items.length > 0)
}
