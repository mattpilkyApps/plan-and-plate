import { classifyRecipeBlock } from './recipeSignals.js'

const noiseTypes = new Set(['ADVERTISEMENT', 'PRODUCT', 'NAVIGATION', 'PROMOTION'])
const ingredientStopWords = new Set(['the', 'and', 'for', 'with', 'large', 'small', 'finely', 'roughly', 'chopped', 'sliced', 'serve', 'optional', 'extra', 'plus', 'can', 'tins', 'tin'])

function extractRecipeNotes(blocks, startIndex) {
  const notes = []
  let active = false
  let reviewNeeded = false
  for (const block of blocks.slice(startIndex)) {
    if (['FOOTER', 'INGREDIENT_HEADING', 'PRODUCT', 'METHOD_HEADING'].includes(block.type)) break
    if (block.type === 'RECIPE_NOTE_HEADING') {
      active = true
      continue
    }
    if (!active) continue
    if (noiseTypes.has(block.type)) break
    // Notes use the same recipe evidence as method steps; unsupported promotional
    // prose is not rescued merely because it follows a tip heading.
    if (block.type !== 'METHOD_STEP') {
      reviewNeeded = true
      break
    }
    notes.push(block.text)
  }
  return { notes, reviewNeeded }
}

function getIngredientWords(ingredients) {
  return new Set(ingredients.join(' ').toLowerCase().split(/[^\p{L}]+/u)
    .filter((word) => word.length > 2 && !ingredientStopWords.has(word)))
}

export function extractRecipeMethod(lines, ingredients) {
  const words = getIngredientWords(ingredients)
  const blocks = lines.map((line) => ({ ...line, ...classifyRecipeBlock(line, words) }))
  const steps = []
  const discarded = []
  let pending = []
  let labelledSteps = false
  let startNewStep = true
  let stoppedBy = 'end-of-input'
  let state = 'METHOD'
  let inNoiseGap = false
  let stoppedAt = blocks.length

  function append(block) {
    const previous = steps.at(-1) || ''
    const wrapped = previous && !/[.!?:]$/.test(previous)
    if (startNewStep || block.numbered || block.bullet || block.blankBefore || (!labelledSteps && !wrapped)) {
      steps.push(block.text)
    } else {
      steps[steps.length - 1] += ' ' + block.text
    }
    if (block.numbered) labelledSteps = true
    startNewStep = false
  }

  function discardPending(reason) {
    discarded.push(...pending.map((block) => ({ text: block.text, reason })))
    pending = []
  }

  // Bounded look-ahead keeps an interstitial ad from ending a good recipe.
  // A footer or second recipe is never crossed, even if it contains cooking verbs.
  function hasCookingAhead(index) {
    let products = 0
    for (let next = index + 1; next < Math.min(blocks.length, index + 7); next += 1) {
      const block = blocks[next]
      if (['FOOTER', 'INGREDIENT_HEADING'].includes(block.type)) return false
      if (block.type === 'RECIPE_NOTE_HEADING' && !hasNumberedStepAhead(next)) return false
      if (block.type === 'PRODUCT') products += 1
      if (products >= 2) return false
      if (block.type === 'METHOD_STEP') return true
    }
    return false
  }

  function hasNumberedStepAhead(index) {
    for (const block of blocks.slice(index + 1, index + 7)) {
      if (['FOOTER', 'INGREDIENT_HEADING', 'PRODUCT'].includes(block.type)) return false
      if (block.type === 'STEP_LABEL' || block.numbered) return true
    }
    return false
  }

  for (let index = 0; index < blocks.length; index += 1) {
    const block = blocks[index]
    if (['FOOTER', 'INGREDIENT_HEADING'].includes(block.type)) {
      discardPending('before-footer')
      stoppedBy = block.type === 'FOOTER' ? 'section-boundary' : 'second-recipe'
      state = 'AFTER_RECIPE'
      stoppedAt = index
      break
    }
    if (block.type === 'METHOD_HEADING') continue
    if (block.type === 'RECIPE_NOTE_HEADING') {
      if (hasNumberedStepAhead(index)) continue
      discardPending('recipe-notes')
      stoppedBy = 'recipe-notes'
      state = 'AFTER_RECIPE'
      stoppedAt = index
      break
    }
    if (block.type === 'STEP_LABEL') {
      // A neutral sentence within an explicitly labelled step has structural
      // support even when it contains no known cooking vocabulary.
      pending.forEach(append)
      pending = []
      startNewStep = true
      labelledSteps = true
      continue
    }
    if (block.type === 'AUXILIARY_HEADING') {
      if (hasCookingAhead(index)) continue
      discardPending('auxiliary-section')
      stoppedBy = 'auxiliary-section'
      state = 'AFTER_RECIPE'
      stoppedAt = index
      break
    }
    if (noiseTypes.has(block.type)) {
      discardPending('domain-shift')
      discarded.push({ text: block.text, reason: block.type.toLowerCase() })
      if (hasCookingAhead(index)) {
        inNoiseGap = true
        continue
      }
      stoppedBy = 'domain-shift'
      state = 'AFTER_RECIPE'
      stoppedAt = index
      break
    }
    if (block.type === 'METHOD_STEP' || (block.numbered && block.cooking > 0)) {
      pending.forEach(append)
      pending = []
      append(block)
      inNoiseGap = false
    } else {
      // Keep uncertain text out of the result until neighbouring cooking text
      // supports it. Retail slogans often precede the first priced card.
      if (inNoiseGap) discarded.push({ text: block.text, reason: 'interstitial-noise' })
      else pending.push(block)
    }
  }
  if (pending.length) {
    const structurallySupported = (labelledSteps && pending.every((block) => !block.blankBefore)) ||
      (ingredients.length > 0 && pending.every((block) => block.numbered))
    if (pending.length <= 2 && structurallySupported) {
      pending.forEach(append)
    } else {
      discardPending('uncertain-tail')
      stoppedBy = 'uncertain-tail'
    }
  }
  const supportedLines = blocks.filter((block) => block.type === 'METHOD_STEP').length
  const extractedNotes = extractRecipeNotes(blocks, stoppedAt)
  return { steps, notes: extractedNotes.notes, diagnostics: { state, stoppedBy, discarded, reviewNeeded: extractedNotes.reviewNeeded || !steps.length || !supportedLines || discarded.some((block) => block.reason === 'uncertain-tail') } }
}
