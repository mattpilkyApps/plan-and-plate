import { findEvidence } from './source.js'

export const METHOD_VERSION = '1.0.0'
const action = '(?:heat|preheat|cook|fry|add(?:ing)?|stir|pour|bring|reduce|simmer|boil|bake|roast|grill|mix|whisk|fold|beat|chop|slice|dice|peel|wash|drain|rinse|squeeze|cut|tear|scatter|season|serve|leave|cover|remove|transfer|return|cool|chill|rest|set|put|place|divide|check|turn|toss|spread|roll|knead|melt|brush|combine|tip|fill|assemble|sprinkle)'
const nextAction = new RegExp(`^(?:(?:then|next|finally|gently|carefully|meanwhile|just before serving)[, ]+)*${action}\\b`, 'i')
const connector = new RegExp(`(?:,?\\s+(?:and then|then|before|and)\\s+|,\\s+)(?=(?:(?:gently|carefully|gradually|slowly)\\s+)?${action}\\b)`, 'gi')
const shortReminder = /^(?:stir(?:ring)?|check(?:ing)?|turn(?:ing)?)\s+(?:occasionally|frequently|regularly|as needed)\b/i

// Partition existing instructions; do not paraphrase them. This deliberately
// favours a longer faithful step over a clever but unsupported rewrite.
export function segmentMethod(method, fragments = []) {
  const paragraphs = method.split(/\n\s*\n/).filter((paragraph) => paragraph.trim())
  const result = []
  paragraphs.forEach((paragraph, paragraphIndex) => {
    const boundaries = new Set([0, paragraph.length])
    let depth = 0
    for (let index = 0; index < paragraph.length; index += 1) {
      const char = paragraph[index]
      if (char === '(' || char === '[') depth += 1
      if (char === ')' || char === ']') depth = Math.max(0, depth - 1)
      if (depth || !/[.!?;]/.test(char)) continue
      if (char === '.' && (/\d/.test(paragraph[index - 1]) && /\d/.test(paragraph[index + 1]))) continue
      if (char === '.' && /\b(?:tsp|tbsp|approx|min|mins|hr|hrs|oz|lb|no)\.$/i.test(paragraph.slice(0, index + 1))) continue
      const rest = paragraph.slice(index + 1).trimStart()
      if (nextAction.test(rest) && !shortReminder.test(rest)) boundaries.add(index + 1)
    }
    for (const match of paragraph.matchAll(connector)) {
      const prefix = paragraph.slice(0, match.index)
      if ((prefix.match(/\(/g) || []).length !== (prefix.match(/\)/g) || []).length) continue
      // Add + cook is one useful kitchen action; heating + cooking something
      // else, adding a new ingredient or serving is a new instruction.
      const rest = paragraph.slice(match.index + match[0].length)
      const current = prefix.slice(Math.max(...[...boundaries].filter((point) => point <= match.index)))
      if (/^cook\b/i.test(rest) && /\b(?:add|stir|pour|fry|simmer|bake)\b/i.test(current)) continue
      if (current.trim().split(/\s+/).length >= 3 && !shortReminder.test(rest)) boundaries.add(match.index)
    }
    const points = [...boundaries].sort((a, b) => a - b)
    points.slice(0, -1).forEach((start, index) => {
      const end = points[index + 1]
      const sourceText = paragraph.slice(start, end)
      const instruction = instructionFromSource(sourceText)
      if (!instruction) return
      result.push({ stepId: `step-${paragraphIndex + 1}-${start}`, number: result.length + 1, instruction, sourceText, sourceRefs: findEvidence(sourceText, fragments), paragraphIndex, start, end, originalOrder: result.length, parseStatus: 'source', ingredientRefs: [] })
    })
  })
  return result
}

export function instructionFromSource(sourceText) {
  const text = sourceText.trim().replace(/^[,;]\s*/, '').replace(/^(?:and then|then|before|and)\s+/i, '').replace(/^adding\b/i, 'Add').trim()
  return text ? text[0].toUpperCase() + text.slice(1) : ''
}

export function methodCoverage(method, steps) {
  const paragraphs = method.split(/\n\s*\n/).filter((paragraph) => paragraph.trim())
  return paragraphs.map((paragraph, index) => {
    const spans = steps.filter((step) => step.paragraphIndex === index).sort((a, b) => a.start - b.start)
    let cursor = 0
    let valid = true
    for (const span of spans) {
      if (span.start !== cursor || span.end <= span.start || paragraph.slice(span.start, span.end) !== span.sourceText) valid = false
      cursor = span.end
    }
    return { paragraph: index, covered: valid && cursor === paragraph.length, characters: paragraph.length }
  })
}
