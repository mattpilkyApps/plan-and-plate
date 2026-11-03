import { allIngredients, toLegacyRecipe } from '../recipe/card.js'
import {
  generateShoppingGroups,
  getIngredientCategory,
} from '../../utils/shoppingList.js'

// The production shopping engine is the only quantity/merge/category engine.
// This boundary enriches its output with canonical provenance and Lab controls.
export function generateCanonicalShopping(
  selections,
  { manualItems = [], includeOptional = true, atHomeSourceIds = [] } = {},
) {
  const traceBySource = new Map()
  const excluded = []
  const warnings = []
  const plannedMeals = []
  const recipes = []
  for (const [selectionIndex, selection] of selections.entries()) {
    const { card, plannedServings = card.servings.value } = selection
    if (card.recipeCardStatus !== 'VALIDATED')
      throw new Error(`Approve “${card.title}” before Shopping simulation.`)
    if (
      !Number.isFinite(Number(plannedServings)) ||
      Number(plannedServings) <= 0
    )
      throw new Error('Planned servings must be positive.')
    const planId = selection.id || `lab-meal-${selectionIndex}`
    const ingredients = allIngredients(card)
    const kept = ingredients.filter((ingredient) => {
      if (ingredient.optional && !includeOptional) {
        excluded.push({
          recipeId: card.id,
          ingredientId: ingredient.ingredientId,
          rawLine: ingredient.rawLine,
          reason: 'Optional ingredient excluded by tester',
        })
        return false
      }
      return true
    })
    const legacy = toLegacyRecipe(card)
    const recipeId = `${card.id}-${selectionIndex}`
    recipes.push({
      ...legacy,
      id: recipeId,
      parsedIngredients: legacy.parsedIngredients.filter((ingredient) =>
        kept.some(
          (item) => item.ingredientId === ingredient.canonicalIngredientId,
        ),
      ),
    })
    plannedMeals.push({
      id: planId,
      recipeId,
      plannedServings: Number(plannedServings),
    })
    kept.forEach((ingredient, index) => {
      const sourceId = `${planId}-${index}-${ingredient.rawLine}`
      traceBySource.set(sourceId, {
        sourceId,
        planId,
        recipeId: card.id,
        recipeRevision: card.revision,
        recipeTitle: card.title,
        ingredientId: ingredient.ingredientId,
        rawLine: ingredient.rawLine,
        originalRawLine: ingredient.originalRawLine,
        preparation: ingredient.preparation,
        sourceRefs: ingredient.sourceRefs,
        originalQuantity: ingredient.quantity,
        plannedServings: Number(plannedServings),
        baseServings: card.servings.value,
        scale: Number(plannedServings) / card.servings.value,
      })
      if (ingredient.quantity.value === null)
        warnings.push({
          code: 'unknown-quantity',
          ingredientId: ingredient.ingredientId,
          message: `“${ingredient.rawLine}” has no single scalable amount. Original wording retained.`,
        })
      if (ingredient.alternatives.length)
        warnings.push({
          code: 'primary-alternative',
          ingredientId: ingredient.ingredientId,
          message: `Shopping uses the reviewed primary option for “${ingredient.rawLine}”.`,
        })
    })
  }
  const manuals = manualItems.map((item) => ({
    ...item,
    category: item.category || getIngredientCategory(item.name),
    note: item.note || '',
  }))
  const groups = generateShoppingGroups(plannedMeals, recipes, [], manuals).map(
    (group) => ({
      ...group,
      items: group.items.map((item) => ({
        ...item,
        trace: item.isManual
          ? [
              {
                manualItemId: item.id,
                rawLine: item.name,
                origin: 'manual-household-item',
              },
            ]
          : item.sourceIds.map((id) => traceBySource.get(id)).filter(Boolean),
        atHome: item.sourceIds.every((id) => atHomeSourceIds.includes(id)),
      })),
    }),
  )
  return {
    schemaVersion: 1,
    sourceFragments: [
      ...new Map(
        selections.flatMap(({ card }) =>
          card.sourceFragments.map((fragment) => [
            fragment.fragmentId,
            fragment,
          ]),
        ),
      ).values(),
    ],
    engine: 'production-shopping-adapter-1.0.0',
    groups: groups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => !item.atHome),
      }))
      .filter((group) => group.items.length),
    atHome: groups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => item.atHome),
      }))
      .filter((group) => group.items.length),
    allGroups: groups,
    warnings,
    excluded,
    plannedMeals,
    sourceCount: traceBySource.size,
  }
}
