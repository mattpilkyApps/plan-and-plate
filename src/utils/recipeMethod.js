import { classifyRecipeBlock } from './recipeSignals.js'

const noiseTypes = new Set(['ADVERTISEMENT', 'PRODUCT', 'NAVIGATION'])
const ingredientStopWords = new Set(['the', 'and', 'for', 'with', 'large', 'small', 'finely', 'roughly', 'chopped', 'sliced', 'serve', 'optional', 'extra', 'plus', 'can', 'tins', 'tin'])

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
    for (const block of blocks.slice(index + 1, index + 7)) {
      if (['FOOTER', 'INGREDIENT_HEADING'].includes(block.type)) return false
      if (block.type === 'METHOD_STEP') return true
    }
    return false
  }

  for (let index = 0; index < blocks.length; index += 1) {
    const block = blocks[index]
    if (['FOOTER', 'INGREDIENT_HEADING'].includes(block.type)) {
      discardPending('before-footer')
      stoppedBy = block.type === 'FOOTER' ? 'section-boundary' : 'second-recipe'
      state = 'AFTER_RECIPE'
      break
    }
    if (block.type === 'METHOD_HEADING') continue
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
    if (labelledSteps && pending.length <= 2 && pending.every((block) => !block.blankBefore)) {
      pending.forEach(append)
    } else {
      discardPending('uncertain-tail')
      stoppedBy = 'uncertain-tail'
    }
  }
  return { steps, diagnostics: { state, stoppedBy, discarded, reviewNeeded: !steps.length || discarded.some((block) => block.reason === 'uncertain-tail') } }
}
