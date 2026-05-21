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

function getScaledQuantityValue(quantity, scale) {
  const numericQuantity = Number(quantity)

  if (!quantity || Number.isNaN(numericQuantity)) {
    return null
  }

  return numericQuantity * scale
}

function getServingScale(plannedMeal, recipe) {
  const recipeServings = Number(recipe.servings)
  const plannedServings = Number(plannedMeal.plannedServings || recipe.servings)

  if (!recipeServings || !plannedServings) {
    return 1
  }

  return plannedServings / recipeServings
}

function normalizeIngredientName(name) {
  return name
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/ies$/, 'y')
    .replace(/oes$/, 'o')
    .replace(/s$/, '')
}

function formatMergedQuantity(quantity, unit) {
  if (quantity === null) {
    return ''
  }

  const roundedQuantity = Number.isInteger(quantity)
    ? quantity
    : Math.round(quantity * 100) / 100

  return [String(roundedQuantity), unit].filter(Boolean).join(' ')
}

function getShoppingItemDisplay(ingredient, scale) {
  const scaledQuantity = getScaledQuantityValue(ingredient.quantity, scale)

  if (scaledQuantity === null) {
    return {
      name: ingredient.rawText,
      quantity: '',
      scaledQuantity: null,
    }
  }

  return {
    name: ingredient.name,
    quantity: [formatScaledQuantity(ingredient.quantity, scale), ingredient.unit]
      .filter(Boolean)
      .join(' '),
    scaledQuantity,
  }
}

function addGeneratedItemToGroup(groupedItems, category, item) {
  if (item.scaledQuantity === null) {
    groupedItems[category].push(item)
    return
  }

  const normalizedUnit = item.unit.toLowerCase()
  const normalizedName = normalizeIngredientName(item.name)
  const mergeKey = `${normalizedName}-${normalizedUnit}`
  const existingItem = groupedItems[category].find(
    (groupedItem) => groupedItem.mergeKey === mergeKey,
  )

  if (!existingItem) {
    groupedItems[category].push({
      ...item,
      mergeKey,
      quantity: formatMergedQuantity(item.scaledQuantity, item.unit),
    })
    return
  }

  existingItem.scaledQuantity += item.scaledQuantity
  existingItem.quantity = formatMergedQuantity(
    existingItem.scaledQuantity,
    existingItem.unit,
  )
  existingItem.rawText = `${existingItem.rawText}; ${item.rawText}`

  if (!existingItem.note.includes(item.note)) {
    existingItem.note = `${existingItem.note}, ${item.note}`
  }
}

function cleanShoppingItem(item) {
  return {
    id: item.id,
    isManual: item.isManual,
    name: item.name,
    note: item.note,
    quantity: item.quantity,
    rawText: item.rawText,
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

      addGeneratedItemToGroup(groupedItems, category, {
        id: itemId,
        isManual: false,
        name: displayItem.name,
        quantity: displayItem.quantity,
        scaledQuantity: displayItem.scaledQuantity,
        unit: ingredient.unit || '',
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
      items: groupedItems[groupName].map(cleanShoppingItem),
    }))
    .filter((group) => group.items.length > 0)
}
