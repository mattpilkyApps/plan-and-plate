import { classifyRecipeBlock, isStrongMethodStart } from './recipeSignals.js'

// Ranges refer only to text still present. Deletion/replacement cannot revive
// old ingredients; an original page rejoins around a middle insertion.
export function createRecipePasteInput(text = '', savedSpans) {
  const spans = Array.isArray(savedSpans) ? savedSpans : []
  const valid = spans.length && spans.every((span, index) =>
    span && Number.isInteger(span.start) && Number.isInteger(span.end) && Number.isInteger(span.part) && span.part >= 0 &&
    span.start === (index ? spans[index - 1].end : 0) && span.end > span.start && span.end <= text.length) &&
    spans.at(-1).end === text.length
  return { text, spans: valid ? spans : text ? [{ start: 0, end: text.length, part: 0 }] : [] }
}

export function updateRecipePasteInput(previous, text, paste) {
  if (previous.text === text) return previous
  let start = 0
  while (start < previous.text.length && start < text.length && previous.text[start] === text[start]) start += 1
  let oldEnd = previous.text.length
  let newEnd = text.length
  while (oldEnd > start && newEnd > start && previous.text[oldEnd - 1] === text[newEnd - 1]) { oldEnd -= 1; newEnd -= 1 }
  // Without a ClipboardEvent, prefer an intact append/prepend over a character
  // diff: two copies can share a long identical title/navigation prefix.
  if (previous.text && text.length > previous.text.length) {
    if (text.startsWith(previous.text)) { start = previous.text.length; oldEnd = start; newEnd = text.length }
    else if (text.endsWith(previous.text)) { start = 0; oldEnd = 0; newEnd = text.length - previous.text.length }
  }
  if (paste && Number.isInteger(paste.start) && Number.isInteger(paste.end) &&
    paste.start >= 0 && paste.end >= paste.start && paste.end <= previous.text.length &&
    previous.text.slice(0, paste.start) + paste.text + previous.text.slice(paste.end) === text) {
    start = paste.start
    oldEnd = paste.end
    newEnd = start + paste.text.length
  }
  const inserted = text.slice(start, newEnd)
  const firstLine = inserted.trimStart().split('\n')[0]
  const sectionHeading = ['INGREDIENT_HEADING', 'METHOD_HEADING'].includes(classifyRecipeBlock({ text: firstLine }).type)
  const pageInsertion = (inserted.includes('\n') &&
    (sectionHeading || inserted.length >= 80 || inserted.split('\n').filter((line) => line.trim()).length >= 3)) ||
    isStrongMethodStart(firstLine, { requireOpening: true })
  const context = previous.spans.find((span) => span.start <= start && span.end >= start)?.part || 0
  const part = pageInsertion ? Math.max(-1, ...previous.spans.map((span) => span.part)) + 1 : context
  const delta = text.length - previous.text.length
  const ranges = []
  for (const span of previous.spans) {
    if (span.start < start) ranges.push({ ...span, end: Math.min(span.end, start) })
    if (span.end > oldEnd) ranges.push({ ...span, start: Math.max(span.start, oldEnd) + delta, end: span.end + delta })
  }
  if (newEnd > start) ranges.push({ start, end: newEnd, part })
  const spans = []
  for (const span of ranges.sort((a, b) => a.start - b.start)) {
    if (spans.at(-1)?.part === span.part && spans.at(-1).end === span.start) spans.at(-1).end = span.end
    else spans.push(span)
  }
  return createRecipePasteInput(text, spans)
}

export function getRecipePasteParts(input) {
  const parts = new Map()
  for (const span of input.spans) parts.set(span.part, (parts.get(span.part) || '') + input.text.slice(span.start, span.end))
  return [...parts.values()].filter((text) => text.trim())
}
