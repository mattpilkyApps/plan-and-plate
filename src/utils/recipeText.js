// Text cleaning, page controls and recipe-header metadata. No shopping identity normalisation.
import { sectionHeading as getHeading, primaryRecipeHeading } from './recipeSignals.js'
export { getHeading }
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

export function readRecipePageLines(text) {
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

export function isIngredientsHeading(text) {
  return primaryRecipeHeading(text) === 'INGREDIENT_HEADING'
}

export function isMethodHeading(text) {
  return primaryRecipeHeading(text) === 'METHOD_HEADING'
}

export function isNutritionHeading(text) {
  return /^(?:nutrition|nutritional information)(?:\s*\([^)]*\)|\s*:\s*.*|\s+per\b.*)?$/.test(
    getHeading(text),
  )
}

export function methodHeadingHasContent(lines, index) {
  for (const line of lines.slice(index + 1, index + 7)) {
    // Tab bars commonly list Method before Nutrition and the actual Ingredients.
    // A real heading needs body text before another primary section begins.
    if (isNutritionHeading(line.text) || isIngredientsHeading(line.text)) return false
    if (isMethodHeading(line.text) || isNoiseLine(line.text)) continue
    return true
  }
  return false
}

function isUnitControl(text) {
  const controls = getHeading(text)
  if (/^(?:units?|scale)$/.test(controls)) return true
  const tokens = controls.replace(/^(?:units?|scale)\s*:?\s*/, '')
  const remainder = tokens
    .replace(/(?:us customary|us cups|metric|imperial|custom|cups|us|uk|\d+(?:\.\d+)?(?:\/\d+)?x)/g, '')
    .replace(/[\s:/|\u00b7\u2013-]+/g, '')
  return Boolean(tokens) && !remainder
}

export function isNoiseLine(text) {
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

export function isStopHeading(text) {
  return (
    text.length < 80 &&
    /^(?:nutrition|nutritional information|notes|tips|recipe tips|cook['\u2019]?s notes|equipment|storage|make ahead|freezing|substitutions|variations|faq|frequently asked questions|comments|reviews|video|more recipes|you may also like|inspired by)\b/.test(
      getHeading(text),
    )
  )
}

export function startsWithQuantity(text) {
  return /^(?:\d|[\u00bc\u00bd\u00be\u2153\u2154\u215b\u215c\u215d\u215e])|^(?:one|two|three|four|five|six|seven|eight|nine|ten)\s+/i.test(
    text,
  )
}

export function isTimeValue(text) {
  return /(?:\d|[\u00bc\u00bd\u00be])\s*(?:hours?|hrs?|h|minutes?|mins?|m)\b/i.test(
    text,
  )
}

export function readMetadata(lines) {
  const values = { servings: '', prepTime: '', cookTime: '' }
  const consumed = new Set()
  let servingsPriority = 0
  for (let index = 0; index < lines.length; index += 1) {
    const text = lines[index].text
    if (isIngredientsHeading(text) || isMethodHeading(text)) break
    const labels = [...text.matchAll(
      /\b(serves|servings|yield|makes|prep(?:are|aration)?(?:\s*time)?|preparation time|cook(?:ing)?(?:\s*time)?|total(?:\s*time)?|additional time)(?=\s|:|\d|$)\s*:?\s*/gi,
    )]
    if (labels[0]?.index !== 0) continue
    let consumedNextLine = false
    for (const [labelIndex, match] of labels.entries()) {
      const field = /^(?:serves|servings|yield|makes)$/i.test(match[1])
        ? 'servings'
        : /^total/i.test(match[1])
          ? 'totalTime'
        : /^additional/i.test(match[1])
          ? 'additionalTime'
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
        if (!/^\d+\s*(?:[-\u2013\u2014/]|to|or)\s*\d/i.test(candidate)) {
          value = candidate.match(/^(\d+)\b/)?.[1] || ''
        }
      } else if (isTimeValue(candidate)) {
        value = candidate
      }

      consumed.add(index)
      if (value) {
        const priority = /^(?:serves|servings)$/i.test(match[1]) ? 2 : 1
        if (field === 'servings') {
          if (priority > servingsPriority) values[field] = value
          servingsPriority = Math.max(servingsPriority, priority)
        } else if (field !== 'additionalTime' && !values[field]) values[field] = value
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

export function findRecipeName(lines, metadataLines) {
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

