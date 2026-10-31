import {
  isInstructionLikeIngredientLine,
  isRejectedIngredientLine,
} from './ingredientParser.js'

function cleanRecipePageLine(line) {
  return line
    .replace(/^[\s\-*\u2022]+/, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function getRecipePageHeading(line) {
  return line.replace(/:$/, '').trim().toLowerCase()
}

function isRecipePageMetaLine(line) {
  return /^(serves|servings|yield|prep time|cook time|total time)\b|^(prep|cook)\s*:/i.test(
    line,
  )
}

function isRecipePageNoiseLine(line) {
  const cleanLine = getRecipePageHeading(line)

  return [
    /^advertisement$/,
    /^skip to/,
    /^jump to recipe/,
    /^print recipe/,
    /^print$/,
    /^pin recipe/,
    /^save recipe/,
    /^shopping list$/,
    /^share$/,
    /^subscribe/,
    /^newsletter/,
    /^sign up/,
    /^log in/,
    /^privacy policy/,
    /^terms/,
    /^all rights reserved/,
    /^rating/,
    /^\d+(\.\d+)? from \d+ votes/,
    /^course\b/,
    /^cuisine\b/,
    /^keyword\b/,
    /^author\b/,
    /^calories\b/,
    /^cook(?:'|\u2019)?s notes?$/,
  ].some((pattern) => pattern.test(cleanLine))
}

function isRecipePageIngredientsHeading(line) {
  const cleanLine = getRecipePageHeading(line)

  return cleanLine.length < 60 && /^ingredients?\b/.test(cleanLine)
}

function isRecipePageMethodHeading(line) {
  const cleanLine = getRecipePageHeading(line)

  return (
    cleanLine.length < 60 &&
    /^(method|instructions|directions|preparation|steps)\b/.test(cleanLine)
  )
}

function isRecipePageStopHeading(line) {
  const cleanLine = getRecipePageHeading(line)

  return (
    cleanLine.length < 80 &&
    /^(nutrition|nutritional information|method|instructions|directions|notes|tips|recipe tips|equipment|storage|make ahead|freezing|substitutions|variations|faq|frequently asked questions|comments|reviews|video|more recipes|you may also like)\b/.test(
      cleanLine,
    )
  )
}

function isRecipePageIngredientSubheading(line) {
  return /^for\s+(the\s+)?/i.test(line.trim()) && line.length < 70
}

function isRecipePageLikelyIngredient(line) {
  return /^(\d|[\u00bc\u00bd\u00be\u2153\u2154\u215b\u215c\u215d\u215e]|one|two|three|four|five|six|seven|eight|nine|ten)\b/i.test(
    line,
  )
}

function isRecipePageUsefulIngredient(line) {
  return isRecipePageLikelyIngredient(line) || line.length < 120
}

function shouldKeepDetectedIngredient(line) {
  if (isRejectedIngredientLine(line)) {
    return false
  }

  if (
    isInstructionLikeIngredientLine(line) &&
    !isRecipePageLikelyIngredient(line)
  ) {
    return false
  }

  return true
}

function getRecipePageTime(line, label) {
  const match = line.match(
    new RegExp(`^${label}(?:\\s*time)?\\s*:?\\s*(.+)$`, 'i'),
  )

  if (!match) {
    return ''
  }

  return match[1].trim()
}

export function parsePastedRecipe(text) {
  if (!text.trim()) {
    return {
      servings: '',
      prepTime: '',
      cookTime: '',
      ingredients: '',
      method: '',
    }
  }

  const lines = text
    .replace(/\r/g, '\n')
    .split('\n')
    .map(cleanRecipePageLine)
    .filter(Boolean)
  let servings = ''
  let prepTime = ''
  let cookTime = ''
  let activeSection = ''
  const ingredientLines = []
  const methodLines = []

  lines.forEach((line) => {
    const cleanLine = line.replace(/:$/, '').trim()
    const lowerLine = cleanLine.toLowerCase()

    if (isRecipePageNoiseLine(cleanLine)) {
      return
    }

    if (isRecipePageIngredientsHeading(cleanLine)) {
      activeSection = 'ingredients'
      return
    }

    if (isRecipePageMethodHeading(cleanLine)) {
      activeSection = 'method'
      return
    }

    if (isRecipePageStopHeading(cleanLine)) {
      activeSection = 'ignore'
      return
    }

    const servingsMatch = line.match(
      /\b(?:serves|servings|yield)\s*:?\s*(\d+)/i,
    )

    if (servingsMatch && !servings) {
      servings = servingsMatch[1]
      return
    }

    if (
      activeSection !== 'method' &&
      lowerLine.startsWith('prep') &&
      !prepTime
    ) {
      prepTime = getRecipePageTime(line, 'prep')
      return
    }

    if (
      activeSection !== 'method' &&
      lowerLine.startsWith('cook') &&
      !cookTime
    ) {
      cookTime = getRecipePageTime(line, 'cook')
      return
    }

    if (
      activeSection === 'ingredients' &&
      !isRecipePageMetaLine(line) &&
      !isRecipePageIngredientSubheading(line) &&
      shouldKeepDetectedIngredient(line) &&
      isRecipePageUsefulIngredient(line)
    ) {
      ingredientLines.push(line)
      return
    }

    if (activeSection === 'method' && !isRecipePageMetaLine(line)) {
      methodLines.push(line)
      return
    }

    if (!activeSection && isRecipePageLikelyIngredient(line)) {
      ingredientLines.push(line)
    }
  })

  return {
    servings,
    prepTime,
    cookTime,
    ingredients: ingredientLines.join('\n'),
    method: methodLines.join('\n'),
  }
}
