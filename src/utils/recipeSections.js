import { classifyRecipeBlock, isStrongMethodStart, splitMethodNumber } from './recipeSignals.js'
import { isRejectedIngredientLine, isInstructionLikeIngredientLine } from './ingredientParser.js'
import { isIngredientContinuation, isIngredientSubsection } from './recipeIngredients.js'
import {
  isIngredientsHeading, isMethodHeading, isNutritionHeading, isNoiseLine,
  isStopHeading, startsWithQuantity, isTimeValue, methodHeadingHasContent,
  readMetadata, findRecipeName,
} from './recipeText.js'

function methodLead(lines, index) {
  const { text } = lines[index]
  const next = lines[index + 1]
  return /\b(?:and|then|with|into)\s*$/i.test(text) && next && !next.blankBefore
    ? text + ' ' + next.text : text
}

function ingredientHeadingHasContent(lines, index) {
  for (let next = index + 1; next < Math.min(index + 8, lines.length); next += 1) {
    const line = lines[next]
    if (isIngredientsHeading(line.text) || isMethodHeading(line.text)) return false
    if (isNutritionHeading(line.text) || isNoiseLine(line.text)) continue
    if (isIngredientSubsection(line, lines[next + 1])) continue
    return !isStopHeading(line.text) && !isStrongMethodStart(line.text) &&
      !isRejectedIngredientLine(line.text) && !isInstructionLikeIngredientLine(line.text) && line.text.length <= 200
  }
  return false
}

function isBareIngredient(line) {
  return startsWithQuantity(line.text) && !isNoiseLine(line.text) && !isTimeValue(line.text) &&
    !/^\d+(?:\.\d+)?\s*(?:kcal|kj|%)/i.test(line.text) &&
    !splitMethodNumber(line.text).numbered && !isRejectedIngredientLine(line.text)
}

function appendedHeaderStart(lines, start, end) {
  const prefix = lines.slice(0, start)
  const title = findRecipeName(prefix, readMetadata(prefix).consumed)
  for (let index = start + 1; index < end; index += 1) {
    const line = lines[index]
    const { type } = classifyRecipeBlock(line)
    if (isNoiseLine(line.text) || isStopHeading(line.text) ||
      ['INGREDIENT_HEADING', 'METHOD_HEADING', 'RECIPE_NOTE_HEADING', 'STEP_LABEL'].includes(type) ||
      startsWithQuantity(line.text) || line.bullet || line.text.length > 140 || /[.!]$/.test(line.text)) continue
    if (line.headingLevel || (title && line.text === title)) return index
    if (isStrongMethodStart(line.text)) continue
    const header = readMetadata(lines.slice(index, Math.min(index + 16, end)))
    if (Object.values(header.values).some(Boolean)) return index
  }
  return end
}

// Index source ranges without moving text or creating an inferred heading.
// A footer closes this page. Only a separately captured paste can start another.
export function indexRecipeSections(lines) {
  const explicitIngredientIndex = lines.findIndex((line, index) =>
    isIngredientsHeading(line.text) && ingredientHeadingHasContent(lines, index))
  let end = lines.length
  let ingredientStart = -1
  let ingredientHeading = -1
  let methodStart = -1
  let methodHeading = -1
  let methodEvidence = 'missing'
  let ingredientContentSeen = false
  let ingredientsBlocked = false
  let ingredientCut = lines.length
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]
    const { type } = classifyRecipeBlock(line)
    if (type === 'FOOTER') {
      const next = lines[index + 1]
      const tab = isNutritionHeading(line.text) && !ingredientContentSeen && methodStart < 0 && next && (
        isIngredientsHeading(next.text) || isMethodHeading(next.text) || isNoiseLine(next.text) ||
        isBareIngredient(next) || isStrongMethodStart(methodLead(lines, index + 1), { requireOpening: true }))
      const primarySectionGap = isNutritionHeading(line.text) || line.text.toLowerCase() === 'featured products'
      if (!tab && !primarySectionGap) { end = index; break }
      if (!tab && methodStart < 0) ingredientCut = Math.min(ingredientCut, index)
    }
    if (type === 'PRODUCT' && methodStart >= 0) ingredientsBlocked = true
    if (isIngredientsHeading(line.text) && ingredientHeadingHasContent(lines, index) && ingredientStart < 0 && !ingredientsBlocked) {
      ingredientHeading = index
      ingredientStart = index + 1
      continue
    }
    if (methodStart < 0 && isMethodHeading(line.text) && methodHeadingHasContent(lines, index)) {
      methodHeading = index
      methodStart = index + 1
      methodEvidence = 'heading'
      continue
    }
    if (isNoiseLine(line.text) || type === 'FOOTER') continue
    if (methodStart < 0 && !isIngredientContinuation(line.text) && isStrongMethodStart(methodLead(lines, index), { requireOpening: ingredientStart < 0 })) {
      methodStart = index
      methodEvidence = 'inferred'
      continue
    }
    if (explicitIngredientIndex < 0 && index < ingredientCut && ingredientStart < 0 && isBareIngredient(line) &&
      (methodStart < 0 || (line.blankBefore && lines[index + 1] && isBareIngredient(lines[index + 1])))) ingredientStart = index
    if (ingredientStart >= 0 && index >= ingredientStart && methodStart < 0 &&
      !['INGREDIENT_HEADING', 'METHOD_HEADING'].includes(type)) ingredientContentSeen = true
  }
  const ingredientEnd = Math.min(ingredientCut, methodStart > ingredientStart && ingredientStart >= 0
    ? (methodHeading >= 0 ? methodHeading : methodStart) : end)
  const methodEnd = ingredientStart > methodStart && methodStart >= 0
    ? appendedHeaderStart(lines, methodHeading >= 0 ? methodHeading : methodStart, ingredientHeading >= 0 ? ingredientHeading : ingredientStart) : end
  return { ingredientStart, ingredientEnd, ingredientHeading, methodStart, methodEnd, methodEvidence, end }
}

export function recipeHeaderRanges(lines, sections) {
  const first = Math.min(...[sections.ingredientHeading >= 0 ? sections.ingredientHeading : sections.ingredientStart,
    sections.methodStart >= 0 ? sections.methodStart : -1].filter((index) => index >= 0))
  const ranges = [lines.slice(0, Number.isFinite(first) ? first + 1 : sections.end)]
  if (sections.methodStart >= 0 && sections.ingredientStart > sections.methodStart && sections.methodEnd < sections.ingredientStart) {
    ranges.push(lines.slice(sections.methodEnd, sections.ingredientStart))
  }
  return ranges
}
