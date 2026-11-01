import { isInstructionLikeIngredientLine, isRejectedIngredientLine } from './ingredientParser.js'
import { isPreparationContinuation } from './ingredientPreparation.js'
import { classifyRecipeBlock } from './recipeSignals.js'
import { getHeading, startsWithQuantity, isNoiseLine, isMethodHeading, isStopHeading, isIngredientsHeading, isNutritionHeading } from './recipeText.js'

export function isIngredientContinuation(text, servingSection = false) {
  if (/^optional\s*:\s*(?:\d|[¼½¾⅓⅔⅛⅜⅝⅞])/i.test(text)) return false
  return (
    /^(?:or\b|to serve\b|for serving\b|to taste\b|optional\b|plus\b|such as\b|and\b.*\bto serve\b)/i.test(text) ||
    isPreparationContinuation(text) ||
    (servingSection && /^and\b/i.test(text)) ||
    /^(?:leaves|juice only|zest only)$/i.test(text)
  )
}

export function isIngredientSubsection(line, nextLine) {
  const text = getHeading(line.text)
  const nextStartsIngredient = nextLine && !isNoiseLine(nextLine.text) &&
    !isMethodHeading(nextLine.text) && !isStopHeading(nextLine.text) &&
    !isIngredientContinuation(nextLine.text)
  return (
    /^for\s+(?:the\s+)?/i.test(text) ||
    (line.headingLevel > 0 && !startsWithQuantity(text) && !isIngredientContinuation(text)) ||
    (/^(?:to serve|for serving|optional(?: toppings)?)$/i.test(text) &&
      (line.headingLevel > 0 || line.text.endsWith(':') || nextStartsIngredient))
  )
}

function isMeasureOnly(text) {
  return /^(?:\d+(?:[./]\d+)?(?:\s+\d+\/\d+)?|[¼½¾⅓⅔⅛⅜⅝⅞])\s*(?:g|kg|ml|l|tsp|tbsp|cups?|tablespoons?|teaspoons?|oz|lbs?|large|small)?$/i.test(text)
}

function appendIngredient(ingredients, line, servingSection = false) {
  const text = line.text
  if (ingredients.length && isMeasureOnly(ingredients.at(-1)) && !startsWithQuantity(text)) {
    ingredients[ingredients.length - 1] += ' ' + text
    return
  }
  if (
    ingredients.length &&
    !line.bullet &&
    isIngredientContinuation(text, servingSection)
  ) {
    const joiner = /^(?:or\b|and\b|leaves$)/i.test(text) ? ' ' : ', '
    ingredients[ingredients.length - 1] += joiner + text
    return
  }
  if (
    /^for\s+(?:the\s+)?/i.test(text) ||
    isRejectedIngredientLine(text) ||
    (isInstructionLikeIngredientLine(text) && !startsWithQuantity(text)) ||
    text.length > 200
  ) {
    return
  }
  ingredients.push(text)
}


export function extractRecipeIngredients(lines) {
  const ingredients = []
  const sections = []
  let servingSection = false
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]
    if (isIngredientsHeading(line.text) || isNoiseLine(line.text)) continue
    if (isNutritionHeading(line.text) && !ingredients.length) continue
    if (isStopHeading(line.text) || isMethodHeading(line.text)) break
    if (isIngredientSubsection(line, lines[index + 1])) {
      sections.push({ name: line.text.replace(/:$/, ''), startIndex: ingredients.length })
      servingSection = /^(?:to serve|for serving)$/i.test(getHeading(line.text))
      continue
    }
    const { type } = classifyRecipeBlock(line)
    if (type === 'FOOTER') break
    if (['ADVERTISEMENT', 'PRODUCT', 'NAVIGATION', 'PROMOTION'].includes(type) && !startsWithQuantity(line.text)) continue
    appendIngredient(ingredients, line, servingSection)
  }
  return { ingredients, sections }
}
