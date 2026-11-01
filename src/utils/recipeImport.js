import {
  isInstructionLikeIngredientLine,
  isRejectedIngredientLine,
} from './ingredientParser.js'

function removeRecipePageLinks(text) {
  return text
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\(([^)]*)\)/g, (_, label, address) => {
      // Keep ingredient names, but discard author links and whole linked adverts.
      if (
        /\/author\//i.test(address) ||
        /\b(?:book now|tickets on sale|try our app|subscribe now)\b/i.test(label)
      ) {
        return ''
      }
      return label
    })
}

function readRecipePageLines(text) {
  let blankBefore = true
  return removeRecipePageLinks(text)
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .flatMap((rawLine) => {
      const unlisted = rawLine
        .trim()
        .replace(/^[-*\u2022]\s+/, '')
        .replace(/^(?:\[[ x]\]|[\u25a1\u25a2\u2610])\s*/i, '')
      const headingLevel = unlisted.match(/^(#{1,6})\s+/)?.[1].length || 0
      const cleanLine = unlisted
        .replace(/^#{1,6}\s+/, '')
        .replace(/\\([^\w\s])/g, '$1')
        .replace(/[*_\x60]/g, '')
        .replace(/&nbsp;|&#160;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/[\u200b-\u200d\ufeff]/g, '')
        .replace(/\s+/g, ' ')
        .trim()

      if (!/[\p{L}\p{N}]/u.test(cleanLine)) {
        blankBefore = true
        return []
      }
      const line = {
        text: cleanLine,
        bullet: /^\s*[-*\u2022]\s+/.test(rawLine),
        headingLevel,
        blankBefore,
      }
      blankBefore = false
      return [line]
    })
}

function getHeading(text) {
  return text.replace(/:$/, '').trim().toLowerCase()
}

function isIngredientsHeading(text) {
  return /^ingredients?(?:\s*\([^)]*\))?$/.test(getHeading(text))
}

function isMethodHeading(text) {
  return /^(?:method|instructions|directions|preparation|steps|cooking instructions)$/.test(
    getHeading(text),
  )
}

function isNutritionHeading(text) {
  return /^(?:nutrition|nutritional information)(?:\s*\([^)]*\))?$/.test(
    getHeading(text),
  )
}

function isUnitControl(text) {
  const controls = getHeading(text)
  if (/^(?:units?|scale)$/.test(controls)) return true
  const tokens = controls.replace(/^(?:units?|scale)\s*:?\s*/, '')
  const remainder = tokens
    .replace(/\b(?:metric|imperial|us customary|us|uk|[123]x)\b/g, '')
    .replace(/[\s:/|\u00b7\u2013-]+/g, '')
  return Boolean(tokens) && !remainder
}

function isNoiseLine(text) {
  const heading = getHeading(text)
  return (
    isUnitControl(text) ||
    [
      /^(?:ad|advertisement|sponsored|rate|easy|medium|hard)$/,
      /^(?:home|recipes|menu|search|back to top|sign in)$/,
      /^(?:a star rating|ratings?\b|rated\b|\d+(?:\.\d+)? from \d+)/,
      /^\d+(?:\.\d+)?\s*(?:ratings?|comments?|reviews?|votes?|out of \d+ stars?)\b/,
      /^(?:skip to|jump to recipe|print(?: recipe)?$|pin recipe|save recipe)/,
      /^(?:shopping list|share|subscribe|newsletter|sign up|log in)/,
      /^(?:(?:add to|copy|print|save) (?:shopping list|ingredients)|cook mode)\b/,
      /^(?:privacy policy|terms|all rights reserved|by\s|author\b)/,
      /^(?:course|cuisine|keyword|calories)\b/,
      /^(?:try (?:our|the) app|keep the screen awake|showing items)/,
      /^(?:book now|tickets on sale|buy now|shop now|inspired by)$/,
      /^(?:dairy-free|gluten-free|vegan|vegetarian|freezable(?:\s+.*)?)$/,
      /^https?:\/\//,
    ].some((pattern) => pattern.test(heading))
  )
}

function isStopHeading(text) {
  return (
    text.length < 80 &&
    /^(?:nutrition|nutritional information|notes|tips|recipe tips|cook['\u2019]?s notes|equipment|storage|make ahead|freezing|substitutions|variations|faq|frequently asked questions|comments|reviews|video|more recipes|you may also like|inspired by)\b/.test(
      getHeading(text),
    )
  )
}

function isRecipeFooter(text) {
  return /^(?:comments|reviews|related recipes|recommended recipes|more recipes|you (?:may|might) also like|leave a (?:review|comment))\b/i.test(text)
}

function startsWithQuantity(text) {
  return /^(?:\d|[\u00bc\u00bd\u00be\u2153\u2154\u215b\u215c\u215d\u215e])|^(?:one|two|three|four|five|six|seven|eight|nine|ten)\s+/i.test(
    text,
  )
}

function isTimeValue(text) {
  return /(?:\d|[\u00bc\u00bd\u00be])\s*(?:hours?|hrs?|h|minutes?|mins?|m)\b/i.test(
    text,
  )
}

function readMetadata(lines) {
  const values = { servings: '', prepTime: '', cookTime: '' }
  const consumed = new Set()
  for (let index = 0; index < lines.length; index += 1) {
    const text = lines[index].text
    if (isIngredientsHeading(text) || isMethodHeading(text)) break
    const labels = [...text.matchAll(
      /\b(serves|servings|yield|makes|prep(?:\s*time)?|preparation time|cook(?:ing)?(?:\s*time)?)\b\s*:?\s*/gi,
    )]
    if (labels[0]?.index !== 0) continue
    let consumedNextLine = false
    for (const [labelIndex, match] of labels.entries()) {
      const field = /^(?:serves|servings|yield|makes)$/i.test(match[1])
        ? 'servings'
        : /^prep/i.test(match[1])
          ? 'prepTime'
          : 'cookTime'
      const inlineValue = text
        .slice(match.index + match[0].length, labels[labelIndex + 1]?.index)
        .replace(/[\s|\u00b7]+$/, '')
        .trim()
      const candidate = inlineValue || lines[index + 1]?.text || ''
      let value = ''
      if (field === 'servings') {
        // A serving range needs a person's choice, rather than a guessed number.
        if (!/^\d+\s*[-\u2013/]\s*\d/.test(candidate)) {
          value = candidate.match(/^(\d+)\b/)?.[1] || ''
        }
      } else if (isTimeValue(candidate)) {
        value = candidate
      }

      consumed.add(index)
      if (value) {
        if (!values[field]) values[field] = value
        if (!inlineValue) {
          consumed.add(index + 1)
          consumedNextLine = true
        }
      }
    }
    if (consumedNextLine) index += 1
  }
  return { values, consumed }
}

function findRecipeName(lines, metadataLines) {
  const firstSection = lines.findIndex(
    ({ text }) => isIngredientsHeading(text) || isMethodHeading(text),
  )
  const candidates = lines
    .slice(0, firstSection < 0 ? lines.length : firstSection)
    .filter(
      (line, index) =>
        !metadataLines.has(index) &&
        !isNoiseLine(line.text) &&
        !isStopHeading(line.text) &&
        !line.bullet &&
        line.text.length >= 3 &&
        line.text.length <= 140 &&
        !/[.!]$/.test(line.text),
    )
  const explicitTitle = candidates.find(
    ({ headingLevel }) => headingLevel === 1 || headingLevel === 2,
  )
  return explicitTitle?.text || (firstSection >= 0 ? candidates[0]?.text : '') || ''
}

function isNutritionTabBeforeIngredients(lines, index, ingredientCount) {
  if (ingredientCount) return false
  const next = lines[index + 1]?.text || ''
  // Some sites put the Ingredients / Nutrition tabs above the ingredient list.
  // A real nutrition section after ingredients must still stop collection.
  return (
    isUnitControl(next) ||
    (startsWithQuantity(next) &&
      !/^\d+(?:\.\d+)?\s*(?:kcal|kj|%)/i.test(next))
  )
}

function isIngredientContinuation(text) {
  return (
    /^(?:or\b|to serve\b|for serving\b|to taste\b|optional\b)/i.test(text) ||
    /^(?:(?:finely|roughly|thinly|freshly)\s+)?(?:chopped|sliced|diced|minced|grated|peeled|crushed|bashed|drained|rinsed|deseeded|trimmed)(?:$|[,\s]+(?:and\b|with\b|into\b|until\b))/i.test(
      text,
    ) ||
    /^(?:leaves|juice only|zest only)$/i.test(text)
  )
}

function appendIngredient(ingredients, line) {
  const text = line.text
  if (
    ingredients.length &&
    !line.bullet &&
    isIngredientContinuation(text)
  ) {
    const joiner = /^(?:or\b|leaves$)/i.test(text) ? ' ' : ', '
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

function isStepLabel(text) {
  return /^(?:(?:step|stage)\s*\d+(?:\s*(?:of|\/)\s*\d+)?|\d+[.)])[.:]?$/i.test(
    text,
  )
}

export function parsePastedRecipe(text) {
  const lines = readRecipePageLines(text)
  const { values, consumed } = readMetadata(lines)
  const ingredients = []
  const method = []
  const hasIngredientsHeading = lines.some(({ text }) =>
    isIngredientsHeading(text),
  )
  let section = ''
  let startNewStep = true
  let labelledSteps = false

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]
    const text = line.text
    if (consumed.has(index)) continue
    if ((ingredients.length || method.length) && isRecipeFooter(text)) break

    if (isIngredientsHeading(text)) {
      section = 'ingredients'
      continue
    }
    if (isMethodHeading(text)) {
      section = 'method'
      continue
    }
    if (
      section === 'ingredients' &&
      isNutritionHeading(text) &&
      isNutritionTabBeforeIngredients(lines, index, ingredients.length)
    ) {
      continue
    }
    if (isStopHeading(text)) {
      if (method.length) break
      section = 'ignore'
      continue
    }
    if (isNoiseLine(text)) continue

    if (section === 'ingredients') {
      appendIngredient(ingredients, line)
    } else if (section === 'method') {
      if (isStepLabel(text)) {
        startNewStep = true
        labelledSteps = true
        continue
      }
      const numbered = text.match(
        /^(?:\d+[.)]\s+|(?:step|stage)\s*\d+[.:]?\s+)(.+)$/i,
      )
      if (
        startNewStep ||
        numbered ||
        !labelledSteps ||
        line.blankBefore
      ) {
        method.push(numbered?.[1] || text)
      } else {
        method[method.length - 1] += ' ' + text
      }
      if (numbered) labelledSteps = true
      startNewStep = false
    } else if (!section && !hasIngredientsHeading && startsWithQuantity(text)) {
      appendIngredient(ingredients, line)
    }
  }

  return {
    name: findRecipeName(lines, consumed),
    ...values,
    ingredients: ingredients.join('\n'),
    method: method.join('\n\n'),
  }
}
