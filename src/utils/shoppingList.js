import {
  cleanIngredientName,
  parseIngredientLine,
  parseIngredients,
} from './ingredientParser.js'

export const shoppingCategoryOptions = [
  'Fresh Produce',
  'Meat & Fish',
  'Dairy & Eggs',
  'Bakery',
  'Pantry / Tins / Dry Goods',
  'Herbs & Spices',
  'Condiments & Sauces',
  'Oils & Cooking',
  'Frozen',
  'Other',
]

const legacyCategoryMap = {
  Dairy: 'Dairy & Eggs',
  Pantry: 'Pantry / Tins / Dry Goods',
}

const groupStyles = {
  'Fresh Produce': 'green',
  'Meat & Fish': 'red',
  'Dairy & Eggs': 'amber',
  Bakery: 'orange',
  'Pantry / Tins / Dry Goods': 'violet',
  'Herbs & Spices': 'lime',
  'Condiments & Sauces': 'rose',
  'Oils & Cooking': 'yellow',
  Frozen: 'blue',
  Other: 'stone',
}

const categoryKeywordGroups = {
  freshProduce: [
    'apple',
    'banana',
    'berries',
    'carrot',
    'celery',
    'cucumber',
    'fresh basil',
    'fresh chilli',
    'fresh coriander',
    'fresh parsley',
    'garlic',
    'garlic clove',
    'herb',
    'lemon',
    'lettuce',
    'lime',
    'mushroom',
    'onion',
    'pepper',
    'potato',
    'spinach',
    'tomato',
    'vegetable',
  ],
  meatAndFish: [
    'bacon',
    'beef',
    'chicken',
    'cod',
    'fish',
    'lamb',
    'mackerel',
    'mince',
    'pork',
    'prawn',
    'salmon',
    'sausage',
    'shrimp',
    'trout',
    'tuna',
    'turkey',
  ],
  dairyAndEggs: [
    'butter',
    'cheddar',
    'cheese',
    'cream',
    'creme fraiche',
    'crème fraiche',
    'crème fraîche',
    'egg',
    'milk',
    'mozzarella',
    'parmesan',
    'yoghurt',
    'yogurt',
  ],
  bakery: [
    'bread',
    'burger bun',
    'bun',
    'pastry',
    'pitta',
    'roll',
    'tortilla',
    'wrap',
  ],
  pantry: [
    'bean',
    'breadcrumb',
    'chickpea',
    'chopped tomato',
    'coconut milk',
    'couscous',
    'flour',
    'lasagne sheet',
    'lentil',
    'noodle',
    'passata',
    'pasta',
    'peanut butter',
    'rice',
    'spaghetti',
    'stock',
    'stock cube',
    'sugar',
    'tin',
    'tinned tomato',
  ],
  herbsAndSpices: [
    'chilli flake',
    'chilli powder',
    'cinnamon',
    'coriander seed',
    'cumin',
    'curry powder',
    'dried basil',
    'dried oregano',
    'dried parsley',
    'dried thyme',
    'garlic granule',
    'garlic powder',
    'ground coriander',
    'mixed herbs',
    'paprika',
    'pepper',
    'salt',
    'sea salt',
    'thyme',
    'turmeric',
  ],
  condimentsAndSauces: [
    'curry paste',
    'dijon mustard',
    'hot sauce',
    'ketchup',
    'mayonnaise',
    'mustard',
    'pesto',
    'redcurrant jelly',
    'soy sauce',
    'tomato puree',
    'tomato purée',
    'vinegar',
    'worcestershire sauce',
  ],
  oilsAndCooking: [
    'cooking spray',
    'ghee',
    'olive oil',
    'sunflower oil',
    'vegetable oil',
  ],
  frozen: ['frozen', 'ice cream'],
}

function getRecipeKey(recipe) {
  return recipe.id || recipe.name
}

function findRecipeForMeal(plannedMeal, recipes) {
  return recipes.find((recipe) => getRecipeKey(recipe) === plannedMeal.recipeId)
}

function normalizeSearchText(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function hasKeyword(name, keywords) {
  return keywords.some((keyword) => {
    return name.includes(normalizeSearchText(keyword))
  })
}

function resolveShoppingCategory(category) {
  const mappedCategory = legacyCategoryMap[category] || category

  return shoppingCategoryOptions.includes(mappedCategory)
    ? mappedCategory
    : 'Other'
}

export function getIngredientCategory(ingredientName) {
  const name = normalizeSearchText(ingredientName)

  if (!name) {
    return 'Other'
  }

  // Specific aisle decisions go first so broad words like tomato or garlic
  // do not pull tinned tomatoes or garlic powder into Fresh Produce.
  if (hasKeyword(name, categoryKeywordGroups.frozen)) {
    return 'Frozen'
  }

  if (hasKeyword(name, categoryKeywordGroups.oilsAndCooking)) {
    return 'Oils & Cooking'
  }

  if (hasKeyword(name, categoryKeywordGroups.condimentsAndSauces)) {
    return 'Condiments & Sauces'
  }

  if (hasKeyword(name, categoryKeywordGroups.herbsAndSpices)) {
    return 'Herbs & Spices'
  }

  if (hasKeyword(name, categoryKeywordGroups.pantry)) {
    return 'Pantry / Tins / Dry Goods'
  }

  if (hasKeyword(name, categoryKeywordGroups.meatAndFish)) {
    return 'Meat & Fish'
  }

  if (hasKeyword(name, categoryKeywordGroups.dairyAndEggs)) {
    return 'Dairy & Eggs'
  }

  if (hasKeyword(name, categoryKeywordGroups.bakery)) {
    return 'Bakery'
  }

  if (hasKeyword(name, categoryKeywordGroups.freshProduce)) {
    return 'Fresh Produce'
  }

  return 'Other'
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
  const cleanName = normalizeSearchText(name)

  if (/^cloves?\s+garlic$/.test(cleanName)) {
    return 'garlic'
  }

  return cleanName
    .replace(/ies$/, 'y')
    .replace(/oes$/, 'o')
    .replace(/s$/, '')
}

function normalizeUnit(unit) {
  const cleanUnit = unit.toLowerCase().trim()

  return cleanUnit.replace(/s$/, '')
}

function getDisplayUnit(unit, quantity) {
  const cleanUnit = unit.trim()

  if (quantity === 1 || cleanUnit.endsWith('s') || !cleanUnit) {
    return cleanUnit
  }

  if (['bulb', 'can', 'clove', 'cup', 'pack', 'tin'].includes(cleanUnit)) {
    return `${cleanUnit}s`
  }

  return cleanUnit
}

function formatMergedQuantity(quantity, unit) {
  if (quantity === null) {
    return ''
  }

  const roundedQuantity = Number.isInteger(quantity)
    ? quantity
    : Math.round(quantity * 100) / 100

  return [String(roundedQuantity), getDisplayUnit(unit, roundedQuantity)]
    .filter(Boolean)
    .join(' ')
}

function getShoppingItemDisplay(ingredient, scale) {
  const scaledQuantity = getScaledQuantityValue(ingredient.quantity, scale)

  if (scaledQuantity === null) {
    return {
      name: cleanIngredientName(ingredient.name || ingredient.rawText),
      quantity: '',
      scaledQuantity: null,
    }
  }

  return {
    name: cleanIngredientName(ingredient.name),
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

  const normalizedUnit = normalizeUnit(item.unit)
  const normalizedName = normalizeIngredientName(item.name)
  const mergeKey = `${normalizedName}-${normalizedUnit}`
  const existingItem = groupedItems[category].find(
    (groupedItem) => groupedItem.mergeKey === mergeKey,
  )
  const sameNameItem = groupedItems[category].find((groupedItem) => {
    return normalizeIngredientName(groupedItem.name) === normalizedName
  })

  if (!existingItem) {
    if (sameNameItem) {
      sameNameItem.quantity = [sameNameItem.quantity, item.quantity]
        .filter(Boolean)
        .join(' + ')
      sameNameItem.rawText = `${sameNameItem.rawText}; ${item.rawText}`
      sameNameItem.scaledQuantity = null

      if (!sameNameItem.recipeNotes.includes(item.note)) {
        sameNameItem.recipeNotes.push(item.note)
      }

      return
    }

    groupedItems[category].push({
      ...item,
      mergeKey,
      quantity: formatMergedQuantity(item.scaledQuantity, item.unit),
      recipeNotes: [item.note],
    })
    return
  }

  if (existingItem.scaledQuantity === null) {
    existingItem.quantity = [existingItem.quantity, item.quantity]
      .filter(Boolean)
      .join(' + ')
    existingItem.rawText = `${existingItem.rawText}; ${item.rawText}`

    if (!existingItem.recipeNotes.includes(item.note)) {
      existingItem.recipeNotes.push(item.note)
    }

    return
  }

  existingItem.scaledQuantity += item.scaledQuantity
  existingItem.quantity = formatMergedQuantity(
    existingItem.scaledQuantity,
    existingItem.unit,
  )
  existingItem.rawText = `${existingItem.rawText}; ${item.rawText}`

  if (!existingItem.recipeNotes.includes(item.note)) {
    existingItem.recipeNotes.push(item.note)
  }
}

function getUsefulGeneratedNote(item) {
  if (!item.recipeNotes || item.recipeNotes.length < 2) {
    return ''
  }

  return item.recipeNotes.join(', ')
}

function sortShoppingItems(items) {
  return [...items].sort((firstItem, secondItem) => {
    return firstItem.name.localeCompare(secondItem.name, undefined, {
      sensitivity: 'base',
    })
  })
}

function cleanShoppingItem(item) {
  return {
    id: item.id,
    isManual: item.isManual,
    name: item.name,
    note: item.isManual ? item.note : getUsefulGeneratedNote(item),
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

      const scale = getServingScale(plannedMeal, recipe)
      const displayItem = getShoppingItemDisplay(ingredient, scale)
      const category = getIngredientCategory(displayItem.name)

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
    const category = resolveShoppingCategory(item.category)

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
      items: sortShoppingItems(groupedItems[groupName]).map(cleanShoppingItem),
    }))
    .filter((group) => group.items.length > 0)
}
